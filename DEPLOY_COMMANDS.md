# Deployment Commands for aaPanel/Linux

Quick reference commands for deploying on your Linux server with aaPanel.

## One-Line Deployment (if you have the deploy script)

```bash
chmod +x deploy.sh && ./deploy.sh
```

## Manual Step-by-Step Commands

### 1. Navigate to your project directory
```bash
cd /www/wwwroot/your-domain.com
# OR wherever your project is located
```

### 2. Pull latest code from GitHub
```bash
git pull origin main
```

### 3. Install/update dependencies
```bash
npm install
```

### 4. Build the application
```bash
npm run build
```

### 5. Restart the application

#### Option A: Using PM2 (Recommended)
```bash
# If PM2 is already running your app
pm2 restart thanvish-music

# If this is the first time, start it with:
pm2 start dist/index.js --name thanvish-music
pm2 save
pm2 startup  # Run this once to enable auto-start on server reboot
```

#### Option B: Using systemd
```bash
sudo systemctl restart thanvish-music
```

#### Option C: Manual restart (if using screen/tmux or no process manager)
```bash
# Kill the existing process and start a new one
pkill -f "node dist/index.js"
nohup node dist/index.js > app.log 2>&1 &
```

## Complete Deployment Command (Copy & Paste)

Copy and paste this entire block into your SSH terminal:

```bash
cd /www/wwwroot/your-domain.com && \
git pull origin main && \
npm install && \
npm run build && \
pm2 restart thanvish-music || pm2 start dist/index.js --name thanvish-music && \
pm2 save
```

*(Replace `/www/wwwroot/your-domain.com` with your actual project path)*

## Setting Up PM2 (First Time Only)

If you haven't set up PM2 yet:

```bash
# Install PM2 globally
npm install -g pm2

# Start your application
pm2 start dist/index.js --name thanvish-music

# Save PM2 process list
pm2 save

# Enable PM2 to start on server reboot
pm2 startup
# Follow the instructions it gives you (usually involves running a sudo command)

# Useful PM2 commands
pm2 list              # View running processes
pm2 logs thanvish-music  # View logs
pm2 restart thanvish-music  # Restart
pm2 stop thanvish-music    # Stop
pm2 delete thanvish-music  # Remove from PM2
```

## Setting Up systemd (Alternative to PM2)

If you prefer systemd over PM2, create a service file:

```bash
sudo nano /etc/systemd/system/thanvish-music.service
```

Add this content (update paths as needed):
```ini
[Unit]
Description=Thanvish AI Music Application
After=network.target

[Service]
Type=simple
User=www
WorkingDirectory=/www/wwwroot/your-domain.com
Environment="NODE_ENV=production"
EnvironmentFile=/www/wwwroot/your-domain.com/.env
ExecStart=/usr/bin/node /www/wwwroot/your-domain.com/dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable thanvish-music
sudo systemctl start thanvish-music
sudo systemctl status thanvish-music
```

## Troubleshooting

### Check if application is running
```bash
# With PM2
pm2 list

# With systemd
sudo systemctl status thanvish-music

# Check port
netstat -tulpn | grep :5000
# OR
lsof -i :5000
```

### View logs
```bash
# PM2 logs
pm2 logs thanvish-music

# systemd logs
sudo journalctl -u thanvish-music -f

# Application logs (if using nohup)
tail -f app.log
```

### Check Node.js version
```bash
node --version  # Should be 20+
```

### Check if build was successful
```bash
ls -la dist/index.js
ls -la dist/public/index.html
```

## Quick Status Check

```bash
# Check git status
git status

# Check if dependencies are installed
ls -la node_modules

# Check build output
ls -la dist/

# Check if process is running
ps aux | grep "node dist/index.js"
```

