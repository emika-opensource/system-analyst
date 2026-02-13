#!/bin/bash

# Install PM2 if not available (baked into Docker image, but fallback for older containers)
if ! command -v pm2 &>/dev/null; then
  echo "PM2 not found, installing..."
  npm install -g pm2 2>/dev/null || true
fi

cd /home/node/app

# Install dependencies if needed
npm install 2>/dev/null || true

if command -v pm2 &>/dev/null; then
  # PM2 available — production-grade startup
  if [ -f /home/node/.pm2/dump.pm2 ] && pm2 resurrect 2>/dev/null; then
    echo "Restored PM2 processes"
    # Ensure spec-hub is running
    if ! pm2 list | grep -q "spec-hub"; then
      pm2 start server.js --name spec-hub
      pm2 save
    fi
  else
    pm2 start server.js --name spec-hub
    pm2 save
  fi
  pm2 logs --no-daemon
else
  # Fallback — direct node
  echo "PM2 unavailable, running directly"
  exec node server.js
fi
