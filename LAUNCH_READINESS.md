# HH Events & Conventions — Launch Readiness & Production Deployment Guide

**Target Application:** H H Events & Conventions Web Application  
**Current Readiness Status:** `Awaiting Owner Confirmation of Business Rules & Physical Venue Assets`  
**Latest Reference Commit:** `155b5d9`  
**Built Artifact:** `dist/index.html`, `dist/assets/`, `dist/server.cjs`  

---

## 1. Production Readiness Matrix

| Category | Requirement | Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Authentication** | Salted scrypt hashing | `VERIFIED` | N=16384, r=8, p=1, constant-time compare |
| **Authentication** | Brute force login rate limiter | `VERIFIED` | Max 5 failed attempts per 15 min per IP &rarr; 429 |
| **Authentication** | Cryptographic session tokens | `VERIFIED` | 32-byte tokens with 24h expiration & logout revocation |
| **Authorization** | Admin API route protection | `VERIFIED` | HTTP 401 enforced across all privileged endpoints |
| **Data Safety** | State persistence | `VERIFIED` | `data/store.json` persists across server restarts |
| **Data Safety** | Atomic disk writes | `VERIFIED` | Temp file writes + atomic filesystem renames |
| **Data Safety** | Automated backup snapshotting | `VERIFIED` | Rotated snapshots in `data/backups/` |
| **Concurrency** | Single-node booking conflict safety | `VERIFIED` | In-process mutex + 409 Conflict rejection |
| **Concurrency** | Distributed multi-instance locking | `BLOCKED` | Architecture requires Redis / PostgreSQL for multi-pod |
| **Packages** | 8 Official venue packages configured | `VERIFIED` | Exact pricing ₹15k to ₹65k populated |
| **Business Rules** | Package inclusions & cancellations | `Awaiting Owner Confirmation` | Documented in `OWNER_APPROVAL_CHECKLIST.md` |
| **Visual Design** | Deep Emerald & Cream theme | `VERIFIED` | Marquees removed, clean executive top bar |
| **Assets** | Real venue photography | `Awaiting Owner Capture` | 10 authentic venue photo slots awaiting capture |
| **Build & Typecheck**| Zero TypeScript / Rollup errors | `VERIFIED` | `tsc --noEmit` clean, `npm run build` completed |

> [!CAUTION]
> In accordance with strict deployment standards, **do NOT label or deploy this application as 100% production-ready** until the owner signs off on [OWNER_APPROVAL_CHECKLIST.md](file:///d:/hhevents/OWNER_APPROVAL_CHECKLIST.md) and authentic venue photography is provided.

---

## 2. Environment Variables Specification

Create a secure `.env` file on the production server (never commit this file to version control):

```bash
# Server Port & Mode
PORT=3000
NODE_ENV=production

# Master Venue Manager Credentials
MANAGER_EMAIL=hheventsconvention@gmail.com
MANAGER_PHONE=9448133378

# Pre-hashed master password using scrypt (recommended)
# Generate via: node -e "const crypto=require('crypto'); const s=crypto.randomBytes(16).toString('hex'); console.log(s + ':' + crypto.scryptSync('YOUR_PASS', s, 64, {N:16384,r:8,p:1}).toString('hex'))"
MANAGER_PASSWORD_HASH=0123456789abcdef0123456789abcdef:fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210

# Fallback plain password (used only if MANAGER_PASSWORD_HASH is unset)
# MANAGER_PASSWORD=YourStrongProductionSecret2026!

# Database & Storage
DATA_DIR=data
BACKUP_DIR=data/backups
```

---

## 3. Production Deployment Configurations

### Option A: Standard Node.js with PM2 (Recommended for VPS / Ubuntu)

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Create `ecosystem.config.js`:**
   ```javascript
   module.exports = {
     apps: [
       {
         name: "hh-events-server",
         script: "dist/server.cjs",
         instances: 1, // Single instance preserves in-process writeLock mutex
         autorestart: true,
         watch: false,
         max_memory_restart: "500M",
         env: {
           NODE_ENV: "production",
           PORT: 3000,
         },
       },
     ],
   };
   ```

3. **Start and register systemd daemon:**
   ```bash
   npm run build
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

---

### Option B: Docker Container

1. **Build Docker Image:**
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:20-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   ENV PORT=3000
   COPY package*.json ./
   RUN npm ci --omit=dev
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/data ./data
   COPY --from=builder /app/public ./public
   EXPOSE 3000
   VOLUME ["/app/data"]
   CMD ["node", "dist/server.cjs"]
   ```

2. **Run Container:**
   ```bash
   docker build -t hh-events:latest .
   docker run -d --name hhevents -p 3000:3000 -v /opt/hhevents/data:/app/data --env-file .env hh-events:latest
   ```

---

## 4. Domain, Reverse Proxy & HTTPS Checklist

When binding the custom domain (e.g. `hhevents.in` or `hheventsconvention.com`):

- [ ] **DNS Records:**
  - Create `A` Record: `@` &rarr; `<Production Server Public IP>`
  - Create `CNAME` Record: `www` &rarr; `@`
- [ ] **Nginx Reverse Proxy Configuration:**
  ```nginx
  server {
      listen 80;
      server_name hhevents.in www.hhevents.in;
      return 301 https://$host$request_uri;
  }

  server {
      listen 443 ssl http2;
      server_name hhevents.in www.hhevents.in;

      ssl_certificate /etc/letsencrypt/live/hhevents.in/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/hhevents.in/privkey.pem;
      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers HIGH:!aNULL:!MD5;

      # Security Headers
      add_header X-Frame-Options "SAMEORIGIN" always;
      add_header X-XSS-Protection "1; mode=block" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header Referrer-Policy "no-referrer-when-downgrade" always;
      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

      location / {
          proxy_pass http://127.0.0.1:3000;
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
- [ ] **Obtain SSL Certificate (Certbot):**
  ```bash
  sudo certbot --nginx -d hhevents.in -d www.hhevents.in
  ```

---

## 5. Database Backup & Disaster Recovery Plan

### Automated Snapshot Retention
The server automatically writes a timestamped snapshot of `data/store.json` to `data/backups/snapshot-<timestamp>.json` whenever a booking or package is modified.

### Daily Offsite Backup Script (Cron)
Add the following cron job (`crontab -e`) to compress and archive daily backups:
```bash
0 3 * * * tar -czf /opt/backups/hhevents-$(date +\%Y\%m\%d).tar.gz /opt/hhevents/data
```

### Point-in-Time Recovery Procedure
If database corruption or accidental booking deletion occurs:
1. Stop the application service:
   ```bash
   pm2 stop hh-events-server
   ```
2. Locate the most recent healthy snapshot in `data/backups/`:
   ```bash
   ls -lt data/backups/
   ```
3. Copy the chosen snapshot over the active `store.json`:
   ```bash
   cp data/backups/snapshot-1792082855000.json data/store.json
   ```
4. Restart the service:
   ```bash
   pm2 start hh-events-server
   ```
5. Verify health endpoint: `curl http://localhost:3000/api/health`.

---

## 6. Rollback Instructions

If a production defect is identified post-deployment:

### Code Rollback:
```bash
# Revert to last stable commit
git checkout 155b5d9
npm run build
pm2 restart hh-events-server
```

### Emergency Database Rollback:
```bash
# Restore previous known good state
cp data/backups/snapshot-PRE_DEPLOY.json data/store.json
pm2 restart hh-events-server
```

---

## 7. Owner Acceptance Testing (OAT) Runbook

Guide the venue owner through the following verification journeys before public launch:

1. **Journey 1: Public Discovery**
   - Visit Homepage &rarr; Verify contact desk phone number (`09448133378`) and venue address.
   - Click "Tariff & Packages" &rarr; Confirm 8 package tariffs match the owner's rate card.
   - Click "Availability" &rarr; View calendar slots.
2. **Journey 2: Reservation Request Submission**
   - Click "Book Hall" &rarr; Choose a test date (e.g., 3 months ahead), select "Single AC Hall (Hall 1)".
   - Enter customer name and phone number &rarr; Submit reservation request.
   - Note down the generated Booking Reference ID (e.g. `HH-2026-XXXXXX`).
3. **Journey 3: Public Status Tracking**
   - Visit `/track-booking` &rarr; Enter Booking ID and registered phone number.
   - Confirm status displays "Under Review / Pending".
4. **Journey 4: Manager Approval & Concurrency Check**
   - Visit `/admin` &rarr; Log in using venue manager credentials.
   - Confirm "Server Online" connection indicator.
   - Find the test reservation in the Bookings table &rarr; Click "Approve".
   - Record an advance token payment of ₹7,500 &rarr; Confirm balance recalculates automatically.
   - Open another incognito browser &rarr; Try submitting another booking request for the exact same date and session. Confirm the system blocks it with a conflict notice.
5. **Journey 5: Photo Upload Verification**
   - In Admin portal, navigate to Photo Manager (`/admin/photos`).
   - Upload 1 test photo into a venue slot &rarr; Verify it immediately appears on the public website.
