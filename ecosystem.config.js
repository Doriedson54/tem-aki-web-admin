module.exports = {
  apps: [
    {
      name: 'tem-aki-institucional',
      script: 'app_supabase.js',
      cwd: '/var/www/seu-dominio.com.br',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Configurações de monitoramento
      monitoring: false,
      
      // Configurações de log
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configurações de restart
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Configurações de cluster
      instance_var: 'INSTANCE_ID',
      
      // Configurações de watch (desabilitado em produção)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Configurações de autorestart
      autorestart: true,
      
      // Configurações de cron para restart
      cron_restart: '0 2 * * *', // Restart diário às 2h da manhã
      
      // Configurações de merge logs
      merge_logs: true,
      
      // Configurações de time
      time: true,
      
      // Configurações de source map
      source_map_support: true,
      
      // Configurações de kill timeout
      kill_timeout: 5000,
      
      // Configurações de listen timeout
      listen_timeout: 8000,
      
      // Configurações de wait ready
      wait_ready: true,
      
      // Configurações de health check
      health_check_grace_period: 3000,
      
      // Variáveis de ambiente específicas
      env_file: '.env.production',
      
      // Configurações de node args
      node_args: '--max-old-space-size=1024',
      
      // Configurações de interpreter
      interpreter: 'node',
      
      // Configurações de post deploy
      post_update: ['npm install', 'echo "Deploy finished"'],
      
      // Configurações de pre deploy
      pre_deploy_local: 'echo "This is a local executed command"',
      
      // Configurações de deploy
      deploy: {
        production: {
          user: 'deploy',
          host: ['seu-servidor.com'],
          ref: 'origin/main',
          repo: 'git@github.com:seu-usuario/seu-repositorio.git',
          path: '/var/www/seu-dominio.com.br',
          'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production && pm2 save'
        }
      }
    }
  ],
  
  // Configurações de deploy
  deploy: {
    production: {
      user: 'deploy',
      host: 'seu-servidor.com',
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/seu-repositorio.git',
      path: '/var/www/seu-dominio.com.br',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};