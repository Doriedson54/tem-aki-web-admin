# Configuração de Secrets do GitHub Actions

Para que o build automatizado funcione, você precisa configurar os seguintes secrets no seu repositório GitHub:

## Como Configurar os Secrets

1. Vá para o seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** > **Actions**
4. Clique em **New repository secret** para cada secret abaixo

## Secrets Necessários

### 1. EXPO_TOKEN
**Descrição:** Token de autenticação do Expo
**Como obter:**
```bash
# Execute no terminal local:
npx expo login
npx expo whoami --json
```
Copie o valor do campo `authToken` e cole como valor do secret.

### 2. ANDROID_SIGNING_KEY
**Descrição:** Chave de assinatura Android em Base64
**Como obter:**
```bash
# Se você já tem uma keystore:
base64 -i caminho/para/sua/keystore.jks

# Se não tem, crie uma nova:
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias release-key
base64 -i release-key.jks
```

### 3. ANDROID_KEY_ALIAS
**Descrição:** Alias da chave (ex: `release-key`)
**Valor:** O alias que você usou ao criar a keystore

### 4. ANDROID_KEYSTORE_PASSWORD
**Descrição:** Senha da keystore
**Valor:** A senha que você definiu para a keystore

### 5. ANDROID_KEY_PASSWORD
**Descrição:** Senha da chave
**Valor:** A senha que você definiu para a chave (pode ser igual à da keystore)

## Alternativa Simples (Para Testes)

Se você quiser apenas testar o build sem assinatura, pode:

1. Comentar a seção "Sign APK" no arquivo `.github/workflows/build-android.yml`
2. Configurar apenas o `EXPO_TOKEN`
3. O APK será gerado sem assinatura (para testes internos)

## Verificação

Após configurar os secrets:
1. Faça um commit e push para o repositório
2. Vá para a aba **Actions** no GitHub
3. Verifique se o workflow está executando
4. O APK será disponibilizado como artifact e/ou release

## Troubleshooting

- Se o build falhar, verifique os logs na aba Actions
- Certifique-se de que todos os secrets estão configurados corretamente
- O token do Expo deve estar válido e ativo