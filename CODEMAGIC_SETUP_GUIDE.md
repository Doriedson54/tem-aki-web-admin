# Guia de Configuração - Codemagic CI/CD

## 📋 Visão Geral

Este guia explica como configurar o build automatizado do aplicativo "Tem Aki no Bairro" usando Codemagic.io.

## 🚀 Pré-requisitos

1. Conta no [Codemagic.io](https://codemagic.io)
2. Repositório Git do projeto
3. Conta de desenvolvedor Apple (para iOS)
4. Conta Google Play Console (para Android)
5. Certificados e perfis de provisionamento

## 📁 Arquivos de Configuração

### Principais arquivos criados:
- `codemagic.yaml` - Configuração principal do CI/CD
- `eas.json` - Configuração do Expo Application Services
- `CODEMAGIC_ENV_SETUP.md` - Guia de variáveis de ambiente

## 🔧 Configuração Passo a Passo

### 1. Conectar Repositório

1. Acesse o dashboard do Codemagic
2. Clique em "Add application"
3. Conecte seu repositório Git
4. Selecione o projeto "Tem Aki no Bairro"

### 2. Configurar Variáveis de Ambiente

Consulte o arquivo `CODEMAGIC_ENV_SETUP.md` para configurar:

#### Android:
- `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`
- `PACKAGE_NAME`

#### iOS:
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY_IDENTIFIER`
- `APP_STORE_CONNECT_PRIVATE_KEY`
- `BUNDLE_ID`
- `APP_ID`

### 3. Configurar Integrações

#### App Store Connect
1. Vá para Settings > Integrations
2. Adicione App Store Connect integration
3. Configure as credenciais da API

#### Google Play Console
1. Configure a conta de serviço do Google Cloud
2. Faça upload do arquivo JSON de credenciais
3. Configure as permissões necessárias

### 4. Workflows Disponíveis

#### `react-native-android`
- Build para Android (AAB)
- Deploy automático para Google Play (internal track)
- Duração máxima: 120 minutos
- Instância: mac_mini_m1

#### `react-native-ios`
- Build para iOS (IPA)
- Deploy automático para TestFlight
- Duração máxima: 120 minutos
- Instância: mac_mini_m1

#### `react-native-web`
- Build da versão web
- Deploy opcional para Vercel
- Duração máxima: 60 minutos
- Instância: linux_x2

## 🔨 Scripts de Build Adicionados

Novos scripts no `package.json`:
```json
{
  "build:android": "expo build:android",
  "build:ios": "expo build:ios",
  "build:web": "expo export:web",
  "prebuild": "expo prebuild",
  "prebuild:clean": "expo prebuild --clean",
  "eas:build:android": "eas build --platform android",
  "eas:build:ios": "eas build --platform ios",
  "eas:build:all": "eas build --platform all",
  "eas:submit:android": "eas submit --platform android",
  "eas:submit:ios": "eas submit --platform ios"
}
```

## 🎯 Triggers de Build

### Automático
- Push para branch `main` → Build de produção
- Push para branch `develop` → Build de preview
- Pull Request → Build de desenvolvimento

### Manual
- Através do dashboard do Codemagic
- Via API do Codemagic
- Webhook personalizado

## 📦 Artefatos Gerados

### Android
- `android/app/build/outputs/**/*.aab` - Android App Bundle
- `android/app/build/outputs/**/*.apk` - APK de debug
- `android/app/build/outputs/**/mapping.txt` - Mapeamento ProGuard

### iOS
- `build/ios/ipa/*.ipa` - Arquivo IPA
- Logs de build do Xcode
- Símbolos de debug (dSYM)

### Web
- `web-build/**` - Arquivos estáticos da versão web

## 🔔 Notificações

### Email
- Sucesso: ✅ Enviado
- Falha: ❌ Não enviado (configurável)

### Slack (Opcional)
Para configurar notificações no Slack:
1. Adicione a integração do Slack no Codemagic
2. Configure o webhook URL
3. Personalize as mensagens

## 🚨 Troubleshooting

### Problemas Comuns

#### Build Android falha
- Verifique as credenciais do keystore
- Confirme as permissões da conta de serviço
- Verifique o package name

#### Build iOS falha
- Verifique os certificados de assinatura
- Confirme o bundle identifier
- Verifique as credenciais do App Store Connect

#### Dependências não instaladas
- Limpe o cache: Settings > Build cache > Clear cache
- Verifique o arquivo `package-lock.json`
- Force reinstall: `npm ci` no script

### Logs e Debug
- Acesse os logs detalhados no dashboard
- Use `--verbose` nos comandos para mais informações
- Verifique os artefatos gerados

## 📈 Otimizações

### Cache
- Node modules: `$CM_BUILD_DIR/node_modules`
- Gradle: `~/.gradle/caches`
- CocoaPods: `$HOME/Library/Caches/CocoaPods`
- Maven: `$HOME/.m2/repository`

### Performance
- Use instâncias M1 para builds iOS
- Configure builds paralelos quando possível
- Otimize dependências desnecessárias

## 🔐 Segurança

### Boas Práticas
- Use variáveis seguras para credenciais
- Rotacione chaves regularmente
- Limite permissões das contas de serviço
- Monitore logs de acesso

### Backup
- Mantenha backup dos certificados
- Documente todas as credenciais
- Use gerenciador de senhas para chaves

## 📞 Suporte

### Recursos
- [Documentação oficial Codemagic](https://docs.codemagic.io)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)

### Contato
- Suporte Codemagic: support@codemagic.io
- Community Slack: [Codemagic Slack](https://slack.codemagic.io)

---

**Nota**: Lembre-se de atualizar as credenciais e IDs específicos do seu projeto nos arquivos de configuração antes de usar em produção.