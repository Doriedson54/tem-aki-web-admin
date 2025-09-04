const express = require('express');
const jwt = require('jsonwebtoken');
const { supabaseService } = require('../config/supabase');

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

// Listar todas as categorias
router.get('/', async (req, res) => {
  try {
    const { data: categories, error } = await supabaseService
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar categorias'
      });
    }

    res.json({
      success: true,
      data: categories || []
    });

  } catch (error) {
    console.error('Erro na API de categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar categoria por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: category, error } = await supabaseService
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar categoria:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar categoria'
      });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Erro na busca de categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Criar nova categoria (requer autenticação)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: category, error } = await supabaseService
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar categoria'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      data: category
    });

  } catch (error) {
    console.error('Erro na criação de categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar categoria (requer autenticação)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data: category, error } = await supabaseService
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar categoria'
      });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: category
    });

  } catch (error) {
    console.error('Erro na atualização de categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar categoria (requer autenticação)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se há negócios usando esta categoria
    const { data: businesses, error: businessError } = await supabaseService
      .from('businesses')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (businessError) {
      console.error('Erro ao verificar negócios da categoria:', businessError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar categoria'
      });
    }

    if (businesses && businesses.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar categoria que possui negócios associados'
      });
    }

    const { error } = await supabaseService
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar categoria:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar categoria'
      });
    }

    res.json({
      success: true,
      message: 'Categoria deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro na deleção de categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;