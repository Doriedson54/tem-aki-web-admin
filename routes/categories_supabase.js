const express = require('express');
const { requireAuth } = require('../middleware/auth_supabase');
const { supabaseService, logUserActivity } = require('../config/supabase');

const router = express.Router();

// Listar categorias
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    // Construir query
    let query = supabaseService
      .from('categories')
      .select(`
        id,
        name,
        description,
        icon,
        color,
        active,
        created_at,
        updated_at,
        subcategories(id, name, active)
      `, { count: 'exact' });

    // Aplicar filtro de busca
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Aplicar paginação e ordenação
    const { data: categories, error, count } = await query
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const totalPages = Math.ceil(count / limit);

    // Renderizar o conteúdo da página
    const bodyContent = await new Promise((resolve, reject) => {
      res.render('categories/index', {
        title: 'Categorias - Tem Aki Admin',
        user: req.session.user,
        categories: categories || [],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          nextPage: page + 1,
          prevPage: page - 1
        },
        filters: {
          search
        },
        currentPage: 'categories'
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Renderizar com layout
    res.render('layout', {
      title: 'Categorias - Tem Aki Admin',
      user: req.session.user,
      body: bodyContent,
      currentPage: 'categories'
    });

  } catch (error) {
    console.error('Erro ao listar categorias:', error.message);
    res.status(500).render('error', {
      title: 'Erro - Tem Aki Admin',
      message: 'Erro ao carregar a lista de categorias.',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Página de criação de categoria
router.get('/new', requireAuth, (req, res) => {
  res.render('categories/form', {
    title: 'Nova Categoria - Tem Aki Admin',
    user: req.session.user,
    category: null,
    isEdit: false
  });
});

// Criar categoria
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, icon, color, is_active } = req.body;
    const userId = req.session.user.id;

    // Validações
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Nome da categoria é obrigatório e deve ter pelo menos 2 caracteres' 
      });
    }

    // Verificar se já existe categoria com o mesmo nome
    const { data: existingCategory } = await supabaseService
      .from('categories')
      .select('id')
      .ilike('name', name.trim())
      .single();

    if (existingCategory) {
      return res.status(400).json({ 
        error: 'Já existe uma categoria com este nome' 
      });
    }

    // Criar categoria
    const { data: category, error } = await supabaseService
      .from('categories')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        color: color?.trim() || '#007bff',
        active: is_active === 'true' || is_active === true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log da atividade
    await logUserActivity(userId, 'category_create', {
      category_id: category.id,
      category_name: category.name
    }, req.ip);

    res.json({
      success: true,
      message: 'Categoria criada com sucesso',
      category
    });

  } catch (error) {
    console.error('Erro ao criar categoria:', error.message);
    res.status(500).json({ 
      error: 'Erro ao criar categoria',
      message: error.message 
    });
  }
});

// Visualizar categoria específica
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Buscar categoria com subcategorias
    const { data: category, error } = await supabaseService
      .from('categories')
      .select(`
        *,
        subcategories(
          id,
          name,
          description,
          active,
          created_at,
          updated_at
        )
      `)
      .eq('id', categoryId)
      .single();

    if (error || !category) {
      return res.status(404).render('error', {
        title: 'Categoria Não Encontrada',
        message: 'A categoria que você está procurando não existe.',
        error: {}
      });
    }

    // Buscar estatísticas da categoria
    const { data: businessStats } = await supabaseService
      .from('businesses')
      .select('status')
      .eq('category_id', categoryId);

    const stats = {
      total: businessStats?.length || 0,
      approved: businessStats?.filter(b => b.status === 'approved').length || 0,
      pending: businessStats?.filter(b => b.status === 'pending').length || 0,
      rejected: businessStats?.filter(b => b.status === 'rejected').length || 0
    };

    res.render('categories/view', {
      title: `${category.name} - Tem Aki Admin`,
      user: req.session.user,
      category,
      stats
    });

  } catch (error) {
    console.error('Erro ao visualizar categoria:', error.message);
    res.status(500).render('error', {
      title: 'Erro - Tem Aki Admin',
      message: 'Erro ao carregar a categoria.',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Página de edição de categoria
router.get('/:id/edit', requireAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;

    const { data: category, error } = await supabaseService
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error || !category) {
      return res.status(404).render('error', {
        title: 'Categoria Não Encontrada',
        message: 'A categoria que você está procurando não existe.',
        error: {}
      });
    }

    res.render('categories/form', {
      title: `Editar ${category.name} - Tem Aki Admin`,
      user: req.session.user,
      category,
      isEdit: true
    });

  } catch (error) {
    console.error('Erro ao carregar categoria para edição:', error.message);
    res.status(500).render('error', {
      title: 'Erro - Tem Aki Admin',
      message: 'Erro ao carregar a categoria.',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Atualizar categoria
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description, icon, color, is_active } = req.body;
    const userId = req.session.user.id;

    // Validações
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Nome da categoria é obrigatório e deve ter pelo menos 2 caracteres' 
      });
    }

    // Verificar se já existe outra categoria com o mesmo nome
    const { data: existingCategory } = await supabaseService
      .from('categories')
      .select('id')
      .ilike('name', name.trim())
      .neq('id', categoryId)
      .single();

    if (existingCategory) {
      return res.status(400).json({ 
        error: 'Já existe uma categoria com este nome' 
      });
    }

    // Atualizar categoria
    const { data: category, error } = await supabaseService
      .from('categories')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        color: color?.trim() || '#007bff',
        active: is_active === 'true' || is_active === true,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log da atividade
    await logUserActivity(userId, 'category_update', {
      category_id: categoryId,
      category_name: category.name
    }, req.ip);

    res.json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      category
    });

  } catch (error) {
    console.error('Erro ao atualizar categoria:', error.message);
    res.status(500).json({ 
      error: 'Erro ao atualizar categoria',
      message: error.message 
    });
  }
});

// Deletar categoria
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const userId = req.session.user.id;

    // Verificar se existem negócios usando esta categoria
    const { data: businesses } = await supabaseService
      .from('businesses')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (businesses && businesses.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar esta categoria pois existem negócios associados a ela' 
      });
    }

    // Buscar nome da categoria para o log
    const { data: category } = await supabaseService
      .from('categories')
      .select('name')
      .eq('id', categoryId)
      .single();

    // Deletar subcategorias primeiro
    await supabaseService
      .from('subcategories')
      .delete()
      .eq('category_id', categoryId);

    // Deletar categoria
    const { error } = await supabaseService
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      throw error;
    }

    // Log da atividade
    await logUserActivity(userId, 'category_delete', {
      category_id: categoryId,
      category_name: category?.name || 'Categoria deletada'
    }, req.ip);

    res.json({
      success: true,
      message: 'Categoria deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar categoria:', error.message);
    res.status(500).json({ 
      error: 'Erro ao deletar categoria',
      message: error.message 
    });
  }
});

// Alternar status ativo/inativo
router.post('/:id/toggle-status', requireAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const userId = req.session.user.id;

    // Buscar status atual
    const { data: category } = await supabaseService
      .from('categories')
      .select('active, name')
      .eq('id', categoryId)
      .single();

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const newStatus = !category.active;

    // Atualizar status
    const { error } = await supabaseService
      .from('categories')
      .update({ 
        active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId);

    if (error) {
      throw error;
    }

    // Log da atividade
    await logUserActivity(userId, 'category_status_toggle', {
      category_id: categoryId,
      category_name: category.name,
      new_status: newStatus
    }, req.ip);

    res.json({
      success: true,
      message: `Categoria ${newStatus ? 'ativada' : 'desativada'} com sucesso`,
      newStatus
    });

  } catch (error) {
    console.error('Erro ao alterar status da categoria:', error.message);
    res.status(500).json({ 
      error: 'Erro ao alterar status da categoria',
      message: error.message 
    });
  }
});

// API para buscar categorias (usado em selects)
router.get('/api/list', requireAuth, async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;

    let query = supabaseService
      .from('categories')
      .select('id, name, description, icon, color')
      .order('name');

    if (active_only === 'true') {
      query = query.eq('active', true);
    }

    const { data: categories, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      categories: categories || []
    });

  } catch (error) {
    console.error('Erro ao buscar categorias:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar categorias',
      message: error.message 
    });
  }
});

module.exports = router;