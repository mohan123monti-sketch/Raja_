# Production Deployment & Operations Guide — Raja Rani Online

## 1. Hosting Architecture
In production, Raja Rani Online is typically deployed on a Linux virtual machine (Ubuntu 22.04 LTS / Debian 12) or persistent container (e.g. Docker with persistent volume) because SQLite requires a persistent local disk.

```
       [ Client Browser ]
               │  (HTTPS :443 / WSS)
               ▼
       [ Nginx Reverse Proxy ]
        ├── /api/* & /socket.io/* ──> Node.js Express (Port 4000)
        └── /* ─────────────────────> Next.js Server (Port 3000)
```

## 2. Environment Configuration
Create a production `.env` file on the server:
```env
PORT=4000
NODE_ENV=production
DATABASE_URL="file:/var/lib/raja-rani/db/production.db"
JWT_SECRET="GENERATE_A_64_CHAR_CRYPTOGRAPHIC_KEY"
SESSION_SECRET="GENERATE_ANOTHER_64_CHAR_KEY"
CLIENT_URL="https://rajaranionline.com"
```

## 3. Persistent SQLite Management & Backups
SQLite writes database changes to a single file. For automated daily backups:
```bash
# Safely snapshot SQLite using sqlite3 .backup
sqlite3 /var/lib/raja-rani/db/production.db ".backup /var/backups/raja-rani/backup-$(date +%F).db"
```

## 4. Systemd Service Configuration
Create `/etc/systemd/system/raja-rani-server.service`:
```ini
[Unit]
Description=Raja Rani Server Daemon
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/var/www/raja-rani-online
EnvironmentFile=/var/www/raja-rani-online/.env
ExecStart=/usr/bin/npm run start --workspace=@raja-rani/server
Restart=always

[Install]
WantedBy=multi-user.target
```

## 5. Security Checklist
- [x] Secure HTTP-only cookies configured for session preservation.
- [x] Password hashing using Bcrypt (10 rounds).
- [x] Server-authoritative secret chit hiding (prevent client inspection).
- [x] Rate limiting configured on authentication routes.
- [x] Helmet security headers active.
- [x] Daily automated SQLite backup cron job.
