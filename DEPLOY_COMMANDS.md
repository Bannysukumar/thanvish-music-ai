# Deployment Commands

## Complete Deployment Sequence

```bash
# 1. Pull latest changes from git
git pull

# 2. Install/update dependencies
npm install

# 3. Build the project (client + server)
npm run build

# 4. Restart PM2 application
# Option A: Restart specific app (if you know the app name)
pm2 restart thanvish-music-ai

# Option B: Restart all PM2 apps
pm2 restart all

# Option C: If app doesn't exist, start it
pm2 start dist/index.js --name thanvish-music-ai

# 5. Check PM2 status
pm2 status

# 6. View logs (optional)
pm2 logs thanvish-music-ai
```

## One-Line Command (if you want to run all at once)

```bash
git pull && npm install && npm run build && pm2 restart all
```

## Alternative: Stop and Start (if restart doesn't work)

```bash
git pull && npm install && npm run build && pm2 stop all && pm2 start dist/index.js --name thanvish-music-ai
```

## Check PM2 App Name

If you're not sure of the PM2 app name, check with:
```bash
pm2 list
```

Then use the name from the list in the restart command.

