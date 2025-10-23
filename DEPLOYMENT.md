# EmailPay Deployment Guide

Complete guide for deploying EmailPay to production environments.

---

## ⚠️ Pre-Deployment Warning

**This application is currently configured for demonstration purposes on Ethereum Sepolia testnet.**

Before deploying to production:
1. Complete security audit
2. Integrate production Lit Protocol PKP
3. Replace JSON database with production database
4. Implement proper secrets management
5. Add rate limiting and security middleware
6. Enable HTTPS/TLS
7. Set up monitoring and alerting
8. Review and test all security measures

---

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)
### Option 2: Platform as a Service (Heroku, Railway, Render)
### Option 3: Containerized (Docker + Kubernetes)
### Option 4: Serverless (AWS Lambda, Vercel)

---

## Option 1: VPS Deployment (Ubuntu 22.04)

### 1.1 Server Setup

**Create and access server:**
```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install certbot for SSL
apt install -y certbot python3-certbot-nginx
```

### 1.2 Application Setup

**Clone and configure:**
```bash
# Create app directory
mkdir -p /var/www/emailpay
cd /var/www/emailpay

# Clone repository
git clone https://github.com/yourusername/emailpay.git .

# Install dependencies
npm install
cd frontend
npm install
cd ..

# Build frontend
cd frontend
npm run build
cd ..

# Create .env file
nano .env
# Add your production environment variables
```

### 1.3 Environment Configuration

**Production .env:**
```env
# Ethereum Network
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CHAIN_ID=11155111
EXPLORER_BASE=https://sepolia.etherscan.io/tx/
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

# Gmail Configuration
GMAIL_CLIENT_ID=your_production_client_id
GMAIL_CLIENT_SECRET=your_production_client_secret
GMAIL_REFRESH_TOKEN=your_production_refresh_token
GMAIL_USER=send@yourdomain.com
GMAIL_POLL_QUERY=in:inbox newer_than:1d

# Lit Protocol
LIT_NETWORK=datil-dev
LIT_ACTION_IPFS_CID=your_production_cid

# Transaction Policies
MAX_TX_AMOUNT=100
DAILY_TX_CAP=500
TX_EXPIRY_MINUTES=30

# Server
PORT=3001
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production

# Database
DB_PATH=/var/www/emailpay/data/db.json
```

### 1.4 PM2 Configuration

**Create ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'emailpay-backend',
    script: './backend/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

**Start with PM2:**
```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided

# Monitor
pm2 monit
```

### 1.5 Nginx Configuration

**Create Nginx config:**
```bash
nano /etc/nginx/sites-available/emailpay
```

**Nginx configuration:**
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/emailpay/frontend/out;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

**Enable site:**
```bash
ln -s /etc/nginx/sites-available/emailpay /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 1.6 SSL Certificate

**Setup Let's Encrypt:**
```bash
# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Test auto-renewal
certbot renew --dry-run
```

### 1.7 Firewall Setup

```bash
# Enable UFW
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

---

## Option 2: Heroku Deployment

### 2.1 Heroku Setup

**Install Heroku CLI:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
heroku login
```

**Create Heroku apps:**
```bash
# Backend
heroku create emailpay-backend

# Frontend
heroku create emailpay-frontend
```

### 2.2 Backend Deployment

**Create Procfile:**
```
web: node backend/index.js
```

**Deploy:**
```bash
# Set environment variables
heroku config:set SEPOLIA_RPC=your_rpc_url -a emailpay-backend
heroku config:set GMAIL_CLIENT_ID=your_client_id -a emailpay-backend
# ... set all other environment variables

# Deploy
git push heroku main

# Check logs
heroku logs --tail -a emailpay-backend
```

### 2.3 Frontend Deployment

**Update frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=https://emailpay-backend.herokuapp.com
```

**Deploy to Vercel (recommended for Next.js):**
```bash
cd frontend
npm install -g vercel
vercel --prod
```

---

## Option 3: Docker Deployment

### 3.1 Create Dockerfiles

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY backend ./backend
COPY .env .env

EXPOSE 3001

CMD ["node", "backend/index.js"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### 3.2 Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

**Deploy:**
```bash
docker-compose up -d
docker-compose logs -f
```

---

## Option 4: AWS Deployment

### 4.1 AWS Architecture

```
Route 53 (DNS)
    │
    ▼
CloudFront (CDN)
    │
    ├─▶ S3 (Frontend Static Files)
    │
    └─▶ ALB (Application Load Balancer)
         │
         ▼
      ECS/Fargate (Backend Containers)
         │
         ├─▶ RDS (PostgreSQL)
         └─▶ ElastiCache (Redis)
```

### 4.2 Backend on ECS

**Create ECS Task Definition:**
```json
{
  "family": "emailpay-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [{
    "name": "emailpay-backend",
    "image": "your-ecr-repo/emailpay-backend:latest",
    "portMappings": [{
      "containerPort": 3001,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "NODE_ENV", "value": "production"}
    ],
    "secrets": [
      {"name": "GMAIL_CLIENT_ID", "valueFrom": "arn:aws:secretsmanager:..."}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/emailpay-backend",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
```

### 4.3 Frontend on S3 + CloudFront

**Build and deploy:**
```bash
cd frontend
npm run build
aws s3 sync out/ s3://emailpay-frontend/
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Database Migration (Production)

### PostgreSQL Setup

**Schema:**
```sql
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    pkp_public_key TEXT NOT NULL,
    pkp_eth_address VARCHAR(42) NOT NULL,
    otp_code VARCHAR(6),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP
);

CREATE TABLE transactions (
    tx_id UUID PRIMARY KEY,
    sender_email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    amount DECIMAL(18, 6) NOT NULL,
    asset VARCHAR(10) NOT NULL,
    chain_id INTEGER NOT NULL,
    token_address VARCHAR(42) NOT NULL,
    tx_hash VARCHAR(66),
    block_number BIGINT,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (sender_email) REFERENCES users(email),
    FOREIGN KEY (recipient_email) REFERENCES users(email)
);

CREATE TABLE pending_transactions (
    tx_id UUID PRIMARY KEY,
    sender_email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    amount DECIMAL(18, 6) NOT NULL,
    asset VARCHAR(10) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (sender_email) REFERENCES users(email)
);

CREATE TABLE processed_emails (
    email_id VARCHAR(255) PRIMARY KEY,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_spending (
    email VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(18, 6) NOT NULL,
    PRIMARY KEY (email, date),
    FOREIGN KEY (email) REFERENCES users(email)
);

CREATE INDEX idx_transactions_sender ON transactions(sender_email);
CREATE INDEX idx_transactions_recipient ON transactions(recipient_email);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_pending_expires ON pending_transactions(expires_at);
```

---

## Monitoring & Logging

### 1. Application Monitoring

**PM2 Monitoring:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**New Relic:**
```bash
npm install newrelic
# Add to backend/index.js
require('newrelic');
```

### 2. Error Tracking

**Sentry:**
```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

### 3. Log Aggregation

**CloudWatch Logs (AWS):**
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i amazon-cloudwatch-agent.deb
```

**ELK Stack:**
```yaml
# docker-compose.yml
elasticsearch:
  image: elasticsearch:8.5.0
  
logstash:
  image: logstash:8.5.0
  
kibana:
  image: kibana:8.5.0
```

---

## Security Hardening

### 1. Environment Variables

**Use AWS Secrets Manager:**
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(data.SecretString);
}
```

### 2. Rate Limiting

**Add express-rate-limit:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Security Headers

**Add helmet:**
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 4. CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

## Backup Strategy

### Database Backups

**Automated PostgreSQL backups:**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="emailpay_backup_$DATE.sql"

pg_dump emailpay > "$BACKUP_DIR/$FILENAME"
gzip "$BACKUP_DIR/$FILENAME"

# Upload to S3
aws s3 cp "$BACKUP_DIR/$FILENAME.gz" s3://emailpay-backups/

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

**Cron job:**
```bash
0 2 * * * /path/to/backup.sh
```

---

## Scaling Considerations

### Horizontal Scaling

**Load Balancer Configuration:**
- Use sticky sessions for stateful operations
- Health check endpoint: `/health`
- Auto-scaling based on CPU/memory

**Database Connection Pooling:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching Layer

**Redis for caching:**
```javascript
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// Cache wallet lookups
async function getWallet(email) {
  const cached = await client.get(`wallet:${email}`);
  if (cached) return JSON.parse(cached);
  
  const wallet = await db.getUser(email);
  await client.setex(`wallet:${email}`, 3600, JSON.stringify(wallet));
  return wallet;
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Security audit completed
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] SSL certificates installed
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Documentation updated

### Deployment

- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Monitor logs
- [ ] Check all endpoints
- [ ] Verify email sending
- [ ] Test transaction flow
- [ ] Deploy to production
- [ ] Monitor for 24 hours

### Post-Deployment

- [ ] Verify all services running
- [ ] Check error rates
- [ ] Monitor performance metrics
- [ ] Test critical paths
- [ ] Document any issues
- [ ] Update runbook

---

## Rollback Procedure

**If deployment fails:**

```bash
# PM2 rollback
pm2 reload ecosystem.config.js --update-env

# Docker rollback
docker-compose down
docker-compose up -d --build

# Database rollback
psql emailpay < backup_file.sql
```

---

## Support & Maintenance

### Regular Maintenance

- **Daily:** Monitor logs and metrics
- **Weekly:** Review error reports
- **Monthly:** Update dependencies
- **Quarterly:** Security audit

### On-Call Procedures

1. Check monitoring dashboard
2. Review recent logs
3. Check service health
4. Investigate alerts
5. Apply fixes
6. Document incident

---

**Deployment complete! Monitor your application closely for the first 24-48 hours.**
