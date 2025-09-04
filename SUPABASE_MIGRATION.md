# Migração para Supabase - Tem Aki no Bairro

## Estrutura Atual do Banco de Dados SQLite

### Tabelas Identificadas:

#### 1. users (Usuários Administradores)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. categories (Categorias)
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. subcategories (Subcategorias)
```sql
CREATE TABLE subcategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories (id)
);
```

#### 4. businesses (Negócios)
```sql
CREATE TABLE businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER,
  subcategory_id INTEGER,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude REAL,
  longitude REAL,
  opening_hours TEXT,
  delivery BOOLEAN DEFAULT 0,
  takeout BOOLEAN DEFAULT 0,
  dine_in BOOLEAN DEFAULT 0,
  image_url TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'pending',
  featured BOOLEAN DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories (id),
  FOREIGN KEY (subcategory_id) REFERENCES subcategories (id)
);
```

#### 5. business_images (Imagens dos Negócios)
```sql
CREATE TABLE business_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses (id)
);
```

#### 6. activity_logs (Logs de Atividades)
```sql
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### 7. moderation_history (Histórico de Moderação)
```sql
CREATE TABLE moderation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  user_id INTEGER,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## Funcionalidades da API Atual

### Dashboard
- Estatísticas gerais (total de negócios, pendentes, aprovados, categorias)
- Negócios recentes
- Distribuição por categoria e status
- Logs de atividade recente
- API para gráficos com dados temporais
- Busca rápida

### Negócios
- Listagem com paginação e filtros
- Visualização detalhada
- Upload de imagens
- Moderação (aprovar, rejeitar, suspender)
- Destaque de negócios
- Exportação para CSV

### Categorias
- CRUD completo
- Gerenciamento de subcategorias
- Verificação de negócios associados

### Autenticação
- Login/logout
- Middleware de proteção
- Logs de atividade

## Plano de Migração para Supabase

### Etapa 1: Configuração do Supabase
1. Criar projeto no Supabase
2. Configurar banco PostgreSQL
3. Adaptar estrutura das tabelas para PostgreSQL

### Etapa 2: Políticas RLS (Row Level Security)
1. Configurar autenticação
2. Definir políticas de acesso
3. Configurar roles e permissões

### Etapa 3: Migração do Código
1. Instalar cliente Supabase
2. Substituir queries SQLite por Supabase
3. Adaptar middleware de autenticação
4. Migrar upload de arquivos para Supabase Storage

### Etapa 4: Testes
1. Testar todas as funcionalidades
2. Verificar performance
3. Validar segurança

## Considerações Importantes

- **Tipos de Dados**: Adaptar de SQLite para PostgreSQL
- **Auto-increment**: Usar SERIAL ou IDENTITY no PostgreSQL
- **Timestamps**: Usar TIMESTAMPTZ no PostgreSQL
- **Booleans**: PostgreSQL tem tipo BOOLEAN nativo
- **Storage**: Migrar uploads para Supabase Storage
- **Autenticação**: Usar Supabase Auth em vez de sessões locais