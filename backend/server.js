const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configurações de segurança com Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compressão para produção
if (NODE_ENV === 'production') {
  app.use(compression());
}

// Logging
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite de requests por IP
  message: {
    error: 'Muitas tentativas. Tente novamente em alguns minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configurado
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : 
      ['http://localhost:8081', 'http://localhost:3001'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Configurar codificacao UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Body parsing com limites configuráveis
const maxFileSize = process.env.MAX_FILE_SIZE || '10mb';
app.use(express.json({ limit: maxFileSize }));
app.use(express.urlencoded({ extended: true, limit: maxFileSize }));

// Dados mock para desenvolvimento
const mockBusinesses = [
  {
    id: 1,
    name: 'Padaria do Joao',
    category: 'Alimentacao e Bebidas',
    subcategory: 'Padaria',
    description: 'Padaria tradicional com paes frescos todos os dias',
    address: 'Rua das Flores, 123',
    phone: '(11) 99999-9999',
    latitude: -23.5505,
    longitude: -46.6333,
    rating: 4.5,
    image: 'https://via.placeholder.com/300x200?text=Padaria+do+Joao',
    isOpen: true,
    openingHours: '06:00 - 20:00'
  },
  {
    id: 2,
    name: 'Oficina do Carlos',
    category: 'Servicos',
    subcategory: 'Mecanica',
    description: 'Oficina mecanica especializada em carros nacionais',
    address: 'Av. Principal, 456',
    phone: '(11) 88888-8888',
    latitude: -23.5515,
    longitude: -46.6343,
    rating: 4.2,
    image: 'https://via.placeholder.com/300x200?text=Oficina+do+Carlos',
    isOpen: true,
    openingHours: '08:00 - 18:00'
  },
  {
    id: 3,
    name: 'Mercadinho da Maria',
    category: 'Comercio',
    subcategory: 'Supermercado',
    description: 'Mercadinho de bairro com produtos frescos e precos justos',
    address: 'Rua do Comercio, 789',
    phone: '(11) 77777-7777',
    latitude: -23.5525,
    longitude: -46.6353,
    rating: 4.8,
    image: 'https://via.placeholder.com/300x200?text=Mercadinho+da+Maria',
    isOpen: false,
    openingHours: '07:00 - 22:00'
  },
  {
    id: 4,
    name: 'Igreja Sao Jose',
    category: 'Instituicoes Religiosas',
    subcategory: 'Igreja Catolica',
    description: 'Igreja catolica tradicional do bairro com missas diarias',
    address: 'Praca da Igreja, 100',
    phone: '(11) 66666-6666',
    latitude: -23.5535,
    longitude: -46.6363,
    rating: 4.9,
    image: 'https://via.placeholder.com/300x200?text=Igreja+Sao+Jose',
    isOpen: true,
    openingHours: '06:00 - 20:00'
  },
  {
    id: 5,
    name: 'Igreja Batista Esperanca',
    category: 'Instituicoes Religiosas',
    subcategory: 'Igreja Batista',
    description: 'Igreja batista com cultos aos domingos e quartas-feiras',
    address: 'Rua da Esperanca, 250',
    phone: '(11) 55555-5555',
    latitude: -23.5545,
    longitude: -46.6373,
    rating: 4.7,
    image: 'https://via.placeholder.com/300x200?text=Igreja+Batista+Esperanca',
    isOpen: true,
    openingHours: '08:00 - 22:00'
  },
  {
    id: 6,
    name: 'Escola Municipal Santos Dumont',
    category: 'Escolas',
    subcategory: 'Escolas Publicas',
    description: 'Escola municipal de ensino fundamental com excelente infraestrutura',
    address: 'Rua da Educacao, 300',
    phone: '(11) 44444-4444',
    latitude: -23.5555,
    longitude: -46.6383,
    rating: 4.6,
    image: 'https://via.placeholder.com/300x200?text=Escola+Santos+Dumont',
    isOpen: true,
    openingHours: '07:00 - 17:00'
  },
  {
    id: 7,
    name: 'Colegio Particular Sao Francisco',
    category: 'Escolas',
    subcategory: 'Escolas Particulares',
    description: 'Colegio particular com ensino de qualidade do infantil ao medio',
    address: 'Av. Educacao Privada, 150',
    phone: '(11) 33333-3333',
    latitude: -23.5565,
    longitude: -46.6393,
    rating: 4.8,
    image: 'https://via.placeholder.com/300x200?text=Colegio+Sao+Francisco',
    isOpen: true,
    openingHours: '07:00 - 18:00'
  },
  {
    id: 8,
    name: 'Escola Comunitaria Esperanca',
    category: 'Escolas',
    subcategory: 'Escolas Comunitarias',
    description: 'Escola comunitaria mantida pela comunidade local',
    address: 'Rua da Comunidade, 50',
    phone: '(11) 22222-2222',
    latitude: -23.5575,
    longitude: -46.6403,
    rating: 4.7,
    image: 'https://via.placeholder.com/300x200?text=Escola+Esperanca',
    isOpen: true,
    openingHours: '07:00 - 17:00'
  },
  {
    id: 9,
    name: 'Prefeitura Municipal',
    category: 'Instituicoes Publicas',
    subcategory: 'Prefeitura',
    description: 'Sede da administracao municipal com diversos servicos publicos',
    address: 'Praca Central, 1',
    phone: '(11) 3456-7890',
    latitude: -23.5585,
    longitude: -46.6413,
    rating: 4.2,
    image: 'https://via.placeholder.com/300x200?text=Prefeitura+Municipal',
    isOpen: true,
    openingHours: '08:00 - 17:00'
  },
  {
    id: 10,
    name: 'Cartorio de Registro Civil',
    category: 'Instituicoes Publicas',
    subcategory: 'Cartorio',
    description: 'Cartorio para registro de nascimento, casamento e obito',
    address: 'Rua dos Documentos, 123',
    phone: '(11) 2345-6789',
    latitude: -23.5595,
    longitude: -46.6423,
    rating: 4.0,
    image: 'https://via.placeholder.com/300x200?text=Cartorio+Civil',
    isOpen: true,
    openingHours: '09:00 - 16:00'
  },
  {
    id: 11,
    name: 'Posto de Saude Central',
    category: 'Instituicoes Publicas',
    subcategory: 'Posto de Saude',
    description: 'Unidade basica de saude com atendimento medico gratuito',
    address: 'Av. da Saude, 456',
    phone: '(11) 1234-5678',
    latitude: -23.5605,
    longitude: -46.6433,
    rating: 4.3,
    image: 'https://via.placeholder.com/300x200?text=Posto+Saude',
    isOpen: true,
    openingHours: '07:00 - 19:00'
  }
];

const mockCategories = [
  {
    id: 1,
    name: 'Alimentacao e Bebidas',
    icon: 'restaurant',
    subcategories: ['Restaurante', 'Padaria', 'Lanchonete', 'Bar', 'Cafeteria']
  },
  {
    id: 2,
    name: 'Servicos',
    icon: 'build',
    subcategories: ['Mecanica', 'Eletrica', 'Encanamento', 'Limpeza', 'Beleza']
  },
  {
    id: 3,
    name: 'Comercio',
    icon: 'shopping-bag',
    subcategories: ['Supermercado', 'Farmacia', 'Roupas', 'Eletronicos', 'Casa e Jardim']
  },
  {
    id: 4,
    name: 'Saude',
    icon: 'medical',
    subcategories: ['Clinica', 'Dentista', 'Veterinario', 'Fisioterapia']
  },
  {
    id: 5,
    name: 'Escolas',
    icon: 'school',
    subcategories: ['Escolas Publicas', 'Escolas Particulares', 'Escolas Comunitarias']
  },
  {
    id: 6,
    name: 'Instituicoes Religiosas',
    icon: 'church',
    subcategories: ['Igreja Catolica', 'Igreja Batista', 'Igreja Evangelica', 'Centro Espirita', 'Templo']
  },
  {
    id: 7,
    name: 'Instituicoes Publicas',
    icon: 'business',
    subcategories: ['Prefeitura', 'Cartorio', 'Posto de Saude', 'Delegacia', 'Correios']
  }
];

// Rotas da API

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor Tem Aki no Bairro funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Listar todas as categorias
app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    data: mockCategories,
    total: mockCategories.length
  });
});

// Listar negocios
app.get('/api/businesses', (req, res) => {
  const { category, subcategory, search, latitude, longitude, radius } = req.query;
  let filteredBusinesses = [...mockBusinesses];

  // Filtrar por categoria
  if (category) {
    filteredBusinesses = filteredBusinesses.filter(business => 
      business.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Filtrar por subcategoria
  if (subcategory) {
    filteredBusinesses = filteredBusinesses.filter(business => 
      business.subcategory && business.subcategory.toLowerCase().includes(subcategory.toLowerCase())
    );
  }

  // Filtrar por busca
  if (search) {
    filteredBusinesses = filteredBusinesses.filter(business => 
      business.name.toLowerCase().includes(search.toLowerCase()) ||
      business.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Simular filtro por localizacao (simplificado)
  if (latitude && longitude && radius) {
    // Em uma implementacao real, calcularia a distancia real
    console.log(`Filtro por localizacao: lat=${latitude}, lng=${longitude}, radius=${radius}m`);
  }

  res.json({
    success: true,
    data: filteredBusinesses,
    total: filteredBusinesses.length,
    filters: { category, subcategory, search }
  });
});

// Rota especifica para busca de negocios
app.get('/api/businesses/search', (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Parametro de busca e obrigatorio'
    });
  }

  const searchTerm = q.toLowerCase().trim();
  const filteredBusinesses = mockBusinesses.filter(business => 
    business.name.toLowerCase().includes(searchTerm) ||
    business.description.toLowerCase().includes(searchTerm) ||
    business.category.toLowerCase().includes(searchTerm) ||
    (business.subcategory && business.subcategory.toLowerCase().includes(searchTerm))
  );

  if (filteredBusinesses.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Negocio nao encontrado'
    });
  }

  res.json({
    success: true,
    data: filteredBusinesses,
    total: filteredBusinesses.length,
    query: q
  });
});

// Obter negocios por categoria
app.get('/api/businesses/category/:category', (req, res) => {
  const { category } = req.params;
  
  // Mapear IDs para nomes de categorias
  const categoryMap = {
    '1': 'Alimentacao e Bebidas',
    '2': 'Servicos', 
    '3': 'Comercio',
    '4': 'Saude',
    '5': 'Educacao',
    '6': 'Instituicoes Religiosas',
    '7': 'Instituicoes Publicas'
  };
  
  // Determinar o nome da categoria (se for ID, converter para nome)
  const categoryName = categoryMap[category] || category;
  
  const filteredBusinesses = mockBusinesses.filter(business => {
    if (!business.category) return false;
    
    // Normalizar strings removendo acentos e caracteres especiais
    const normalizeString = (str) => {
      return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
    };
    
    const businessCategory = normalizeString(business.category);
    const searchCategory = normalizeString(categoryName);
    
    return businessCategory.includes(searchCategory) || searchCategory.includes(businessCategory);
  });

  res.json({
    success: true,
    data: filteredBusinesses,
    total: filteredBusinesses.length,
    filters: { category: categoryName }
  });
});

// Obter negocios por subcategoria
app.get('/api/businesses/subcategory/:subcategory', (req, res) => {
  const { subcategory } = req.params;
  
  // Filtrar negocios pela subcategoria
  const filteredBusinesses = mockBusinesses.filter(business => 
    business.subcategory && business.subcategory.toLowerCase() === subcategory.toLowerCase()
  );

  res.json({
    success: true,
    data: filteredBusinesses,
    total: filteredBusinesses.length,
    filters: { subcategory }
  });
});

// Obter negocio por ID
app.get('/api/businesses/:id', (req, res) => {
  const { id } = req.params;
  const business = mockBusinesses.find(b => b.id === parseInt(id));
  
  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Negocio nao encontrado'
    });
  }

  res.json({
    success: true,
    data: business
  });
});

// Criar novo negocio
app.post('/api/businesses', (req, res) => {
  // Encontrar a categoria baseada no category_id
  const category = mockCategories.find(cat => cat.id === req.body.category_id);
  
  const newBusiness = {
    id: mockBusinesses.length + 1,
    ...req.body,
    category: category ? category.name : null,
    rating: 0,
    isOpen: true
  };
  
  mockBusinesses.push(newBusiness);
  
  res.status(201).json({
    success: true,
    data: newBusiness,
    message: 'Negocio criado com sucesso!'
  });
});

// Atualizar negocio
app.put('/api/businesses/:id', (req, res) => {
  const { id } = req.params;
  const businessIndex = mockBusinesses.findIndex(b => b.id === parseInt(id));
  
  if (businessIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Negocio nao encontrado'
    });
  }

  mockBusinesses[businessIndex] = {
    ...mockBusinesses[businessIndex],
    ...req.body
  };
  
  res.json({
    success: true,
    data: mockBusinesses[businessIndex],
    message: 'Negocio atualizado com sucesso!'
  });
});

// Deletar negocio
app.delete('/api/businesses/:id', (req, res) => {
  const { id } = req.params;
  const businessIndex = mockBusinesses.findIndex(b => b.id === parseInt(id));
  
  if (businessIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'negocio nao encontrado'
    });
  }

  mockBusinesses.splice(businessIndex, 1);
  
  res.json({
    success: true,
    message: 'Negocio removido com sucesso!'
  });
});

// Rotas para autenticacao (mock)
app.post('/api/auth/login', (req, res) => {
  const { email, password, username } = req.body;
  
  // Aceita tanto email quanto username para compatibilidade
  const loginField = email || username;
  
  // Validacao simples para desenvolvimento
  if ((loginField === 'admin@temakinobairro.com' || loginField === 'admin') && (password === '123456' || password === 'admin123')) {
    res.json({
      success: true,
      data: {
        token: 'mock-jwt-token-12345',
        user: {
          id: 1,
          name: 'Administrador',
          email: 'admin@temakinobairro.com',
          username: 'admin',
          role: 'admin'
        }
      },
      message: 'Login realizado com sucesso!'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciais invalidas'
    });
  }
});

// Verificar token (mock)
app.post('/api/auth/verify', (req, res) => {
  const { token } = req.body;
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  
  const receivedToken = token || tokenFromHeader;
  
  if (receivedToken === 'mock-jwt-token-12345') {
    res.json({
      success: true,
      data: {
        user: {
          id: 1,
          name: 'Administrador',
          email: 'admin@temakinobairro.com',
          username: 'admin',
          role: 'admin'
        }
      },
      message: 'Token valido'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Token invalido ou expirado'
    });
  }
});

// Logout (mock)
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso!'
  });
});

// Middleware para rotas nao encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota nao encontrada',
    availableRoutes: [
      'GET /api/health',
      'GET /api/categories',
      'GET /api/businesses',
      'GET /api/businesses/:id',
      'POST /api/businesses',
      'PUT /api/businesses/:id',
      'DELETE /api/businesses/:id',
      'POST /api/auth/login',
      'POST /api/auth/verify',
      'POST /api/auth/logout'
    ]
  });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ========================================');
  console.log(`🚀 Servidor Tem Aki no Bairro iniciado!`);
  console.log(`🚀 Porta: ${PORT}`);
  console.log(`🚀 URL Local: http://localhost:${PORT}`);
  console.log(`🚀 URL Rede: http://192.168.3.195:${PORT}`);
  console.log(`🚀 API Local: http://localhost:${PORT}/api`);
  console.log(`🚀 API Rede: http://192.168.3.195:${PORT}/api`);
  console.log(`🚀 Health: http://192.168.3.195:${PORT}/api/health`);
  console.log('🚀 ========================================');
  console.log('📍 Rotas disponiveis:');
  console.log('   GET  /api/health');
  console.log('   GET  /api/categories');
  console.log('   GET  /api/businesses');
  console.log('   GET  /api/businesses/:id');
  console.log('   POST /api/businesses');
  console.log('   PUT  /api/businesses/:id');
  console.log('   DELETE /api/businesses/:id');
  console.log('   POST /api/auth/login');
  console.log('   POST /api/auth/verify');
  console.log('   POST /api/auth/logout');
  console.log('🚀 ========================================');
  console.log('🚀 Servidor configurado para aceitar conexoes de qualquer IP');
  console.log('🚀 ========================================');
});

module.exports = app;
