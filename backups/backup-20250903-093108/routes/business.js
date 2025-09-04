const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'businesses');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WebP)'));
    }
  }
});

// Listar todos os negócios
router.get('/', logActivity('view_businesses'), (req, res) => {
  const { page = 1, limit = 20, status, category, search } = req.query;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let queryParams = [];

  if (status) {
    whereConditions.push('b.status = ?');
    queryParams.push(status);
  }

  if (category) {
    whereConditions.push('b.category_id = ?');
    queryParams.push(category);
  }

  if (search) {
    whereConditions.push('(b.name LIKE ? OR b.phone LIKE ? OR b.email LIKE ?)');
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  const businessesQuery = `
    SELECT b.*, c.name as category_name, sc.name as subcategory_name
    FROM businesses b
    LEFT JOIN categories c ON b.category_id = c.id
    LEFT JOIN subcategories sc ON b.subcategory_id = sc.id
    ${whereClause}
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM businesses b
    ${whereClause}
  `;

  // Buscar categorias para o filtro
  const categoriesQuery = 'SELECT * FROM categories WHERE active = 1 ORDER BY name';

  queryParams.push(parseInt(limit), parseInt(offset));

  db.getDb().all(businessesQuery, queryParams, (err, businesses) => {
    if (err) {
      console.error('Erro ao buscar negócios:', err.message);
      return res.status(500).render('error', {
        title: 'Erro do Servidor',
        message: 'Erro ao carregar negócios.',
        error: err
      });
    }

    // Contar total de registros
    const countParams = queryParams.slice(0, -2); // Remove limit e offset
    db.getDb().get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Erro ao contar negócios:', err.message);
        return res.status(500).render('error', {
          title: 'Erro do Servidor',
          message: 'Erro ao carregar negócios.',
          error: err
        });
      }

      // Buscar categorias
      db.getDb().all(categoriesQuery, [], (err, categories) => {
        if (err) {
          console.error('Erro ao buscar categorias:', err.message);
          categories = [];
        }

        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);

        res.render('business/index', {
          title: 'Gerenciar Negócios - Tem Aki Admin',
          businesses: businesses,
          categories: categories,
          pagination: {
            current: parseInt(page),
            total: totalPages,
            limit: parseInt(limit),
            totalRecords: total
          },
          filters: {
            status: status || '',
            category: category || '',
            search: search || ''
          }
        });
      });
    });
  });
});

// Visualizar negócio específico
router.get('/:id', logActivity('view_business'), (req, res) => {
  const { id } = req.params;

  const businessQuery = `
    SELECT b.*, c.name as category_name, sc.name as subcategory_name
    FROM businesses b
    LEFT JOIN categories c ON b.category_id = c.id
    LEFT JOIN subcategories sc ON b.subcategory_id = sc.id
    WHERE b.id = ?
  `;

  const imagesQuery = 'SELECT * FROM business_images WHERE business_id = ? ORDER BY is_primary DESC, created_at';
  
  const historyQuery = `
    SELECT mh.*, u.username
    FROM moderation_history mh
    LEFT JOIN users u ON mh.user_id = u.id
    WHERE mh.business_id = ?
    ORDER BY mh.created_at DESC
  `;

  db.getDb().get(businessQuery, [id], (err, business) => {
    if (err) {
      console.error('Erro ao buscar negócio:', err.message);
      return res.status(500).render('error', {
        title: 'Erro do Servidor',
        message: 'Erro ao carregar negócio.',
        error: err
      });
    }

    if (!business) {
      return res.status(404).render('error', {
        title: 'Negócio Não Encontrado',
        message: 'O negócio que você está procurando não existe.',
        error: {}
      });
    }

    // Buscar imagens do negócio
    db.getDb().all(imagesQuery, [id], (err, images) => {
      if (err) {
        console.error('Erro ao buscar imagens:', err.message);
        images = [];
      }

      // Buscar histórico de moderação
      db.getDb().all(historyQuery, [id], (err, history) => {
        if (err) {
          console.error('Erro ao buscar histórico:', err.message);
          history = [];
        }

        res.render('business/view', {
          title: `${business.name} - Tem Aki Admin`,
          business: business,
          images: images,
          history: history
        });
      });
    });
  });
});

// Aprovar negócio
router.post('/:id/approve', logActivity('approve_business'), (req, res) => {
  const { id } = req.params;
  const userId = req.session.user.id;

  // Primeiro, buscar o status atual
  const getStatusQuery = 'SELECT status FROM businesses WHERE id = ?';
  
  db.getDb().get(getStatusQuery, [id], (err, business) => {
    if (err) {
      console.error('Erro ao buscar negócio:', err.message);
      return res.status(500).json({ error: 'Erro ao aprovar negócio' });
    }

    if (!business) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    const previousStatus = business.status;
    const newStatus = 'approved';

    // Atualizar status do negócio
    const updateQuery = 'UPDATE businesses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.getDb().run(updateQuery, [newStatus, id], function(err) {
      if (err) {
        console.error('Erro ao aprovar negócio:', err.message);
        return res.status(500).json({ error: 'Erro ao aprovar negócio' });
      }

      // Registrar no histórico de moderação
      const historyQuery = `INSERT INTO moderation_history 
        (business_id, user_id, action, previous_status, new_status, created_at) 
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
      
      db.getDb().run(historyQuery, [id, userId, 'approve', previousStatus, newStatus], (err) => {
        if (err) {
          console.error('Erro ao registrar histórico:', err.message);
        }
      });

      res.json({ success: true, message: 'Negócio aprovado com sucesso!' });
    });
  });
});

// Rejeitar negócio
router.post('/:id/reject', logActivity('reject_business'), (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.session.user.id;

  // Primeiro, buscar o status atual
  const getStatusQuery = 'SELECT status FROM businesses WHERE id = ?';
  
  db.getDb().get(getStatusQuery, [id], (err, business) => {
    if (err) {
      console.error('Erro ao buscar negócio:', err.message);
      return res.status(500).json({ error: 'Erro ao rejeitar negócio' });
    }

    if (!business) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    const previousStatus = business.status;
    const newStatus = 'rejected';

    // Atualizar status do negócio
    const updateQuery = 'UPDATE businesses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.getDb().run(updateQuery, [newStatus, id], function(err) {
      if (err) {
        console.error('Erro ao rejeitar negócio:', err.message);
        return res.status(500).json({ error: 'Erro ao rejeitar negócio' });
      }

      // Registrar no histórico de moderação
      const historyQuery = `INSERT INTO moderation_history 
        (business_id, user_id, action, previous_status, new_status, reason, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
      
      db.getDb().run(historyQuery, [id, userId, 'reject', previousStatus, newStatus, reason], (err) => {
        if (err) {
          console.error('Erro ao registrar histórico:', err.message);
        }
      });

      // TODO: Implementar notificação por email com a razão da rejeição

      res.json({ success: true, message: 'Negócio rejeitado com sucesso!' });
    });
  });
});

// Destacar/Remover destaque do negócio
router.post('/:id/toggle-featured', logActivity('toggle_featured'), (req, res) => {
  const { id } = req.params;
  const userId = req.session.user.id;

  // Primeiro, verificar o status atual
   const checkQuery = 'SELECT featured, status FROM businesses WHERE id = ?';
  
  db.getDb().get(checkQuery, [id], (err, business) => {
    if (err) {
      console.error('Erro ao verificar negócio:', err.message);
      return res.status(500).json({ error: 'Erro ao processar solicitação' });
    }

    if (!business) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    const newFeaturedStatus = business.featured ? 0 : 1;
    const action = newFeaturedStatus ? 'feature' : 'unfeature';
    const actionText = newFeaturedStatus ? 'destacar' : 'remover destaque';

    const updateQuery = 'UPDATE businesses SET featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    db.getDb().run(updateQuery, [newFeaturedStatus, id], function(err) {
      if (err) {
        console.error('Erro ao atualizar destaque:', err.message);
        return res.status(500).json({ error: 'Erro ao atualizar destaque' });
      }

      // Registrar no histórico de moderação
       const historyQuery = `INSERT INTO moderation_history 
         (business_id, user_id, action, previous_status, new_status, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
       
       const notes = newFeaturedStatus ? 'Negócio destacado' : 'Destaque removido';
       
       db.getDb().run(historyQuery, [id, userId, action, business.status, business.status, notes], (err) => {
        if (err) {
          console.error('Erro ao registrar histórico:', err.message);
        }
      });

      const message = newFeaturedStatus ? 'Negócio destacado com sucesso!' : 'Destaque removido com sucesso!';
      res.json({ success: true, message: message, featured: newFeaturedStatus });
    });
  });
});

// Excluir negócio
router.delete('/:id', logActivity('delete_business'), (req, res) => {
  const { id } = req.params;

  // Primeiro, excluir imagens associadas
  const deleteImagesQuery = 'DELETE FROM business_images WHERE business_id = ?';
  
  db.getDb().run(deleteImagesQuery, [id], (err) => {
    if (err) {
      console.error('Erro ao excluir imagens:', err.message);
      return res.status(500).json({ error: 'Erro ao excluir negócio' });
    }

    // Depois, excluir o negócio
    const deleteBusinessQuery = 'DELETE FROM businesses WHERE id = ?';
    
    db.getDb().run(deleteBusinessQuery, [id], function(err) {
      if (err) {
        console.error('Erro ao excluir negócio:', err.message);
        return res.status(500).json({ error: 'Erro ao excluir negócio' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }

      res.json({ success: true, message: 'Negócio excluído com sucesso!' });
    });
  });
});

// Exportar negócios para CSV
router.get('/export/csv', logActivity('export_businesses'), (req, res) => {
  const query = `
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
      b.created_at
    FROM businesses b
    LEFT JOIN categories c ON b.category_id = c.id
    LEFT JOIN subcategories sc ON b.subcategory_id = sc.id
    ORDER BY b.created_at DESC
  `;

  db.getDb().all(query, [], (err, businesses) => {
    if (err) {
      console.error('Erro ao exportar negócios:', err.message);
      return res.status(500).json({ error: 'Erro ao exportar dados' });
    }

    // Converter para CSV
    const headers = Object.keys(businesses[0] || {});
    const csvContent = [
      headers.join(','),
      ...businesses.map(business => 
        headers.map(header => {
          const value = business[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=negocios_tem_aki.csv');
    res.send(csvContent);
  });
});

module.exports = router;