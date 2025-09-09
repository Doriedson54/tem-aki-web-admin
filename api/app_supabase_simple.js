const express = require('express');
const path = require('path');
require('dotenv').config();

// Importar rotas do Supabase
const publicRoutes = require('./routes/public');

const app = express();

// Configurações básicas do Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware básico para disponibilizar informações globais nas views
app.use((req, res, next) => {
  res.locals.user = null;
  res.locals.currentPath = req.path;
  res.locals.environment = process.env.NODE_ENV || 'development';
  res.locals.appName = 'Tem Aki Admin';
  res.locals.appVersion = '2.0.0';
  next();
});

// Rotas do Site Público (sem autenticação)
app.use('/', publicRoutes);

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

// Rota de teste simples
app.get('/test', (req, res) => {
  res.json({
    message: 'Servidor funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Página não encontrada',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros gerais
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  
  const status = err.status || 500;
  const message = status === 500 ? 'Erro interno do servidor' : err.message;
  
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;