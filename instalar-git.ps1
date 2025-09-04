# Script para instalar Git automaticamente no Windows
# Execute como Administrador

Write-Host "🔧 Instalador Automático do Git para Temaki no Bairro" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Verificar se já está instalado
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Host "✅ Git já está instalado: $gitVersion" -ForegroundColor Green
        Write-Host "Prosseguindo para configuração..." -ForegroundColor Yellow
        Start-Sleep 2
    }
} catch {
    Write-Host "📥 Git não encontrado. Iniciando instalação..." -ForegroundColor Yellow
    
    # URL do Git para Windows (64-bit)
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $gitInstaller = "$env:TEMP\Git-Installer.exe"
    
    try {
        Write-Host "📥 Baixando Git..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller -UseBasicParsing
        
        Write-Host "🚀 Instalando Git..." -ForegroundColor Yellow
        Write-Host "⚠️  Uma janela de instalação será aberta. Aceite as configurações padrão." -ForegroundColor Red
        
        # Instalar silenciosamente com configurações padrão
        Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL", "/SP-", "/CLOSEAPPLICATIONS", "/RESTARTAPPLICATIONS", "/COMPONENTS=ext\\shellhere,assoc,assoc_sh" -Wait
        
        Write-Host "🗑️  Limpando arquivos temporários..." -ForegroundColor Yellow
        Remove-Item $gitInstaller -Force
        
        Write-Host "✅ Git instalado com sucesso!" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Feche e reabra o PowerShell para usar o Git" -ForegroundColor Red
        
    } catch {
        Write-Host "❌ Erro ao instalar Git: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "📋 Instalação manual necessária:" -ForegroundColor Yellow
        Write-Host "   1. Acesse: https://git-scm.com/download/win" -ForegroundColor White
        Write-Host "   2. Baixe e execute o instalador" -ForegroundColor White
        Write-Host "   3. Use as configurações padrão" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Configurando Git..." -ForegroundColor Yellow

# Solicitar informações do usuário
$userName = Read-Host "Digite seu nome completo"
$userEmail = Read-Host "Digite seu email"

try {
    # Configurar Git
    git config --global user.name "$userName"
    git config --global user.email "$userEmail"
    git config --global init.defaultBranch main
    git config --global credential.helper manager
    
    Write-Host "✅ Git configurado com sucesso!" -ForegroundColor Green
    Write-Host "📋 Configurações aplicadas:" -ForegroundColor White
    Write-Host "   Nome: $userName" -ForegroundColor White
    Write-Host "   Email: $userEmail" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro ao configurar Git: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "⚠️  Configure manualmente após reiniciar o PowerShell" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Instalação concluída!" -ForegroundColor Green
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Feche e reabra o PowerShell" -ForegroundColor White
Write-Host "   2. Execute: git --version" -ForegroundColor White
Write-Host "   3. Continue com o GUIA-INSTALACAO-GIT-GITHUB.md" -ForegroundColor White

Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")