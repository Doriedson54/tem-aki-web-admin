# Guia de Configuração de Domínio - Site Institucional Tem Aki

Este guia fornece instruções detalhadas para configurar seu domínio personalizado para o site institucional.

## 📋 Pré-requisitos

- Domínio registrado (ex: meusite.com.br)
- Servidor VPS/Cloud com IP público
- Acesso ao painel de controle do domínio
- Conhecimentos básicos de DNS

## 🌐 Configuração de DNS

### 1. Registros DNS Necessários

Configure os seguintes registros DNS no painel do seu provedor:

```dns
# Registro A - Aponta o domínio para o IP do servidor
@               A       300     SEU_IP_SERVIDOR
www             A       300     SEU_IP_SERVIDOR

# Registro CNAME (alternativo ao www A)
www             CNAME   300     meusite.com.br

# Registros MX para email (opcional)
@               MX      300     10 mail.meusite.com.br
mail            A       300     SEU_IP_SERVIDOR

# Registros TXT para verificação
@               TXT     300     "v=spf1 include:_spf.google.com ~all"
_dmarc          TXT     300     "v=DMARC1; p=none; rua=mailto:admin@meusite.com.br"

# Subdomínios úteis
api             A       300     SEU_IP_SERVIDOR
admin           A       300     SEU_IP_SERVIDOR
status          A       300     SEU_IP_SERVIDOR
```

### 2. Verificação de DNS

Após configurar os registros, verifique se estão funcionando:

```bash
# Verificar registro A
nslookup meusite.com.br

# Verificar registro CNAME
nslookup www.meusite.com.br

# Verificar propagação global
dig @8.8.8.8 meusite.com.br
```

## 🔧 Configuração do Servidor

### 1. Atualizar Configurações

Edite o arquivo `.env.production`:

```env
# Substitua pelo seu domínio
DOMAIN=meusite.com.br
BASE_URL=https://meusite.com.br

# Configurações de CORS
CORS_ORIGIN=https://meusite.com.br,https://www.meusite.com.br

# Email
SMTP_FROM=noreply@meusite.com.br
DEFAULT_ADMIN_EMAIL=admin@meusite.com.br
NOTIFICATION_EMAIL=admin@meusite.com.br
```

### 2. Configurar Nginx

Use o arquivo `nginx.conf` gerado pelo script de setup:

```bash
# Copiar configuração para o Nginx
sudo cp nginx.conf /etc/nginx/sites-available/meusite.com.br
sudo ln -s /etc/nginx/sites-available/meusite.com.br /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## 🔒 Configuração SSL/HTTPS

### 1. Usando Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d meusite.com.br -d www.meusite.com.br

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Usando Docker (Alternativo)

```bash
# Usar o docker-compose.production.yml
docker-compose -f docker-compose.production.yml up certbot
```

## 🚀 Deploy da Aplicação

### 1. Usando PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Configurar aplicação
cp ecosystem.config.js /var/www/meusite.com.br/
cd /var/www/meusite.com.br

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save
pm2 startup
```

### 2. Usando Docker

```bash
# Editar docker-compose.production.yml com seu domínio
# Executar containers
docker-compose -f docker-compose.production.yml up -d
```

## 📊 Verificação e Testes

### 1. Testes de Conectividade

```bash
# Testar HTTP
curl -I http://meusite.com.br

# Testar HTTPS
curl -I https://meusite.com.br

# Testar redirecionamento
curl -I http://www.meusite.com.br

# Testar health check
curl https://meusite.com.br/health
```

### 2. Testes de Performance

```bash
# Testar velocidade
curl -w "@curl-format.txt" -o /dev/null -s https://meusite.com.br

# Testar compressão
curl -H "Accept-Encoding: gzip" -I https://meusite.com.br
```

### 3. Ferramentas Online

- [SSL Labs](https://www.ssllabs.com/ssltest/) - Testar SSL
- [GTmetrix](https://gtmetrix.com/) - Performance
- [DNS Checker](https://dnschecker.org/) - Propagação DNS
- [Security Headers](https://securityheaders.com/) - Segurança

## 🔧 Configurações Avançadas

### 1. CDN (Opcional)

Para melhor performance global:

```bash
# Cloudflare
# 1. Adicionar site no Cloudflare
# 2. Alterar nameservers do domínio
# 3. Configurar regras de cache
```

### 2. Monitoramento

```bash
# Uptime monitoring
# - UptimeRobot
# - Pingdom
# - StatusCake

# Application monitoring
# - New Relic
# - DataDog
# - Sentry
```

### 3. Backup Automático

```bash
# Configurar backup diário
sudo crontab -e
# Adicionar:
0 2 * * * /var/www/meusite.com.br/scripts/backup.sh
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **DNS não propaga**
   - Aguardar até 48h para propagação completa
   - Verificar TTL dos registros
   - Usar DNS público (8.8.8.8) para teste

2. **SSL não funciona**
   - Verificar se certificado foi gerado
   - Conferir configuração do Nginx
   - Verificar firewall (portas 80 e 443)

3. **Site não carrega**
   - Verificar se aplicação está rodando
   - Conferir logs do Nginx e da aplicação
   - Verificar configurações de proxy

4. **Performance lenta**
   - Ativar compressão gzip
   - Configurar cache de arquivos estáticos
   - Otimizar imagens

### Logs Importantes

```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs da aplicação
pm2 logs
tail -f /var/www/meusite.com.br/logs/app.log

# Logs do sistema
sudo journalctl -u nginx -f
sudo journalctl -u pm2-root -f
```

## 📞 Suporte

Para suporte adicional:

1. Verificar documentação do provedor de hospedagem
2. Consultar documentação do registrador de domínio
3. Verificar logs de erro detalhados
4. Testar em ambiente de desenvolvimento primeiro

## ✅ Checklist Final

- [ ] DNS configurado e propagado
- [ ] SSL/HTTPS funcionando
- [ ] Redirecionamentos HTTP→HTTPS funcionando
- [ ] Site carregando corretamente
- [ ] Admin panel acessível
- [ ] API funcionando
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Performance otimizada
- [ ] Segurança configurada

---

**Importante**: Sempre teste as configurações em um ambiente de desenvolvimento antes de aplicar em produção.