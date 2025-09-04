/**
 * Middleware de Segurança
 * Implementa cabeçalhos de segurança e configurações HTTPS
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

/**
 * Configuração de cabeçalhos de segurança usando Helmet
 */
function setupSecurityHeaders() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "https://fonts.googleapis.com",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net"
        ],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
          "https://www.google-analytics.com",
          "https://www.googletagmanager.com"
        ],
        fontSrc: [
          "'self'", 
          "https://fonts.gstatic.com",
          "https://unpkg.com"
        ],
        imgSrc: [
          "'self'", 
          "data:", 
          "https:",
          "blob:"
        ],
        connectSrc: [
          "'self'",
          "https://api.supabase.co",
          "wss://api.supabase.co",
          "https://www.google-analytics.com"
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"]
      },
      reportOnly: process.env.NODE_ENV === 'development'
    },
    
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true
    },
    
    // X-Frame-Options
    frameguard: {
      action: 'deny'
    },
    
    // X-Content-Type-Options
    noSniff: true,
    
    // X-XSS-Protection
    xssFilter: true,
    
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },
    
    // Hide X-Powered-By
    hidePoweredBy: true,
    
    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false
    },
    
    // Expect-CT
    expectCt: {
      maxAge: 86400,
      enforce: true
    },
    
    // Permissions Policy
    permittedCrossDomainPolicies: false
  });
}

/**
 * Rate Limiting para diferentes endpoints
 */
function setupRateLimiting() {
  // Rate limit geral
  const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests por IP
    message: {
      error: 'Muitas requisições. Tente novamente em alguns minutos.',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Pular rate limiting para health checks
      return req.path === '/health' || req.path === '/metrics';
    }
  });
  
  // Rate limit para login (mais restritivo)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas de login por IP
    message: {
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
  });
  
  // Rate limit para API (moderado)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // 200 requests por IP para API
    message: {
      error: 'Limite de API excedido. Tente novamente em alguns minutos.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  
  return {
    general: generalLimiter,
    login: loginLimiter,
    api: apiLimiter
  };
}

/**
 * Middleware para forçar HTTPS em produção
 */
function forceHTTPS(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    // Verificar se a requisição é HTTPS
    const isHTTPS = req.secure || 
                   req.get('X-Forwarded-Proto') === 'https' ||
                   req.get('X-Forwarded-Ssl') === 'on';
    
    if (!isHTTPS) {
      const httpsUrl = `https://${req.get('Host')}${req.originalUrl}`;
      return res.redirect(301, httpsUrl);
    }
  }
  
  next();
}

/**
 * Middleware para adicionar cabeçalhos de cache
 */
function setupCacheHeaders() {
  return (req, res, next) => {
    // Cache para arquivos estáticos
    if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      const maxAge = process.env.STATIC_CACHE_MAX_AGE || 31536000; // 1 ano
      res.set('Cache-Control', `public, max-age=${maxAge}, immutable`);
    }
    // Cache para API
    else if (req.path.startsWith('/api/')) {
      const maxAge = process.env.API_CACHE_MAX_AGE || 300; // 5 minutos
      res.set('Cache-Control', `public, max-age=${maxAge}`);
    }
    // Sem cache para páginas dinâmicas
    else {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
    
    next();
  };
}

/**
 * Middleware para compressão
 */
function setupCompression() {
  return compression({
    level: parseInt(process.env.COMPRESSION_LEVEL || '6'),
    threshold: 1024, // Comprimir apenas arquivos > 1KB
    filter: (req, res) => {
      // Não comprimir se o cliente não suporta
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Usar filtro padrão do compression
      return compression.filter(req, res);
    }
  });
}

/**
 * Middleware para logging de segurança
 */
function securityLogger(req, res, next) {
  // Log de tentativas suspeitas
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /vbscript:/i, // VBScript injection
    /onload=/i, // Event handler injection
    /onerror=/i // Event handler injection
  ];
  
  const userAgent = req.get('User-Agent') || '';
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Verificar padrões suspeitos na URL
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      console.warn(`[SECURITY] Tentativa suspeita detectada:`, {
        ip,
        userAgent,
        url,
        pattern: pattern.toString(),
        timestamp: new Date().toISOString()
      });
      break;
    }
  }
  
  // Log de User-Agents suspeitos
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i,
    /nmap/i,
    /masscan/i
  ];
  
  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(userAgent)) {
      console.warn(`[SECURITY] User-Agent suspeito detectado:`, {
        ip,
        userAgent,
        url,
        timestamp: new Date().toISOString()
      });
      break;
    }
  }
  
  next();
}

/**
 * Middleware para validação de origem
 */
function validateOrigin(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim());
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    
    // Verificar Origin header para requisições CORS
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`[SECURITY] Origin não permitida: ${origin} de IP: ${req.ip}`);
      return res.status(403).json({ error: 'Origin não permitida' });
    }
    
    // Verificar Referer para formulários
    if (req.method === 'POST' && referer) {
      const refererHost = new URL(referer).hostname;
      const allowedHosts = allowedOrigins.map(o => new URL(o).hostname);
      
      if (!allowedHosts.includes(refererHost)) {
        console.warn(`[SECURITY] Referer suspeito: ${referer} de IP: ${req.ip}`);
        return res.status(403).json({ error: 'Referer inválido' });
      }
    }
  }
  
  next();
}

/**
 * Middleware para health check seguro
 */
function secureHealthCheck(req, res, next) {
  if (req.path === '/health') {
    // Verificar se é uma requisição interna ou de monitoramento
    const allowedIPs = [
      '127.0.0.1',
      '::1',
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16'
    ];
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Simplificado: permitir localhost e IPs privados
    if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('10.') || 
        clientIP.startsWith('172.') || clientIP.startsWith('192.168.')) {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.DEPLOY_VERSION || '1.0.0'
      });
    }
    
    // Para IPs externos, retornar apenas status básico
    return res.status(200).text('OK');
  }
  
  next();
}

module.exports = {
  setupSecurityHeaders,
  setupRateLimiting,
  forceHTTPS,
  setupCacheHeaders,
  setupCompression,
  securityLogger,
  validateOrigin,
  secureHealthCheck
};