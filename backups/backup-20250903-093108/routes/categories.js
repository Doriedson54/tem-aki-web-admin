const express = require('express');
const { logActivity } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Listar todas as categorias
router.get('/', logActivity('view_categories'), (req, res) => {
  const categoriesQuery = `
    SELECT c.*, COUNT(DISTINCT b.id) as business_count
    FROM categories c
    LEFT JOIN businesses b ON c.id = b.category_id
    GROUP BY c.id
    ORDER BY c.name
  `;

  db.getDb().all(categoriesQuery, [], (err, categories) => {
    if (err) {
      console.error('Erro ao listar categorias:', err.message);
      return res.status(500).render('error', {
        title: 'Erro do Servidor',
        message: 'Erro ao carregar categorias.',
        error: err
      });
    }

    // Buscar subcategorias para cada categoria
    const categoriesWithSubcategories = [];
    let processedCount = 0;

    if (categories.length === 0) {
      return res.render('categories/index', {
        title: 'Gerenciar Categorias - Tem Aki Admin',
        categories: [],
        currentPage: 'categories'
      });
    }

    categories.forEach((category, index) => {
      const subcategoriesQuery = `
        SELECT id, name, active
        FROM subcategories
        WHERE category_id = ?
        ORDER BY name
      `;

      db.getDb().all(subcategoriesQuery, [category.id], (err, subcategories) => {
        if (!err) {
          category.subcategories = subcategories || [];
        } else {
          category.subcategories = [];
        }

        categoriesWithSubcategories[index] = category;
        processedCount++;

        if (processedCount === categories.length) {
          res.render('categories/index', {
            title: 'Gerenciar Categorias - Tem Aki Admin',
            categories: categoriesWithSubcategories,
            currentPage: 'categories'
          });
        }
      });
    });
  });
});

// Página para criar nova categoria
router.get('/new', (req, res) => {
  res.render('categories/form', {
    title: 'Nova Categoria - Tem Aki Admin',
    category: null,
    action: 'create'
  });
});

// Criar nova categoria
router.post('/', logActivity('create_category'), (req, res) => {
  const { name, description, icon, color, active } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  }

  const query = `
    INSERT INTO categories (name, description, icon, color, active)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.getDb().run(query, [
    name,
    description || null,
    icon || null,
    color || '#007bff',
    active === 'on' ? 1 : 0
  ], function(err) {
    if (err) {
      console.error('Erro ao criar categoria:', err.message);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
      }
      return res.status(500).json({ error: 'Erro ao criar categoria' });
    }

    res.json({ success: true, message: 'Categoria criada com sucesso!', id: this.lastID });
  });
});

// Visualizar categoria específica
router.get('/:id', logActivity('view_category'), (req, res) => {
  const { id } = req.params;

  const categoryQuery = `
    SELECT c.*, COUNT(b.id) as business_count
    FROM categories c
    LEFT JOIN businesses b ON c.id = b.category_id
    WHERE c.id = ?
    GROUP BY c.id
  `;

  const subcategoriesQuery = `
    SELECT sc.*, COUNT(b.id) as business_count
    FROM subcategories sc
    LEFT JOIN businesses b ON sc.id = b.subcategory_id
    WHERE sc.category_id = ?
    GROUP BY sc.id
    ORDER BY sc.name
  `;

  const businessesQuery = `
    SELECT id, name, status, created_at
    FROM businesses
    WHERE category_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `;

  db.getDb().get(categoryQuery, [id], (err, category) => {
    if (err) {
      console.error('Erro ao buscar categoria:', err.message);
      return res.status(500).render('error', {
        title: 'Erro do Servidor',
        message: 'Erro ao carregar categoria.',
        error: err
      });
    }

    if (!category) {
      return res.status(404).render('error', {
        title: 'Categoria Não Encontrada',
        message: 'A categoria que você está procurando não existe.',
        error: {}
      });
    }

    // Buscar subcategorias
    db.getDb().all(subcategoriesQuery, [id], (err, subcategories) => {
      if (err) {
        console.error('Erro ao buscar subcategorias:', err.message);
        subcategories = [];
      }

      // Buscar negócios da categoria
      db.getDb().all(businessesQuery, [id], (err, businesses) => {
        if (err) {
          console.error('Erro ao buscar negócios:', err.message);
          businesses = [];
        }

        res.render('categories/view', {
          title: `${category.name} - Tem Aki Admin`,
          category: category,
          subcategories: subcategories,
          businesses: businesses
        });
      });
    });
  });
});

// Página para editar categoria
router.get('/:id/edit', (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM categories WHERE id = ?';

  db.getDb().get(query, [id], (err, category) => {
    if (err) {
      console.error('Erro ao buscar categoria:', err.message);
      return res.status(500).render('error', {
        title: 'Erro do Servidor',
        message: 'Erro ao carregar categoria.',
        error: err
      });
    }

    if (!category) {
      return res.status(404).render('error', {
        title: 'Categoria Não Encontrada',
        message: 'A categoria que você está procurando não existe.',
        error: {}
      });
    }

    res.render('categories/form', {
      title: `Editar ${category.name} - Tem Aki Admin`,
      category: category,
      action: 'edit'
    });
  });
});

// Atualizar categoria
router.put('/:id', logActivity('update_category'), (req, res) => {
  const { id } = req.params;
  const { name, description, icon, color, active } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  }

  const query = `
    UPDATE categories 
    SET name = ?, description = ?, icon = ?, color = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.getDb().run(query, [
    name,
    description || null,
    icon || null,
    color || '#007bff',
    active === 'on' ? 1 : 0,
    id
  ], function(err) {
    if (err) {
      console.error('Erro ao atualizar categoria:', err.message);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
      }
      return res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    res.json({ success: true, message: 'Categoria atualizada com sucesso!' });
  });
});

// Excluir categoria
router.delete('/:id', logActivity('delete_category'), (req, res) => {
  const { id } = req.params;

  // Verificar se há negócios usando esta categoria
  const checkQuery = 'SELECT COUNT(*) as count FROM businesses WHERE category_id = ?';

  db.getDb().get(checkQuery, [id], (err, result) => {
    if (err) {
      console.error('Erro ao verificar negócios:', err.message);
      return res.status(500).json({ error: 'Erro ao excluir categoria' });
    }

    if (result.count > 0) {
      return res.status(400).json({ 
        error: `Não é possível excluir esta categoria pois ela possui ${result.count} negócio(s) associado(s)` 
      });
    }

    // Excluir subcategorias primeiro
    const deleteSubcategoriesQuery = 'DELETE FROM subcategories WHERE category_id = ?';
    
    db.getDb().run(deleteSubcategoriesQuery, [id], (err) => {
      if (err) {
        console.error('Erro ao excluir subcategorias:', err.message);
        return res.status(500).json({ error: 'Erro ao excluir categoria' });
      }

      // Depois excluir a categoria
      const deleteCategoryQuery = 'DELETE FROM categories WHERE id = ?';
      
      db.getDb().run(deleteCategoryQuery, [id], function(err) {
        if (err) {
          console.error('Erro ao excluir categoria:', err.message);
          return res.status(500).json({ error: 'Erro ao excluir categoria' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        res.json({ success: true, message: 'Categoria excluída com sucesso!' });
      });
    });
  });
});

// SUBCATEGORIAS

// Listar subcategorias de uma categoria
router.get('/:categoryId/subcategories', (req, res) => {
  const { categoryId } = req.params;

  const query = `
    SELECT sc.*, COUNT(b.id) as business_count
    FROM subcategories sc
    LEFT JOIN businesses b ON sc.id = b.subcategory_id
    WHERE sc.category_id = ?
    GROUP BY sc.id
    ORDER BY sc.name
  `;

  db.getDb().all(query, [categoryId], (err, subcategories) => {
    if (err) {
      console.error('Erro ao buscar subcategorias:', err.message);
      return res.status(500).json({ error: 'Erro ao carregar subcategorias' });
    }

    res.json(subcategories);
  });
});

// Criar nova subcategoria
router.post('/:categoryId/subcategories', logActivity('create_subcategory'), (req, res) => {
  const { categoryId } = req.params;
  const { name, description, active } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Nome da subcategoria é obrigatório' });
  }

  const query = `
    INSERT INTO subcategories (category_id, name, description, active)
    VALUES (?, ?, ?, ?)
  `;

  db.getDb().run(query, [
    categoryId,
    name,
    description || null,
    active === 'on' ? 1 : 0
  ], function(err) {
    if (err) {
      console.error('Erro ao criar subcategoria:', err.message);
      return res.status(500).json({ error: 'Erro ao criar subcategoria' });
    }

    res.json({ success: true, message: 'Subcategoria criada com sucesso!', id: this.lastID });
  });
});

// Atualizar subcategoria
router.put('/subcategories/:id', logActivity('update_subcategory'), (req, res) => {
  const { id } = req.params;
  const { name, description, active } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Nome da subcategoria é obrigatório' });
  }

  const query = `
    UPDATE subcategories 
    SET name = ?, description = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.getDb().run(query, [
    name,
    description || null,
    active === 'on' ? 1 : 0,
    id
  ], function(err) {
    if (err) {
      console.error('Erro ao atualizar subcategoria:', err.message);
      return res.status(500).json({ error: 'Erro ao atualizar subcategoria' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Subcategoria não encontrada' });
    }

    res.json({ success: true, message: 'Subcategoria atualizada com sucesso!' });
  });
});

// Excluir subcategoria
router.delete('/subcategories/:id', logActivity('delete_subcategory'), (req, res) => {
  const { id } = req.params;

  // Verificar se há negócios usando esta subcategoria
  const checkQuery = 'SELECT COUNT(*) as count FROM businesses WHERE subcategory_id = ?';

  db.getDb().get(checkQuery, [id], (err, result) => {
    if (err) {
      console.error('Erro ao verificar negócios:', err.message);
      return res.status(500).json({ error: 'Erro ao excluir subcategoria' });
    }

    if (result.count > 0) {
      return res.status(400).json({ 
        error: `Não é possível excluir esta subcategoria pois ela possui ${result.count} negócio(s) associado(s)` 
      });
    }

    const query = 'DELETE FROM subcategories WHERE id = ?';
    
    db.getDb().run(query, [id], function(err) {
      if (err) {
        console.error('Erro ao excluir subcategoria:', err.message);
        return res.status(500).json({ error: 'Erro ao excluir subcategoria' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Subcategoria não encontrada' });
      }

      res.json({ success: true, message: 'Subcategoria excluída com sucesso!' });
    });
  });
});

module.exports = router;