// Configuração da aplicação
require('dotenv').config();

const config = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // Configurações do banco de dados
  database: {
    type: process.env.DATABASE_TYPE || 'sqlite', // 'sqlite' ou 'supabase'
    sqlite: {
      path: process.env.DATABASE_PATH || './tem_aki_admin.db'
    },
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'business-images',
      storageUrl: process.env.SUPABASE_STORAGE_URL
    }
  },

  // Configurações de sessão
  session: {
    secret: process.env.SESSION_SECRET || 'tem-aki-admin-secret-key-2024',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 horas
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  },

  // Configurações de upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    destination: process.env.UPLOAD_DESTINATION || './uploads/'
  },

  // Configurações de segurança
  security: {
    jwtSecret: process.env.JWT_SECRET || 'tem-aki-jwt-secret-2024',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutos
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // Configurações de CORS
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: true
  },

  // Configurações de log
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  },

  // Configurações do admin padrão
  defaultAdmin: {
    username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@temaki.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
  },

  // Validação de configuração
  validate() {
    const errors = [];

    // Validar configurações obrigatórias
    if (!this.session.secret || this.session.secret === 'tem-aki-admin-secret-key-2024') {
      errors.push('SESSION_SECRET deve ser definido em produção');
    }

    if (!this.security.jwtSecret || this.security.jwtSecret === 'tem-aki-jwt-secret-2024') {
      errors.push('JWT_SECRET deve ser definido em produção');
    }

    // Validar configurações do Supabase se estiver sendo usado
    if (this.database.type === 'supabase') {
      if (!this.database.supabase.url) {
        errors.push('SUPABASE_URL é obrigatório quando DATABASE_TYPE=supabase');
      }
      if (!this.database.supabase.anonKey) {
        errors.push('SUPABASE_ANON_KEY é obrigatório quando DATABASE_TYPE=supabase');
      }
      if (!this.database.supabase.serviceRoleKey) {
        errors.push('SUPABASE_SERVICE_ROLE_KEY é obrigatório quando DATABASE_TYPE=supabase');
      }
    }

    // Validar ambiente de produção
    if (this.server.env === 'production') {
      if (this.defaultAdmin.password === 'admin123') {
        errors.push('DEFAULT_ADMIN_PASSWORD deve ser alterado em produção');
      }
    }

    return errors;
  },

  // Verificar se está usando Supabase
  isSupabase() {
    return this.database.type === 'supabase';
  },

  // Verificar se está em desenvolvimento
  isDevelopment() {
    return this.server.env === 'development';
  },

  // Verificar se está em produção
  isProduction() {
    return this.server.env === 'production';
  }
};

// Validar configuração na inicialização
const validationErrors = config.validate();
if (validationErrors.length > 0) {
  console.warn('⚠️  Avisos de configuração:');
  validationErrors.forEach(error => console.warn(`   - ${error}`));
  
  if (config.isProduction()) {
    console.error('❌ Erros críticos de configuração em produção!');
    process.exit(1);
  }
}

// Log da configuração atual
console.log(`🚀 Configuração carregada:`);
console.log(`   - Ambiente: ${config.server.env}`);
console.log(`   - Porta: ${config.server.port}`);
console.log(`   - Banco: ${config.database.type}`);
if (config.isSupabase()) {
  console.log(`   - Supabase URL: ${config.database.supabase.url}`);
  console.log(`   - Storage Bucket: ${config.database.supabase.storageBucket}`);
}

module.exports = config;