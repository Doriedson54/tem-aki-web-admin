# 🍣 Guia de Deploy - www.temakinobairro.com.br

## Visão Geral
Este guia detalha como colocar o site institucional **Temaki no Bairro** no ar no domínio `www.temakinobairro.com.br`.

## 📋 Pré-requisitos

### Servidor
- VPS/Servidor com Ubuntu 20.04+ ou CentOS 7+
- Mínimo 1GB RAM, 1 CPU, 20GB SSD
- Acesso root ou sudo
- IP público fixo

### Domínio
- Domínio: `www.temakinobairro.com.br`
- Acesso ao painel de DNS do registrador

### Software
- Node.js 18+
- npm
- Nginx
- PM2
- Certbot (Let's Encrypt)

## 🚀 Processo de Deploy

### 1. Configuração do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Nginx
sudo apt install nginx -y

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Configuração do DNS

No painel do seu registrador de domínio, configure:

```
Tipo    Nome                    Valor               TTL
A       @                       SEU_IP_SERVIDOR     3600
A       www                     SEU_IP_SERVIDOR     3600
CNAME   temakinobairro.com.br   www.temakinobairro.com.br   3600
```

### 3. Upload da Aplicação

```bash
# Criar diretório da aplicação
sudo mkdir -p /var/www/temakinobairro
sudo chown $USER:$USER /var/www/temakinobairro

# Fazer upload dos arquivos (via SCP, FTP, Git, etc.)
# Exemplo com Git:
cd /var/www/temakinobairro
git clone SEU_REPOSITORIO .

# Ou copiar arquivos locais:
# scp -r ./web-admin/* usuario@servidor:/var/www/temakinobairro/
```

### 4. Configuração da Aplicação

```bash
cd /var/www/temakinobairro

# Instalar dependências
npm ci --only=production

# Configurar variáveis de ambiente
cp .env.production .env

# Editar configurações do Supabase
nano .env
```

**Configurações importantes no .env:**
```env
# Supabase (OBRIGATÓRIO)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Domínio
DOMAIN_NAME=www.temakinobairro.com.br
BASE_URL=https://www.temakinobairro.com.br

# Segurança (ALTERAR)
SESSION_SECRET=sua-chave-secreta-muito-segura
JWT_SECRET=sua-chave-jwt-muito-segura

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

### 5. Configuração do PM2

```bash
# Iniciar aplicação com PM2
pm2 start ecosystem.config.json

# Salvar configuração
pm2 save

# Configurar inicialização automática
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 6. Configuração do Nginx

```bash
# Copiar configuração
sudo cp config/nginx/temakinobairro.conf /etc/nginx/sites-available/

# Ativar site
sudo ln -s /etc/nginx/sites-available/temakinobairro.conf /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 7. Configuração SSL (Let's Encrypt)

```bash
# Obter certificado SSL
sudo certbot --nginx -d www.temakinobairro.com.br -d temakinobairro.com.br

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. Configuração do Firewall

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 🔧 Configurações Avançadas

### Monitoramento

```bash
# Instalar dependências de monitoramento
npm install winston morgan prom-client

# Configurar logrotate
sudo nano /etc/logrotate.d/temakinobairro
```

**Conteúdo do logrotate:**
```
/var/www/temakinobairro/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload temaki-no-bairro
    endscript
}
```

### Backup Automático

```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-temakinobairro.sh
```

**Script de backup:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/temakinobairro"
APP_DIR="/var/www/temakinobairro"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $APP_DIR .

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/backup-temakinobairro.sh

# Agendar backup diário
sudo crontab -e
# Adicionar linha:
0 2 * * * /usr/local/bin/backup-temakinobairro.sh
```

## 📊 Verificação e Testes

### 1. Testar Aplicação

```bash
# Verificar status PM2
pm2 status

# Ver logs
pm2 logs temaki-no-bairro

# Testar health check
curl http://localhost:3000/health
```

### 2. Testar Nginx

```bash
# Verificar status
sudo systemctl status nginx

# Testar configuração
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/temakinobairro_access.log
```

### 3. Testar SSL

```bash
# Verificar certificado
sudo certbot certificates

# Testar renovação
sudo certbot renew --dry-run
```

### 4. Testar Domínio

```bash
# Testar resolução DNS
nslookup www.temakinobairro.com.br

# Testar HTTPS
curl -I https://www.temakinobairro.com.br
```

## 🛠️ Comandos Úteis

### PM2
```bash
pm2 status                    # Ver status
pm2 logs temaki-no-bairro     # Ver logs
pm2 restart temaki-no-bairro  # Reiniciar
pm2 stop temaki-no-bairro     # Parar
pm2 delete temaki-no-bairro   # Remover
pm2 monit                     # Monitor em tempo real
```

### Nginx
```bash
sudo systemctl status nginx   # Status
sudo systemctl restart nginx  # Reiniciar
sudo systemctl reload nginx   # Recarregar config
sudo nginx -t                 # Testar config
```

### Logs
```bash
# Logs da aplicação
tail -f /var/www/temakinobairro/logs/app.log

# Logs do Nginx
sudo tail -f /var/log/nginx/temakinobairro_access.log
sudo tail -f /var/log/nginx/temakinobairro_error.log

# Logs do sistema
sudo journalctl -u nginx -f
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Site não carrega**
   - Verificar DNS: `nslookup www.temakinobairro.com.br`
   - Verificar Nginx: `sudo nginx -t`
   - Verificar PM2: `pm2 status`

2. **Erro 502 Bad Gateway**
   - Verificar se aplicação está rodando: `pm2 status`
   - Verificar logs: `pm2 logs temaki-no-bairro`
   - Verificar porta: `netstat -tlnp | grep 3000`

3. **SSL não funciona**
   - Verificar certificado: `sudo certbot certificates`
   - Verificar configuração Nginx
   - Renovar certificado: `sudo certbot renew`

4. **Performance lenta**
   - Verificar recursos: `htop`
   - Verificar logs de erro
   - Otimizar configuração PM2

### Logs de Debug

```bash
# Ativar modo debug
export DEBUG=*
pm2 restart temaki-no-bairro

# Ver logs detalhados
pm2 logs temaki-no-bairro --lines 100
```

## 📈 Monitoramento

### Métricas Importantes
- Uptime da aplicação
- Tempo de resposta
- Uso de memória/CPU
- Logs de erro
- Certificado SSL válido

### Ferramentas Recomendadas
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: Google PageSpeed, GTmetrix
- **Logs**: Logrotate, rsyslog
- **Monitoramento**: Prometheus + Grafana

## 🔄 Atualizações

### Deploy de Nova Versão

```bash
cd /var/www/temakinobairro

# Backup
pm2 stop temaki-no-bairro
cp -r . ../backup-$(date +%Y%m%d)

# Atualizar código
git pull origin main
# ou upload de novos arquivos

# Instalar dependências
npm ci --only=production

# Reiniciar aplicação
pm2 restart temaki-no-bairro

# Verificar
pm2 status
curl https://www.temakinobairro.com.br/health
```

## 📞 Suporte

Para suporte técnico:
- Verificar logs primeiro
- Documentar erro exato
- Incluir informações do sistema
- Testar em ambiente local

---

**🎉 Parabéns! Seu site Temaki no Bairro está no ar em www.temakinobairro.com.br**

Lembre-se de:
- ✅ Configurar backups regulares
- ✅ Monitorar performance
- ✅ Manter sistema atualizado
- ✅ Renovar certificado SSL automaticamente
- ✅ Verificar logs regularmente