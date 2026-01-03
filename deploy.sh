#!/bin/bash

# Deployment script for aaPanel/Linux
# Usage: ./deploy.sh

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Navigate to project directory (update this path to your actual project directory)
# cd /www/wwwroot/your-domain.com
# OR if you're already in the project directory, comment out the cd line above

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if PM2 is installed and restart the app
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting application with PM2..."
    pm2 restart thanvish-music || pm2 start dist/index.js --name thanvish-music
    pm2 save
else
    echo "⚠️  PM2 not found. Please restart your application manually."
    echo "   If using systemd: sudo systemctl restart thanvish-music"
    echo "   Or start manually: node dist/index.js"
fi

echo "✅ Deployment complete!"

