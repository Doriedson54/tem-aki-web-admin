const express = require('express');
const bcrypt = require('bcryptjs');
const { redirectIfAuthenticated, logActivity } = require('../middleware/auth_supabase');
const { supabaseService, logUserActivity } = require('../config/supabase');

const router = express.Router();

// Página de login
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', {
    title: 'Login - Tem Aki Admin',
    error: null
  });
});

// Processar login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('auth/login', {
      title: 'Login - Tem Aki Admin',
      error: 'Por favor, preencha todos os campos.'
    });
  }

  try {
    // Buscar usuário por username ou email
    const { data: user, error } = await supabaseService
      .from('admins')
      .select('*')
      .or(`username.eq.${username},email.eq.${username}`)
      .single();

    if (error || !user) {
      return res.render('auth/login', {
        title: 'Login - Tem Aki Admin',
        error: 'Usuário não encontrado.'
      });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
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
      full_name: user.full_name,
      is_super_admin: user.is_super_admin,
      role: 'admin' // Adicionar role para compatibilidade com middleware
    };

    // Log da atividade
    await logUserActivity(user.id, 'login', {
      method: 'POST',
      url: '/auth/login',
      userAgent: req.get('User-Agent')
    }, req.ip);

    res.redirect('/admin/dashboard');

  } catch (err) {
    console.error('Erro ao fazer login:', err.message);
    return res.render('auth/login', {
      title: 'Login - Tem Aki Admin',
      error: 'Erro interno do servidor.'
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  if (req.session.user) {
    try {
      // Log da atividade
      await logUserActivity(req.session.user.id, 'logout', {
        method: 'POST',
        url: '/auth/logout',
        userAgent: req.get('User-Agent')
      }, req.ip);
    } catch (err) {
      console.error('Erro ao registrar logout:', err.message);
    }
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
router.post('/register', redirectIfAuthenticated, async (req, res) => {
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

  try {
    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseService
      .from('admins')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existingUser) {
      return res.render('auth/register', {
        title: 'Registro - Tem Aki Admin',
        error: 'Usuário ou email já existe.',
        success: null
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Inserir usuário
    const { data: newUser, error } = await supabaseService
      .from('admins')
      .insert({
        username,
        email,
        password_hash: hashedPassword,
        full_name: username,
        is_super_admin: false
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error.message);
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

  } catch (err) {
    console.error('Erro ao registrar usuário:', err.message);
    return res.render('auth/register', {
      title: 'Registro - Tem Aki Admin',
      error: 'Erro interno do servidor.',
      success: null
    });
  }
});

module.exports = router;