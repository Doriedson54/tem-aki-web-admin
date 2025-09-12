const { supabase } = require('../config/supabase');

const authMiddleware = (req, res, next) => {
  // Verificar se o usuário está logado
  if (!req.session.user) {
    // Se for uma requisição AJAX, retornar JSON
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    // Caso contrário, redirecionar para login
    return res.redirect('/admin/auth/login');
  }

  // Verificar se o usuário tem permissão de admin
  if (req.session.user.role !== 'admin') {
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    return res.status(403).render('error', {
      title: 'Acesso Negado',
      message: 'Você não tem permissão para acessar esta página.',
      error: {}
    });
  }

  // Adicionar informações do usuário ao objeto req
  res.locals.user = req.session.user;
  
  next();
};

// Middleware para verificar se o usuário já está logado
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

// Middleware para log de atividades usando Supabase
const logActivity = (action, entityType = null, entityId = null) => {
  return async (req, res, next) => {
    if (req.session.user) {
      try {
        const details = JSON.stringify({
          method: req.method,
          url: req.originalUrl,
          userAgent: req.get('User-Agent')
        });

        const { error } = await supabase
          .from('activity_logs')
          .insert({
            user_id: req.session.user.id,
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            details: details,
            ip_address: req.ip,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Erro ao registrar atividade:', error.message);
        }
      } catch (err) {
        console.error('Erro ao registrar atividade:', err.message);
      }
    }
    
    next();
  };
};

module.exports = {
  authMiddleware,
  requireAuth: authMiddleware, // Alias para compatibilidade
  redirectIfAuthenticated,
  logActivity
};