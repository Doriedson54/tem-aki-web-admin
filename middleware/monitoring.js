/**
 * Middleware de Monitoramento e Performance
 * Coleta métricas, logs e monitora a saúde da aplicação
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');

// Métricas em memória
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byMethod: {},
    byRoute: {},
    byStatusCode: {}
  },
  performance: {
    responseTime: [],
    memoryUsage: [],
    cpuUsage: []
  },
  errors: [],
  uptime: Date.now()
};

/**
 * Middleware para coleta de métricas de requisições
 */
function requestMetrics(req, res, next) {
  const startTime = Date.now();
  
  // Incrementar contador total
  metrics.requests.total++;
  
  // Contar por método
  metrics.requests.byMethod[req.method] = (metrics.requests.byMethod[req.method] || 0) + 1;
  
  // Contar por rota (simplificado)
  const route = req.route ? req.route.path : req.path;
  metrics.requests.byRoute[route] = (metrics.requests.byRoute[route] || 0) + 1;
  
  // Interceptar o final da resposta
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Registrar tempo de resposta
    metrics.performance.responseTime.push({
      timestamp: endTime,
      duration: responseTime,
      method: req.method,
      route: route,
      statusCode: res.statusCode
    });
    
    // Manter apenas os últimos 1000 registros
    if (metrics.performance.responseTime.length > 1000) {
      metrics.performance.responseTime = metrics.performance.responseTime.slice(-1000);
    }
    
    // Contar por status code
    metrics.requests.byStatusCode[res.statusCode] = (metrics.requests.byStatusCode[res.statusCode] || 0) + 1;
    
    // Contar sucessos e erros
    if (res.statusCode >= 200 && res.statusCode < 400) {
      metrics.requests.success++;
    } else {
      metrics.requests.errors++;
    }
    
    // Log de requisições lentas (> 1 segundo)
    if (responseTime > 1000) {
      console.warn(`[PERFORMANCE] Requisição lenta detectada:`, {
        method: req.method,
        route: route,
        duration: responseTime,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date(endTime).toISOString()
      });
    }
    
    // Adicionar headers de performance
    res.set('X-Response-Time', `${responseTime}ms`);
    res.set('X-Request-ID', req.id || 'unknown');
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Middleware para logging estruturado
 */
function structuredLogging(req, res, next) {
  // Gerar ID único para a requisição
  req.id = generateRequestId();
  
  // Log da requisição
  const requestLog = {
    id: req.id,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentLength: req.get('Content-Length'),
    sessionId: req.session?.id
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[REQUEST] ${req.method} ${req.originalUrl}`, requestLog);
  }
  
  // Interceptar erros
  const originalNext = next;
  next = function(error) {
    if (error) {
      const errorLog = {
        id: req.id,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
          status: error.status
        },
        request: requestLog
      };
      
      // Adicionar ao array de erros
      metrics.errors.push(errorLog);
      
      // Manter apenas os últimos 100 erros
      if (metrics.errors.length > 100) {
        metrics.errors = metrics.errors.slice(-100);
      }
      
      console.error(`[ERROR] ${error.message}`, errorLog);
    }
    
    return originalNext(error);
  };
  
  next();
}

/**
 * Coletor de métricas do sistema
 */
function collectSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  const systemMetrics = {
    timestamp: Date.now(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      uptime: os.uptime()
    },
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      version: process.version,
      platform: process.platform
    }
  };
  
  metrics.performance.memoryUsage.push(systemMetrics);
  
  // Manter apenas os últimos 100 registros
  if (metrics.performance.memoryUsage.length > 100) {
    metrics.performance.memoryUsage = metrics.performance.memoryUsage.slice(-100);
  }
  
  // Alertas de memória
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  if (memoryUsagePercent > 90) {
    console.warn(`[MEMORY] Alto uso de memória detectado: ${memoryUsagePercent.toFixed(1)}%`);
  }
  
  // Alertas de CPU (simplificado)
  const loadAverage = os.loadavg()[0];
  const cpuCount = os.cpus().length;
  const cpuUsagePercent = (loadAverage / cpuCount) * 100;
  
  if (cpuUsagePercent > 80) {
    console.warn(`[CPU] Alto uso de CPU detectado: ${cpuUsagePercent.toFixed(1)}%`);
  }
}

/**
 * Endpoint de métricas para Prometheus/Grafana
 */
function metricsEndpoint(req, res) {
  const now = Date.now();
  const uptime = Math.floor((now - metrics.uptime) / 1000);
  
  // Calcular estatísticas de tempo de resposta
  const responseTimes = metrics.performance.responseTime.map(r => r.duration);
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  
  const p95ResponseTime = responseTimes.length > 0 
    ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)] 
    : 0;
  
  // Formato Prometheus
  const prometheusMetrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.requests.total}

# HELP http_requests_success_total Total number of successful HTTP requests
# TYPE http_requests_success_total counter
http_requests_success_total ${metrics.requests.success}

# HELP http_requests_errors_total Total number of HTTP request errors
# TYPE http_requests_errors_total counter
http_requests_errors_total ${metrics.requests.errors}

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_avg ${avgResponseTime / 1000}
http_request_duration_seconds_p95 ${p95ResponseTime / 1000}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${uptime}

# HELP nodejs_memory_heap_used_bytes Node.js heap memory used
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes ${process.memoryUsage().heapUsed}

# HELP nodejs_memory_heap_total_bytes Node.js heap memory total
# TYPE nodejs_memory_heap_total_bytes gauge
nodejs_memory_heap_total_bytes ${process.memoryUsage().heapTotal}
`;
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics.trim());
}

/**
 * Endpoint de health check detalhado
 */
function healthCheckEndpoint(req, res) {
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.DEPLOY_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: {
      usage: memoryUsage,
      usagePercent: memoryUsagePercent
    },
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      errors: metrics.requests.errors,
      errorRate: metrics.requests.total > 0 
        ? (metrics.requests.errors / metrics.requests.total * 100).toFixed(2) + '%'
        : '0%'
    },
    performance: {
      avgResponseTime: metrics.performance.responseTime.length > 0
        ? (metrics.performance.responseTime.reduce((a, b) => a + b.duration, 0) / metrics.performance.responseTime.length).toFixed(2) + 'ms'
        : '0ms'
    }
  };
  
  // Determinar status baseado em métricas
  if (memoryUsagePercent > 95) {
    health.status = 'critical';
    health.issues = health.issues || [];
    health.issues.push('High memory usage');
  } else if (memoryUsagePercent > 85) {
    health.status = 'warning';
    health.issues = health.issues || [];
    health.issues.push('Elevated memory usage');
  }
  
  const errorRate = metrics.requests.total > 0 
    ? (metrics.requests.errors / metrics.requests.total * 100)
    : 0;
  
  if (errorRate > 10) {
    health.status = 'critical';
    health.issues = health.issues || [];
    health.issues.push('High error rate');
  } else if (errorRate > 5) {
    health.status = 'warning';
    health.issues = health.issues || [];
    health.issues.push('Elevated error rate');
  }
  
  const statusCode = health.status === 'healthy' ? 200 
    : health.status === 'warning' ? 200 
    : 503;
  
  res.status(statusCode).json(health);
}

/**
 * Salvar métricas em arquivo (para persistência)
 */
async function saveMetricsToFile() {
  try {
    const metricsData = {
      timestamp: new Date().toISOString(),
      metrics: {
        requests: metrics.requests,
        errors: metrics.errors.slice(-10), // Apenas os últimos 10 erros
        performance: {
          responseTime: metrics.performance.responseTime.slice(-100), // Últimos 100
          memoryUsage: metrics.performance.memoryUsage.slice(-10) // Últimos 10
        }
      }
    };
    
    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const filename = `metrics-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(logsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(metricsData, null, 2));
  } catch (error) {
    console.error('[MONITORING] Erro ao salvar métricas:', error.message);
  }
}

/**
 * Gerar ID único para requisição
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Inicializar monitoramento
 */
function initializeMonitoring() {
  // Coletar métricas do sistema a cada 30 segundos
  setInterval(collectSystemMetrics, 30000);
  
  // Salvar métricas a cada 5 minutos
  setInterval(saveMetricsToFile, 5 * 60 * 1000);
  
  // Log inicial
  console.log('[MONITORING] Sistema de monitoramento inicializado');
}

/**
 * Obter métricas atuais
 */
function getCurrentMetrics() {
  return {
    ...metrics,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - metrics.uptime) / 1000)
  };
}

module.exports = {
  requestMetrics,
  structuredLogging,
  metricsEndpoint,
  healthCheckEndpoint,
  initializeMonitoring,
  getCurrentMetrics,
  collectSystemMetrics,
  saveMetricsToFile
};