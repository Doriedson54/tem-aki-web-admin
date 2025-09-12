# Configuração GitHub Actions para Builds Automáticos

## 🚀 Configuração Rápida

### 1. Secrets Necessários

Vá em **Settings > Secrets and variables > Actions** no seu repositório GitHub e adicione:

#### Obrigatórios:
- `EXPO_TOKEN`: Token da sua conta Expo
  ```bash
  # Para obter o token:
  npx expo login
  npx expo whoami --json
  ```

#### Para builds de produção (opcional):
- `ANDROID_KEYSTORE`: Base64 do arquivo .jks
- `ANDROID_KEYSTORE_PASSWORD`: Senha do keystore
- `ANDROID_KEY_ALIAS`: Alias da chave
- `ANDROID_KEY_PASSWORD`: Senha da chave
- `IOS_DISTRIBUTION_CERTIFICATE`: Certificado iOS (Base64)
- `IOS_PROVISIONING_PROFILE`: Perfil de provisionamento iOS (Base64)

### 2. Como Usar

#### Trigger Manual (Recomendado para começar):
1. Vá em **Actions** no GitHub
2. Selecione **Build React Native App**
3. Clique **Run workflow**
4. Escolha:
   - **Platform**: android, ios, ou all
   - **Profile**: development, preview, ou production
5. Clique **Run workflow**

#### Trigger Automático:
- **Push para main/develop**: Build automático
- **Pull Request para main**: Build de teste

### 3. Download dos APKs/IPAs

1. Vá em **Actions** no GitHub
2. Clique no workflow executado
3. Na seção **Artifacts**, baixe:
   - `android-app-preview` (APK para teste)
   - `ios-app-preview` (IPA para teste)
   - `android-aab-production` (AAB para Play Store)

---

## 🔧 Configuração Avançada

### Builds Locais no GitHub Actions

O workflow está configurado para usar `--local`, que significa:
- ✅ **Builds ilimitados e gratuitos**
- ✅ **Sem fila de espera**
- ✅ **Controle total do processo**
- ⚠️ **Precisa configurar certificados manualmente**

### Alternativa: Usar EAS Build na Nuvem

Para usar o EAS Build (com limite de 30/mês), remova `--local` do comando:

```yaml
# De:
eas build --platform android --profile $PROFILE --local --output ./build-output/

# Para:
eas build --platform android --profile $PROFILE --non-interactive
```

---

## 📱 Profiles de Build

### Development
- **Uso**: Desenvolvimento e debug
- **Saída**: APK/IPA para instalação direta
- **Certificados**: Desenvolvimento (auto-gerados)

### Preview
- **Uso**: Testes internos e QA
- **Saída**: APK/IPA otimizado
- **Certificados**: Ad-hoc (iOS) / Debug (Android)

### Production
- **Uso**: Publicação nas lojas
- **Saída**: AAB (Android) / IPA (iOS)
- **Certificados**: Produção (obrigatórios)

---

## 🛠 Troubleshooting

### Erro: "EXPO_TOKEN not found"
```bash
# Obter token:
npx expo login
npx expo whoami --json
# Copie o "authenticationToken" para o secret EXPO_TOKEN
```

### Erro: "Build failed - certificates"
- Para **development/preview**: Use certificados automáticos
- Para **production**: Configure os secrets de certificados

### Erro: "Out of disk space"
- Builds locais usam espaço do runner
- Use `--local` apenas quando necessário
- Para builds frequentes, considere EAS Build na nuvem

### Build iOS falha no Ubuntu
- Builds iOS precisam de macOS
- O workflow usa `macos-latest` para iOS
- Builds Android funcionam no Ubuntu (mais rápido)

---

## 💡 Dicas de Otimização

### 1. Cache de Dependências
```yaml
- uses: actions/setup-node@v4
  with:
    cache: npm  # Acelera builds
```

### 2. Builds Paralelos
- Android e iOS rodam em paralelo
- Reduz tempo total de build

### 3. Artifacts com Retenção
- **Preview**: 30 dias
- **Production**: 90 dias
- Economiza espaço de armazenamento

### 4. Conditional Builds
```yaml
if: contains(github.event.head_commit.message, '[build]')
```

---

## 🎯 Próximos Passos

1. **Configure o EXPO_TOKEN**:
   ```bash
   npx expo login
   npx expo whoami --json
   ```

2. **Teste um build**:
   - Vá em Actions > Build React Native App
   - Run workflow > android > preview

3. **Para produção**:
   - Configure certificados nos secrets
   - Use profile "production"

4. **Automatize**:
   - Commits em main triggam builds automáticos
   - PRs fazem builds de teste

---

## 🆚 Comparação: GitHub Actions vs EAS Build

| Aspecto | GitHub Actions | EAS Build |
|---------|----------------|----------|
| **Custo** | Gratuito (2000 min/mês) | 30 builds/mês grátis |
| **Builds** | Ilimitados* | Limitados |
| **Configuração** | Média | Mínima |
| **Controle** | Total | Limitado |
| **Manutenção** | Você | Expo |
| **Velocidade** | Variável | Otimizada |

*Limitado pelos minutos gratuitos do GitHub

**Recomendação**: Comece com EAS Build, migre para GitHub Actions quando precisar de mais builds.