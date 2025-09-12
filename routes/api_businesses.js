const express = require('express');
const jwt = require('jsonwebtoken');
const { supabaseService, supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Middleware para validar JSON
router.use(express.json());

// Middleware de autenticação para API
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tem_aki_jwt_secret_2024');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Listar todos os negócios
router.get('/', async (req, res) => {
  try {
    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar negócios:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar negócios'
      });
    }

    res.json({
      success: true,
      data: businesses || []
    });

  } catch (error) {
    console.error('Erro na API de negócios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar negócios por categoria
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar negócios por categoria:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar negócios'
      });
    }

    res.json({
      success: true,
      data: businesses || []
    });

  } catch (error) {
    console.error('Erro na API de negócios por categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar negócios por subcategoria
router.get('/subcategory/:subcategory', async (req, res) => {
  try {
    const { subcategory } = req.params;

    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('subcategory', subcategory)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar negócios por subcategoria:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar negócios'
      });
    }

    res.json({
      success: true,
      data: businesses || []
    });

  } catch (error) {
    console.error('Erro na API de negócios por subcategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar negócios
router.get('/search', async (req, res) => {
  try {
    const { q, category, subcategory } = req.query;

    let query = supabaseAdmin.from('businesses').select('*');

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    const { data: businesses, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar negócios:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar negócios'
      });
    }

    res.json({
      success: true,
      data: businesses || []
    });

  } catch (error) {
    console.error('Erro na busca de negócios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Criar novo negócio (requer autenticação)
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Dados recebidos na API:', JSON.stringify(req.body, null, 2));
    
    const businessData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Converte city_state para city e state separados
    if (businessData.city_state) {
      const cityStateParts = businessData.city_state.split('/');
      if (cityStateParts.length === 2) {
        businessData.city = cityStateParts[0].trim();
        businessData.state = cityStateParts[1].trim();
      }
      delete businessData.city_state;
    }
    
    // Remove campos que não existem na tabela
    delete businessData.working_hours;
    delete businessData.other_social_media;
    delete businessData.main_product;
    
    console.log('Dados preparados para inserção:', JSON.stringify(businessData, null, 2));

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .insert(businessData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar negócio:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar negócio'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Negócio criado com sucesso',
      data: business
    });

  } catch (error) {
    console.error('Erro na criação de negócio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar negócio (requer autenticação)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const businessData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .update(businessData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar negócio:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar negócio'
      });
    }

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Negócio não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Negócio atualizado com sucesso',
      data: business
    });

  } catch (error) {
    console.error('Erro na atualização de negócio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar negócio (requer autenticação)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar negócio:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar negócio'
      });
    }

    res.json({
      success: true,
      message: 'Negócio deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro na deleção de negócio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;