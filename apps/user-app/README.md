# Tem Aki (Usuários)

App separado, somente leitura, para usuários pesquisarem e localizarem os negócios cadastrados.

Ele usa a mesma base de dados do painel de cadastro (admin) através do mesmo backend/API (`EXPO_PUBLIC_API_BASE_URL`).

## Rodar

Pré-requisito: backend rodando (ex.: `http://localhost:3000/api`)

```bash
cd apps/user-app
npm install
```

### No celular (Android / Expo Go)

```bash
npm run start:phone:api
```

### No PC (localhost)

```bash
npm run start:api
```

## Variáveis de ambiente

- `EXPO_PUBLIC_API_BASE_URL`
  - Ex.: `http://192.168.x.x:3000/api` (celular na mesma rede)
  - Ex.: `http://localhost:3000/api` (somente no PC)

