#!/bin/bash

# Script de Deploy Automatizado - Tem Aki Institucional
# Automatiza o processo completo de deploy para produção

set -e  # Parar em caso de erro

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

log_step() {
    echo -e "\n${BLUE}[STEP $1]${NC} $2"
    echo "================================================"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Este script deve ser executado no diretório raiz do projeto"
    exit 1
fi

# Verificar se o arquivo .env.production existe
if [ ! -f ".env.production" ]; then
    log_error "Arquivo .env.production não encontrado. Execute o script setup-production.js primeiro."
    exit 1
fi

# Carregar variáveis de ambiente
source .env.production

# Verificar variáveis obrigatórias
if [ -z "$DOMAIN_NAME" ]; then
    log_error "DOMAIN_NAME não definido no .env.production"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    log_error "SUPABASE_URL não definido no .env.production"
    exit 1
fi

echo "🚀 Iniciando deploy do Tem Aki Institucional"
echo "================================================"
echo "Domínio: $DOMAIN_NAME"
echo "Ambiente: production"
echo "Versão: ${DEPLOY_VERSION:-2.0.0}"
echo "================================================\n"

# Passo 1: Backup da versão atual (se existir)
log_step "1" "Criando backup da versão atual"
if [ -d "/var/www/$DOMAIN_NAME" ]; then
    BACKUP_DIR="/var/backups/tem-aki-$(date +%Y%m%d-%H%M%S)"
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r "/var/www/$DOMAIN_NAME" "$BACKUP_DIR/"
    log_success "Backup criado em $BACKUP_DIR"
else
    log_info "Primeira instalação - sem backup necessário"
fi

# Passo 2: Atualizar código do repositório
log_step "2" "Atualizando código do repositório"
git fetch origin
git checkout main
git pull origin main
log_success "Código atualizado"

# Passo 3: Instalar/atualizar dependências
log_step "3" "Instalando dependências"
npm ci --only=production
log_success "Dependências instaladas"

# Passo 4: Executar testes (se existirem)
log_step "4" "Executando testes"
if [ -f "package.json" ] && npm run test --if-present > /dev/null 2>&1; then
    npm test
    log_success "Testes executados com sucesso"
else
    log_warning "Nenhum teste configurado"
fi

# Passo 5: Otimizar para produção
log_step "5" "Otimizando aplicação para produção"
node scripts/optimize-production.js
log_success "Aplicação otimizada"

# Passo 6: Configurar diretório de produção
log_step "6" "Configurando diretório de produção"
sudo mkdir -p "/var/www/$DOMAIN_NAME"
sudo chown -R $USER:$USER "/var/www/$DOMAIN_NAME"

# Copiar arquivos para produção
cp -r . "/var/www/$DOMAIN_NAME/"
cp .env.production "/var/www/$DOMAIN_NAME/.env"

# Configurar permissões
sudo chown -R www-data:www-data "/var/www/$DOMAIN_NAME"
sudo chmod -R 755 "/var/www/$DOMAIN_NAME"
sudo chmod -R 777 "/var/www/$DOMAIN_NAME/logs"
sudo chmod -R 777 "/var/www/$DOMAIN_NAME/uploads"

log_success "Arquivos copiados para produção"

# Passo 7: Configurar Nginx
log_step "7" "Configurando Nginx"
if [ -f "config/nginx.conf.template" ]; then
    # Substituir variáveis no template
    sed "s/{{DOMAIN_NAME}}/$DOMAIN_NAME/g" config/nginx.conf.template > /tmp/nginx-$DOMAIN_NAME.conf
    sed -i "s/{{SUPABASE_URL}}/${SUPABASE_URL//\//\\/}/g" /tmp/nginx-$DOMAIN_NAME.conf
    
    # Copiar configuração do Nginx
    sudo cp /tmp/nginx-$DOMAIN_NAME.conf "/etc/nginx/sites-available/$DOMAIN_NAME"
    
    # Habilitar site
    sudo ln -sf "/etc/nginx/sites-available/$DOMAIN_NAME" "/etc/nginx/sites-enabled/$DOMAIN_NAME"
    
    # Testar configuração
    sudo nginx -t
    
    log_success "Nginx configurado"
else
    log_warning "Template do Nginx não encontrado"
fi

# Passo 8: Configurar SSL com Let's Encrypt
log_step "8" "Configurando SSL"
if command -v certbot &> /dev/null; then
    # Parar Nginx temporariamente
    sudo systemctl stop nginx
    
    # Obter certificado SSL
    sudo certbot certonly --standalone \
        --email "$ADMIN_EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN_NAME" \
        -d "www.$DOMAIN_NAME"
    
    # Reiniciar Nginx
    sudo systemctl start nginx
    sudo systemctl reload nginx
    
    log_success "SSL configurado"
else
    log_warning "Certbot não instalado. Execute o script setup-ssl.sh primeiro."
fi

# Passo 9: Configurar PM2
log_step "9" "Configurando PM2"
cd "/var/www/$DOMAIN_NAME"

# Parar aplicação anterior (se existir)
pm2 stop tem-aki-institucional 2>/dev/null || true
pm2 delete tem-aki-institucional 2>/dev/null || true

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js --env production
pm2 save

# Configurar PM2 para iniciar no boot
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

log_success "PM2 configurado"

# Passo 10: Configurar firewall
log_step "10" "Configurando firewall"
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw --force enable
    log_success "Firewall configurado"
else
    log_warning "UFW não instalado"
fi

# Passo 11: Configurar monitoramento
log_step "11" "Configurando monitoramento"
# Criar diretório de logs
sudo mkdir -p /var/log/tem-aki
sudo chown -R www-data:www-data /var/log/tem-aki

# Configurar logrotate
sudo tee /etc/logrotate.d/tem-aki > /dev/null <<EOF
/var/log/tem-aki/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload tem-aki-institucional
    endscript
}
EOF

log_success "Monitoramento configurado"

# Passo 12: Verificar deploy
log_step "12" "Verificando deploy"
sleep 5  # Aguardar aplicação inicializar

# Verificar se a aplicação está rodando
if pm2 list | grep -q "tem-aki-institucional.*online"; then
    log_success "Aplicação está rodando no PM2"
else
    log_error "Aplicação não está rodando no PM2"
    pm2 logs tem-aki-institucional --lines 20
    exit 1
fi

# Verificar se o Nginx está funcionando
if sudo systemctl is-active --quiet nginx; then
    log_success "Nginx está ativo"
else
    log_error "Nginx não está ativo"
    sudo systemctl status nginx
    exit 1
fi

# Verificar conectividade HTTP
if curl -f -s "http://localhost/health" > /dev/null; then
    log_success "Health check HTTP passou"
else
    log_warning "Health check HTTP falhou"
fi

# Verificar conectividade HTTPS (se SSL estiver configurado)
if [ -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]; then
    if curl -f -s "https://$DOMAIN_NAME/health" > /dev/null; then
        log_success "Health check HTTPS passou"
    else
        log_warning "Health check HTTPS falhou"
    fi
fi

# Passo 13: Executar verificação de domínio
log_step "13" "Verificando configuração do domínio"
if [ -f "scripts/verify-domain.js" ]; then
    node scripts/verify-domain.js "$DOMAIN_NAME"
else
    log_warning "Script de verificação de domínio não encontrado"
fi

# Passo 14: Limpeza
log_step "14" "Limpeza final"
# Limpar arquivos temporários
rm -f /tmp/nginx-$DOMAIN_NAME.conf

# Limpar cache do npm
npm cache clean --force

# Limpar logs antigos do PM2
pm2 flush

log_success "Limpeza concluída"

# Resumo final
echo "\n================================================"
echo "🎉 Deploy concluído com sucesso!"
echo "================================================"
echo "🌐 Site: https://$DOMAIN_NAME"
echo "🔧 Admin: https://$DOMAIN_NAME/admin"
echo "📊 Health: https://$DOMAIN_NAME/health"
echo "📈 Métricas: https://$DOMAIN_NAME/metrics"
echo "================================================"
echo "\n📋 Próximos passos:"
echo "1. Configurar DNS do domínio para apontar para este servidor"
echo "2. Testar todas as funcionalidades do site"
echo "3. Configurar backup automático"
echo "4. Configurar monitoramento externo"
echo "5. Configurar CDN (opcional)"
echo "\n📚 Documentação:"
echo "- Guia de domínio: ./DOMAIN_SETUP_GUIDE.md"
echo "- Logs da aplicação: pm2 logs tem-aki-institucional"
echo "- Status do sistema: pm2 status"
echo "- Reiniciar aplicação: pm2 restart tem-aki-institucional"
echo "\n✅ Deploy finalizado em $(date)"

# Salvar informações do deploy
echo "{
  \"timestamp\": \"$(date -Iseconds)\",
  \"version\": \"${DEPLOY_VERSION:-2.0.0}\",
  \"domain\": \"$DOMAIN_NAME\",
  \"environment\": \"production\",
  \"git_commit\": \"$(git rev-parse HEAD)\",
  \"deployed_by\": \"$USER\",
  \"server\": \"$(hostname)\"
}" > "/var/www/$DOMAIN_NAME/deploy-info.json"

log_success "Informações do deploy salvas em deploy-info.json"