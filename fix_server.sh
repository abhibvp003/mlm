#!/bin/bash
# Fix script for EC2 deployment

echo "🔧 Starting server fixes..."

# 1. Create missing public folder files
echo "📁 Creating public folder files..."
mkdir -p /home/ubuntu/mlm/client/public

# Create index.html
cat > /home/ubuntu/mlm/client/public/index.html << 'EOFHTML'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="BSS Saathi Partner - MLM Investment Platform" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>BSS Saathi Partner</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOFHTML

# Create manifest.json
cat > /home/ubuntu/mlm/client/public/manifest.json << 'EOFMANIFEST'
{
  "short_name": "BSS Saathi Partner",
  "name": "BSS Saathi Partner - MLM Platform",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
EOFMANIFEST

# Create robots.txt
cat > /home/ubuntu/mlm/client/public/robots.txt << 'EOFROBOTS'
# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:
EOFROBOTS

echo "✅ Public folder files created"

# 2. Fix PM2 ecosystem config to load env vars
echo "⚙️  Updating PM2 config..."
cat > /home/ubuntu/mlm/ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'mlm-backend',
    script: './server/index.js',
    cwd: '/home/ubuntu/mlm',
    instances: 1,
    exec_mode: 'fork',
    env_file: './server/config.env',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOFPM2

echo "✅ PM2 config updated"

# 3. Fix server/index.js to use absolute path for config.env
echo "🔧 Updating server to load config.env properly..."
cd /home/ubuntu/mlm/server
sed -i "s|require('dotenv').config({ path: './config.env' });|require('dotenv').config({ path: __dirname + '/config.env' });|g" index.js

echo "✅ Server config path fixed"

# 4. Build frontend
echo "🏗️  Building frontend..."
cd /home/ubuntu/mlm/client
npm run build

# 5. Fix permissions
echo "🔐 Fixing permissions..."
sudo chown -R www-data:www-data /home/ubuntu/mlm/client/build
sudo chmod -R 755 /home/ubuntu/mlm/client/build

# 6. Restart services
echo "🔄 Restarting services..."
pm2 restart mlm-backend
sudo systemctl reload nginx

echo ""
echo "✅ All fixes completed!"
echo ""
echo "Checking status..."
pm2 status
echo ""
echo "Backend logs (last 5 lines):"
pm2 logs mlm-backend --lines 5 --nostream

