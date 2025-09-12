#!/bin/bash

# Script de Configuração SSL/HTTPS
# Configura certificados SSL usando Let's Encrypt

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   log_error "Este script deve ser executado como root (use sudo)"
   exit 1
fi

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para instalar Certbot
install_certbot() {
    log_info "Instalando Certbot..."
    
    # Detectar distribuição Linux
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt update
        apt install -y certbot python3-certbot-nginx
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL/Fedora
        if command_exists dnf; then
            dnf install -y certbot python3-certbot-nginx
        else
            yum install -y certbot python3-certbot-nginx
        fi
    else
        log_error "Distribuição Linux não suportada"
        exit 1
    fi
    
    log_success "Certbot instalado com sucesso"
}

# Função para verificar Nginx
check_nginx() {
    log_info "Verificando Nginx..."
    
    if ! command_exists nginx; then
        log_error "Nginx não está instalado"
        exit 1
    fi
    
    if ! systemctl is-active --quiet nginx; then
        log_warning "Nginx não está rodando. Iniciando..."
        systemctl start nginx
    fi
    
    # Testar configuração
    if ! nginx -t; then
        log_error "Configuração do Nginx inválida"
        exit 1
    fi
    
    log_success "Nginx está funcionando corretamente"
}

# Função para configurar firewall
setup_firewall() {
    log_info "Configurando firewall..."
    
    if command_exists ufw; then
        # Ubuntu/Debian com UFW
        ufw allow 'Nginx Full'
        ufw allow ssh
        log_success "UFW configurado"
    elif command_exists firewall-cmd; then
        # CentOS/RHEL com firewalld
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --reload
        log_success "Firewalld configurado"
    else
        log_warning "Sistema de firewall não detectado. Configure manualmente as portas 80, 443 e 22"
    fi
}

# Função para obter certificado SSL
get_ssl_certificate() {
    local domain=$1
    local email=$2
    local webroot_path=$3
    
    log_info "Obtendo certificado SSL para $domain..."
    
    # Verificar se o domínio está apontando para este servidor
    local domain_ip=$(dig +short $domain)
    local server_ip=$(curl -s ifconfig.me)
    
    if [ "$domain_ip" != "$server_ip" ]; then
        log_warning "O domínio $domain não está apontando para este servidor"
        log_warning "IP do domínio: $domain_ip"
        log_warning "IP do servidor: $server_ip"
        read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Configuração cancelada"
            exit 1
        fi
    fi
    
    # Método 1: Nginx plugin (recomendado)
    if certbot --nginx -d $domain -d www.$domain --non-interactive --agree-tos --email $email; then
        log_success "Certificado SSL obtido com sucesso usando plugin Nginx"
        return 0
    fi
    
    log_warning "Plugin Nginx falhou. Tentando método webroot..."
    
    # Método 2: Webroot
    if [ -n "$webroot_path" ] && [ -d "$webroot_path" ]; then
        if certbot certonly --webroot -w $webroot_path -d $domain -d www.$domain --non-interactive --agree-tos --email $email; then
            log_success "Certificado SSL obtido com sucesso usando webroot"
            configure_nginx_ssl $domain
            return 0
        fi
    fi
    
    log_warning "Webroot falhou. Tentando método standalone..."
    
    # Método 3: Standalone (para o Nginx temporariamente)
    systemctl stop nginx
    if certbot certonly --standalone -d $domain -d www.$domain --non-interactive --agree-tos --email $email; then
        log_success "Certificado SSL obtido com sucesso usando standalone"
        configure_nginx_ssl $domain
        systemctl start nginx
        return 0
    fi
    
    systemctl start nginx
    log_error "Falha ao obter certificado SSL"
    return 1
}

# Função para configurar SSL no Nginx manualmente
configure_nginx_ssl() {
    local domain=$1
    local config_file="/etc/nginx/sites-available/$domain"
    
    log_info "Configurando SSL no Nginx para $domain..."
    
    # Backup da configuração atual
    cp $config_file $config_file.backup.$(date +%Y%m%d_%H%M%S)
    
    # Atualizar configuração com SSL
    cat > $config_file << EOF
server {
    listen 80;
    server_name $domain www.$domain;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $domain www.$domain;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static Files
    location /public/ {
        alias /var/www/$domain/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias /var/www/$domain/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Node.js Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Testar configuração
    if nginx -t; then
        systemctl reload nginx
        log_success "Configuração SSL do Nginx atualizada"
    else
        log_error "Erro na configuração do Nginx. Restaurando backup..."
        mv $config_file.backup.* $config_file
        systemctl reload nginx
        return 1
    fi
}

# Função para configurar renovação automática
setup_auto_renewal() {
    log_info "Configurando renovação automática..."
    
    # Criar script de renovação
    cat > /usr/local/bin/renew-ssl.sh << 'EOF'
#!/bin/bash

# Script de renovação automática SSL
LOG_FILE="/var/log/ssl-renewal.log"

echo "$(date): Iniciando renovação SSL" >> $LOG_FILE

# Renovar certificados
if certbot renew --quiet; then
    echo "$(date): Certificados renovados com sucesso" >> $LOG_FILE
    
    # Recarregar Nginx
    if systemctl reload nginx; then
        echo "$(date): Nginx recarregado com sucesso" >> $LOG_FILE
    else
        echo "$(date): Erro ao recarregar Nginx" >> $LOG_FILE
    fi
else
    echo "$(date): Erro na renovação dos certificados" >> $LOG_FILE
fi

echo "$(date): Renovação finalizada" >> $LOG_FILE
EOF
    
    chmod +x /usr/local/bin/renew-ssl.sh
    
    # Configurar cron job
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/renew-ssl.sh") | crontab -
    
    log_success "Renovação automática configurada (diariamente às 2h)"
}

# Função para testar SSL
test_ssl() {
    local domain=$1
    
    log_info "Testando configuração SSL..."
    
    # Testar conectividade HTTPS
    if curl -s -I https://$domain | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
        log_success "HTTPS funcionando corretamente"
    else
        log_error "Erro ao acessar HTTPS"
        return 1
    fi
    
    # Testar redirecionamento HTTP -> HTTPS
    if curl -s -I http://$domain | grep -q "301\|302"; then
        log_success "Redirecionamento HTTP -> HTTPS funcionando"
    else
        log_warning "Redirecionamento HTTP -> HTTPS não configurado"
    fi
    
    # Verificar certificado
    local cert_info=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates)
    if [ $? -eq 0 ]; then
        log_success "Certificado SSL válido"
        echo "$cert_info"
    else
        log_error "Problema com o certificado SSL"
        return 1
    fi
}

# Função principal
main() {
    echo "🔒 Configuração SSL/HTTPS - Site Institucional"
    echo "============================================="
    echo
    
    # Verificar argumentos
    if [ $# -lt 2 ]; then
        echo "Uso: $0 <dominio> <email> [webroot_path]"
        echo "Exemplo: $0 meusite.com.br admin@meusite.com.br /var/www/meusite.com.br/public"
        exit 1
    fi
    
    local domain=$1
    local email=$2
    local webroot_path=$3
    
    log_info "Configurando SSL para: $domain"
    log_info "Email: $email"
    
    # Verificações iniciais
    check_nginx
    
    # Instalar Certbot se necessário
    if ! command_exists certbot; then
        install_certbot
    else
        log_success "Certbot já está instalado"
    fi
    
    # Configurar firewall
    setup_firewall
    
    # Obter certificado SSL
    if get_ssl_certificate $domain $email $webroot_path; then
        # Configurar renovação automática
        setup_auto_renewal
        
        # Testar configuração
        sleep 5
        test_ssl $domain
        
        echo
        log_success "✅ Configuração SSL concluída com sucesso!"
        echo
        echo "📋 Próximos passos:"
        echo "   1. Teste seu site: https://$domain"
        echo "   2. Verifique SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$domain"
        echo "   3. Configure monitoramento de expiração"
        echo
        echo "📄 Logs de renovação: /var/log/ssl-renewal.log"
        echo "🔄 Renovação automática: Configurada para 2h da manhã"
        
    else
        log_error "❌ Falha na configuração SSL"
        echo
        echo "🔧 Troubleshooting:"
        echo "   1. Verifique se o domínio aponta para este servidor"
        echo "   2. Confirme que as portas 80 e 443 estão abertas"
        echo "   3. Verifique os logs: /var/log/letsencrypt/letsencrypt.log"
        echo "   4. Tente novamente em alguns minutos"
        exit 1
    fi
}

# Executar função principal
main "$@"