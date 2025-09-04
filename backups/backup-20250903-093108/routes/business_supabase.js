const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth, logActivity } = require('../middleware/auth_supabase');
const { supabaseService, supabaseAdmin, uploadFile, deleteFile, logUserActivity } = require('../config/supabase');

const router = express.Router();

// Configuração do multer para upload temporário
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './temp_uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Listar negócios
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';
    const category = req.query.category || 'all';
    const search = req.query.search || '';

    // Construir query base
    let query = supabaseAdmin
      .from('businesses')
      .select(`
        id,
        name,
        description,
        phone,
        whatsapp,
        address,
        status,
        created_at,
        updated_at,
        categories!inner(id, name),
        subcategories(id, name)
      `, { count: 'exact' });

    // Aplicar filtros
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (category !== 'all') {
      query = query.eq('category_id', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // Aplicar paginação e ordenação
    const { data: businesses, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Buscar categorias para o filtro
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .order('name');

    const totalPages = Math.ceil(count / limit);

    // Renderizar o conteúdo da página
    const bodyContent = await new Promise((resolve, reject) => {
      res.app.render('business/index', {
        title: 'Negócios - Tem Aki Admin',
        user: req.session.user,
        businesses: businesses || [],
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
          status,
          category,
          search
        }
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Renderizar o layout com o conteúdo
    res.render('layout', {
      title: 'Negócios - Tem Aki Admin',
      user: req.session.user,
      body: bodyContent
    });

  } catch (error) {
    console.error('Erro ao listar negócios:', error.message);
    res.status(500).render('error', {
      title: 'Erro - Tem Aki Admin',
      message: 'Erro ao carregar a lista de negócios.',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Visualizar negócio específico
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const businessId = req.params.id;

    // Buscar negócio com relacionamentos
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select(`
        *,
        categories!inner(id, name),
        subcategories(id, name),
        business_images(
          id,
          image_url,
          alt_text,
          is_primary,
          created_at
        )
      `)
      .eq('id', businessId)
      .single();

    if (error || !business) {
      return res.status(404).render('error', {
        title: 'Negócio Não Encontrado',
        message: 'O negócio que você está procurando não existe.',
        error: {}
      });
    }

    // Buscar histórico de moderação
    const { data: moderationHistory } = await supabaseAdmin
      .from('moderation_history')
      .select(`
        id,
        previous_status,
        new_status,
        reason,
        created_at,
        users!inner(username)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    // Renderizar o conteúdo da página
    const bodyContent = await new Promise((resolve, reject) => {
      res.app.render('business/view', {
        title: `${business.name} - Tem Aki Admin`,
        user: req.session.user,
        business,
        moderationHistory: moderationHistory || []
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });

    // Renderizar o layout com o conteúdo
    res.render('layout', {
      title: `${business.name} - Tem Aki Admin`,
      user: req.session.user,
      body: bodyContent
    });

  } catch (error) {
    console.error('Erro ao visualizar negócio:', error.message);
    res.status(500).render('error', {
      title: 'Erro - Tem Aki Admin',
      message: 'Erro ao carregar o negócio.',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Atualizar status do negócio
router.post('/:id/status', requireAuth, async (req, res) => {
  try {
    const businessId = req.params.id;
    const { status, reason } = req.body;
    const userId = req.session.user.id;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Buscar status atual
    const { data: currentBusiness } = await supabaseAdmin
      .from('businesses')
      .select('status')
      .eq('id', businessId)
      .single();

    if (!currentBusiness) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    // Atualizar status
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (updateError) {
      throw updateError;
    }

    // Registrar no histórico de moderação
    const { error: historyError } = await supabaseAdmin
      .from('moderation_history')
      .insert({
        business_id: businessId,
        user_id: userId,
        previous_status: currentBusiness.status,
        new_status: status,
        reason: reason || null
      });

    if (historyError) {
      console.error('Erro ao registrar histórico:', historyError.message);
    }

    // Log da atividade
    await logUserActivity(userId, 'business_status_update', {
      business_id: businessId,
      previous_status: currentBusiness.status,
      new_status: status,
      reason
    }, req.ip);

    res.json({ 
      success: true, 
      message: 'Status atualizado com sucesso',
      newStatus: status
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error.message);
    res.status(500).json({ 
      error: 'Erro ao atualizar status',
      message: error.message 
    });
  }
});

// Upload de imagem
router.post('/:id/upload-image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const businessId = req.params.id;
    const { alt_text, is_primary } = req.body;
    const userId = req.session.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    // Verificar se o negócio existe
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .single();

    if (!business) {
      // Limpar arquivo temporário
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    // Upload para o Supabase Storage
    const fileName = `business-${businessId}-${Date.now()}${path.extname(req.file.originalname)}`;
    const imageUrl = await uploadFile(req.file.path, fileName, 'business-images');

    // Se esta é a imagem primária, remover flag de outras imagens
    if (is_primary === 'true') {
      await supabaseAdmin
        .from('business_images')
        .update({ is_primary: false })
        .eq('business_id', businessId);
    }

    // Salvar informações da imagem no banco
    const { data: imageRecord, error } = await supabaseAdmin
      .from('business_images')
      .insert({
        business_id: businessId,
        image_url: imageUrl,
        alt_text: alt_text || business.name,
        is_primary: is_primary === 'true'
      })
      .select()
      .single();

    if (error) {
      // Se erro ao salvar no banco, tentar deletar do storage
      try {
        await deleteFile(fileName, 'business-images');
      } catch (deleteError) {
        console.error('Erro ao deletar arquivo do storage:', deleteError.message);
      }
      throw error;
    }

    // Limpar arquivo temporário
    fs.unlinkSync(req.file.path);

    // Log da atividade
    await logUserActivity(userId, 'business_image_upload', {
      business_id: businessId,
      image_id: imageRecord.id,
      is_primary: is_primary === 'true'
    }, req.ip);

    res.json({
      success: true,
      message: 'Imagem enviada com sucesso',
      image: imageRecord
    });

  } catch (error) {
    // Limpar arquivo temporário em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Erro ao fazer upload da imagem:', error.message);
    res.status(500).json({ 
      error: 'Erro ao fazer upload da imagem',
      message: error.message 
    });
  }
});

// Deletar imagem
router.delete('/:businessId/images/:imageId', requireAuth, async (req, res) => {
  try {
    const { businessId, imageId } = req.params;
    const userId = req.session.user.id;

    // Buscar informações da imagem
    const { data: image } = await supabaseAdmin
      .from('business_images')
      .select('image_url')
      .eq('id', imageId)
      .eq('business_id', businessId)
      .single();

    if (!image) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    // Deletar do storage
    const fileName = image.image_url.split('/').pop();
    await deleteFile(fileName, 'business-images');

    // Deletar do banco
    const { error } = await supabaseAdmin
      .from('business_images')
      .delete()
      .eq('id', imageId)
      .eq('business_id', businessId);

    if (error) {
      throw error;
    }

    // Log da atividade
    await logUserActivity(userId, 'business_image_delete', {
      business_id: businessId,
      image_id: imageId
    }, req.ip);

    res.json({ 
      success: true, 
      message: 'Imagem deletada com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao deletar imagem:', error.message);
    res.status(500).json({ 
      error: 'Erro ao deletar imagem',
      message: error.message 
    });
  }
});

module.exports = router;