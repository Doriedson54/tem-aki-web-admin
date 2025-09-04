const express = require('express');
const { requireAuth } = require('../middleware/auth_supabase');
const { supabaseService } = require('../config/supabase');

const router = express.Router();

// Dashboard principal
router.get('/', requireAuth, async (req, res) => {
  try {
    // Buscar estatísticas básicas
    const [businessesResult, categoriesResult, pendingResult, recentActivitiesResult, recentBusinessesResult] = await Promise.all([
      // Total de negócios
      supabaseService
        .from('businesses')
        .select('id', { count: 'exact' }),
      
      // Total de categorias
      supabaseService
        .from('categories')
        .select('id', { count: 'exact' }),
      
      // Negócios pendentes
      supabaseService
        .from('businesses')
        .select('id', { count: 'exact' })
        .eq('status', 'pending'),
      
      // Atividades recentes
      supabaseService
        .from('activity_logs')
        .select(`
          id,
          action,
          details,
          created_at,
          users!inner(username)
        `)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Negócios recentes
      supabaseService
        .from('businesses')
        .select(`
          id,
          name,
          phone,
          status,
          created_at,
          categories!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // Buscar negócios por status
    const statusStats = await supabaseService
      .from('businesses')
      .select('status')
      .then(({ data }) => {
        const stats = { approved: 0, pending: 0, rejected: 0 };
        if (data) {
          data.forEach(business => {
            stats[business.status] = (stats[business.status] || 0) + 1;
          });
        }
        return stats;
      });

    // Buscar negócios por categoria
    const categoryStats = await supabaseService
      .from('businesses')
      .select(`
        categories!inner(name),
        id
      `)
      .eq('status', 'approved')
      .then(({ data }) => {
        const stats = {};
        if (data) {
          data.forEach(business => {
            const categoryName = business.categories.name;
            stats[categoryName] = (stats[categoryName] || 0) + 1;
          });
        }
        return Object.entries(stats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
      });

    const stats = {
      totalBusinesses: businessesResult.count || 0,
      totalCategories: categoriesResult.count || 0,
      pendingBusinesses: pendingResult.count || 0,
      approvedBusinesses: statusStats.approved || 0,
      rejectedBusinesses: statusStats.rejected || 0
    };

    // Processar negócios recentes para incluir category_name
    const recentBusinesses = (recentBusinessesResult.data || []).map(business => ({
      ...business,
      category_name: business.categories?.name || 'Sem categoria'
    }));

    res.render('dashboard/index', {
      title: 'Dashboard - Tem Aki Admin',
      user: req.session.user,
      stats,
      statusStats,
      categoryStats,
      recentActivities: recentActivitiesResult.data || [],
      recentBusinesses,
      businessesByCategory: categoryStats
    });

  } catch (error) {
    console.error('Erro ao carregar dashboard:', error.message);
    res.status(500).render('error', {
      title: 'Erro - Tem Aki Admin',
      message: 'Erro ao carregar o dashboard.',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// API para estatísticas (usado pelo JavaScript do frontend)
router.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const [businessesResult, categoriesResult, pendingResult] = await Promise.all([
      supabaseService
        .from('businesses')
        .select('id', { count: 'exact' }),
      
      supabaseService
        .from('categories')
        .select('id', { count: 'exact' }),
      
      supabaseService
        .from('businesses')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')
    ]);

    // Estatísticas por status
    const statusStats = await supabaseService
      .from('businesses')
      .select('status')
      .then(({ data }) => {
        const stats = { approved: 0, pending: 0, rejected: 0 };
        if (data) {
          data.forEach(business => {
            stats[business.status] = (stats[business.status] || 0) + 1;
          });
        }
        return stats;
      });

    // Estatísticas por categoria (top 5)
    const categoryStats = await supabaseService
      .from('businesses')
      .select(`
        categories!inner(name),
        id
      `)
      .eq('status', 'approved')
      .then(({ data }) => {
        const stats = {};
        if (data) {
          data.forEach(business => {
            const categoryName = business.categories.name;
            stats[categoryName] = (stats[categoryName] || 0) + 1;
          });
        }
        return Object.entries(stats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
      });

    // Atividades recentes dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivities = await supabaseService
      .from('activity_logs')
      .select(`
        id,
        action,
        created_at,
        users!inner(username)
      `)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    const stats = {
      totalBusinesses: businessesResult.count || 0,
      totalCategories: categoriesResult.count || 0,
      pendingBusinesses: pendingResult.count || 0,
      approvedBusinesses: statusStats.approved || 0,
      rejectedBusinesses: statusStats.rejected || 0,
      statusDistribution: statusStats,
      topCategories: categoryStats,
      recentActivities: recentActivities.data || []
    };

    res.json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      message: error.message 
    });
  }
});

// Busca rápida
router.get('/search', requireAuth, async (req, res) => {
  const { q, type = 'all' } = req.query;
  
  if (!q || q.trim().length < 2) {
    return res.json({ results: [] });
  }

  try {
    const searchTerm = q.trim();
    const results = [];

    // Buscar negócios
    if (type === 'all' || type === 'businesses') {
      const { data: businesses } = await supabaseService
        .from('businesses')
        .select(`
          id,
          name,
          description,
          status,
          categories!inner(name)
        `)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(10);

      if (businesses) {
        businesses.forEach(business => {
          results.push({
            type: 'business',
            id: business.id,
            title: business.name,
            subtitle: business.categories.name,
            description: business.description,
            status: business.status,
            url: `/businesses/${business.id}`
          });
        });
      }
    }

    // Buscar categorias
    if (type === 'all' || type === 'categories') {
      const { data: categories } = await supabaseService
        .from('categories')
        .select('id, name, description')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      if (categories) {
        categories.forEach(category => {
          results.push({
            type: 'category',
            id: category.id,
            title: category.name,
            subtitle: 'Categoria',
            description: category.description,
            url: `/categories/${category.id}`
          });
        });
      }
    }

    // Buscar usuários (apenas username)
    if (type === 'all' || type === 'users') {
      const { data: users } = await supabaseService
        .from('users')
        .select('id, username, email, role')
        .ilike('username', `%${searchTerm}%`)
        .limit(5);

      if (users) {
        users.forEach(user => {
          results.push({
            type: 'user',
            id: user.id,
            title: user.username,
            subtitle: user.role,
            description: user.email,
            url: `/users/${user.id}`
          });
        });
      }
    }

    res.json({ 
      results: results.slice(0, 15), // Limitar a 15 resultados
      total: results.length 
    });

  } catch (error) {
    console.error('Erro na busca:', error.message);
    res.status(500).json({ 
      error: 'Erro na busca',
      results: [] 
    });
  }
});

module.exports = router;