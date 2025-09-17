# 🚀 Quick Start - Build APK

## ⚡ Início Rápido (5 minutos)

### 1. Obter Token do Expo
```bash
node get-expo-token.js
```
**Copie o token exibido**

### 2. Configurar no GitHub
1. Vá para seu repositório no GitHub
2. **Settings** > **Secrets and variables** > **Actions**
3. **New repository secret**
4. **Name**: `EXPO_TOKEN`
5. **Value**: Cole o token copiado

### 3. Fazer Push
```bash
git add .
git commit -m "Configurar GitHub Actions para build APK"
git push origin main
```

### 4. Acompanhar Build
1. Vá para aba **Actions** no GitHub
2. Aguarde o build concluir (~10-15 minutos)
3. Baixe o APK em **Artifacts** ou **Releases**

## 📁 Arquivos Criados

- `.github/workflows/build-android-simple.yml` - Build simples
- `.github/workflows/build-android.yml` - Build completo
- `.github/GITHUB_SECRETS_SETUP.md` - Guia detalhado
- `BUILD_INSTRUCTIONS.md` - Instruções completas
- `get-expo-token.js` - Script para obter token

## ✅ Status Atual

- ✅ Projeto configurado
- ✅ Workflows criados
- ⏳ Aguardando configuração de secrets
- ⏳ Aguardando primeiro build

## 🎯 Próximo Passo

**Configure o EXPO_TOKEN no GitHub e faça push!**