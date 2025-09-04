const express = require('express');
const { logActivity } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Dashboard principal
router.get('/', logActivity('view_dashboard'), (req, res) => {
  // Buscar estatísticas
  const queries = {
    totalBusinesses: 'SELECT COUNT(*) as count FROM businesses',
    pendingBusinesses: 'SELECT COUNT(*) as count FROM businesses WHERE status = "pending"',
    approvedBusinesses: 'SELECT COUNT(*) as count FROM businesses WHERE status = "approved"',
    totalCategories: 'SELECT COUNT(*) as count FROM categories WHERE active = 1',
    recentBusinesses: `SELECT b.*, c.name as category_name 
                       FROM businesses b 
                       LEFT JOIN categories c ON b.category_id = c.id 
                       ORDER BY b.created_at DESC 
                       LIMIT 10`,
    businessesByCategory: `SELECT c.name, COUNT(b.id) as count 
                           FROM categories c 
                           LEFT JOIN businesses b ON c.id = b.category_id 
                           WHERE c.active = 1 
                           GROUP BY c.id, c.name 
                           ORDER BY count DESC`,
    businessesByStatus: `SELECT status, COUNT(*) as count 
                         FROM businesses 
                         GROUP BY status`,
    recentActivity: `SELECT al.*, u.username 
                     FROM activity_logs al 
                     LEFT JOIN users u ON al.user_id = u.id 
                     ORDER BY al.created_at DESC 
                     LIMIT 20`
  };

  const stats = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.keys(queries).forEach(key => {
    if (key.includes('recent') || key.includes('By')) {
      // Para queries que retornam múltiplas linhas
      db.getDb().all(queries[key], [], (err, rows) => {
        if (err) {
          console.error(`Erro na query ${key}:`, err.message);
          stats[key] = [];
        } else {
          stats[key] = rows;
        }
        
        completed++;
        if (completed === totalQueries) {
          renderDashboard();
        }
      });
    } else {
      // Para queries que retornam uma única linha
      db.getDb().get(queries[key], [], (err, row) => {
        if (err) {
          console.error(`Erro na query ${key}:`, err.message);
          stats[key] = 0;
        } else {
          stats[key] = row ? row.count : 0;
        }
        
        completed++;
        if (completed === totalQueries) {
          renderDashboard();
        }
      });
    }
  });

  function renderDashboard() {
    res.render('dashboard/index', {
      title: 'Dashboard - Tem Aki Admin',
      stats: stats,
      recentBusinesses: stats.recentBusinesses || [],
      recentActivities: stats.recentActivity || [],
      businessesByCategory: stats.businessesByCategory || [],
      businessesByStatus: stats.businessesByStatus || [],
      user: req.session.user
    });
  }
});

// API para dados do dashboard (para gráficos)
router.get('/api/stats', (req, res) => {
  const { period = '30' } = req.query;
  
  const queries = {
    businessesOverTime: `SELECT DATE(created_at) as date, COUNT(*) as count 
                         FROM businesses 
                         WHERE created_at >= datetime('now', '-${period} days') 
                         GROUP BY DATE(created_at) 
                         ORDER BY date`,
    categoriesStats: `SELECT c.name, COUNT(b.id) as count, c.color 
                      FROM categories c 
                      LEFT JOIN businesses b ON c.id = b.category_id 
                      WHERE c.active = 1 
                      GROUP BY c.id, c.name, c.color 
                      ORDER BY count DESC`,
    statusStats: `SELECT status, COUNT(*) as count 
                  FROM businesses 
                  GROUP BY status`,
    neighborhoodStats: `SELECT neighborhood, COUNT(*) as count 
                        FROM businesses 
                        WHERE neighborhood IS NOT NULL AND neighborhood != '' 
                        GROUP BY neighborhood 
                        ORDER BY count DESC 
                        LIMIT 10`
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.keys(queries).forEach(key => {
    db.getDb().all(queries[key], [], (err, rows) => {
      if (err) {
        console.error(`Erro na query ${key}:`, err.message);
        results[key] = [];
      } else {
        results[key] = rows;
      }
      
      completed++;
      if (completed === totalQueries) {
        res.json(results);
      }
    });
  });
});

// Busca rápida
router.get('/search', (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ businesses: [], categories: [] });
  }

  const businessQuery = `SELECT id, name, phone, status 
                         FROM businesses 
                         WHERE name LIKE ? OR phone LIKE ? 
                         LIMIT 10`;
  
  const categoryQuery = `SELECT id, name 
                         FROM categories 
                         WHERE name LIKE ? AND active = 1 
                         LIMIT 5`;

  const searchTerm = `%${q}%`;
  const results = {};
  let completed = 0;

  db.getDb().all(businessQuery, [searchTerm, searchTerm], (err, businesses) => {
    if (err) {
      console.error('Erro na busca de negócios:', err.message);
      results.businesses = [];
    } else {
      results.businesses = businesses;
    }
    
    completed++;
    if (completed === 2) {
      res.json(results);
    }
  });

  db.getDb().all(categoryQuery, [searchTerm], (err, categories) => {
    if (err) {
      console.error('Erro na busca de categorias:', err.message);
      results.categories = [];
    } else {
      results.categories = categories;
    }
    
    completed++;
    if (completed === 2) {
      res.json(results);
    }
  });
});

module.exports = router;