const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"]
    }
  }
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sessões
app.use(session({
  secret: process.env.SESSION_SECRET || 'tem-aki-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de autenticação
const authMiddleware = require('./middleware/auth').authMiddleware;

// Rotas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const businessRoutes = require('./routes/business');
const categoryRoutes = require('./routes/categories');
const reportsRoutes = require('./routes/reports');

// Usar rotas
app.use('/auth', authRoutes);
app.use('/dashboard', authMiddleware, dashboardRoutes);
app.use('/business', authMiddleware, businessRoutes);
app.use('/categories', authMiddleware, categoryRoutes);
app.use('/reports', authMiddleware, reportsRoutes);

// Rota principal - redireciona para login
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Erro do Servidor',
    message: 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página Não Encontrada',
    message: 'A página que você está procurando não existe.',
    error: {}
  });
});

// Inicializar banco de dados
const db = require('./config/database');
db.init();

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Painel de administração do Tem Aki no Bairro`);
});

module.exports = app;