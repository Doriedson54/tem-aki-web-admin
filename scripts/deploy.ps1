# Script de Deploy Automatizado - Tem Aki Institucional (Windows)
# PowerShell script para deploy em ambiente Windows

param(
    [string]$Environment = "production",
    [string]$Domain = "",
    [switch]$SkipTests = $false,
    [switch]$SkipBackup = $false,
    [switch]$Help = $false
)

# Função para exibir ajuda
function Show-Help {
    Write-Host "Deploy Script - Tem Aki Institucional" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\deploy.ps1 [parâmetros]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Parâmetros:" -ForegroundColor Green
    Write-Host "  -Environment    Ambiente de deploy (production, staging) [padrão: production]"
    Write-Host "  -Domain         Domínio do site (obrigatório para production)"
    Write-Host "  -SkipTests      Pular execução de testes"
    Write-Host "  -SkipBackup     Pular criação de backup"
    Write-Host "  -Help           Exibir esta ajuda"
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Green
    Write-Host "  .\deploy.ps1 -Domain 'meusite.com.br'"
    Write-Host "  .\deploy.ps1 -Environment staging -SkipTests"
    exit 0
}

if ($Help) {
    Show-Help
}

# Funções de log
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-LogWarning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-LogStep {
    param([int]$Step, [string]$Message)
    Write-Host ""
    Write-Host "[STEP $Step] $Message" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
}

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-LogError "Este script deve ser executado no diretório raiz do projeto"
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-LogInfo "Node.js versão: $nodeVersion"
} catch {
    Write-LogError "Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm --version
    Write-LogInfo "npm versão: $npmVersion"
} catch {
    Write-LogError "npm não encontrado."
    exit 1
}

# Carregar configurações
$envFile = ".env.$Environment"
if (-not (Test-Path $envFile)) {
    Write-LogError "Arquivo $envFile não encontrado. Execute o script setup-production.js primeiro."
    exit 1
}

# Ler variáveis do arquivo .env
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $envVars[$matches[1]] = $matches[2]
    }
}

# Verificar domínio
if ($Environment -eq "production" -and -not $Domain) {
    if ($envVars.ContainsKey("DOMAIN_NAME")) {
        $Domain = $envVars["DOMAIN_NAME"]
    } else {
        Write-LogError "Domínio é obrigatório para ambiente de produção"
        exit 1
    }
}

# Cabeçalho
Write-Host "🚀 Iniciando deploy do Tem Aki Institucional" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Ambiente: $Environment" -ForegroundColor White
if ($Domain) {
    Write-Host "Domínio: $Domain" -ForegroundColor White
}
Write-Host "Versão: $($envVars['DEPLOY_VERSION'] ?? '2.0.0')" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Backup
if (-not $SkipBackup) {
    Write-LogStep 1 "Criando backup"
    
    $backupDir = "backups\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    if (Test-Path "dist") {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Copy-Item -Path "dist\*" -Destination $backupDir -Recurse -Force
        Write-LogSuccess "Backup criado em $backupDir"
    } else {
        Write-LogInfo "Primeira instalação - sem backup necessário"
    }
} else {
    Write-LogInfo "Backup pulado conforme solicitado"
}

# Passo 2: Verificar Git (se disponível)
Write-LogStep 2 "Verificando controle de versão"
try {
    $gitStatus = git status --porcelain 2>$null
    if ($gitStatus) {
        Write-LogWarning "Existem alterações não commitadas:"
        git status --short
        $continue = Read-Host "Continuar mesmo assim? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-LogInfo "Deploy cancelado pelo usuário"
            exit 0
        }
    }
    
    $gitCommit = git rev-parse HEAD 2>$null
    Write-LogInfo "Commit atual: $($gitCommit.Substring(0,8))"
} catch {
    Write-LogWarning "Git não disponível ou não é um repositório Git"
}

# Passo 3: Instalar dependências
Write-LogStep 3 "Instalando dependências"
try {
    if ($Environment -eq "production") {
        npm ci --only=production
    } else {
        npm ci
    }
    Write-LogSuccess "Dependências instaladas"
} catch {
    Write-LogError "Falha ao instalar dependências"
    exit 1
}

# Passo 4: Executar testes
if (-not $SkipTests) {
    Write-LogStep 4 "Executando testes"
    
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.test) {
        try {
            npm test
            Write-LogSuccess "Testes executados com sucesso"
        } catch {
            Write-LogError "Testes falharam"
            $continue = Read-Host "Continuar mesmo assim? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                exit 1
            }
        }
    } else {
        Write-LogWarning "Nenhum teste configurado"
    }
} else {
    Write-LogInfo "Testes pulados conforme solicitado"
}

# Passo 5: Otimizar para produção
Write-LogStep 5 "Otimizando aplicação"
try {
    if (Test-Path "scripts\optimize-production.js") {
        node scripts\optimize-production.js
        Write-LogSuccess "Aplicação otimizada"
    } else {
        Write-LogWarning "Script de otimização não encontrado"
    }
} catch {
    Write-LogError "Falha na otimização: $($_.Exception.Message)"
    exit 1
}

# Passo 6: Configurar ambiente
Write-LogStep 6 "Configurando ambiente"

# Copiar arquivo de ambiente
Copy-Item $envFile ".env" -Force
Write-LogSuccess "Arquivo de ambiente configurado"

# Criar diretórios necessários
$directories = @("logs", "uploads", "temp")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-LogInfo "Diretório $dir criado"
    }
}

# Passo 7: Configurar PM2 (se disponível)
Write-LogStep 7 "Configurando PM2"
try {
    $pm2Version = pm2 --version 2>$null
    Write-LogInfo "PM2 versão: $pm2Version"
    
    # Parar aplicação anterior
    pm2 stop tem-aki-institucional 2>$null
    pm2 delete tem-aki-institucional 2>$null
    
    # Iniciar nova aplicação
    pm2 start ecosystem.config.js --env $Environment
    pm2 save
    
    Write-LogSuccess "PM2 configurado"
} catch {
    Write-LogWarning "PM2 não disponível. Aplicação deve ser iniciada manualmente."
}

# Passo 8: Verificar aplicação
Write-LogStep 8 "Verificando aplicação"

# Aguardar inicialização
Start-Sleep -Seconds 5

# Verificar se a aplicação está respondendo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$($envVars['PORT'] ?? '3000')/health" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-LogSuccess "Health check passou"
    } else {
        Write-LogWarning "Health check retornou status $($response.StatusCode)"
    }
} catch {
    Write-LogWarning "Health check falhou: $($_.Exception.Message)"
}

# Passo 9: Configurar IIS (se disponível)
Write-LogStep 9 "Configurando IIS (opcional)"
try {
    $iisFeature = Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
    if ($iisFeature.State -eq "Enabled") {
        Write-LogInfo "IIS detectado. Configurando proxy reverso..."
        
        # Verificar se o módulo URL Rewrite está instalado
        if (Get-Module -ListAvailable -Name WebAdministration) {
            Import-Module WebAdministration
            
            # Criar configuração básica do IIS
            $webConfigContent = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="NodeJS" stopProcessing="true">
          <match url=".*" />
          <action type="Rewrite" url="http://localhost:$($envVars['PORT'] ?? '3000')/{R:0}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@
            
            $webConfigContent | Out-File -FilePath "web.config" -Encoding UTF8
            Write-LogSuccess "Configuração do IIS criada"
        } else {
            Write-LogWarning "Módulo WebAdministration não disponível"
        }
    } else {
        Write-LogInfo "IIS não está habilitado"
    }
} catch {
    Write-LogWarning "Erro ao configurar IIS: $($_.Exception.Message)"
}

# Passo 10: Gerar relatório de deploy
Write-LogStep 10 "Gerando relatório de deploy"

$deployInfo = @{
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    version = $envVars['DEPLOY_VERSION'] ?? '2.0.0'
    environment = $Environment
    domain = $Domain
    deployed_by = $env:USERNAME
    server = $env:COMPUTERNAME
    node_version = $nodeVersion
    npm_version = $npmVersion
}

try {
    $gitCommit = git rev-parse HEAD 2>$null
    $deployInfo.git_commit = $gitCommit
} catch {
    # Git não disponível
}

$deployInfo | ConvertTo-Json -Depth 3 | Out-File -FilePath "deploy-info.json" -Encoding UTF8
Write-LogSuccess "Relatório de deploy salvo em deploy-info.json"

# Resumo final
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

if ($Domain) {
    Write-Host "🌐 Site: https://$Domain" -ForegroundColor White
    Write-Host "🔧 Admin: https://$Domain/admin" -ForegroundColor White
    Write-Host "📊 Health: https://$Domain/health" -ForegroundColor White
} else {
    Write-Host "🌐 Site: http://localhost:$($envVars['PORT'] ?? '3000')" -ForegroundColor White
    Write-Host "🔧 Admin: http://localhost:$($envVars['PORT'] ?? '3000')/admin" -ForegroundColor White
    Write-Host "📊 Health: http://localhost:$($envVars['PORT'] ?? '3000')/health" -ForegroundColor White
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Testar todas as funcionalidades do site"
Write-Host "2. Configurar backup automático"
Write-Host "3. Configurar monitoramento"
if ($Environment -eq "production") {
    Write-Host "4. Configurar DNS do domínio"
    Write-Host "5. Configurar SSL/HTTPS"
}
Write-Host ""
Write-Host "📚 Comandos úteis:" -ForegroundColor Yellow
Write-Host "- Ver logs: pm2 logs tem-aki-institucional"
Write-Host "- Status: pm2 status"
Write-Host "- Reiniciar: pm2 restart tem-aki-institucional"
Write-Host "- Parar: pm2 stop tem-aki-institucional"
Write-Host ""
Write-Host "✅ Deploy finalizado em $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Green

# Abrir navegador (opcional)
$openBrowser = Read-Host "Abrir o site no navegador? (y/N)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    $url = if ($Domain) { "https://$Domain" } else { "http://localhost:$($envVars['PORT'] ?? '3000')" }
    Start-Process $url
}