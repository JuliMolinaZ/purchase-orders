/**
 * Configuración de PM2 para producción
 *
 * Uso:
 * - Desarrollo: pm2 start ecosystem.config.js --env development
 * - Producción: pm2 start ecosystem.config.js --env production
 * - Cluster: pm2 start ecosystem.config.js --env production -i max
 */

module.exports = {
  apps: [
    {
      name: 'orden-autorizacion-compra',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      instances: process.env.PM2_INSTANCES || 2,
      exec_mode: 'cluster',

      // Variables de entorno
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: 1,
      },

      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      merge_logs: true,

      // Reinicio automático
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',

      // Configuración de reinicio
      exp_backoff_restart_delay: 100,
      restart_delay: 4000,

      // Watch (solo desarrollo)
      watch: false,
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        '.git',
      ],

      // Opciones adicionales
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: false,

      // Configuración de monitoreo
      instance_var: 'INSTANCE_ID',

      // Scripts de ciclo de vida
      post_update: ['pnpm install', 'pnpm build'],
    },
  ],

  // Configuración de deploy (Opcional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/your-repo.git',
      path: '/var/www/orden-autorizacion',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get update && apt-get install -y git',
    },
  },
};
