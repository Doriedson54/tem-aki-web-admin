# 🚀 Solução Rápida: Instalar Git e Configurar GitHub

## ❌ Problema
O Git não está instalado no seu sistema. Vamos resolver isso de forma simples e rápida.

---

## 📥 OPÇÃO 1: Instalação Manual (RECOMENDADA)

### Passo 1: Baixar Git
1. **Acesse**: https://git-scm.com/download/win
2. **Clique em**: "64-bit Git for Windows Setup"
3. **Execute** o arquivo baixado
4. **Durante a instalação**: Aceite todas as configurações padrão (apenas clique "Next")
5. **Ao final**: Clique "Finish"

### Passo 2: Verificar Instalação
1. **Feche** este PowerShell
2. **Abra um novo PowerShell**
3. **Execute**:
```powershell
git --version
```
4. **Deve aparecer**: `git version 2.xx.x.windows.1`

---

## 🔧 OPÇÃO 2: Via PowerShell Administrativo

### Se preferir instalar via comando:
1. **Clique com botão direito** no PowerShell
2. **Selecione**: "Executar como administrador"
3. **Execute**:
```powershell
choco install git -y
```
4. **Aguarde** a instalação
5. **Feche e reabra** o PowerShell

---

## ⚙️ Configurar Git (APÓS INSTALAÇÃO)

### Execute estes comandos (substitua pelos seus dados):
```powershell
# Configurar nome
git config --global user.name "Seu Nome Completo"

# Configurar email
git config --global user.email "seu.email@gmail.com"

# Configurar branch padrão
git config --global init.defaultBranch main
```

---

## 🐙 Criar Repositório GitHub

### 1. Acessar GitHub
- **Acesse**: https://github.com
- **Faça login** (ou crie conta se necessário)

### 2. Criar Repositório
- **Clique**: "+" → "New repository"
- **Nome**: `temaki-no-bairro-admin`
- **Descrição**: `Sistema administrativo Temaki no Bairro`
- **Público** ou **Privado** (sua escolha)
- **NÃO marque** nenhuma opção adicional
- **Clique**: "Create repository"

### 3. Copiar URL
- **Copie** a URL que aparece (exemplo):
  ```
  https://github.com/SEU_USUARIO/temaki-no-bairro-admin.git
  ```

---

## 💻 Enviar Código para GitHub

### Execute estes comandos na pasta web-admin:
```powershell
# Navegar para a pasta (se não estiver)
cd "C:\Projetos\Aplicativos\Negócios do Bairro\web-admin"

# Inicializar Git
git init

# Criar .gitignore
echo "node_modules/" > .gitignore
echo "logs/" >> .gitignore
echo "temp/" >> .gitignore
echo "uploads/" >> .gitignore
echo "*.log" >> .gitignore
echo ".env" >> .gitignore
echo "tem_aki_admin.db" >> .gitignore
echo "backups/" >> .gitignore

# Adicionar arquivos
git add .

# Fazer commit
git commit -m "Deploy inicial Temaki no Bairro"

# Configurar branch
git branch -M main

# Conectar com GitHub (SUBSTITUA pela SUA URL)
git remote add origin https://github.com/SEU_USUARIO/temaki-no-bairro-admin.git

# Enviar para GitHub
git push -u origin main
```

---

## ✅ Verificar Sucesso

1. **Acesse** seu repositório no GitHub
2. **Verifique** se os arquivos apareceram:
   - `package.json`
   - `app_supabase.js`
   - `vercel.json`
   - `.env.production`
   - E outros...

---

## 🎯 Próximos Passos

**Após o Git estar funcionando:**
1. ✅ Continue no **GUIA-DEPLOY-SUPABASE-COMPLETO.md**
2. 🔄 Vá para o **PASSO 5: Deploy no Vercel**
3. 🚀 Seu site estará no ar em poucos minutos!

---

## 🆘 Precisa de Ajuda?

### Se der erro "git não é reconhecido":
- **Solução**: Feche e reabra o PowerShell

### Se der erro de autenticação:
- **Solução**: Use seu usuário e senha do GitHub

### Se der erro "repository not found":
- **Solução**: Verifique se a URL do repositório está correta

---

## 📞 Status Atual

**Você está aqui:**
- ❌ Git não instalado
- ⏳ Precisa instalar Git
- ⏳ Precisa configurar GitHub
- ⏳ Precisa enviar código

**Após seguir este guia:**
- ✅ Git instalado e configurado
- ✅ Código no GitHub
- 🚀 **Pronto para deploy no Vercel!**

---

**🎉 Escolha a OPÇÃO 1 (manual) se quiser mais controle, ou OPÇÃO 2 (comando) se preferir automático!**