#!/usr/bin/env node

/**
 * Script de Configuração para Produção
 * Configura o site institucional para deploy em domínio personalizado
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupProduction() {
  console.log('🚀 Configuração do Site Institucional para Produção\n');
  console.log('Este script irá configurar seu site para deploy em um domínio personalizado.\n');

  try {
    // Coleta informações do usuário
    const domain = await question('Digite seu domínio (ex: meusite.com.br): ');
    const email = await question('Digite seu email de administrador: ');
    const adminPassword = await question('Digite uma senha segura para o admin: ');
    
    console.log('\n📋 Configurações do Supabase:');
    const supabaseUrl = await question('URL do Supabase: ');
    const supabaseAnonKey = await question('Chave Anônima do Supabase: ');
    const supabaseServiceKey = await question('Chave Service Role do Supabase: ');
    
    console.log('\n📧 Configurações de Email (opcional):');
    const smtpHost = await question('SMTP Host (deixe vazio para pular): ');
    const smtpUser = await question('SMTP User (deixe vazio para pular): ');
    const smtpPass = await question('SMTP Password (deixe vazio para pular): ');

    // Gera chaves secretas seguras
    const sessionSecret = generateSecretKey(64);
    const jwtSecret = generateSecretKey(64);

    // Cria arquivo .env.production personalizado
    const envContent = `# Configurações do Servidor - PRODUÇÃO
PORT=3000
NODE_ENV=production

# Domínio do Site Institucional
DOMAIN=${domain}
BASE_URL=https://${domain}

# Configurações do Banco de Dados
DATABASE_TYPE=supabase

# Configurações de Sessão - PRODUÇÃO
SESSION_SECRET=${sessionSecret}
SESSION_MAX_AGE=86400000
SESSION_SECURE=true
SESSION_SAME_SITE=strict

# Configurações de Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Configurações de Segurança - PRODUÇÃO
BCRYPT_ROUNDS=14
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=24h

# Configurações do Admin Padrão - PRODUÇÃO
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=${adminPassword}
DEFAULT_ADMIN_EMAIL=${email}

# Configurações de Email
SMTP_HOST=${smtpHost}
SMTP_PORT=587
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}
SMTP_FROM=noreply@${domain}
SMTP_SECURE=true

# Configurações de Backup
BACKUP_ENABLED=true
BACKUP_INTERVAL=12
BACKUP_RETENTION_DAYS=90

# Configurações de Log - PRODUÇÃO
LOG_LEVEL=warn
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Configurações da API
API_BASE_URL=https://${domain}/api
API_VERSION=v1

# Configurações de CORS - PRODUÇÃO
CORS_ORIGIN=https://${domain},https://www.${domain}
CORS_CREDENTIALS=true

# Configurações de Rate Limiting - PRODUÇÃO
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true

# Configurações de Cache
CACHE_TTL=7200
CACHE_ENABLED=true

# Configurações do Supabase - PRODUÇÃO
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Configurações do Storage do Supabase
SUPABASE_STORAGE_BUCKET=business-images
SUPABASE_STORAGE_URL=${supabaseUrl}/storage/v1/object/public/

# Configurações de SSL/HTTPS
SSL_ENABLED=true

# Configurações de Monitoramento
MONITORING_ENABLED=true
HEALTH_CHECK_ENDPOINT=/health
METRICS_ENDPOINT=/metrics

# Configurações de Compressão
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6

# Configurações de Segurança Adicional
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000
CSP_ENABLED=true
X_FRAME_OPTIONS=DENY
X_CONTENT_TYPE_OPTIONS=nosniff

# Configurações de Performance
STATIC_CACHE_MAX_AGE=31536000
API_CACHE_MAX_AGE=300

# Configurações de Deploy
DEPLOY_ENVIRONMENT=production
DEPLOY_VERSION=1.0.0
DEPLOY_TIMESTAMP=${new Date().toISOString()}

# Configurações de Notificações
NOTIFICATION_EMAIL=${email}
ERROR_NOTIFICATION_ENABLED=true`;

    // Salva o arquivo .env.production
    const envPath = path.join(__dirname, '..', '.env.production');
    fs.writeFileSync(envPath, envContent);

    // Cria arquivo de configuração do Nginx
    const nginxConfig = createNginxConfig(domain);
    const nginxPath = path.join(__dirname, '..', 'nginx.conf');
    fs.writeFileSync(nginxPath, nginxConfig);

    // Cria script de deploy
    const deployScript = createDeployScript(domain);
    const deployPath = path.join(__dirname, 'deploy.sh');
    fs.writeFileSync(deployPath, deployScript);
    fs.chmodSync(deployPath, '755');

    // Cria arquivo Docker para produção
    const dockerfile = createDockerfile();
    const dockerPath = path.join(__dirname, '..', 'Dockerfile.production');
    fs.writeFileSync(dockerPath, dockerfile);

    console.log('\n✅ Configuração concluída com sucesso!');
    console.log('\n📁 Arquivos criados:');
    console.log(`   - .env.production (configurações de produção)`);
    console.log(`   - nginx.conf (configuração do Nginx)`);
    console.log(`   - scripts/deploy.sh (script de deploy)`);
    console.log(`   - Dockerfile.production (container Docker)`);
    
    console.log('\n🔧 Próximos passos:');
    console.log('1. Configure seu DNS para apontar para o servidor');
    console.log('2. Configure SSL/HTTPS (recomendado: Let\'s Encrypt)');
    console.log('3. Execute o deploy usando: ./scripts/deploy.sh');
    console.log('4. Configure monitoramento e backups');
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('- Mantenha as chaves secretas seguras');
    console.log('- Configure firewall adequadamente');
    console.log('- Teste todas as funcionalidades antes do go-live');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
  } finally {
    rl.close();
  }
}

function generateSecretKey(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createNginxConfig(domain) {
  return `# Configuração Nginx para ${domain}
server {
    listen 80;
    server_name ${domain} www.${domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain} www.${domain};

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
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
        alias /var/www/${domain}/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias /var/www/${domain}/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Node.js Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}`;
}

function createDeployScript(domain) {
  return `#!/bin/bash

# Script de Deploy para ${domain}
# Execute este script no servidor de produção

set -e

echo "🚀 Iniciando deploy para ${domain}..."

# Variáveis
APP_DIR="/var/www/${domain}"
BACKUP_DIR="/var/backups/${domain}"
DATE=$(date +"%Y%m%d_%H%M%S")

# Criar backup
echo "📦 Criando backup..."
mkdir -p $BACKUP_DIR
if [ -d "$APP_DIR" ]; then
    tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$APP_DIR" .
fi

# Atualizar código
echo "📥 Atualizando código..."
cd $APP_DIR
git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --production

# Executar migrações (se necessário)
echo "🗄️ Executando migrações..."
# npm run migrate

# Reiniciar aplicação
echo "🔄 Reiniciando aplicação..."
pm2 restart ${domain}

# Verificar saúde da aplicação
echo "🏥 Verificando saúde da aplicação..."
sleep 5
if curl -f https://${domain}/health > /dev/null 2>&1; then
    echo "✅ Deploy concluído com sucesso!"
else
    echo "❌ Erro no deploy. Restaurando backup..."
    tar -xzf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$APP_DIR"
    pm2 restart ${domain}
    exit 1
fi

# Limpar backups antigos (manter últimos 5)
echo "🧹 Limpando backups antigos..."
cd $BACKUP_DIR
ls -t backup_*.tar.gz | tail -n +6 | xargs -r rm

echo "🎉 Deploy finalizado!"`;
}

function createDockerfile() {
  return `# Dockerfile para Produção
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    dumb-init \
    curl

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p uploads logs
RUN chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "app_supabase.js"]`;
}

// Executar configuração
if (require.main === module) {
  setupProduction();
}

module.exports = { setupProduction };