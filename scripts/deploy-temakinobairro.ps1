#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de Deploy para www.temakinobairro.com.br
    
.DESCRIPTION
    Este script automatiza o deploy da aplicação Temaki no Bairro para o domínio www.temakinobairro.com.br
    Inclui configuração de servidor, SSL, monitoramento e otimizações de produção.
    
.PARAMETER Environment
    Ambiente de deploy (production, staging)
    
.PARAMETER SkipBackup
    Pula o backup antes do deploy
    
.PARAMETER SkipTests
    Pula a execução dos testes
    
.EXAMPLE
    .\deploy-temakinobairro.ps1 -Environment production
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "staging")]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests
)

# Configurações específicas do domínio
$DOMAIN = "www.temakinobairro.com.br"
$APP_NAME = "temaki-no-bairro"
$APP_PORT = 3000
$DEPLOY_USER = "deploy"
$DEPLOY_PATH = "/var/www/temakinobairro"
$NGINX_CONFIG = "/etc/nginx/sites-available/temakinobairro.conf"
$SSL_EMAIL = "admin@temakinobairro.com.br"

# Cores para output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { $Red }
        "SUCCESS" { $Green }
        "WARNING" { $Yellow }
        "INFO" { $Blue }
        default { $Reset }
    }
    Write-Host "${color}[$timestamp] [$Level] $Message${Reset}"
}

function Test-Prerequisites {
    Write-Log "Verificando pré-requisitos..." "INFO"
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        Write-Log "Node.js encontrado: $nodeVersion" "SUCCESS"
    } catch {
        Write-Log "Node.js não encontrado. Instale Node.js 18+ antes de continuar." "ERROR"
        exit 1
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version
        Write-Log "npm encontrado: $npmVersion" "SUCCESS"
    } catch {
        Write-Log "npm não encontrado." "ERROR"
        exit 1
    }
    
    # Verificar PM2
    try {
        $pm2Version = pm2 --version
        Write-Log "PM2 encontrado: $pm2Version" "SUCCESS"
    } catch {
        Write-Log "PM2 não encontrado. Instalando..." "WARNING"
        npm install -g pm2
    }
    
    # Verificar arquivo .env.production
    if (-not (Test-Path ".env.production")) {
        Write-Log "Arquivo .env.production não encontrado!" "ERROR"
        Write-Log "Execute primeiro o script setup-production.js" "ERROR"
        exit 1
    }
    
    Write-Log "Todos os pré-requisitos atendidos!" "SUCCESS"
}

function Backup-Application {
    if ($SkipBackup) {
        Write-Log "Backup pulado conforme solicitado." "WARNING"
        return
    }
    
    Write-Log "Criando backup da aplicação..." "INFO"
    
    $backupDir = "backups"
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupName = "backup-$timestamp"
    
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    
    # Backup dos arquivos principais
    $filesToBackup = @(
        "package.json",
        "app_supabase.js",
        "public",
        "views",
        "middleware",
        "routes",
        ".env.production"
    )
    
    $backupPath = Join-Path $backupDir $backupName
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    
    foreach ($item in $filesToBackup) {
        if (Test-Path $item) {
            Copy-Item -Path $item -Destination $backupPath -Recurse -Force
        }
    }
    
    Write-Log "Backup criado em: $backupPath" "SUCCESS"
}

function Install-Dependencies {
    Write-Log "Instalando dependências de produção..." "INFO"
    
    # Limpar cache do npm
    npm cache clean --force
    
    # Instalar dependências
    npm ci --only=production
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Erro ao instalar dependências!" "ERROR"
        exit 1
    }
    
    Write-Log "Dependências instaladas com sucesso!" "SUCCESS"
}

function Run-Tests {
    if ($SkipTests) {
        Write-Log "Testes pulados conforme solicitado." "WARNING"
        return
    }
    
    Write-Log "Executando testes..." "INFO"
    
    # Verificar se existem testes
    if (Test-Path "test") {
        npm test
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Testes falharam! Deploy cancelado." "ERROR"
            exit 1
        }
    } else {
        Write-Log "Nenhum teste encontrado. Continuando..." "WARNING"
    }
    
    Write-Log "Testes executados com sucesso!" "SUCCESS"
}

function Optimize-Application {
    Write-Log "Otimizando aplicação para produção..." "INFO"
    
    # Executar script de otimização se existir
    if (Test-Path "scripts\optimize-production.js") {
        node scripts\optimize-production.js
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Erro na otimização!" "ERROR"
            exit 1
        }
    }
    
    Write-Log "Aplicação otimizada!" "SUCCESS"
}

function Setup-Environment {
    Write-Log "Configurando ambiente de produção..." "INFO"
    
    # Copiar arquivo de ambiente
    Copy-Item ".env.production" ".env" -Force
    
    # Criar diretórios necessários
    $directories = @("logs", "uploads", "temp", "backups")
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Log "Diretório criado: $dir" "INFO"
        }
    }
    
    Write-Log "Ambiente configurado!" "SUCCESS"
}

function Deploy-WithPM2 {
    Write-Log "Configurando PM2 para $DOMAIN..." "INFO"
    
    # Parar aplicação se estiver rodando
    pm2 stop $APP_NAME 2>$null
    pm2 delete $APP_NAME 2>$null
    
    # Configuração do PM2 para o domínio
    $pm2Config = @"
{
  "name": "$APP_NAME",
  "script": "app_supabase.js",
  "cwd": "$(Get-Location)",
  "instances": 2,
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production",
    "PORT": $APP_PORT,
    "DOMAIN_NAME": "$DOMAIN"
  },
  "log_file": "./logs/app.log",
  "out_file": "./logs/out.log",
  "error_file": "./logs/error.log",
  "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
  "merge_logs": true,
  "max_memory_restart": "500M",
  "node_args": "--max-old-space-size=512",
  "watch": false,
  "ignore_watch": ["node_modules", "logs", "uploads"],
  "max_restarts": 10,
  "min_uptime": "10s",
  "kill_timeout": 5000
}
"@
    
    $pm2Config | Out-File -FilePath "ecosystem.config.json" -Encoding UTF8
    
    # Iniciar aplicação
    pm2 start ecosystem.config.json
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Erro ao iniciar aplicação com PM2!" "ERROR"
        exit 1
    }
    
    # Salvar configuração do PM2
    pm2 save
    pm2 startup
    
    Write-Log "Aplicação iniciada com PM2!" "SUCCESS"
}

function Test-Application {
    Write-Log "Testando aplicação..." "INFO"
    
    # Aguardar aplicação inicializar
    Start-Sleep -Seconds 10
    
    # Testar health check
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$APP_PORT/health" -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Log "Health check passou!" "SUCCESS"
        } else {
            Write-Log "Health check falhou! Status: $($response.StatusCode)" "ERROR"
        }
    } catch {
        Write-Log "Erro ao testar aplicação: $($_.Exception.Message)" "ERROR"
    }
    
    # Mostrar status do PM2
    pm2 status
}

function Setup-SSL {
    Write-Log "Configurações de SSL para $DOMAIN" "INFO"
    
    Write-Host @"
${Yellow}=== CONFIGURAÇÃO SSL MANUAL ===${Reset}

Para configurar SSL no servidor de produção, execute os seguintes comandos:

1. Instalar Certbot:
   ${Blue}sudo apt update${Reset}
   ${Blue}sudo apt install certbot python3-certbot-nginx${Reset}

2. Obter certificado SSL:
   ${Blue}sudo certbot --nginx -d $DOMAIN -d temakinobairro.com.br --email $SSL_EMAIL --agree-tos --non-interactive${Reset}

3. Configurar renovação automática:
   ${Blue}sudo crontab -e${Reset}
   Adicionar linha: ${Blue}0 12 * * * /usr/bin/certbot renew --quiet${Reset}

4. Copiar configuração Nginx:
   ${Blue}sudo cp config/nginx/temakinobairro.conf /etc/nginx/sites-available/${Reset}
   ${Blue}sudo ln -s /etc/nginx/sites-available/temakinobairro.conf /etc/nginx/sites-enabled/${Reset}
   ${Blue}sudo nginx -t && sudo systemctl reload nginx${Reset}

"@
}

function Generate-DeployReport {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $report = @"
=== RELATÓRIO DE DEPLOY - TEMAKI NO BAIRRO ===
Data: $timestamp
Domínio: $DOMAIN
Ambiente: $Environment
Versão: $(Get-Content package.json | ConvertFrom-Json | Select-Object -ExpandProperty version)
Porta: $APP_PORT

=== STATUS DA APLICAÇÃO ===
$(pm2 status --no-color)

=== PRÓXIMOS PASSOS ===
1. Configurar DNS para apontar $DOMAIN para o IP do servidor
2. Configurar SSL com Let's Encrypt (ver instruções acima)
3. Configurar Nginx como proxy reverso
4. Configurar monitoramento e logs
5. Testar aplicação em produção

=== COMANDOS ÚTEIS ===
- Ver logs: pm2 logs $APP_NAME
- Reiniciar: pm2 restart $APP_NAME
- Parar: pm2 stop $APP_NAME
- Status: pm2 status
- Monitoramento: pm2 monit

=== ARQUIVOS IMPORTANTES ===
- Configuração: .env.production
- Nginx: config/nginx/temakinobairro.conf
- PM2: ecosystem.config.json
- Logs: logs/
"@
    
    $report | Out-File -FilePath "deploy-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt" -Encoding UTF8
    Write-Log "Relatório de deploy salvo!" "SUCCESS"
}

# === EXECUÇÃO PRINCIPAL ===

Write-Host @"
${Green}🍣 DEPLOY - TEMAKI NO BAIRRO${Reset}
${Blue}Domínio: $DOMAIN${Reset}
${Blue}Ambiente: $Environment${Reset}
${Blue}Porta: $APP_PORT${Reset}

"@

try {
    Test-Prerequisites
    Backup-Application
    Install-Dependencies
    Run-Tests
    Optimize-Application
    Setup-Environment
    Deploy-WithPM2
    Test-Application
    Setup-SSL
    Generate-DeployReport
    
    Write-Host @"

${Green}🎉 DEPLOY CONCLUÍDO COM SUCESSO! 🎉${Reset}

${Yellow}A aplicação Temaki no Bairro está rodando em:${Reset}
${Blue}http://localhost:$APP_PORT${Reset}

${Yellow}Para colocar no ar em $DOMAIN${Reset}
1. Configure o DNS do domínio para apontar para o IP do servidor
2. Configure SSL com Let's Encrypt (instruções mostradas acima)
3. Configure Nginx como proxy reverso
4. Teste a aplicação em produção

${Yellow}Comandos úteis:${Reset}
- ${Blue}pm2 status${Reset} - Ver status da aplicação
- ${Blue}pm2 logs $APP_NAME${Reset} - Ver logs
- ${Blue}pm2 restart $APP_NAME${Reset} - Reiniciar aplicação
- ${Blue}pm2 monit${Reset} - Monitoramento em tempo real

"@
    
} catch {
    Write-Log "Erro durante o deploy: $($_.Exception.Message)" "ERROR"
    exit 1
}

Write-Log "Deploy finalizado!" "SUCCESS"