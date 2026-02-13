#!/bin/bash

# Install PM2 globally if not present
if ! command -v pm2 &>/dev/null; then
  echo "Installing PM2..."
  npm install -g pm2 2>/dev/null || true
fi

# Check if PM2 has saved processes (user deployed something)
if [ -f /home/node/.pm2/dump.pm2 ] && pm2 resurrect 2>/dev/null; then
  echo "Restored PM2 processes"
  # Check if spec-hub is among them, if not start it
  if ! pm2 list | grep -q "spec-hub"; then
    cd /home/node/app
    npm install 2>/dev/null || true
    pm2 start server.js --name spec-hub
    pm2 save
  fi
  pm2 logs --no-daemon
else
  # Start Spec Hub via PM2
  cd /home/node/app
  npm install 2>/dev/null || true
  pm2 start server.js --name spec-hub
  pm2 save
  pm2 logs --no-daemon
fi
