const express = require('express');
const router = express.Router();
const { requireAuth, logActivity } = require('../middleware/auth_supabase');

// Página de configurações
router.get('/', requireAuth, async (req, res) => {
  try {
    // Log da atividade
    await logActivity(req.session.user.id, 'view_settings', 'Visualizou configurações');
    
    res.render('settings/index', {
      title: 'Configurações - Tem Aki Admin',
      currentPage: 'settings',
      user: req.session.user
    });
  } catch (error) {
    console.error('Erro ao carregar configurações:', error.message);
    res.status(500).render('error', {
      title: 'Erro - Tem Aki Admin',
      message: 'Erro ao carregar as configurações.',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

module.exports = router;