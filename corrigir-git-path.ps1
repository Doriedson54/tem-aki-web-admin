# Script para corrigir o PATH do Git e configurar tudo
Write-Host "🔧 Corrigindo PATH do Git..." -ForegroundColor Yellow

# Verificar se Git está instalado
if (Test-Path 'C:\Program Files\Git\bin\git.exe') {
    Write-Host "✅ Git encontrado em: C:\Program Files\Git\bin\git.exe" -ForegroundColor Green
    
    # Adicionar Git ao PATH da sessão atual
    $env:PATH += ';C:\Program Files\Git\bin'
    
    # Verificar se funcionou
    try {
        $gitVersion = & 'C:\Program Files\Git\bin\git.exe' --version
        Write-Host "✅ Git funcionando: $gitVersion" -ForegroundColor Green
        
        # Configurar Git
        Write-Host "\n🔧 Configurando Git..." -ForegroundColor Yellow
        
        $userName = Read-Host "Digite seu nome completo"
        $userEmail = Read-Host "Digite seu email"
        
        & 'C:\Program Files\Git\bin\git.exe' config --global user.name "$userName"
        & 'C:\Program Files\Git\bin\git.exe' config --global user.email "$userEmail"
        & 'C:\Program Files\Git\bin\git.exe' config --global init.defaultBranch main
        
        Write-Host "✅ Git configurado com sucesso!" -ForegroundColor Green
        Write-Host "   Nome: $userName" -ForegroundColor White
        Write-Host "   Email: $userEmail" -ForegroundColor White
        
        # Adicionar PATH permanentemente (requer admin)
        Write-Host "\n🔧 Tentando adicionar Git ao PATH permanentemente..." -ForegroundColor Yellow
        
        try {
            $currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
            if ($currentPath -notlike '*Git\bin*') {
                $newPath = $currentPath + ';C:\Program Files\Git\bin'
                [Environment]::SetEnvironmentVariable('PATH', $newPath, 'User')
                Write-Host "✅ Git adicionado ao PATH permanentemente!" -ForegroundColor Green
                Write-Host "⚠️  Reinicie o PowerShell para que as mudanças tenham efeito" -ForegroundColor Red
            } else {
                Write-Host "✅ Git já está no PATH" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️  Não foi possível adicionar ao PATH permanentemente" -ForegroundColor Yellow
            Write-Host "   Você pode fazer isso manualmente nas Variáveis de Ambiente" -ForegroundColor White
        }
        
        Write-Host "\n🎉 Configuração concluída!" -ForegroundColor Green
        Write-Host "\n📋 Próximos passos:" -ForegroundColor Yellow
        Write-Host "1. Criar repositório no GitHub" -ForegroundColor White
        Write-Host "2. Executar comandos de upload do código" -ForegroundColor White
        Write-Host "3. Continuar com deploy no Vercel" -ForegroundColor White
        
    } catch {
        Write-Host "❌ Erro ao executar Git: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ Git não encontrado em C:\Program Files\Git\bin\git.exe" -ForegroundColor Red
    Write-Host "\n📋 Soluções:" -ForegroundColor Yellow
    Write-Host "1. Reinstalar Git de https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "2. Verificar se foi instalado em outro local" -ForegroundColor White
    Write-Host "3. Executar como Administrador" -ForegroundColor White
}

Write-Host "\nPressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")