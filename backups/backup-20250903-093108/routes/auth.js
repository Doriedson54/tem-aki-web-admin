const express = require('express');
const bcrypt = require('bcryptjs');
const { redirectIfAuthenticated, logActivity } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Página de login
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', {
    title: 'Login - Tem Aki Admin',
    error: null
  });
});

// Processar login
router.post('/login', redirectIfAuthenticated, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('auth/login', {
      title: 'Login - Tem Aki Admin',
      error: 'Por favor, preencha todos os campos.'
    });
  }

  const query = 'SELECT * FROM users WHERE username = ? OR email = ?';
  
  db.getDb().get(query, [username, username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return res.render('auth/login', {
        title: 'Login - Tem Aki Admin',
        error: 'Erro interno do servidor.'
      });
    }

    if (!user) {
      return res.render('auth/login', {
        title: 'Login - Tem Aki Admin',
        error: 'Usuário não encontrado.'
      });
    }

    // Verificar senha
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Erro ao verificar senha:', err.message);
        return res.render('auth/login', {
          title: 'Login - Tem Aki Admin',
          error: 'Erro interno do servidor.'
        });
      }

      if (!isMatch) {
        return res.render('auth/login', {
          title: 'Login - Tem Aki Admin',
          error: 'Senha incorreta.'
        });
      }

      // Login bem-sucedido
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      // Log da atividade
      const logQuery = `INSERT INTO activity_logs (user_id, action, details, ip_address) 
                        VALUES (?, ?, ?, ?)`;
      
      const details = JSON.stringify({
        method: 'POST',
        url: '/auth/login',
        userAgent: req.get('User-Agent')
      });
      
      db.getDb().run(logQuery, [user.id, 'login', details, req.ip]);

      res.redirect('/dashboard');
    });
  });
});

// Logout
router.post('/logout', (req, res) => {
  if (req.session.user) {
    // Log da atividade
    const logQuery = `INSERT INTO activity_logs (user_id, action, details, ip_address) 
                      VALUES (?, ?, ?, ?)`;
    
    const details = JSON.stringify({
      method: 'POST',
      url: '/auth/logout',
      userAgent: req.get('User-Agent')
    });
    
    db.getDb().run(logQuery, [req.session.user.id, 'logout', details, req.ip]);
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir sessão:', err.message);
    }
    res.redirect('/auth/login');
  });
});

// Página de registro (apenas para desenvolvimento)
router.get('/register', redirectIfAuthenticated, (req, res) => {
  // Só permitir registro em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).render('error', {
      title: 'Página Não Encontrada',
      message: 'A página que você está procurando não existe.',
      error: {}
    });
  }

  res.render('auth/register', {
    title: 'Registro - Tem Aki Admin',
    error: null,
    success: null
  });
});

// Processar registro (apenas para desenvolvimento)
router.post('/register', redirectIfAuthenticated, (req, res) => {
  // Só permitir registro em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Não encontrado' });
  }

  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.render('auth/register', {
      title: 'Registro - Tem Aki Admin',
      error: 'Por favor, preencha todos os campos.',
      success: null
    });
  }

  if (password !== confirmPassword) {
    return res.render('auth/register', {
      title: 'Registro - Tem Aki Admin',
      error: 'As senhas não coincidem.',
      success: null
    });
  }

  if (password.length < 6) {
    return res.render('auth/register', {
      title: 'Registro - Tem Aki Admin',
      error: 'A senha deve ter pelo menos 6 caracteres.',
      success: null
    });
  }

  // Verificar se usuário já existe
  const checkQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
  
  db.getDb().get(checkQuery, [username, email], (err, existingUser) => {
    if (err) {
      console.error('Erro ao verificar usuário existente:', err.message);
      return res.render('auth/register', {
        title: 'Registro - Tem Aki Admin',
        error: 'Erro interno do servidor.',
        success: null
      });
    }

    if (existingUser) {
      return res.render('auth/register', {
        title: 'Registro - Tem Aki Admin',
        error: 'Usuário ou email já existe.',
        success: null
      });
    }

    // Hash da senha
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Erro ao hash da senha:', err.message);
        return res.render('auth/register', {
          title: 'Registro - Tem Aki Admin',
          error: 'Erro interno do servidor.',
          success: null
        });
      }

      // Inserir usuário
      const insertQuery = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
      
      db.getDb().run(insertQuery, [username, email, hashedPassword, 'admin'], function(err) {
        if (err) {
          console.error('Erro ao criar usuário:', err.message);
          return res.render('auth/register', {
            title: 'Registro - Tem Aki Admin',
            error: 'Erro ao criar usuário.',
            success: null
          });
        }

        res.render('auth/register', {
          title: 'Registro - Tem Aki Admin',
          error: null,
          success: 'Usuário criado com sucesso! Você pode fazer login agora.'
        });
      });
    });
  });
});

module.exports = router;