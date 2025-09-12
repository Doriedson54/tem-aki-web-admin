#!/usr/bin/env node
/**
 * Script de Configuração de Monitoramento - Tem Aki Institucional
 * Configura monitoramento, logs e alertas para ambiente de produção
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Interface para entrada do usuário
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Função para fazer perguntas
function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

// Função para log colorido
function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        warning: '\x1b[33m', // Yellow
        error: '\x1b[31m',   // Red
        reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

// Função para criar diretórios
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        log(`Diretório criado: ${dirPath}`, 'success');
    }
}

// Função para escrever arquivo
function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`Arquivo criado: ${filePath}`, 'success');
}

// Configuração do Logrotate (Linux)
function createLogrotateConfig() {
    const logrotateConfig = `# Configuração do Logrotate para Tem Aki Institucional
/var/log/tem-aki-institucional/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reload tem-aki-institucional
    endscript
}

# Logs do PM2
/home/*/.pm2/logs/*.log {
    daily
    missingok
    rotate 15
    compress
    delaycompress
    notifempty
    copytruncate
}`;
    
    return logrotateConfig;
}

// Configuração do Winston Logger
function createWinstonConfig() {
    const winstonConfig = `const winston = require('winston');
const path = require('path');

// Configuração de níveis customizados
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'blue'
    }
};

// Adicionar cores
winston.addColors(customLevels.colors);

// Formato customizado
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Formato para console
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return \`\${timestamp} [\${level}]: \${stack || message}\`;
    })
);

// Configuração dos transportes
const transports = [
    // Console (apenas em desenvolvimento)
    new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        format: consoleFormat
    }),
    
    // Arquivo de erro
    new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        format: customFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10
    }),
    
    // Arquivo combinado
    new winston.transports.File({
        filename: path.join('logs', 'combined.log'),
        format: customFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 15
    }),
    
    // Arquivo de acesso HTTP
    new winston.transports.File({
        filename: path.join('logs', 'access.log'),
        level: 'http',
        format: customFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 20
    })
];

// Criar logger
const logger = winston.createLogger({
    levels: customLevels.levels,
    format: customFormat,
    transports,
    exitOnError: false
});

// Stream para Morgan
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

// Função para log de performance
logger.performance = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: \`\${responseTime}ms\`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
    };
    
    if (responseTime > 1000) {
        logger.warn('Slow request detected', logData);
    } else {
        logger.http('Request completed', logData);
    }
};

// Função para log de segurança
logger.security = (event, details) => {
    logger.warn('Security event', {
        event,
        details,
        timestamp: new Date().toISOString()
    });
};

// Função para log de sistema
logger.system = (metric, value, unit = '') => {
    logger.info('System metric', {
        metric,
        value,
        unit,
        timestamp: new Date().toISOString()
    });
};

module.exports = logger;`;
    
    return winstonConfig;
}

// Configuração do Health Check
function createHealthCheckConfig() {
    const healthCheckConfig = `const os = require('os');
const fs = require('fs');
const { promisify } = require('util');
const logger = require('./winston.config');

class HealthChecker {
    constructor() {
        this.checks = new Map();
        this.setupDefaultChecks();
    }
    
    // Configurar verificações padrão
    setupDefaultChecks() {
        this.addCheck('memory', this.checkMemory.bind(this));
        this.addCheck('disk', this.checkDisk.bind(this));
        this.addCheck('database', this.checkDatabase.bind(this));
        this.addCheck('external_apis', this.checkExternalAPIs.bind(this));
    }
    
    // Adicionar verificação customizada
    addCheck(name, checkFunction) {
        this.checks.set(name, checkFunction);
    }
    
    // Verificar memória
    async checkMemory() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsage = (usedMem / totalMem) * 100;
        
        return {
            status: memoryUsage < 90 ? 'healthy' : 'warning',
            details: {
                total: \`\${Math.round(totalMem / 1024 / 1024 / 1024)}GB\`,
                used: \`\${Math.round(usedMem / 1024 / 1024 / 1024)}GB\`,
                free: \`\${Math.round(freeMem / 1024 / 1024 / 1024)}GB\`,
                usage: \`\${memoryUsage.toFixed(2)}%\`
            }
        };
    }
    
    // Verificar disco
    async checkDisk() {
        try {
            const stats = await promisify(fs.statvfs || fs.stat)('.');
            // Implementação simplificada para Windows
            return {
                status: 'healthy',
                details: {
                    message: 'Disk check available on Linux systems'
                }
            };
        } catch (error) {
            return {
                status: 'error',
                details: { error: error.message }
            };
        }
    }
    
    // Verificar banco de dados
    async checkDatabase() {
        try {
            // Verificar conexão com Supabase
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
            );
            
            const { data, error } = await supabase
                .from('estabelecimentos')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            
            return {
                status: 'healthy',
                details: { connection: 'active' }
            };
        } catch (error) {
            return {
                status: 'error',
                details: { error: error.message }
            };
        }
    }
    
    // Verificar APIs externas
    async checkExternalAPIs() {
        const apis = [
            { name: 'Supabase', url: process.env.SUPABASE_URL },
            // Adicionar outras APIs conforme necessário
        ];
        
        const results = [];
        
        for (const api of apis) {
            try {
                const response = await fetch(api.url, {
                    method: 'HEAD',
                    timeout: 5000
                });
                
                results.push({
                    name: api.name,
                    status: response.ok ? 'healthy' : 'error',
                    responseTime: response.headers.get('x-response-time') || 'unknown'
                });
            } catch (error) {
                results.push({
                    name: api.name,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        const hasErrors = results.some(r => r.status === 'error');
        
        return {
            status: hasErrors ? 'warning' : 'healthy',
            details: results
        };
    }
    
    // Executar todas as verificações
    async runAllChecks() {
        const results = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            checks: {}
        };
        
        for (const [name, checkFunction] of this.checks) {
            try {
                const result = await checkFunction();
                results.checks[name] = result;
                
                if (result.status === 'error') {
                    results.status = 'error';
                } else if (result.status === 'warning' && results.status === 'healthy') {
                    results.status = 'warning';
                }
            } catch (error) {
                results.checks[name] = {
                    status: 'error',
                    details: { error: error.message }
                };
                results.status = 'error';
            }
        }
        
        // Log do resultado
        if (results.status === 'error') {
            logger.error('Health check failed', results);
        } else if (results.status === 'warning') {
            logger.warn('Health check warning', results);
        } else {
            logger.info('Health check passed', results);
        }
        
        return results;
    }
    
    // Middleware Express
    middleware() {
        return async (req, res) => {
            try {
                const results = await this.runAllChecks();
                const statusCode = results.status === 'healthy' ? 200 : 
                                 results.status === 'warning' ? 200 : 503;
                
                res.status(statusCode).json(results);
            } catch (error) {
                logger.error('Health check middleware error', error);
                res.status(503).json({
                    status: 'error',
                    error: 'Health check failed'
                });
            }
        };
    }
}

module.exports = new HealthChecker();`;
    
    return healthCheckConfig;
}

// Configuração do Prometheus
function createPrometheusConfig() {
    const prometheusConfig = `const client = require('prom-client');
const logger = require('./winston.config');

// Configurar coleta padrão de métricas
client.collectDefaultMetrics({
    timeout: 5000,
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// Métricas customizadas
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
    name: 'active_connections',
    help: 'Number of active connections'
});

const databaseQueries = new client.Counter({
    name: 'database_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table']
});

const errorRate = new client.Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'route']
});

// Middleware para coletar métricas HTTP
function metricsMiddleware() {
    return (req, res, next) => {
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = (Date.now() - start) / 1000;
            const route = req.route ? req.route.path : req.path;
            
            httpRequestDuration
                .labels(req.method, route, res.statusCode)
                .observe(duration);
            
            httpRequestTotal
                .labels(req.method, route, res.statusCode)
                .inc();
            
            if (res.statusCode >= 400) {
                errorRate
                    .labels('http_error', route)
                    .inc();
            }
        });
        
        next();
    };
}

// Função para registrar query do banco
function recordDatabaseQuery(operation, table) {
    databaseQueries.labels(operation, table).inc();
}

// Função para registrar erro
function recordError(type, route) {
    errorRate.labels(type, route).inc();
}

// Endpoint de métricas
function metricsEndpoint() {
    return async (req, res) => {
        try {
            res.set('Content-Type', client.register.contentType);
            const metrics = await client.register.metrics();
            res.end(metrics);
        } catch (error) {
            logger.error('Error generating metrics', error);
            res.status(500).end('Error generating metrics');
        }
    };
}

// Atualizar métricas de conexões ativas
function updateActiveConnections(count) {
    activeConnections.set(count);
}

module.exports = {
    metricsMiddleware,
    metricsEndpoint,
    recordDatabaseQuery,
    recordError,
    updateActiveConnections,
    register: client.register
};`;
    
    return prometheusConfig;
}

// Configuração do PM2 Ecosystem
function createPM2EcosystemConfig(config) {
    const pm2Config = {
        apps: [{
            name: 'tem-aki-institucional',
            script: 'app_supabase.js',
            instances: config.instances || 'max',
            exec_mode: 'cluster',
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: config.port || 3000
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_file: './logs/pm2-combined.log',
            time: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            kill_timeout: 5000,
            listen_timeout: 3000,
            shutdown_with_message: true,
            wait_ready: true
        }],
        deploy: {
            production: {
                user: config.deployUser || 'deploy',
                host: config.deployHost || 'localhost',
                ref: 'origin/main',
                repo: config.repository || 'git@github.com:user/repo.git',
                path: config.deployPath || '/var/www/tem-aki-institucional',
                'pre-deploy-local': '',
                'post-deploy': 'npm ci --only=production && pm2 reload ecosystem.config.js --env production',
                'pre-setup': ''
            }
        }
    };
    
    return JSON.stringify(pm2Config, null, 2);
}

// Função principal
async function main() {
    try {
        console.log('\n🔧 Configuração de Monitoramento - Tem Aki Institucional');
        console.log('========================================================\n');
        
        // Coletar informações do usuário
        const config = {};
        
        config.enablePrometheus = await question('Habilitar métricas Prometheus? (y/N): ');
        config.enablePrometheus = config.enablePrometheus.toLowerCase() === 'y';
        
        config.logLevel = await question('Nível de log (debug/info/warn/error) [info]: ') || 'info';
        
        config.instances = await question('Número de instâncias PM2 (max para automático) [max]: ') || 'max';
        
        config.port = await question('Porta da aplicação [3000]: ') || '3000';
        
        if (config.enablePrometheus) {
            config.metricsPort = await question('Porta para métricas Prometheus [9090]: ') || '9090';
        }
        
        config.enableHealthCheck = await question('Habilitar health check avançado? (Y/n): ');
        config.enableHealthCheck = config.enableHealthCheck.toLowerCase() !== 'n';
        
        config.enableLogRotation = await question('Configurar rotação de logs? (Y/n): ');
        config.enableLogRotation = config.enableLogRotation.toLowerCase() !== 'n';
        
        // Criar diretórios necessários
        log('Criando estrutura de diretórios...');
        ensureDir('logs');
        ensureDir('config');
        ensureDir('monitoring');
        
        // Criar configuração do Winston
        log('Configurando sistema de logs...');
        writeFile('config/winston.config.js', createWinstonConfig());
        
        // Criar configuração do Health Check
        if (config.enableHealthCheck) {
            log('Configurando health check...');
            writeFile('config/health-check.config.js', createHealthCheckConfig());
        }
        
        // Criar configuração do Prometheus
        if (config.enablePrometheus) {
            log('Configurando métricas Prometheus...');
            writeFile('config/prometheus.config.js', createPrometheusConfig());
        }
        
        // Atualizar configuração do PM2
        log('Atualizando configuração do PM2...');
        writeFile('ecosystem.config.js', createPM2EcosystemConfig(config));
        
        // Criar configuração do Logrotate (Linux)
        if (config.enableLogRotation && process.platform === 'linux') {
            log('Configurando rotação de logs...');
            writeFile('monitoring/logrotate.conf', createLogrotateConfig());
            log('Para ativar o logrotate, execute: sudo cp monitoring/logrotate.conf /etc/logrotate.d/tem-aki-institucional', 'warning');
        }
        
        // Criar script de monitoramento
        const monitoringScript = `#!/bin/bash
# Script de monitoramento do sistema

echo "=== Status do Sistema - $(date) ==="
echo

# Status do PM2
echo "📊 Status do PM2:"
pm2 status
echo

# Uso de memória
echo "💾 Uso de Memória:"
free -h
echo

# Uso de disco
echo "💿 Uso de Disco:"
df -h
echo

# Logs recentes
echo "📝 Logs Recentes (últimas 10 linhas):"
tail -n 10 logs/combined.log
echo

# Health check
echo "🏥 Health Check:"
curl -s http://localhost:${config.port}/health | jq .
echo

echo "=== Fim do Relatório ==="`;
        
        writeFile('monitoring/system-status.sh', monitoringScript);
        
        // Instalar dependências necessárias
        log('Verificando dependências...');
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        const requiredDeps = {
            'winston': '^3.8.2',
            'morgan': '^1.10.0'
        };
        
        if (config.enablePrometheus) {
            requiredDeps['prom-client'] = '^14.2.0';
        }
        
        const missingDeps = [];
        for (const [dep, version] of Object.entries(requiredDeps)) {
            if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
                missingDeps.push(`${dep}@${version}`);
            }
        }
        
        if (missingDeps.length > 0) {
            log(`Instalando dependências: ${missingDeps.join(', ')}`);
            try {
                execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
                log('Dependências instaladas com sucesso!', 'success');
            } catch (error) {
                log('Erro ao instalar dependências. Instale manualmente:', 'error');
                log(`npm install ${missingDeps.join(' ')}`, 'warning');
            }
        }
        
        // Criar arquivo de configuração final
        const finalConfig = {
            monitoring: {
                enabled: true,
                logLevel: config.logLevel,
                prometheus: config.enablePrometheus,
                healthCheck: config.enableHealthCheck,
                logRotation: config.enableLogRotation
            },
            pm2: {
                instances: config.instances,
                port: config.port
            }
        };
        
        writeFile('monitoring/config.json', JSON.stringify(finalConfig, null, 2));
        
        // Resumo final
        console.log('\n✅ Configuração de monitoramento concluída!');
        console.log('============================================\n');
        
        console.log('📁 Arquivos criados:');
        console.log('  - config/winston.config.js (Sistema de logs)');
        if (config.enableHealthCheck) {
            console.log('  - config/health-check.config.js (Health check)');
        }
        if (config.enablePrometheus) {
            console.log('  - config/prometheus.config.js (Métricas)');
        }
        console.log('  - ecosystem.config.js (Configuração PM2)');
        console.log('  - monitoring/system-status.sh (Script de status)');
        console.log('  - monitoring/config.json (Configuração final)');
        
        console.log('\n🚀 Próximos passos:');
        console.log('1. Integrar os middlewares na aplicação');
        console.log('2. Reiniciar a aplicação com PM2');
        console.log('3. Testar os endpoints de monitoramento');
        if (config.enablePrometheus) {
            console.log(`4. Acessar métricas em http://localhost:${config.port}/metrics`);
        }
        console.log('5. Configurar alertas (opcional)');
        
        console.log('\n📚 Comandos úteis:');
        console.log('  - Ver logs: pm2 logs tem-aki-institucional');
        console.log('  - Status: ./monitoring/system-status.sh');
        console.log('  - Métricas: curl http://localhost:' + config.port + '/metrics');
        console.log('  - Health: curl http://localhost:' + config.port + '/health');
        
    } catch (error) {
        log(`Erro durante a configuração: ${error.message}`, 'error');
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    createWinstonConfig,
    createHealthCheckConfig,
    createPrometheusConfig,
    createPM2EcosystemConfig
};