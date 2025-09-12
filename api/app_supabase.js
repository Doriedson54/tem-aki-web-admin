const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Importar rotas do Supabase
const authRoutes = require('../routes/auth_supabase');
const dashboardRoutes = require('../routes/dashboard_supabase');
const businessRoutes = require('../routes/business_supabase');
const categoriesRoutes = require('../routes/categories_supabase');
const reportsRoutes = require('../routes/reports_supabase');
const settingsRoutes = require('../routes/settings_supabase');
const publicRoutes = require('../routes/public');

// Importar middlewares
const { requireAuth } = require('../middleware/auth_supabase');
const {
  setupSecurityHeaders,
  setupRateLimiting,
  forceHTTPS,
  setupCacheHeaders,
  setupCompression,
  securityLogger,
  validateOrigin,
  secureHealthCheck
} = require('../middleware/security');

const app = express();

// Configurar middlewares de segurança
const rateLimiters = setupRateLimiting();

// Forçar HTTPS em produção
app.use(forceHTTPS);

// Configurações de segurança avançadas
app.use(setupSecurityHeaders());

// Compressão
app.use(setupCompression());

// Rate limiting geral
app.use(rateLimiters.general);

// Logging de segurança
app.use(securityLogger);

// Validação de origem
app.use(validateOrigin);

// Health check seguro
app.use(secureHealthCheck);

// Cache headers
app.use(setupCacheHeaders());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));

// Configurações do Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Configurar layout padrão
app.locals.layout = 'layout';
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'tem_aki_admin_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000 // 24 horas
  }
}));

// Middleware para disponibilizar informações globais nas views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.environment = process.env.NODE_ENV || 'development';
  res.locals.appName = 'Tem Aki Admin';
  res.locals.appVersion = '2.0.0';
  next();
});

// Middleware de log de requests (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API Routes para aplicativo móvel (com rate limiting específico)
app.use('/api/auth', rateLimiters.login, require('../routes/api_auth'));
app.use('/api/businesses', rateLimiters.api, require('../routes/api_businesses'));
app.use('/api/categories', rateLimiters.api, require('../routes/api_categories'));

// Rotas do Site Público (sem autenticação)
app.use('/', publicRoutes);

// Rotas Web Admin (com autenticação e rate limiting específico)
app.use('/admin/auth', rateLimiters.login, authRoutes);
app.use('/admin/dashboard', dashboardRoutes);
app.use('/admin/businesses', businessRoutes);
app.use('/admin/categories', categoriesRoutes);
app.use('/admin/reports', reportsRoutes);
app.use('/admin/settings', settingsRoutes);

// Rota de redirecionamento para admin
app.get('/admin', (req, res) => {
  if (req.session.user) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/auth/login');
  }
});

// Rota de saúde da aplicação
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: 'supabase',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API de informações do sistema (protegida)
app.get('/api/system-info', requireAuth, (req, res) => {
  res.json({
    appName: 'Tem Aki Admin',
    version: '2.0.0',
    database: 'Supabase PostgreSQL',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página Não Encontrada - Tem Aki Admin',
    message: 'A página que você está procurando não existe.',
    error: {
      status: 404,
      stack: process.env.NODE_ENV === 'development' ? 'Página não encontrada' : ''
    }
  });
});

// Middleware de tratamento de erros gerais
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  
  // Erro de rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Muitas tentativas. Tente novamente em alguns minutos.',
      retryAfter: err.retryAfter
    });
  }
  
  // Erro de upload de arquivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Arquivo muito grande. Tamanho máximo permitido: 5MB'
    });
  }
  
  // Erro de tipo de arquivo
  if (err.message === 'Tipo de arquivo não permitido') {
    return res.status(400).json({
      error: 'Tipo de arquivo não permitido. Use apenas: JPEG, PNG, GIF ou WebP'
    });
  }
  
  // Outros erros
  const status = err.status || 500;
  const message = status === 500 ? 'Erro interno do servidor' : err.message;
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.status(status).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    res.status(status).render('error', {
      title: `Erro ${status} - Tem Aki Admin`,
      message,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// Inicializar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n🚀 Tem Aki Admin (Supabase) iniciado com sucesso!');
  console.log(`📍 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🗄️  Banco de dados: Supabase PostgreSQL`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Supabase URL: ${process.env.SUPABASE_URL || 'Não configurado'}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📋 Rotas disponíveis:');
    console.log('   🔐 /auth/login - Página de login');
    console.log('   📊 /dashboard - Dashboard principal');
    console.log('   🏢 /businesses - Gerenciar negócios');
    console.log('   📂 /categories - Gerenciar categorias');
    console.log('   ❤️  /health - Status da aplicação');
  }
  
  console.log('\n⚠️  IMPORTANTE: Configure as variáveis do Supabase no arquivo .env');
  console.log('   📖 Consulte o arquivo SUPABASE_SETUP_GUIDE.md para instruções');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM. Encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT. Encerrando servidor graciosamente...');
  process.exit(0);
});

module.exports = app;