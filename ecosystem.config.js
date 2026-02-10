module.exports = {
  apps: [{
    name: 'system-analyst',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    watch: false,
    max_memory_restart: '256M'
  }]
};
