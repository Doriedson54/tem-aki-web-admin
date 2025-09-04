# 🔧 Guia de Instalação Git e Configuração GitHub

## ❌ Problema Identificado
O Git não está instalado no seu sistema Windows. Vamos resolver isso passo a passo.

## 📋 Pré-requisitos
- Windows 10/11
- Conexão com internet
- Conta no GitHub (se não tiver, criaremos)

---

## 🚀 PASSO 1: Instalar Git

### 1.1 Download do Git
1. Acesse: https://git-scm.com/download/win
2. Clique em **"64-bit Git for Windows Setup"**
3. Aguarde o download (aproximadamente 50MB)

### 1.2 Instalação
1. Execute o arquivo baixado (`Git-2.xx.x-64-bit.exe`)
2. **Configurações recomendadas durante a instalação:**
   - ✅ **Select Components**: Deixe todas marcadas
   - ✅ **Default editor**: Use Visual Studio Code (se instalado) ou Notepad++
   - ✅ **PATH environment**: "Git from the command line and also from 3rd-party software"
   - ✅ **HTTPS transport backend**: "Use the OpenSSL library"
   - ✅ **Line ending conversions**: "Checkout Windows-style, commit Unix-style"
   - ✅ **Terminal emulator**: "Use Windows' default console window"
   - ✅ **Git Pull behavior**: "Default (fast-forward or merge)"
   - ✅ **Credential helper**: "Git Credential Manager"
   - ✅ **Extra options**: Marque "Enable file system caching"

3. Clique **"Install"** e aguarde
4. Clique **"Finish"**

### 1.3 Verificar Instalação
1. **Feche e reabra o PowerShell**
2. Execute:
```powershell
git --version
```
3. Deve aparecer algo como: `git version 2.xx.x.windows.1`

---

## 🔑 PASSO 2: Configurar Git

### 2.1 Configurar Usuário
```powershell
# Substitua pelos seus dados
git config --global user.name "Seu Nome Completo"
git config --global user.email "seu.email@gmail.com"
```

### 2.2 Verificar Configuração
```powershell
git config --list
```

---

## 🐙 PASSO 3: Criar Conta GitHub (se necessário)

### 3.1 Se você NÃO tem conta GitHub:
1. Acesse: https://github.com
2. Clique **"Sign up"**
3. Preencha:
   - **Username**: `temaki-no-bairro` (ou similar)
   - **Email**: Seu email
   - **Password**: Senha forte
4. Verifique o email
5. Escolha o plano **Free**

### 3.2 Se você JÁ tem conta GitHub:
1. Acesse: https://github.com
2. Faça login

---

## 📁 PASSO 4: Criar Repositório GitHub

### 4.1 Criar Novo Repositório
1. No GitHub, clique **"+"** → **"New repository"**
2. Preencha:
   - **Repository name**: `temaki-no-bairro-admin`
   - **Description**: `Sistema administrativo do Temaki no Bairro`
   - ✅ **Public** (ou Private se preferir)
   - ❌ **NÃO** marque "Add a README file"
   - ❌ **NÃO** marque "Add .gitignore"
   - ❌ **NÃO** marque "Choose a license"
3. Clique **"Create repository"**

### 4.2 Copiar URL do Repositório
- Copie a URL que aparece (algo como):
  ```
  https://github.com/SEU_USUARIO/temaki-no-bairro-admin.git
  ```

---

## 💻 PASSO 5: Configurar Repositório Local

### 5.1 Navegar para a Pasta
```powershell
cd "C:\Projetos\Aplicativos\Negócios do Bairro\web-admin"
```

### 5.2 Inicializar Git
```powershell
git init
```

### 5.3 Criar .gitignore
```powershell
# Criar arquivo .gitignore
echo "node_modules/" > .gitignore
echo "logs/" >> .gitignore
echo "temp/" >> .gitignore
echo "uploads/" >> .gitignore
echo "*.log" >> .gitignore
echo ".env" >> .gitignore
echo "tem_aki_admin.db" >> .gitignore
echo "backups/" >> .gitignore
echo "dist/" >> .gitignore
```

### 5.4 Adicionar Arquivos
```powershell
git add .
```

### 5.5 Fazer Primeiro Commit
```powershell
git commit -m "Deploy inicial Temaki no Bairro - Sistema administrativo completo"
```

### 5.6 Configurar Branch Principal
```powershell
git branch -M main
```

### 5.7 Conectar com GitHub
```powershell
# SUBSTITUA pela URL do SEU repositório
git remote add origin https://github.com/SEU_USUARIO/temaki-no-bairro-admin.git
```

### 5.8 Enviar para GitHub
```powershell
git push -u origin main
```

**Nota**: Na primeira vez, pode pedir login do GitHub.

---

## ✅ PASSO 6: Verificar Sucesso

1. Acesse seu repositório no GitHub
2. Verifique se os arquivos foram enviados
3. Deve ver arquivos como:
   - `package.json`
   - `app_supabase.js`
   - `vercel.json`
   - `.env.production`
   - E outros...

---

## 🔄 Comandos Úteis para o Futuro

### Atualizar Código no GitHub
```powershell
# Adicionar mudanças
git add .

# Fazer commit
git commit -m "Descrição das mudanças"

# Enviar para GitHub
git push
```

### Ver Status
```powershell
git status
```

### Ver Histórico
```powershell
git log --oneline
```

---

## 🚨 Solução de Problemas

### Erro: "Git não é reconhecido"
- **Solução**: Feche e reabra o PowerShell após instalar o Git

### Erro: "Permission denied"
- **Solução**: Configure autenticação do GitHub:
  ```powershell
  git config --global credential.helper manager
  ```

### Erro: "Repository not found"
- **Solução**: Verifique se a URL do repositório está correta

### Erro: "Authentication failed"
- **Solução**: Use Personal Access Token:
  1. GitHub → Settings → Developer settings → Personal access tokens
  2. Generate new token
  3. Use o token como senha

---

## 📞 Próximos Passos

Após concluir este guia:
1. ✅ Git instalado e configurado
2. ✅ Repositório GitHub criado
3. ✅ Código enviado para GitHub
4. 🔄 **Continue no GUIA-DEPLOY-SUPABASE-COMPLETO.md** no **PASSO 5** (Deploy no Vercel)

---

## 📋 Checklist Final

- [ ] Git instalado (`git --version` funciona)
- [ ] Git configurado (nome e email)
- [ ] Conta GitHub criada/acessada
- [ ] Repositório GitHub criado
- [ ] Código local commitado
- [ ] Código enviado para GitHub
- [ ] Repositório visível no GitHub

**🎉 Parabéns! Agora você pode continuar com o deploy no Vercel!**