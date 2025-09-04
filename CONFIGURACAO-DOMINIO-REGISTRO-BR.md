# 🌐 Configuração do Domínio www.temakinobairro.com.br

## ✅ Status Atual
- ✅ Domínio registrado: `www.temakinobairro.com.br`
- ✅ Registrador: Registro.br
- ⏳ Configuração DNS: **PENDENTE**
- ⏳ Servidor de hospedagem: **PENDENTE**
- ⏳ Deploy da aplicação: **PENDENTE**

## 🎯 O que você precisa fazer

### 1. 🏢 Contratar Hospedagem/Servidor

**Opções recomendadas:**

#### A) **VPS/Cloud (Recomendado)**
- **DigitalOcean**: $5-10/mês
- **Vultr**: $5-10/mês
- **Linode**: $5-10/mês
- **AWS EC2**: $5-15/mês
- **Google Cloud**: $5-15/mês

#### B) **Hospedagem Nacional**
- **Hostinger**: R$ 15-30/mês
- **UOL Host**: R$ 20-40/mês
- **Locaweb**: R$ 25-50/mês

**Especificações mínimas:**
- 1 GB RAM
- 1 vCPU
- 25 GB SSD
- Ubuntu 20.04+ ou CentOS 8+
- Acesso SSH/root

### 2. 🔧 Configurar DNS no Registro.br

#### Passo 1: Acessar o painel do Registro.br
1. Acesse: https://registro.br/
2. Faça login com suas credenciais
3. Vá em "Meus domínios"
4. Clique em `temakinobairro.com.br`

#### Passo 2: Configurar DNS
1. Vá na seção "DNS" ou "Gerenciar DNS"
2. **Remova** todos os registros existentes (se houver)
3. **Adicione** os seguintes registros:

```
Tipo: A
Nome: @
Valor: [IP_DO_SEU_SERVIDOR]
TTL: 3600

Tipo: A
Nome: www
Valor: [IP_DO_SEU_SERVIDOR]
TTL: 3600

Tipo: CNAME
Nome: *
Valor: temakinobairro.com.br
TTL: 3600
```

**⚠️ Importante:** Substitua `[IP_DO_SEU_SERVIDOR]` pelo IP real do seu servidor.

#### Passo 3: Aguardar propagação
- Tempo: 24-48 horas
- Verificar em: https://dnschecker.org/

### 3. 🖥️ Configurar o Servidor

#### Conectar ao servidor via SSH:
```bash
ssh root@[IP_DO_SEU_SERVIDOR]
```

#### Instalar dependências:
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
npm install -g pm2

# Instalar Nginx
sudo apt install nginx -y

# Instalar Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y

# Instalar Git
sudo apt install git -y
```

### 4. 📁 Upload da Aplicação

#### Opção A: Via Git (Recomendado)
```bash
# No servidor
cd /var/www/
sudo git clone [URL_DO_SEU_REPOSITORIO] temakinobairro
cd temakinobairro/web-admin
sudo chown -R $USER:$USER .
```

#### Opção B: Via FTP/SFTP
1. Use FileZilla, WinSCP ou similar
2. Conecte no servidor
3. Faça upload da pasta `web-admin` para `/var/www/temakinobairro/`

### 5. ⚙️ Configurar a Aplicação

```bash
# No servidor, dentro da pasta da aplicação
cd /var/www/temakinobairro/web-admin

# Instalar dependências
npm install --production

# Copiar arquivo de configuração
cp .env.production .env

# Editar configurações (se necessário)
nano .env
```

**Verificar as configurações em `.env`:**
```env
NODE_ENV=production
PORT=3000
DOMAIN=www.temakinobairro.com.br
BASE_URL=https://www.temakinobairro.com.br
# ... outras configurações
```

### 6. 🚀 Iniciar com PM2

```bash
# Iniciar aplicação
pm2 start app_supabase.js --name "temakinobairro"

# Configurar para iniciar automaticamente
pm2 startup
pm2 save

# Verificar status
pm2 status
pm2 logs temakinobairro
```

### 7. 🌐 Configurar Nginx

#### Criar arquivo de configuração:
```bash
sudo nano /etc/nginx/sites-available/temakinobairro
```

#### Conteúdo do arquivo:
```nginx
server {
    listen 80;
    server_name temakinobairro.com.br www.temakinobairro.com.br;
    
    # Redirecionar para HTTPS
    return 301 https://www.temakinobairro.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    server_name temakinobairro.com.br;
    
    # Redirecionar para www
    return 301 https://www.temakinobairro.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.temakinobairro.com.br;
    
    # Certificados SSL (serão configurados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/www.temakinobairro.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.temakinobairro.com.br/privkey.pem;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Configurações de cache
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy para aplicação Node.js
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
    }
}
```

#### Ativar configuração:
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/temakinobairro /etc/nginx/sites-enabled/

# Remover configuração padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 8. 🔒 Configurar SSL (HTTPS)

```bash
# Obter certificado SSL gratuito
sudo certbot --nginx -d temakinobairro.com.br -d www.temakinobairro.com.br

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 9. 🔥 Configurar Firewall

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verificar status
sudo ufw status
```

### 10. ✅ Verificar Funcionamento

#### Testes básicos:
```bash
# Verificar aplicação
curl http://localhost:3000

# Verificar Nginx
sudo systemctl status nginx

# Verificar PM2
pm2 status

# Verificar logs
pm2 logs temakinobairro
sudo tail -f /var/log/nginx/access.log
```

#### Testes externos:
1. Acesse: https://www.temakinobairro.com.br
2. Verifique SSL: https://www.ssllabs.com/ssltest/
3. Teste velocidade: https://pagespeed.web.dev/

## 🚨 Troubleshooting

### Problema: Site não carrega
```bash
# Verificar DNS
nslookup www.temakinobairro.com.br

# Verificar aplicação
pm2 logs temakinobairro
curl http://localhost:3000

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Problema: SSL não funciona
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew --dry-run

# Verificar configuração Nginx
sudo nginx -t
```

### Problema: Aplicação não inicia
```bash
# Verificar logs
pm2 logs temakinobairro

# Verificar dependências
npm install

# Verificar arquivo .env
cat .env
```

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs: `pm2 logs temakinobairro`
2. Consulte este guia novamente
3. Entre em contato com suporte técnico

## 🎉 Próximos Passos

Após o site estar funcionando:
1. Configure backup automático
2. Configure monitoramento
3. Otimize performance
4. Configure analytics (Google Analytics)
5. Configure SEO básico

---

**⏰ Tempo estimado total: 2-4 horas**
**💰 Custo mensal estimado: R$ 15-50**

**🔗 Links úteis:**
- Registro.br: https://registro.br/
- DNS Checker: https://dnschecker.org/
- SSL Test: https://www.ssllabs.com/ssltest/
- PageSpeed: https://pagespeed.web.dev/