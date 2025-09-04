const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { requireAuth, logActivity } = require('../middleware/auth_supabase');

// Aplicar middleware de autenticação a todas as rotas
router.use(requireAuth);

// Página principal de relatórios
router.get('/', logActivity('view_reports'), async (req, res) => {
  try {
    // Estatísticas gerais
    const { data: totalBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });
    
    const { data: pendingBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    const { data: approvedBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    const { data: rejectedBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');
    
    const { data: featuredBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('featured', true);
    
    // Negócios por categoria
    const { data: businessesByCategory } = await supabase
      .from('categories')
      .select(`
        name,
        businesses(count)
      `);
    
    // Negócios por status
    const { data: businessesByStatus } = await supabase
      .from('businesses')
      .select('status')
      .then(({ data }) => {
        const statusCounts = {};
        data?.forEach(business => {
          statusCounts[business.status] = (statusCounts[business.status] || 0) + 1;
        });
        return Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
      });
    
    // Atividades recentes de moderação
    const { data: recentModerations } = await supabase
      .from('moderation_history')
      .select(`
        *,
        businesses(name),
        users(username)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Negócios criados por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: businessesByMonth } = await supabase
      .from('businesses')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .then(({ data }) => {
        const monthCounts = {};
        data?.forEach(business => {
          const month = business.created_at.substring(0, 7); // YYYY-MM
          monthCounts[month] = (monthCounts[month] || 0) + 1;
        });
        return Object.entries(monthCounts)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => b.month.localeCompare(a.month));
      });
    
    // Top categorias mais populares
    const { data: topCategories } = await supabase
      .from('categories')
      .select(`
        name,
        businesses!inner(id)
      `)
      .eq('businesses.status', 'approved')
      .then(({ data }) => {
        return data?.map(category => ({
          name: category.name,
          business_count: category.businesses?.length || 0
        }))
        .filter(cat => cat.business_count > 0)
        .sort((a, b) => b.business_count - a.business_count)
        .slice(0, 5) || [];
      });
    
    res.render('reports/index', {
      title: 'Relatórios - Tem Aki Admin',
      currentPage: 'reports',
      totalBusinesses: { count: totalBusinesses?.count || 0 },
      pendingBusinesses: { count: pendingBusinesses?.count || 0 },
      approvedBusinesses: { count: approvedBusinesses?.count || 0 },
      rejectedBusinesses: { count: rejectedBusinesses?.count || 0 },
      featuredBusinesses: { count: featuredBusinesses?.count || 0 },
      businessesByCategory: businessesByCategory?.map(cat => ({
        category: cat.name,
        count: cat.businesses?.length || 0
      })) || [],
      businessesByStatus: businessesByStatus || [],
      recentModerations: recentModerations?.map(mod => ({
        ...mod,
        business_name: mod.businesses?.name,
        username: mod.users?.username
      })) || [],
      businessesByMonth: businessesByMonth || [],
      topCategories: topCategories || []
    });
  } catch (error) {
    console.error('Erro ao carregar relatórios:', error);
    res.status(500).render('error', {
      title: 'Erro - Tem Aki Admin',
      message: 'Erro ao carregar relatórios',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Exportar relatório de negócios em CSV
router.get('/export/businesses', logActivity('export_businesses'), async (req, res) => {
  try {
    const { status, category, format = 'csv' } = req.query;
    
    let query = supabase
      .from('businesses')
      .select(`
        id,
        name,
        description,
        phone,
        whatsapp,
        email,
        website,
        address,
        neighborhood,
        city,
        state,
        status,
        featured,
        views,
        created_at,
        updated_at,
        categories(name),
        subcategories(name)
      `);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (category) {
      query = query.eq('category_id', category);
    }
    
    const { data: businesses, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao exportar negócios:', error);
      return res.status(500).json({ error: 'Erro ao exportar dados' });
    }
    
    if (format === 'csv') {
      // Gerar CSV
      const headers = [
        'ID', 'Nome', 'Descrição', 'Categoria', 'Subcategoria',
        'Telefone', 'WhatsApp', 'Email', 'Website', 'Endereço',
        'Bairro', 'Cidade', 'Estado', 'Status', 'Destacado',
        'Visualizações', 'Criado em', 'Atualizado em'
      ];
      
      let csv = headers.join(',') + '\n';
      
      businesses?.forEach(business => {
        const row = [
          business.id,
          `"${business.name || ''}"`,
          `"${business.description || ''}"`,
          `"${business.categories?.name || ''}"`,
          `"${business.subcategories?.name || ''}"`,
          business.phone || '',
          business.whatsapp || '',
          business.email || '',
          business.website || '',
          `"${business.address || ''}"`,
          `"${business.neighborhood || ''}"`,
          `"${business.city || ''}"`,
          business.state || '',
          business.status || '',
          business.featured ? 'Sim' : 'Não',
          business.views || 0,
          business.created_at || '',
          business.updated_at || ''
        ];
        csv += row.join(',') + '\n';
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="negocios_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.json(businesses);
    }
  } catch (error) {
    console.error('Erro ao exportar negócios:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

// Relatório de atividades de moderação
router.get('/moderation', logActivity('view_moderation_report'), async (req, res) => {
  try {
    const { user_id, action, date_from, date_to } = req.query;
    
    let query = supabase
      .from('moderation_history')
      .select(`
        *,
        businesses(name),
        users(username),
        categories(name)
      `);
    
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    
    if (action) {
      query = query.eq('action', action);
    }
    
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    
    if (date_to) {
      query = query.lte('created_at', date_to);
    }
    
    const { data: moderations, error } = await query
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Erro ao carregar moderações:', error);
      throw error;
    }
    
    // Buscar usuários para o filtro
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .order('username');
    
    res.render('reports/moderation', {
      title: 'Relatório de Moderação - Tem Aki Admin',
      currentPage: 'reports',
      moderations: moderations?.map(mod => ({
        ...mod,
        business_name: mod.businesses?.name,
        username: mod.users?.username,
        category_name: mod.categories?.name
      })) || [],
      users: users || [],
      filters: { user_id, action, date_from, date_to }
    });
  } catch (error) {
    console.error('Erro ao carregar relatório de moderação:', error);
    res.status(500).render('error', {
      title: 'Erro - Tem Aki Admin',
      message: 'Erro ao carregar relatório de moderação',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Página de backup
router.get('/backup-page', logActivity('view_backup_page'), (req, res) => {
  res.render('reports/backup', {
    title: 'Backup e Restauração - Tem Aki Admin',
    currentPage: 'reports'
  });
});

// Fazer backup do sistema
router.get('/backup', logActivity('create_backup'), async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // Buscar todos os dados
    const { data: businesses } = await supabase.from('businesses').select('*');
    const { data: categories } = await supabase.from('categories').select('*');
    const { data: subcategories } = await supabase.from('subcategories').select('*');
    const { data: business_images } = await supabase.from('business_images').select('*');
    const { data: moderation_history } = await supabase.from('moderation_history').select('*');
    const { data: activity_logs } = await supabase.from('activity_logs').select('*');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      database: 'supabase',
      data: {
        businesses: businesses || [],
        categories: categories || [],
        subcategories: subcategories || [],
        business_images: business_images || [],
        moderation_history: moderation_history || [],
        activity_logs: activity_logs || []
      }
    };
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="backup_tem_aki_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(backupData);
    } else {
      res.json(backupData);
    }
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    res.status(500).json({ error: 'Erro ao criar backup' });
  }
});

// Restaurar backup
router.post('/restore', logActivity('restore_backup'), async (req, res) => {
  try {
    const { backup_data } = req.body;
    
    if (!backup_data || !backup_data.data) {
      return res.status(400).json({ error: 'Dados de backup inválidos' });
    }
    
    // Limpar dados existentes (cuidado!)
    await supabase.from('business_images').delete().neq('id', 0);
    await supabase.from('moderation_history').delete().neq('id', 0);
    await supabase.from('businesses').delete().neq('id', 0);
    await supabase.from('subcategories').delete().neq('id', 0);
    await supabase.from('categories').delete().neq('id', 0);
    
    // Restaurar dados
    if (backup_data.data.categories?.length > 0) {
      await supabase.from('categories').insert(backup_data.data.categories);
    }
    
    if (backup_data.data.subcategories?.length > 0) {
      await supabase.from('subcategories').insert(backup_data.data.subcategories);
    }
    
    if (backup_data.data.businesses?.length > 0) {
      await supabase.from('businesses').insert(backup_data.data.businesses);
    }
    
    if (backup_data.data.business_images?.length > 0) {
      await supabase.from('business_images').insert(backup_data.data.business_images);
    }
    
    if (backup_data.data.moderation_history?.length > 0) {
      await supabase.from('moderation_history').insert(backup_data.data.moderation_history);
    }
    
    res.json({ success: true, message: 'Backup restaurado com sucesso' });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    res.status(500).json({ error: 'Erro ao restaurar backup' });
  }
});

module.exports = router;