// PixloGames PM2 template for a VPS/self-hosted Node deployment.
// Install PM2 on the host if you choose this process manager.

module.exports = {
  apps: [
    {
      name: 'pixlogames-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/srv/pixlogames',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '768M',
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
