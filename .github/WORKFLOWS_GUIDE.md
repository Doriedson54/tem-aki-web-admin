# 🚀 Guia dos Workflows GitHub Actions

Este projeto possui workflows automatizados para build, deploy e testes. Aqui está um guia completo de como usar cada um.

## 📋 Workflows Disponíveis

### 1. 🌐 Build Web (`build-web.yml`)
**Quando executa:**
- Push para `main` ou `master`
- Pull requests
- Execução manual

**O que faz:**
- Instala dependências
- Faz build da aplicação web com Expo
- Faz upload dos artefatos
- Deploy automático para GitHub Pages
- Cria release para tags

### 2. 📱 Build EAS (`build-eas.yml`)
**Quando executa:**
- Push para `main` ou `master`
- Tags `v*`
- Execução manual (com opções)

**O que faz:**
- Build Android APK e iOS IPA
- Suporte a múltiplos profiles (development, preview, production)
- Upload para EAS
- Criação de releases

**Execução manual:**
```bash
# Via interface do GitHub
Actions → EAS Build → Run workflow
- Platform: android/ios/all
- Profile: development/preview/production
```

### 3. 🚀 Deploy (`deploy.yml`)
**Quando executa:**
- Push para `main`
- Tags `v*`
- Execução manual

**O que faz:**
- Deploy da aplicação web (Vercel/Netlify/GitHub Pages)
- Deploy do backend (Railway/Heroku)
- Deploy do painel admin
- Notificações de status

### 4. 🧪 CI/Testes (`ci.yml`)
**Quando executa:**
- Push para qualquer branch
- Pull requests

**O que faz:**
- Executa testes
- Verifica linting
- Valida configurações
- Testa builds
- Auditoria de segurança

## 🔧 Configuração Necessária

### Secrets Obrigatórios
Configure estes secrets no GitHub (Settings → Secrets and variables → Actions):

```bash
# Expo
EXPO_TOKEN=your_expo_token

# Vercel (opcional)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
VERCEL_ADMIN_PROJECT_ID=your_admin_project_id

# Netlify (opcional)
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id

# Railway (opcional)
RAILWAY_TOKEN=your_railway_token

# Heroku (opcional)
HEROKU_API_KEY=your_heroku_key
HEROKU_EMAIL=your_email

# Android Signing (para builds assinados)
ANDROID_SIGNING_KEY=base64_encoded_keystore
ANDROID_KEY_ALIAS=your_key_alias
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_PASSWORD=your_key_password
```

### Como obter tokens:

#### Expo Token:
```bash
npx expo login
npx expo whoami
# Vá para https://expo.dev/accounts/[username]/settings/access-tokens
```

#### Vercel Token:
```bash
# Vá para https://vercel.com/account/tokens
```

#### Netlify Token:
```bash
# Vá para https://app.netlify.com/user/applications#personal-access-tokens
```

## 🎯 Como Usar

### 1. Build Automático
```bash
# Fazer push para main dispara todos os workflows
git push origin main

# Criar tag dispara builds de produção
git tag v1.0.0
git push origin v1.0.0
```

### 2. Build Manual
```bash
# Via GitHub Actions interface
1. Vá para Actions no GitHub
2. Selecione o workflow desejado
3. Clique em "Run workflow"
4. Configure as opções
5. Execute
```

### 3. Deploy Manual
```bash
# Via GitHub Actions
Actions → Deploy Application → Run workflow
- Environment: staging/production
```

## 📊 Status dos Builds

### Badges
Adicione estes badges ao README:

```markdown
![Build Web](https://github.com/[username]/[repo]/workflows/Build%20Web%20App/badge.svg)
![EAS Build](https://github.com/[username]/[repo]/workflows/EAS%20Build/badge.svg)
![CI](https://github.com/[username]/[repo]/workflows/Continuous%20Integration/badge.svg)
![Deploy](https://github.com/[username]/[repo]/workflows/Deploy%20Application/badge.svg)
```

### Monitoramento
- **Actions tab**: Veja todos os workflows em execução
- **Releases**: Baixe builds automaticamente criados
- **Artifacts**: Acesse builds temporários

## 🔄 Fluxo de Trabalho Recomendado

### Desenvolvimento
```bash
1. Criar branch feature
2. Fazer commits
3. Push → CI executa automaticamente
4. Criar PR → Testes executam
5. Merge → Deploy automático
```

### Release
```bash
1. Merge para main
2. Criar tag: git tag v1.0.0
3. Push tag: git push origin v1.0.0
4. Workflows executam automaticamente
5. Releases são criados
```

## 🛠️ Troubleshooting

### Problemas Comuns

#### Build falha por falta de token:
```bash
# Verifique se EXPO_TOKEN está configurado
# Regenere o token se necessário
```

#### Deploy falha:
```bash
# Verifique secrets de deploy (Vercel, Netlify, etc.)
# Confirme permissões do token
```

#### EAS build trava:
```bash
# Verifique configuração eas.json
# Confirme que o projeto está configurado no Expo
```

### Logs Úteis
```bash
# Ver logs detalhados
Actions → [Workflow] → [Run] → [Job] → [Step]

# Download de artefatos
Actions → [Workflow] → [Run] → Artifacts
```

## 📝 Customização

### Modificar workflows:
1. Edite arquivos em `.github/workflows/`
2. Commit e push
3. Workflows são atualizados automaticamente

### Adicionar novos steps:
```yaml
- name: Meu step customizado
  run: |
    echo "Executando comando customizado"
    npm run meu-comando
```

### Configurar notificações:
- Slack: Use `8398a7/action-slack@v3`
- Discord: Use `Ilshidur/action-discord@master`
- Email: Configure no GitHub Settings

## 🎉 Próximos Passos

1. ✅ Configure os secrets necessários
2. ✅ Teste um workflow manual
3. ✅ Faça um push para testar automação
4. ✅ Configure badges no README
5. ✅ Customize conforme necessário

---

**💡 Dica:** Comece com workflows simples e vá adicionando complexidade gradualmente!