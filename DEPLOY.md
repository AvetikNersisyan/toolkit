# Deploying toolkit.am

Target: Ubuntu 22.04/24.04 VPS at `91.236.195.60`, domain `toolkit.am` proxied through
Cloudflare, served by **nginx + pm2**, with **PostgreSQL on the same VPS**.

Config files that ship with the repo:

| File | Goes to |
| --- | --- |
| `ecosystem.config.js` | pm2 process definition (stays in the repo at `/var/www/toolkit`) |
| `deploy/nginx/toolkit.am.conf` | `/etc/nginx/sites-available/toolkit.am` |
| `deploy/nginx/cloudflare-realip.conf` | `/etc/nginx/conf.d/cloudflare-realip.conf` |

> Replace `<...>` placeholders as you go. Keep the two generated passwords somewhere safe.

---

## 1. Push the code to GitHub (on your Windows machine)

`.env.local` and `*.pem` are gitignored, so no secrets are pushed.

```bash
cd /c/Users/Avet/Desktop/tools-landing
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:<you>/toolkit.git   # create the private repo first
git push -u origin main
```

---

## 2. Server: base software (SSH in as a sudo user)

```bash
ssh <user>@91.236.195.60
```

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# nginx, git, PostgreSQL
sudo apt-get install -y nginx git postgresql postgresql-contrib

# pm2, globally
sudo npm install -g pm2
```

## 3. Server: create the database

```bash
sudo -u postgres psql <<'SQL'
CREATE USER toolkit WITH PASSWORD '<DB_PASSWORD>';
CREATE DATABASE toolkit OWNER toolkit;
SQL
```

Connection string for later: `postgres://toolkit:<DB_PASSWORD>@localhost:5432/toolkit`

## 4. Server: get the code and the env file

```bash
sudo mkdir -p /var/www/toolkit /var/log/toolkit
sudo chown -R $USER:$USER /var/www/toolkit /var/log/toolkit
git clone git@github.com:<you>/toolkit.git /var/www/toolkit
cd /var/www/toolkit
cp .env.example .env.local
nano .env.local
```

Fill `.env.local`:

```ini
DATABASE_URL=postgres://toolkit:<DB_PASSWORD>@localhost:5432/toolkit

ADMIN_USER=admin
ADMIN_PASSWORD=<generate: openssl rand -base64 24>

# Meta — leave empty for now; fill once the pixel/CAPI exist (then rebuild, step 5).
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_META_ORDER_EVENT=Purchase
META_CAPI_ACCESS_TOKEN=
META_GRAPH_API_VERSION=v23.0
META_TEST_EVENT_CODE=
```

> **`NEXT_PUBLIC_*` values are baked in at build time.** Set the pixel ID *before* `npm run build`, or rebuild after you add it later.

## 5. Server: install, migrate, build

```bash
cd /var/www/toolkit
npm ci                 # installs dev deps too — needed for drizzle-kit + the build
npm run db:migrate     # creates the orders table
npm run build
```

> Don't export `NODE_ENV=production` in this shell — it would make `npm ci` skip
> `drizzle-kit`/`tsx` and break the migrate step. pm2 sets production at runtime only.
>
> If `npm run build` is killed on a small VPS (out of memory), add swap once:
> `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`

## 6. Server: start under pm2

```bash
cd /var/www/toolkit
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd      # run the sudo command it prints, so the app survives reboots
```

Check it's up locally: `curl -I http://127.0.0.1:3000/hammer-drill` → `200 OK`.

---

## 7. Cloudflare: DNS + Origin Certificate

In the Cloudflare dashboard for `toolkit.am`:

1. **DNS →** `A` record `toolkit.am` → `91.236.195.60`, **Proxied (orange cloud)**. Same for `www` (or a CNAME to `toolkit.am`).
2. **SSL/TLS → Overview →** set mode to **Full (strict)**.
3. **SSL/TLS → Origin Server → Create Certificate** (leave defaults, hosts `toolkit.am, *.toolkit.am`). Copy the two blocks.

On the server, save them:

```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/toolkit.am.pem   # paste the Origin Certificate
sudo nano /etc/ssl/cloudflare/toolkit.am.key   # paste the Private Key
sudo chmod 600 /etc/ssl/cloudflare/toolkit.am.key
```

## 8. nginx

```bash
cd /var/www/toolkit
sudo cp deploy/nginx/toolkit.am.conf        /etc/nginx/sites-available/toolkit.am
sudo cp deploy/nginx/cloudflare-realip.conf /etc/nginx/conf.d/cloudflare-realip.conf
sudo ln -sf /etc/nginx/sites-available/toolkit.am /etc/nginx/sites-enabled/toolkit.am
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Firewall (optional but recommended)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

For extra hardening you can allow 443 only from Cloudflare's ranges (see
`deploy/nginx/cloudflare-realip.conf` for the list).

## 10. Verify

- Visit `https://toolkit.am/hammer-drill` — the page loads over HTTPS (Cloudflare cert in the browser).
- Place a test order, then open `https://toolkit.am/admin` and log in with `ADMIN_USER` / `ADMIN_PASSWORD` — the order shows with the **real** visitor IP (confirms the Cloudflare real-IP config).
- `pm2 logs toolkit` for app logs; `sudo tail -f /var/log/nginx/error.log` for proxy issues.

---

## Redeploying after a change

```bash
cd /var/www/toolkit
git pull
npm ci
npm run db:migrate   # only if the schema changed
npm run build
pm2 reload toolkit
```
