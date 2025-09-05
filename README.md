# Tem Aki no Bairro

Aplicativo para cadastrar e visualizar os diversos negócios de um bairro, organizados por categorias.

## Funcionalidades

- Tela inicial com logomarca e slogan
- Navegação por categorias de negócios
- Visualização de negócios por categoria
- Dados de exemplo pré-cadastrados

## Estrutura do Projeto

```
├── App.js                 # Ponto de entrada do aplicativo
├── package.json           # Dependências do projeto
├── babel.config.js        # Configuração do Babel
└── src/                   # Código fonte
    ├── assets/            # Recursos estáticos (imagens, fontes)
    │   └── logo.svg       # Logo do aplicativo
    ├── components/        # Componentes reutilizáveis
    └── screens/           # Telas do aplicativo
        ├── HomeScreen.js             # Tela inicial
        ├── CategoriesScreen.js       # Tela de categorias
        └── CategoryBusinessesScreen.js # Tela de negócios por categoria
```

## Como Executar

1. Instale as dependências:
   ```
   npm install
   ```

2. Inicie o aplicativo:
   ```
   npm start
   ```

3. Use o aplicativo Expo Go no seu dispositivo móvel para escanear o QR code ou execute em um emulador.

## Tecnologias Utilizadas

- React Native
- Expo
- React Navigation