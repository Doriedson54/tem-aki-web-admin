const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Página inicial do site público
router.get('/', (req, res) => {
  res.render('public/index', {
    title: 'Tem Aki no Bairro - Descubra negócios locais',
    layout: false // Usar layout próprio
  });
});

// Página do diretório
router.get('/directory', (req, res) => {
  res.render('public/directory', {
    title: 'Diretório de Negócios - Tem Aki no Bairro',
    layout: false // Usar layout próprio
  });
});

// API para preview de negócios na página inicial
router.get('/api/businesses/preview', async (req, res) => {
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        description,
        address,
        category_id,
        categories(name)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Erro ao buscar negócios para preview:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Formatar dados para o frontend
    const formattedBusinesses = businesses.map(business => ({
      id: business.id,
      name: business.name,
      description: business.description,
      address: business.address,
      category: business.categories?.name || 'Categoria não informada'
    }));

    res.json(formattedBusinesses);
  } catch (error) {
    console.error('Erro ao buscar negócios para preview:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para negócios públicos (diretório)
router.get('/api/businesses/public', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('businesses')
      .select(`
        id,
        name,
        description,
        address,
        phone,
        email,
        status,
        views,
        created_at,
        category_id,
        categories(id, name)
      `);

    // Filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (status) {
      query = query.eq('status', status);
    } else {
      // Por padrão, mostrar apenas aprovados no site público
      query = query.eq('status', 'approved');
    }

    const { data: businesses, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar negócios públicos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Formatar dados para o frontend
    const formattedBusinesses = businesses.map(business => ({
      id: business.id,
      name: business.name,
      description: business.description,
      address: business.address,
      phone: business.phone,
      email: business.email,
      status: business.status,
      views: business.views || 0,
      created_at: business.created_at,
      category_id: business.category_id,
      category_name: business.categories?.name || 'Categoria não informada'
    }));

    res.json(formattedBusinesses);
  } catch (error) {
    console.error('Erro ao buscar negócios públicos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para categorias públicas
router.get('/api/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para detalhes de um negócio específico
router.get('/api/businesses/:id/public', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        description,
        address,
        phone,
        email,
        website,
        opening_hours,
        status,
        views,
        created_at,
        category_id,
        subcategory_id,
        categories(id, name),
        subcategories(id, name)
      `)
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (error || !business) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    // Incrementar visualizações
    await supabase
      .from('businesses')
      .update({ views: (business.views || 0) + 1 })
      .eq('id', id);

    // Formatar dados para o frontend
    const formattedBusiness = {
      id: business.id,
      name: business.name,
      description: business.description,
      address: business.address,
      phone: business.phone,
      email: business.email,
      website: business.website,
      opening_hours: business.opening_hours,
      status: business.status,
      views: (business.views || 0) + 1,
      created_at: business.created_at,
      category: business.categories?.name || 'Categoria não informada',
      subcategory: business.subcategories?.name || null
    };

    res.json(formattedBusiness);
  } catch (error) {
    console.error('Erro ao buscar detalhes do negócio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Página de detalhes de um negócio (opcional)
router.get('/business/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        description,
        address,
        phone,
        email,
        website,
        opening_hours,
        status,
        views,
        created_at,
        category_id,
        subcategory_id,
        categories(id, name),
        subcategories(id, name)
      `)
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (error || !business) {
      return res.status(404).render('public/error', {
        title: 'Negócio não encontrado',
        message: 'O negócio que você está procurando não foi encontrado.',
        layout: false
      });
    }

    // Incrementar visualizações
    await supabase
      .from('businesses')
      .update({ views: (business.views || 0) + 1 })
      .eq('id', id);

    res.render('public/business-detail', {
      title: `${business.name} - Tem Aki no Bairro`,
      business: business,
      layout: false
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do negócio:', error);
    res.status(500).render('public/error', {
      title: 'Erro interno',
      message: 'Ocorreu um erro interno. Tente novamente mais tarde.',
      layout: false
    });
  }
});

module.exports = router;