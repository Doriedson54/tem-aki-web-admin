const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, logActivity } = require('../middleware/auth');

// Aplicar middleware de autenticação a todas as rotas
router.use(requireAuth);

// Página principal de relatórios
router.get('/', logActivity('view_reports'), (req, res) => {
  const queries = {
    // Estatísticas gerais
    totalBusinesses: 'SELECT COUNT(*) as count FROM businesses',
    pendingBusinesses: 'SELECT COUNT(*) as count FROM businesses WHERE status = "pending"',
    approvedBusinesses: 'SELECT COUNT(*) as count FROM businesses WHERE status = "approved"',
    rejectedBusinesses: 'SELECT COUNT(*) as count FROM businesses WHERE status = "rejected"',
    featuredBusinesses: 'SELECT COUNT(*) as count FROM businesses WHERE featured = 1',
    
    // Negócios por categoria
    businessesByCategory: `
      SELECT c.name as category, COUNT(b.id) as count
      FROM categories c
      LEFT JOIN businesses b ON c.id = b.category_id
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `,
    
    // Negócios por status
    businessesByStatus: `
      SELECT status, COUNT(*) as count
      FROM businesses
      GROUP BY status
    `,
    
    // Atividades recentes de moderação
    recentModerations: `
      SELECT mh.*, b.name as business_name, u.username
      FROM moderation_history mh
      LEFT JOIN businesses b ON mh.business_id = b.id
      LEFT JOIN users u ON mh.user_id = u.id
      ORDER BY mh.created_at DESC
      LIMIT 10
    `,
    
    // Negócios criados por mês (últimos 6 meses)
    businessesByMonth: `
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM businesses
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `,
    
    // Top categorias mais populares
    topCategories: `
      SELECT c.name, COUNT(b.id) as business_count
      FROM categories c
      LEFT JOIN businesses b ON c.id = b.category_id AND b.status = 'approved'
      GROUP BY c.id, c.name
      HAVING business_count > 0
      ORDER BY business_count DESC
      LIMIT 5
    `
  };

  const results = {};
  const queryKeys = Object.keys(queries);
  let completed = 0;

  queryKeys.forEach(key => {
    db.getDb().all(queries[key], [], (err, rows) => {
      if (err) {
        console.error(`Erro na query ${key}:`, err.message);
        results[key] = key.includes('By') ? [] : { count: 0 };
      } else {
        if (key.includes('By') || key === 'recentModerations') {
          results[key] = rows;
        } else {
          results[key] = rows[0] || { count: 0 };
        }
      }
      
      completed++;
      if (completed === queryKeys.length) {
        res.render('reports/index', {
          title: 'Relatórios - Tem Aki Admin',
          currentPage: 'reports',
          ...results
        });
      }
    });
  });
});

// Exportar relatório de negócios em CSV
router.get('/export/businesses', logActivity('export_businesses'), (req, res) => {
  const { status, category, format = 'csv' } = req.query;
  
  let query = `
    SELECT 
      b.id,
      b.name,
      b.description,
      c.name as category,
      sc.name as subcategory,
      b.phone,
      b.whatsapp,
      b.email,
      b.website,
      b.address,
      b.neighborhood,
      b.city,
      b.state,
      b.status,
      b.featured,
      b.views,
      b.created_at,
      b.updated_at
    FROM businesses b
    LEFT JOIN categories c ON b.category_id = c.id
    LEFT JOIN subcategories sc ON b.subcategory_id = sc.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }
  
  if (category) {
    query += ' AND b.category_id = ?';
    params.push(category);
  }
  
  query += ' ORDER BY b.created_at DESC';
  
  db.getDb().all(query, params, (err, businesses) => {
    if (err) {
      console.error('Erro ao exportar negócios:', err.message);
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
      
      businesses.forEach(business => {
        const row = [
          business.id,
          `"${business.name || ''}"`,
          `"${business.description || ''}"`,
          `"${business.category || ''}"`,
          `"${business.subcategory || ''}"`,
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
  });
});

// Relatório de atividades de moderação
router.get('/moderation', logActivity('view_moderation_report'), (req, res) => {
  const { user_id, action, date_from, date_to } = req.query;
  
  let query = `
    SELECT 
      mh.*,
      b.name as business_name,
      u.username,
      c.name as category_name
    FROM moderation_history mh
    LEFT JOIN businesses b ON mh.business_id = b.id
    LEFT JOIN users u ON mh.user_id = u.id
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (user_id) {
    query += ' AND mh.user_id = ?';
    params.push(user_id);
  }
  
  if (action) {
    query += ' AND mh.action = ?';
    params.push(action);
  }
  
  if (date_from) {
    query += ' AND DATE(mh.created_at) >= ?';
    params.push(date_from);
  }
  
  if (date_to) {
    query += ' AND DATE(mh.created_at) <= ?';
    params.push(date_to);
  }
  
  query += ' ORDER BY mh.created_at DESC LIMIT 100';
  
  // Buscar usuários para o filtro
  const usersQuery = 'SELECT id, username FROM users ORDER BY username';
  
  db.getDb().all(usersQuery, [], (err, users) => {
    if (err) {
      console.error('Erro ao buscar usuários:', err.message);
      users = [];
    }
    
    db.getDb().all(query, params, (err, moderations) => {
      if (err) {
        console.error('Erro ao buscar moderações:', err.message);
        return res.status(500).render('error', {
          title: 'Erro do Servidor',
          message: 'Erro ao carregar relatório de moderação.',
          error: err
        });
      }
      
      res.render('reports/moderation', {
        title: 'Relatório de Moderação - Tem Aki Admin',
        currentPage: 'reports',
        moderations: moderations,
        users: users,
        filters: { user_id, action, date_from, date_to }
      });
    });
  });
});

// Rota para a página de backup
router.get('/backup-page', async (req, res) => {
  try {
    res.render('reports/backup', {
      title: 'Backup e Restauração',
      user: req.session.user
    });
  } catch (error) {
    console.error('Erro ao carregar página de backup:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.session.user
    });
  }
});

// Backup completo do sistema
router.get('/backup', logActivity('system_backup'), (req, res) => {
  const { format = 'json' } = req.query;
  
  const queries = {
    users: 'SELECT * FROM users',
    categories: 'SELECT * FROM categories',
    subcategories: 'SELECT * FROM subcategories',
    businesses: 'SELECT * FROM businesses',
    business_images: 'SELECT * FROM business_images',
    activity_logs: 'SELECT * FROM activity_logs',
    moderation_history: 'SELECT * FROM moderation_history'
  };
  
  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    data: {}
  };
  
  const queryKeys = Object.keys(queries);
  let completed = 0;
  
  queryKeys.forEach(table => {
    db.getDb().all(queries[table], [], (err, rows) => {
      if (err) {
        console.error(`Erro ao fazer backup da tabela ${table}:`, err.message);
        backup.data[table] = [];
      } else {
        backup.data[table] = rows;
      }
      
      completed++;
      if (completed === queryKeys.length) {
        if (format === 'json') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="backup_${new Date().toISOString().split('T')[0]}.json"`);
          res.send(JSON.stringify(backup, null, 2));
        } else {
          res.json(backup);
        }
      }
    });
  });
});

// Restaurar backup
router.post('/restore', logActivity('system_restore'), (req, res) => {
  const { backup_data } = req.body;
  
  if (!backup_data || !backup_data.data) {
    return res.status(400).json({ error: 'Dados de backup inválidos' });
  }
  
  const db_instance = db.getDb();
  
  // Começar transação
  db_instance.serialize(() => {
    db_instance.run('BEGIN TRANSACTION');
    
    try {
      // Limpar tabelas existentes (exceto users para manter admin)
      const tablesToClear = ['moderation_history', 'activity_logs', 'business_images', 'businesses', 'subcategories', 'categories'];
      
      tablesToClear.forEach(table => {
        db_instance.run(`DELETE FROM ${table}`);
      });
      
      // Restaurar dados
      Object.keys(backup_data.data).forEach(table => {
        if (table === 'users') return; // Pular usuários para manter admin
        
        const rows = backup_data.data[table];
        if (rows && rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const placeholders = columns.map(() => '?').join(',');
          const query = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
          
          rows.forEach(row => {
            const values = columns.map(col => row[col]);
            db_instance.run(query, values);
          });
        }
      });
      
      db_instance.run('COMMIT');
      res.json({ success: true, message: 'Backup restaurado com sucesso!' });
    } catch (error) {
      db_instance.run('ROLLBACK');
      console.error('Erro ao restaurar backup:', error);
      res.status(500).json({ error: 'Erro ao restaurar backup' });
    }
  });
});

module.exports = router;