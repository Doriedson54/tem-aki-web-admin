const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseService } = require('../config/supabase');

const router = express.Router();

// Middleware para validar JSON
router.use(express.json());

// Endpoint de login para API
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário por email ou username
    const { data: user, error } = await supabaseService
      .from('admins')
      .select('*')
      .or(`username.eq.${email},email.eq.${email}`)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email
      },
      process.env.JWT_SECRET || 'tem_aki_jwt_secret_2024',
      { expiresIn: '24h' }
    );

    // Atualizar último login
    await supabaseService
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('Erro no login API:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint de registro para API
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validações básicas
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'As senhas não coincidem'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseService
      .from('admins')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Usuário ou email já existe'
      });
    }

    // Hash da senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar novo usuário
    const { data: newUser, error } = await supabaseService
      .from('admins')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar usuário'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: newUser.id, 
        username: newUser.username, 
        email: newUser.email
      },
      process.env.JWT_SECRET || 'tem_aki_jwt_secret_2024',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          created_at: newUser.created_at
        }
      }
    });

  } catch (error) {
    console.error('Erro no registro API:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para validar token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tem_aki_jwt_secret_2024');
    
    // Verificar se usuário ainda existe
    const { data: user, error } = await supabaseService
      .from('admins')
      .select('id, username, email, is_super_admin, created_at')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// Endpoint de logout
router.post('/logout', (req, res) => {
  // Para JWT, o logout é feito no cliente removendo o token
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// Endpoint para refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    // Para JWT simples, apenas validamos e geramos um novo token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tem_aki_jwt_secret_2024', { ignoreExpiration: true });
    
    // Verificar se usuário ainda existe
    const { data: user, error } = await supabaseService
      .from('admins')
      .select('id, username, email, role, created_at')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Gerar novo token
    const newToken = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email
      },
      process.env.JWT_SECRET || 'tem_aki_jwt_secret_2024',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        token: newToken,
        user
      }
    });

  } catch (error) {
    console.error('Erro no refresh token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// Endpoint para atualizar perfil
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tem_aki_jwt_secret_2024');
    const { username, email } = req.body;

    // Atualizar dados do usuário
    const { data: updatedUser, error } = await supabaseService
      .from('admins')
      .update({ 
        username: username || decoded.username,
        email: email || decoded.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.id)
      .select('id, username, email, role, created_at')
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao atualizar perfil'
      });
    }

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;