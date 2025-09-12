# Guia de Build Local com Expo Prebuild

## 🔧 Visão Geral

O build local permite compilar o aplicativo diretamente na sua máquina, oferecendo controle total sobre o processo, mas com maior complexidade de configuração.

---

## 📋 Pré-requisitos

### Para Android:
- **Node.js** 18+ (✅ já instalado)
- **Java Development Kit (JDK)** 17
- **Android Studio** com SDK
- **Android SDK Build-Tools**
- **Gradle** (incluído no Android Studio)

### Para iOS (apenas macOS):
- **Xcode** 14+
- **iOS SDK**
- **CocoaPods**
- **Conta Apple Developer** (para dispositivos físicos)

---

## 🚀 Configuração Inicial

### 1. Instalar Dependências Android

```powershell
# Instalar Java 17 (via Chocolatey)
choco install openjdk17

# Ou baixar manualmente:
# https://adoptium.net/temurin/releases/

# Instalar Android Studio
# https://developer.android.com/studio
```

### 2. Configurar Variáveis de Ambiente

```powershell
# Adicionar ao PATH (Windows)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot"
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin"

# Verificar instalação
java -version
adb version
```

### 3. Gerar Projetos Nativos

```bash
# No diretório do projeto
npx expo prebuild

# Isso criará:
# - /android (projeto Android nativo)
# - /ios (projeto iOS nativo)
```

---

## 📱 Build Android

### Build de Desenvolvimento (APK)

```bash
# Navegar para pasta Android
cd android

# Build debug (para teste)
.\gradlew assembleDebug

# APK gerado em:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Build de Produção (AAB)

```bash
# Build release (para Play Store)
.\gradlew bundleRelease

# AAB gerado em:
# android/app/build/outputs/bundle/release/app-release.aab

# Ou APK release:
.\gradlew assembleRelease
# android/app/build/outputs/apk/release/app-release.apk
```

### Instalar no Dispositivo

```bash
# Conectar dispositivo via USB (debug habilitado)
adb devices

# Instalar APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🍎 Build iOS (apenas macOS)

### Build de Desenvolvimento

```bash
# Navegar para pasta iOS
cd ios

# Instalar dependências
pod install

# Build para simulador
xcodebuild -workspace TemAkiNoBairro.xcworkspace -scheme TemAkiNoBairro -configuration Debug -sdk iphonesimulator -derivedDataPath build

# App gerado em:
# ios/build/Build/Products/Debug-iphonesimulator/
```

### Build de Produção

```bash
# Archive para App Store
xcodebuild -workspace TemAkiNoBairro.xcworkspace -scheme TemAkiNoBairro -configuration Release -archivePath build/TemAkiNoBairro.xcarchive archive

# Export IPA
xcodebuild -exportArchive -archivePath build/TemAkiNoBairro.xcarchive -exportPath build/ -exportOptionsPlist ExportOptions.plist
```

---

## ⚙️ Scripts Automatizados

### Adicionar ao package.json

```json
{
  "scripts": {
    "prebuild": "expo prebuild",
    "prebuild:clean": "expo prebuild --clean",
    "android:debug": "cd android && .\\gradlew assembleDebug",
    "android:release": "cd android && .\\gradlew assembleRelease",
    "android:bundle": "cd android && .\\gradlew bundleRelease",
    "android:install": "cd android && .\\gradlew installDebug",
    "ios:build": "cd ios && xcodebuild -workspace *.xcworkspace -scheme * -configuration Debug -sdk iphonesimulator",
    "ios:archive": "cd ios && xcodebuild -workspace *.xcworkspace -scheme * -configuration Release archive"
  }
}
```

### Uso dos Scripts

```bash
# Gerar projetos nativos
npm run prebuild

# Build Android debug
npm run android:debug

# Build Android release
npm run android:release

# Build e instalar no dispositivo
npm run android:install
```

---

## 🔐 Configuração de Certificados

### Android Keystore

```bash
# Gerar keystore (apenas uma vez)
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Configurar em android/gradle.properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

### iOS Certificates (macOS)

1. **Xcode**: Preferences > Accounts > Add Apple ID
2. **Automatic Signing**: Deixar Xcode gerenciar
3. **Manual Signing**: Baixar certificados do Apple Developer

---

## 🐛 Troubleshooting

### Erro: "JAVA_HOME not set"
```powershell
# Verificar Java
java -version

# Configurar JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot"
```

### Erro: "Android SDK not found"
```powershell
# Configurar ANDROID_HOME
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
```

### Erro: "Gradle build failed"
```bash
# Limpar cache
cd android
.\gradlew clean

# Rebuild
.\gradlew assembleDebug
```

### Erro: "Metro bundler conflict"
```bash
# Parar Metro se estiver rodando
npx expo start --clear

# Ou em terminal separado
npx react-native start --reset-cache
```

---

## ✅ Vantagens do Build Local

- **Controle total** do processo de build
- **Builds ilimitados** sem custos
- **Debug avançado** com logs completos
- **Customização** de configurações nativas
- **Offline** - não depende de internet
- **Velocidade** - sem fila de espera

## ❌ Desvantagens do Build Local

- **Configuração complexa** - muitas dependências
- **iOS apenas no macOS** - limitação de plataforma
- **Manutenção** - updates manuais frequentes
- **Espaço em disco** - projetos nativos são grandes
- **Certificados** - gerenciamento manual
- **Conhecimento técnico** - Android/iOS development

---

## 🎯 Quando Usar Build Local

### ✅ Recomendado para:
- **Desenvolvimento avançado** com customizações nativas
- **Debugging profundo** de issues específicas
- **Projetos grandes** com muitos builds
- **Equipes experientes** em desenvolvimento mobile
- **Controle total** sobre o processo

### ❌ Não recomendado para:
- **Iniciantes** em React Native
- **Projetos simples** sem customizações
- **Equipes pequenas** sem expertise mobile
- **Desenvolvimento rápido** e prototipagem
- **Windows + iOS** (impossível)

---

## 🔄 Migração de Expo Managed

```bash
# 1. Backup do projeto
git add .
git commit -m "Backup before prebuild"

# 2. Gerar projetos nativos
npx expo prebuild

# 3. Testar build
npm run android:debug

# 4. Se algo der errado, reverter:
git checkout -- .
git clean -fd
```

---

## 📊 Resumo Comparativo

| Aspecto | Build Local | EAS Build | GitHub Actions |
|---------|-------------|-----------|----------------|
| **Complexidade** | Alta | Baixa | Média |
| **Configuração** | Horas | Minutos | 30min |
| **iOS no Windows** | ❌ | ✅ | ✅ |
| **Builds/mês** | Ilimitado | 30 | Ilimitado* |
| **Manutenção** | Alta | Zero | Baixa |
| **Controle** | Total | Limitado | Alto |
| **Conhecimento** | Avançado | Básico | Intermediário |

**Conclusão**: Build local é poderoso, mas complexo. Para a maioria dos casos, EAS Build ou GitHub Actions são mais práticos.