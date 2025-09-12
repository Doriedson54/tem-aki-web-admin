# Configuração de Variáveis de Ambiente - Codemagic

## Variáveis Necessárias para Android

### Google Play Console
```
GCLOUD_SERVICE_ACCOUNT_CREDENTIALS
```
- Tipo: Secure file
- Descrição: Arquivo JSON com credenciais da conta de serviço do Google Cloud
- Como obter: Google Cloud Console > IAM & Admin > Service Accounts

### Android Signing
```
KEYSTORE_PASSWORD
KEY_ALIAS
KEY_PASSWORD
```
- Tipo: Environment variable (secure)
- Descrição: Credenciais para assinatura do APK/AAB

### Package Info
```
PACKAGE_NAME=com.temaki.nobairro
GOOGLE_PLAY_TRACK=internal
```
- Tipo: Environment variable
- Descrição: Informações do pacote Android

## Variáveis Necessárias para iOS

### App Store Connect
```
APP_STORE_CONNECT_ISSUER_ID
APP_STORE_CONNECT_KEY_IDENTIFIER
APP_STORE_CONNECT_PRIVATE_KEY
```
- Tipo: Environment variable (secure)
- Descrição: Credenciais para App Store Connect API
- Como obter: App Store Connect > Users and Access > Keys

### iOS Signing
```
BUNDLE_ID=com.temaki.nobairro
APP_ID
CERTIFICATE_PRIVATE_KEY
```
- Tipo: Environment variable (secure)
- Descrição: Informações para assinatura iOS

## Variáveis Opcionais

### Notificações
```
EMAIL_RECIPIENTS=seu-email@exemplo.com
```
- Tipo: Environment variable
- Descrição: Email para receber notificações de build

### Vercel (para versão web)
```
VERCEL_TOKEN
```
- Tipo: Environment variable (secure)
- Descrição: Token para deploy automático no Vercel

## Como Configurar no Codemagic

1. Acesse o dashboard do Codemagic
2. Selecione seu projeto
3. Vá para Settings > Environment variables
4. Adicione cada variável conforme o tipo especificado
5. Para arquivos seguros (keystores, certificados), use "Secure files"
6. Para variáveis sensíveis, marque como "Secure"

## Grupos de Variáveis

Configure os seguintes grupos no Codemagic:

### google_play
- GCLOUD_SERVICE_ACCOUNT_CREDENTIALS
- KEYSTORE_PASSWORD
- KEY_ALIAS
- KEY_PASSWORD

### app_store
- APP_STORE_CONNECT_ISSUER_ID
- APP_STORE_CONNECT_KEY_IDENTIFIER
- APP_STORE_CONNECT_PRIVATE_KEY
- CERTIFICATE_PRIVATE_KEY

## Notas Importantes

- Nunca commite credenciais no código
- Use sempre variáveis seguras para informações sensíveis
- Teste as configurações com builds de desenvolvimento primeiro
- Mantenha backups das credenciais em local seguro