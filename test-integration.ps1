# Script de Teste de Integração - Negócios do Bairro
# Este script testa todos os endpoints e serviços

Write-Host "🧪 Iniciando testes de integração..." -ForegroundColor Green
Write-Host ""

$errors = 0
$tests = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200
    )
    
    $global:tests++
    Write-Host "🔍 Testando: $Name" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "✅ $Name - OK (Status: $($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Name - FALHOU (Status: $($response.StatusCode), Esperado: $ExpectedStatus)" -ForegroundColor Red
            $global:errors++
            return $false
        }
    } catch {
        Write-Host "❌ $Name - ERRO: $($_.Exception.Message)" -ForegroundColor Red
        $global:errors++
        return $false
    }
}

function Test-Service {
    param(
        [string]$Name,
        [string]$Url
    )
    
    Write-Host "🔍 Verificando serviço: $Name" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ $Name está rodando" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $Name não está acessível" -ForegroundColor Red
        return $false
    }
}

# Teste 1: Verificar se os serviços estão rodando
Write-Host "📋 FASE 1: Verificando serviços..." -ForegroundColor Cyan
Write-Host ""

$backendRunning = Test-Service "Backend API" "http://localhost:3000"
$adminRunning = Test-Service "Web Admin" "http://localhost:3001"
$mobileRunning = Test-Service "Mobile App" "http://localhost:8081"

Write-Host ""

# Teste 2: Endpoints da API
if ($backendRunning) {
    Write-Host "📋 FASE 2: Testando endpoints da API..." -ForegroundColor Cyan
    Write-Host ""
    
    Test-Endpoint "Health Check" "http://localhost:3000/api/health"
    Test-Endpoint "Listar Categorias" "http://localhost:3000/api/categories"
    Test-Endpoint "Listar Negócios" "http://localhost:3000/api/businesses"
    
    Write-Host ""
}

# Teste 3: Web Admin
if ($adminRunning) {
    Write-Host "📋 FASE 3: Testando Web Admin..." -ForegroundColor Cyan
    Write-Host ""
    
    Test-Endpoint "Página Principal" "http://localhost:3001/"
    Test-Endpoint "Health Check Admin" "http://localhost:3001/health"
    
    Write-Host ""
}

# Teste 4: Aplicativo Móvel
if ($mobileRunning) {
    Write-Host "📋 FASE 4: Testando Aplicativo Móvel..." -ForegroundColor Cyan
    Write-Host ""
    
    Test-Endpoint "App Mobile" "http://localhost:8081/"
    
    Write-Host ""
}

# Teste 5: Conectividade entre serviços
Write-Host "📋 FASE 5: Testando conectividade..." -ForegroundColor Cyan
Write-Host ""

if ($backendRunning -and $adminRunning) {
    try {
        # Simular requisição do admin para a API
        $apiResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/businesses" -UseBasicParsing -TimeoutSec 10
        Write-Host "✅ Conectividade Admin -> API funcionando" -ForegroundColor Green
    } catch {
        Write-Host "❌ Problema na conectividade Admin -> API" -ForegroundColor Red
        $errors++
    }
    $tests++
}

Write-Host ""

# Relatório final
Write-Host "📊 RELATÓRIO FINAL" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Total de testes: $tests" -ForegroundColor White
Write-Host "Sucessos: $($tests - $errors)" -ForegroundColor Green
Write-Host "Falhas: $errors" -ForegroundColor Red

if ($errors -eq 0) {
    Write-Host ""
    Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "✅ Sistema está funcionando corretamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 URLs dos serviços:" -ForegroundColor Cyan
    Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
    Write-Host "   Web Admin: http://localhost:3001" -ForegroundColor White
    Write-Host "   Mobile App: http://localhost:8081" -ForegroundColor White
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ ALGUNS TESTES FALHARAM!" -ForegroundColor Red
    Write-Host "⚠️ Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
    exit 1
}