# AWS EC2 Deployment Guide for BSS Saathi Partner

This guide will help you deploy the BSS Saathi Partner MLM application on an AWS EC2 instance.

## Prerequisites

1. AWS Account
2. EC2 Instance (Ubuntu 20.04/22.04 LTS recommended)
3. MongoDB Atlas account (or MongoDB installed on EC2)
4. Domain name (optional but recommended)

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu Server 22.04 LTS** (or 20.04)
3. Select instance type: **t2.micro** (free tier) or **t3.small** (recommended for production)
4. Configure Security Group:
   - **SSH (22)**: Your IP only
   - **HTTP (80)**: 0.0.0.0/0 (all traffic)
   - **HTTPS (443)**: 0.0.0.0/0 (all traffic)
   - **Custom TCP (5001)**: 0.0.0.0/0 (for backend API)
   - **Custom TCP (3000)**: 0.0.0.0/0 (for frontend dev server, optional)

5. Create or select a key pair for SSH access
6. Launch the instance

### 1.2 Get Instance Details
- Note your EC2 instance's **Public IP** or **Elastic IP**
- You'll need this for MongoDB Atlas whitelist and domain configuration

## Step 2: Connect to EC2 Instance

```bash
# Replace with your key file path and instance IP
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP
```

## Step 3: Install Dependencies

### 3.1 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 3.2 Install Node.js (v18 or higher)
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3.3 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 3.4 Install Nginx (Reverse Proxy)
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.5 Install Git
```bash
sudo apt install git -y
```

## Step 4: Clone and Setup Application

### 4.1 Clone Repository
```bash
cd /home/ubuntu
git clone https://github.com/abhibvp003/mlm.git
cd mlm
```

### 4.2 Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4.3 Build Frontend
```bash
cd /home/ubuntu/mlm/client
npm run build
```

This creates a `build` folder with production-ready React files.

## Step 5: Configure Environment Variables

### 5.1 Backend Configuration
```bash
cd /home/ubuntu/mlm/server
cp config.env.example config.env
nano config.env
```

Update `config.env` with your production values:
```env
PORT=5001
MONGODB_URI=mongodb+srv://username:password@mlm.phdeccd.mongodb.net/mlm_system?retryWrites=true&w=majority&appName=mlm
JWT_SECRET=your_strong_jwt_secret_key_change_this_in_production
NODE_ENV=production
FRONTEND_URL=http://YOUR_EC2_IP_OR_DOMAIN
# or for HTTPS: FRONTEND_URL=https://yourdomain.com

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Important**: 
- Update `MONGODB_URI` with your MongoDB Atlas credentials
- Use a strong `JWT_SECRET` (generate with: `openssl rand -base64 32`)
- Update `FRONTEND_URL` with your EC2 IP or domain name

### 5.2 MongoDB Atlas Whitelist
1. Go to MongoDB Atlas → Network Access
2. Add your EC2 instance's **Public IP** to the whitelist
3. Or add `0.0.0.0/0` for testing (not recommended for production)

## Step 6: Configure PM2 for Backend

### 6.1 Create PM2 Ecosystem File
```bash
cd /home/ubuntu/mlm
nano ecosystem.config.js
```

Add this content:
```javascript
module.exports = {
  apps: [{
    name: 'mlm-backend',
    script: './server/index.js',
    cwd: '/home/ubuntu/mlm',
    instances: 1,
    exec_mode: 'fork',
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
```

### 6.2 Create Logs Directory
```bash
mkdir -p /home/ubuntu/mlm/logs
```

### 6.3 Start Backend with PM2
```bash
cd /home/ubuntu/mlm
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Follow the command output from `pm2 startup` to enable PM2 on system reboot.

## Step 7: Configure Nginx as Reverse Proxy

### 7.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/mlm
```

Add this configuration:
```nginx
# Backend API
server {
    listen 80;
    server_name YOUR_EC2_IP_OR_DOMAIN;

    # Frontend (React App)
    location / {
        root /home/ubuntu/mlm/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.2 Enable Site and Test
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/mlm /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 8: Configure Firewall (UFW)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 9: Setup Domain and SSL (Optional but Recommended)

### 9.1 Point Domain to EC2
1. Go to your domain registrar
2. Add an A record pointing to your EC2 instance's **Elastic IP** (recommended) or Public IP

### 9.2 Install Certbot for SSL
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 9.3 Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically update your Nginx configuration.

### 9.4 Auto-renewal (Certbot sets this up automatically)
```bash
# Test renewal
sudo certbot renew --dry-run
```

### 9.5 Update Nginx Config for HTTPS
After SSL setup, update your config:
```bash
sudo nano /etc/nginx/sites-available/mlm
```

Update to redirect HTTP to HTTPS:
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /home/ubuntu/mlm/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Step 10: Create Initial Users (Optional)

```bash
cd /home/ubuntu/mlm/server
node utils/createUsers.js
```

This creates:
- Admin: `admin@mlm.com` / `admin123`
- Abhishek: `abhishek@mlm.com` / `abhishek123`
- Birendra: `birendra@mlm.com` / `birendra123`

**Important**: Change these passwords immediately after first login!

## Step 11: Verify Deployment

### 11.1 Check Services
```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check backend logs
pm2 logs mlm-backend
```

### 11.2 Test Application
1. Open browser: `http://YOUR_EC2_IP` or `https://yourdomain.com`
2. Test login with created users
3. Verify API endpoints are working

## Step 12: Monitoring and Maintenance

### 12.1 PM2 Commands
```bash
# View logs
pm2 logs mlm-backend

# Restart application
pm2 restart mlm-backend

# Stop application
pm2 stop mlm-backend

# Monitor
pm2 monit
```

### 12.2 Update Application
```bash
cd /home/ubuntu/mlm
git pull origin main

# Rebuild frontend
cd client
npm run build

# Restart backend
pm2 restart mlm-backend
```

### 12.3 Set Up Backup (Optional)
```bash
# Install MongoDB tools for backup
sudo apt install mongodb-database-tools -y

# Create backup script
nano /home/ubuntu/backup-mongodb.sh
```

Add backup script content:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

# Backup MongoDB Atlas (if needed)
# mongodump --uri="YOUR_MONGODB_URI" --out=$BACKUP_DIR/mongo_$DATE

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /home/ubuntu/mlm

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

Make executable:
```bash
chmod +x /home/ubuntu/backup-mongodb.sh
```

Add to crontab for daily backups:
```bash
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-mongodb.sh
```

## Troubleshooting

### Backend Not Starting
```bash
# Check PM2 logs
pm2 logs mlm-backend

# Check if port 5001 is in use
sudo netstat -tulpn | grep 5001

# Verify environment variables
cd /home/ubuntu/mlm/server
cat config.env
```

### Frontend Not Loading
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify build directory exists
ls -la /home/ubuntu/mlm/client/build

# Rebuild if needed
cd /home/ubuntu/mlm/client
npm run build
```

### MongoDB Connection Issues
1. Verify MongoDB Atlas IP whitelist includes EC2 IP
2. Check MongoDB connection string in `config.env`
3. Test connection: `mongosh "YOUR_MONGODB_URI"`

### Permission Issues
```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu /home/ubuntu/mlm

# Fix Nginx permissions
sudo chown -R www-data:www-data /home/ubuntu/mlm/client/build
```

## Security Best Practices

1. **Change Default Passwords**: Update all default user passwords
2. **Use Strong JWT Secret**: Generate with `openssl rand -base64 32`
3. **Enable HTTPS**: Always use SSL certificates in production
4. **Restrict SSH Access**: Only allow your IP in Security Group
5. **Regular Updates**: Keep system and dependencies updated
6. **Firewall**: Only open necessary ports
7. **MongoDB**: Use strong passwords and IP whitelisting
8. **Backups**: Regular backups of database and application

## Cost Estimation

- **EC2 t2.micro**: Free tier eligible (750 hours/month)
- **EC2 t3.small**: ~$15/month
- **MongoDB Atlas**: Free tier available (512MB)
- **Data Transfer**: First 1GB free, then $0.09/GB
- **Domain**: ~$10-15/year
- **SSL Certificate**: Free (Let's Encrypt)

## Quick Reference Commands

```bash
# SSH into EC2
ssh -i key.pem ubuntu@EC2_IP

# View backend logs
pm2 logs mlm-backend

# Restart services
pm2 restart mlm-backend
sudo systemctl restart nginx

# Rebuild and deploy
cd /home/ubuntu/mlm
git pull
cd client && npm run build
pm2 restart mlm-backend

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
pm2 status
```

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs mlm-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify MongoDB connection
4. Check EC2 Security Group settings

---

**Deployment Complete!** Your BSS Saathi Partner application should now be running on AWS EC2. 🚀

