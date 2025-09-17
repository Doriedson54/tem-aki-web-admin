# Script de Deploy PowerShell - Negócios do Bairro
# Este script automatiza o processo de deploy para produção no Windows

param(
    [switch]$SkipBuild,
    [switch]$CleanImages,
    [switch]$Help
)

if ($Help) {
    Write-Host "Script de Deploy - Negócios do Bairro" -ForegroundColor Green
    Write-Host ""
    Write-Host "Parâmetros disponíveis:"
    Write-Host "  -SkipBuild    : Pula a etapa de build das imagens"
    Write-Host "  -CleanImages  : Remove imagens antigas automaticamente"
    Write-Host "  -Help         : Mostra esta ajuda"
    Write-Host ""
    Write-Host "Exemplo: .\deploy.ps1 -CleanImages"
    exit 0
}

Write-Host "🚀 Iniciando deploy do Negócios do Bairro..." -ForegroundColor Green

# Verificar se Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está instalado. Por favor, instale o Docker Desktop primeiro." -ForegroundColor Red
    Write-Host "Download: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar se Docker Compose está disponível
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose não está disponível." -ForegroundColor Red
    exit 1
}

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down

# Remover imagens antigas se solicitado
if ($CleanImages) {
    Write-Host "🗑️ Removendo imagens antigas..." -ForegroundColor Yellow
    docker system prune -f
} elseif (-not $SkipBuild) {
    $response = Read-Host "Deseja remover imagens antigas? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "🗑️ Removendo imagens antigas..." -ForegroundColor Yellow
        docker system prune -f
    }
}

# Build das imagens
if (-not $SkipBuild) {
    Write-Host "🔨 Construindo imagens Docker..." -ForegroundColor Yellow
    docker-compose build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro durante o build das imagens" -ForegroundColor Red
        exit 1
    }
}

# Verificar arquivos de ambiente
Write-Host "🔍 Verificando arquivos de ambiente..." -ForegroundColor Yellow

if (-not (Test-Path ".\backend\.env.production")) {
    Write-Host "⚠️ Arquivo .\backend\.env.production não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, configure as variáveis de ambiente de produção." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path ".\web-admin\.env.production")) {
    Write-Host "⚠️ Arquivo .\web-admin\.env.production não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, configure as variáveis de ambiente de produção." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Arquivos de ambiente encontrados" -ForegroundColor Green

# Iniciar serviços
Write-Host "🚀 Iniciando serviços..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar os serviços" -ForegroundColor Red
    exit 1
}

# Aguardar serviços ficarem prontos
Write-Host "⏳ Aguardando serviços ficarem prontos..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar status dos serviços
Write-Host "🔍 Verificando status dos serviços..." -ForegroundColor Yellow
docker-compose ps

# Testar endpoints
Write-Host "🧪 Testando endpoints..." -ForegroundColor Yellow

try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 10 -UseBasicParsing
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend está funcionando" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend retornou status: $($backendResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend não está respondendo" -ForegroundColor Red
}

try {
    $adminResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 10 -UseBasicParsing
    if ($adminResponse.StatusCode -eq 200) {
        Write-Host "✅ Web Admin está funcionando" -ForegroundColor Green
    } else {
        Write-Host "❌ Web Admin retornou status: $($adminResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Web Admin não está respondendo" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Serviços disponíveis:" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "   Web Admin: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "📊 Para monitorar os logs:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Para parar os serviços:" -ForegroundColor Cyan
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "📚 Para mais informações, consulte o README.md" -ForegroundColor Cyan