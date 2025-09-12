const authMiddleware = (req, res, next) => {
  // Verificar se o usuário está logado
  if (!req.session.user) {
    // Se for uma requisição AJAX, retornar JSON
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    // Caso contrário, redirecionar para login
    return res.redirect('/auth/login');
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
    return res.redirect('/dashboard');
  }
  next();
};

// Middleware para log de atividades
const logActivity = (action, entityType = null, entityId = null) => {
  return (req, res, next) => {
    const db = require('../config/database').getDb();
    
    if (req.session.user) {
      const query = `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
      
      const details = JSON.stringify({
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent')
      });
      
      db.run(query, [
        req.session.user.id,
        action,
        entityType,
        entityId,
        details,
        req.ip
      ], (err) => {
        if (err) {
          console.error('Erro ao registrar atividade:', err.message);
        }
      });
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