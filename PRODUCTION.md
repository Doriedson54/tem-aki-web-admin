# Guia de Produção - Negócios do Bairro

## 📱 Build do APK Android

### Opção 1: GitHub Actions (Recomendado)

O projeto está configurado com GitHub Actions para build automatizado do APK. Existem duas opções:

#### Build Simples (Para Testes)
- **Arquivo**: `.github/workflows/build-android-simple.yml`
- **Quando executa**: Push para main/master ou manualmente
- **Resultado**: APK debug não assinado
- **Requisitos**: Apenas `EXPO_TOKEN` nos secrets

#### Build Completo (Para Produção)
- **Arquivo**: `.github/workflows/build-android.yml`
- **Quando executa**: Push para main/master ou manualmente
- **Resultado**: APK release assinado
- **Requisitos**: Todos os secrets configurados

#### Configuração dos Secrets
Consulte o arquivo `.github/GITHUB_SECRETS_SETUP.md` para instruções detalhadas sobre como configurar os secrets necessários no GitHub.

#### Como Usar
1. Configure os secrets no GitHub (Settings > Secrets and variables > Actions)
2. Faça push para o repositório
3. Vá para a aba Actions no GitHub para acompanhar o build
4. Download do APK estará disponível como artifact ou release

### Opção 2: EAS Build (Limitado)
- Requer conta Expo com builds disponíveis
- Comando: `eas build --platform android --profile production-apk`

### Opção 3: Build Local
- Requer Android Studio e SDK configurado
- Comando: `npx expo prebuild && cd android && ./gradlew assembleRelease`

## 📋 Pré-requisitos

### Servidor de Produção
- **Sistema Operacional**: Ubuntu 20.04+ ou CentOS 8+
- **RAM**: Mínimo 4GB, recomendado 8GB+
- **CPU**: Mínimo 2 cores, recomendado 4 cores+
- **Armazenamento**: Mínimo 50GB SSD
- **Rede**: Conexão estável com IP público

### Software Necessário
- Docker 20.10+
- Docker Compose 2.0+
- Nginx (se não usar container)
- Certbot (para SSL)
- Git

## 🔧 Configuração Inicial

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx
sudo apt install nginx -y

# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Configuração de Firewall

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. Clonagem do Projeto

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/negocios-do-bairro.git
cd negocios-do-bairro

# Criar branch de produção
git checkout -b production
```

## 🔐 Configuração de Segurança

### 1. Variáveis de Ambiente

Criar arquivos `.env.production` para cada serviço:

#### Backend (.env.production)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@db:5432/negocios_db
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_KEY=sua_chave_servico_aqui
CORS_ORIGIN=https://admin.seudominio.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

#### Web Admin (.env.production)
```env
NODE_ENV=production
PORT=3001
API_BASE_URL=https://api.seudominio.com
SESSION_SECRET=seu_session_secret_super_seguro_aqui
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
LOG_LEVEL=info
```

### 2. Certificados SSL

```bash
# Gerar certificados Let's Encrypt
sudo certbot --nginx -d api.seudominio.com
sudo certbot --nginx -d admin.seudominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Configuração de Backup

```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-negocios.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/negocios-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker exec negocios-db pg_dump -U postgres negocios_db > $BACKUP_DIR/database.sql

# Backup dos uploads
cp -r /var/www/negocios/uploads $BACKUP_DIR/

# Compactar
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Manter apenas últimos 7 backups
find /backup -name "negocios-*.tar.gz" -mtime +7 -delete
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/backup-negocios.sh

# Agendar backup diário
sudo crontab -e
# Adicionar linha:
0 2 * * * /usr/local/bin/backup-negocios.sh
```

## 🚀 Deploy

### 1. Deploy Inicial

```bash
# Executar script de deploy
chmod +x deploy.sh
./deploy.sh

# Ou no Windows
.\deploy.ps1
```

### 2. Deploy com CI/CD (GitHub Actions)

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/negocios-do-bairro
          git pull origin production
          docker-compose down
          docker-compose build --no-cache
          docker-compose up -d
```

## 📊 Monitoramento

### 1. Logs

```bash
# Ver logs em tempo real
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f web-admin

# Logs com timestamp
docker-compose logs -f --timestamps
```

### 2. Métricas

```bash
# Iniciar monitoramento
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Acessar dashboards
# Grafana: http://localhost:3000 (admin/admin123)
# Prometheus: http://localhost:9090
```

### 3. Health Checks

```bash
# Verificar status dos serviços
curl http://localhost:3000/health
curl http://localhost:3001/health

# Verificar containers
docker-compose ps
docker stats
```

## 🔧 Manutenção

### 1. Atualizações

```bash
# Backup antes da atualização
/usr/local/bin/backup-negocios.sh

# Atualizar código
git pull origin production

# Rebuild e restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verificar se tudo está funcionando
./health-check.sh
```

### 2. Limpeza

```bash
# Limpar imagens não utilizadas
docker system prune -f

# Limpar volumes órfãos
docker volume prune -f

# Limpar logs antigos
sudo find /var/log -name "*.log" -mtime +30 -delete
```

### 3. Troubleshooting

#### Problemas Comuns

1. **Container não inicia**
   ```bash
   docker-compose logs [service-name]
   docker inspect [container-id]
   ```

2. **Erro de conexão com banco**
   ```bash
   docker exec -it negocios-db psql -U postgres -d negocios_db
   ```

3. **Problemas de SSL**
   ```bash
   sudo certbot certificates
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Alto uso de CPU/Memória**
   ```bash
   docker stats
   htop
   ```

## 📈 Performance

### 1. Otimizações

- **Nginx**: Configurar cache e compressão
- **Database**: Índices e query optimization
- **Node.js**: PM2 para clustering
- **Docker**: Multi-stage builds

### 2. Scaling

```bash
# Escalar serviços
docker-compose up -d --scale backend=3 --scale web-admin=2

# Load balancer com Nginx
# Configurar upstream com múltiplos servers
```

## 🔒 Segurança

### 1. Checklist de Segurança

- [ ] Firewall configurado
- [ ] SSL/TLS ativo
- [ ] Senhas fortes
- [ ] Rate limiting ativo
- [ ] Headers de segurança
- [ ] Logs de auditoria
- [ ] Backup automático
- [ ] Atualizações regulares

### 2. Monitoramento de Segurança

```bash
# Verificar tentativas de login
sudo tail -f /var/log/auth.log

# Monitorar conexões
sudo netstat -tulpn

# Verificar processos suspeitos
ps aux | grep -v grep
```

## 📞 Suporte

### Contatos de Emergência
- **DevOps**: devops@empresa.com
- **Backend**: backend@empresa.com
- **Frontend**: frontend@empresa.com

### Documentação Adicional
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

---

**Última atualização**: $(date)
**Versão**: 1.0.0