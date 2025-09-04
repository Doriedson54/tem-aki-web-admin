# Guia de Deploy - Site Institucional Tem Aki

## 📋 Visão Geral

Este guia orienta você através do processo completo de configuração e deploy do site institucional Tem Aki em um domínio próprio, incluindo configuração de produção, SSL, monitoramento e deploy automatizado.

## 🚀 Pré-requisitos

### Software Necessário
- **Node.js** (versão 16 ou superior)
- **npm** ou **yarn**
- **PM2** (para gerenciamento de processos)
- **Git** (para controle de versão)
- **Servidor web** (Nginx recomendado)
- **Certbot** (para SSL/HTTPS)

### Informações Necessárias
- **Domínio registrado** (ex: meusite.com.br)
- **Servidor/VPS** com acesso root
- **Credenciais do Supabase**
- **Configurações de email SMTP**
- **Chaves de APIs externas**

## 📁 Estrutura dos Scripts

```
scripts/
├── setup-production.js     # Configuração inicial de produção
├── verify-domain.js         # Verificação de domínio e DNS
├── setup-ssl.sh            # Configuração de SSL/HTTPS
├── optimize-production.js   # Otimização da aplicação
├── setup-monitoring.js      # Configuração de monitoramento
├── deploy.sh               # Deploy automatizado (Linux)
└── deploy.ps1              # Deploy automatizado (Windows)
```

## 🔧 Processo de Deploy Passo a Passo

### Passo 1: Configuração Inicial de Produção

```bash
# Execute o script de configuração
node scripts/setup-production.js
```

**O que este script faz:**
- Coleta informações do domínio, email e credenciais
- Gera chaves secretas seguras
- Cria arquivo `.env.production`
- Gera configuração do Nginx
- Cria Dockerfile para produção
- Prepara script de deploy

**Informações solicitadas:**
- Domínio do site
- Email do administrador
- Senha do admin
- URL e chaves do Supabase
- Configurações SMTP
- Chaves de APIs externas

### Passo 2: Verificação de Domínio

```bash
# Verificar configuração do domínio
node scripts/verify-domain.js
```

**O que este script verifica:**
- Registros DNS (A, CNAME, MX)
- Conectividade HTTP/HTTPS
- Certificados SSL
- Performance e segurança
- Redirecionamentos

### Passo 3: Configuração de SSL/HTTPS

```bash
# Linux/macOS
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh

# Windows (PowerShell como administrador)
# Instalar Certbot manualmente e configurar IIS/Nginx
```

**O que este script faz:**
- Instala Certbot
- Configura firewall
- Obtém certificado SSL do Let's Encrypt
- Configura Nginx para HTTPS
- Configura renovação automática

### Passo 4: Otimização da Aplicação

```bash
# Otimizar para produção
node scripts/optimize-production.js
```

**O que este script faz:**
- Minifica CSS e JavaScript
- Otimiza imagens
- Gera hashes para cache busting
- Cria build otimizado
- Gera relatório de otimização

### Passo 5: Configuração de Monitoramento

```bash
# Configurar monitoramento
node scripts/setup-monitoring.js
```

**O que este script configura:**
- Sistema de logs com Winston
- Health checks avançados
- Métricas Prometheus (opcional)
- Configuração PM2 otimizada
- Rotação de logs

### Passo 6: Deploy Final

```bash
# Linux/macOS
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Windows (PowerShell)
.\scripts\deploy.ps1 -Domain "meusite.com.br"
```

**O que o deploy faz:**
- Cria backup da versão anterior
- Instala dependências
- Executa testes
- Aplica otimizações
- Configura ambiente
- Inicia aplicação com PM2
- Verifica funcionamento
- Gera relatório de deploy

## 🌐 Configuração de DNS

### Registros DNS Necessários

```dns
# Registro A (apontar para IP do servidor)
meusite.com.br.        A       123.456.789.10
www.meusite.com.br.    A       123.456.789.10

# Registro CNAME (alternativo para www)
www.meusite.com.br.    CNAME   meusite.com.br.

# Registro MX (email - opcional)
meusite.com.br.        MX  10  mail.meusite.com.br.

# Registros TXT (verificação e segurança)
meusite.com.br.        TXT     "v=spf1 include:_spf.google.com ~all"
```

### Verificação de DNS

```bash
# Verificar propagação DNS
nslookup meusite.com.br
dig meusite.com.br

# Verificar online
# https://dnschecker.org/
# https://www.whatsmydns.net/
```

## 🔒 Configuração de Segurança

### Firewall (Linux)

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Nginx Security Headers

O arquivo `nginx.conf` gerado inclui:
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- Content Security Policy
- Rate limiting
- Compressão Gzip

### Aplicação Security

O middleware de segurança inclui:
- Helmet.js para headers de segurança
- Rate limiting por IP
- Validação de origem
- Logs de segurança
- Health check protegido

## 📊 Monitoramento e Logs

### Logs da Aplicação

```bash
# Ver logs em tempo real
pm2 logs tem-aki-institucional

# Logs por arquivo
tail -f logs/combined.log
tail -f logs/error.log
tail -f logs/access.log
```

### Métricas Prometheus

```bash
# Acessar métricas
curl http://localhost:3000/metrics

# Health check
curl http://localhost:3000/health
```

### Status do Sistema

```bash
# Script de status (Linux)
./monitoring/system-status.sh

# Status PM2
pm2 status
pm2 monit
```

## 🔄 Comandos Úteis

### Gerenciamento PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Parar aplicação
pm2 stop tem-aki-institucional

# Reiniciar aplicação
pm2 restart tem-aki-institucional

# Recarregar (zero downtime)
pm2 reload tem-aki-institucional

# Ver logs
pm2 logs tem-aki-institucional

# Monitoramento
pm2 monit

# Salvar configuração
pm2 save

# Startup automático
pm2 startup
```

### Nginx

```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo nginx -s reload

# Reiniciar Nginx
sudo systemctl restart nginx

# Status do Nginx
sudo systemctl status nginx
```

### SSL/Certbot

```bash
# Renovar certificados
sudo certbot renew

# Testar renovação
sudo certbot renew --dry-run

# Listar certificados
sudo certbot certificates
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de DNS
```bash
# Verificar propagação DNS
nslookup meusite.com.br
# Aguardar até 48h para propagação completa
```

#### 2. Erro de SSL
```bash
# Verificar certificado
openssl s_client -connect meusite.com.br:443

# Renovar certificado
sudo certbot renew --force-renewal
```

#### 3. Aplicação não inicia
```bash
# Verificar logs
pm2 logs tem-aki-institucional

# Verificar arquivo .env
cat .env.production

# Testar manualmente
node app_supabase.js
```

#### 4. Erro 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar configuração Nginx
sudo nginx -t

# Verificar logs Nginx
sudo tail -f /var/log/nginx/error.log
```

#### 5. Performance lenta
```bash
# Verificar recursos do sistema
htop
free -h
df -h

# Verificar logs de performance
tail -f logs/access.log
```

### Logs de Debug

```bash
# Habilitar debug
export DEBUG=*
node app_supabase.js

# Logs detalhados PM2
pm2 logs tem-aki-institucional --lines 100
```

## 📈 Otimização de Performance

### Configurações Recomendadas

1. **PM2 Cluster Mode**: Usar todas as CPUs disponíveis
2. **Nginx Caching**: Cache de arquivos estáticos
3. **Gzip Compression**: Reduzir tamanho de transferência
4. **CDN**: Para arquivos estáticos (opcional)
5. **Database Indexing**: Otimizar queries do Supabase

### Monitoramento Contínuo

1. **Métricas de Sistema**: CPU, memória, disco
2. **Métricas de Aplicação**: Tempo de resposta, erros
3. **Logs de Acesso**: Análise de tráfego
4. **Health Checks**: Verificação automática

## 🔄 Atualizações e Manutenção

### Deploy de Atualizações

```bash
# Fazer backup
pm2 stop tem-aki-institucional
cp -r dist backup-$(date +%Y%m%d)

# Atualizar código
git pull origin main
npm ci --only=production

# Executar otimizações
node scripts/optimize-production.js

# Reiniciar aplicação
pm2 reload tem-aki-institucional
```

### Backup Regular

```bash
# Script de backup (adicionar ao cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz dist/ logs/ .env.production
```

### Monitoramento de Segurança

```bash
# Verificar logs de segurança
grep "security" logs/combined.log

# Verificar tentativas de acesso
grep "401\|403\|404" logs/access.log
```

## 📞 Suporte

Para suporte adicional:

1. **Documentação**: Consulte os comentários nos scripts
2. **Logs**: Sempre verifique os logs primeiro
3. **Health Check**: Use `/health` para diagnóstico
4. **Métricas**: Use `/metrics` para análise de performance

---

**✅ Checklist Final de Deploy:**

- [ ] Domínio registrado e DNS configurado
- [ ] Servidor configurado com Node.js e PM2
- [ ] Scripts de configuração executados
- [ ] SSL/HTTPS funcionando
- [ ] Aplicação otimizada e funcionando
- [ ] Monitoramento configurado
- [ ] Backup configurado
- [ ] Testes de funcionalidade realizados
- [ ] Documentação atualizada

**🎉 Parabéns! Seu site institucional está no ar!**