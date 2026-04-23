const express = require('express');
const jwt = require('jsonwebtoken');
const { supabaseService, supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Middleware para validar JSON
router.use(express.json());

const looksLikeUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'sim', 'y', 'on'].includes(v)) return true;
    if (['false', '0', 'no', 'nao', 'não', 'n', 'off'].includes(v)) return false;
  }
  return null;
};

const normalizeBusinessPayload = (payload) => {
  const raw = payload && typeof payload === 'object' ? payload : {};

  const out = {};
  const copyIf = (key, value) => {
    if (value === undefined) return;
    out[key] = value;
  };

  const categoryId = raw.category_id ?? raw.categoryId ?? (looksLikeUuid(raw.category) ? raw.category : undefined);
  const subcategoryId = raw.subcategory_id ?? raw.subcategoryId ?? (looksLikeUuid(raw.subcategory) ? raw.subcategory : undefined);

  copyIf('name', raw.name);
  copyIf('description', raw.description);
  copyIf('category_id', categoryId);
  copyIf('subcategory_id', subcategoryId);
  copyIf('phone', raw.phone);
  copyIf('whatsapp', raw.whatsapp);
  copyIf('email', raw.email);
  copyIf('website', raw.website);
  copyIf('instagram', raw.instagram);
  copyIf('facebook', raw.facebook);
  copyIf('address', raw.address);
  copyIf('neighborhood', raw.neighborhood);
  copyIf('city', raw.city);
  copyIf('state', raw.state);

  const zip = raw.zip_code ?? raw.zipCode;
  copyIf('zip_code', zip);

  copyIf('latitude', raw.latitude);
  copyIf('longitude', raw.longitude);

  const openingHours = raw.opening_hours ?? raw.openingHours;
  if (openingHours !== undefined) {
    if (typeof openingHours === 'string') {
      const trimmed = openingHours.trim();
      if (!trimmed) {
        copyIf('opening_hours', null);
      } else {
        try {
          copyIf('opening_hours', JSON.parse(trimmed));
        } catch {
          copyIf('opening_hours', { description: trimmed });
        }
      }
    } else {
      copyIf('opening_hours', openingHours);
    }
  }

  const delivery = toBoolean(raw.delivery);
  if (delivery !== null) copyIf('delivery', delivery);
  const takeout = toBoolean(raw.takeout);
  if (takeout !== null) copyIf('takeout', takeout);
  const dineIn = toBoolean(raw.dine_in ?? raw.dineIn);
  if (dineIn !== null) copyIf('dine_in', dineIn);

  copyIf('image_url', raw.image_url ?? raw.imageUrl);
  copyIf('logo_url', raw.logo_url ?? raw.logoUrl);
  copyIf('status', raw.status);

  const featured = toBoolean(raw.featured);
  if (featured !== null) copyIf('featured', featured);

  if (raw.city_state && typeof raw.city_state === 'string') {
    const cityStateParts = raw.city_state.split('/');
    if (cityStateParts.length === 2) {
      out.city = out.city ?? cityStateParts[0].trim();
      out.state = out.state ?? cityStateParts[1].trim();
    }
  }

  if (raw.cityState && typeof raw.cityState === 'string') {
    const cityStateParts = raw.cityState.split('/');
    if (cityStateParts.length === 2) {
      out.city = out.city ?? cityStateParts[0].trim();
      out.state = out.state ?? cityStateParts[1].trim();
    }
  }

  return out;
};

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

// Listar todos os negócios
router.get('/', async (req, res) => {
  try {
    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar negócios:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar negócios'
      });
    }

    res.json({
      success: true,
      data: businesses || []
    });

  } catch (error) {
    console.error('Erro na API de negócios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar negócios por categoria
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar negócios por categoria:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar negócios'
      });
    }

    res.json({
      success: true,
      data: businesses || []
    });

  } catch (error) {
    console.error('Erro na API de negócios por categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar negócios por subcategoria
router.get('/subcategory/:subcategory', async (req, res) => {
  try {
    const { subcategory } = req.params;

    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('subcategory', subcategory)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar negócios por subcategoria:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar negócios'
      });
    }

    res.json({
      success: true,
      data: businesses || []
    });

  } catch (error) {
    console.error('Erro na API de negócios por subcategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar negócios
router.get('/search', async (req, res) => {
  try {
    const { q, category, subcategory } = req.query;

    let query = supabaseAdmin.from('businesses').select('*');

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    const { data: businesses, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar negócios:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar negócios'
      });
    }

    res.json({
      success: true,
      data: businesses || []
    });

  } catch (error) {
    console.error('Erro na busca de negócios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Criar novo negócio (requer autenticação)
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Dados recebidos na API:', JSON.stringify(req.body, null, 2));
    
    const businessData = {
      ...normalizeBusinessPayload(req.body),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Dados preparados para inserção:', JSON.stringify(businessData, null, 2));

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .insert(businessData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar negócio:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar negócio'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Negócio criado com sucesso',
      data: business
    });

  } catch (error) {
    console.error('Erro na criação de negócio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar negócio (requer autenticação)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const businessData = {
      ...normalizeBusinessPayload(req.body),
      updated_at: new Date().toISOString()
    };

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .update(businessData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar negócio:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar negócio'
      });
    }

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Negócio não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Negócio atualizado com sucesso',
      data: business
    });

  } catch (error) {
    console.error('Erro na atualização de negócio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar negócio (requer autenticação)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar negócio:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar negócio'
      });
    }

    res.json({
      success: true,
      message: 'Negócio deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro na deleção de negócio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
