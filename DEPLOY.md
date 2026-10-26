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

Connection string for later: `postgres://toolkit:<DB_PASSWORD>@localhost:<PORT>/toolkit`

> Check the port with `pg_lsclusters` — it isn't always 5432 (on toolkit.am's VPS it's **5434**).

## 4. Server: get the code and the env file

```bash
sudo mkdir -p /var/www/toolkit /var/www/toolkit-uploads /var/log/toolkit
sudo chown -R $USER:$USER /var/www/toolkit /var/www/toolkit-uploads /var/log/toolkit
git clone git@github.com:<you>/toolkit.git /var/www/toolkit
cd /var/www/toolkit
cp .env.example .env.local
nano .env.local
```

Fill `.env.local`:

```ini
DATABASE_URL=postgres://toolkit:<DB_PASSWORD>@localhost:<PORT>/toolkit

# Product photos/videos uploaded in the admin. Outside the repo so a re-clone can't lose them.
UPLOAD_DIR=/var/www/toolkit-uploads

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
npm run db:migrate     # creates the orders and products tables
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

Check it's up locally: `curl -I http://127.0.0.1:3030/` → `200 OK`.

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

## 9. How images are cached

- Uploaded originals (`/uploads/*.webp`, `*.mp4`) have one-year immutable cache headers and file
  extensions, so Cloudflare caches them automatically.
- Resized copies (`/_next/image?url=…&w=…`) are made once per width and kept on the VPS in
  `.next/cache/images`; later requests are a quick file read. Cloudflare does not cache this path by default.

**Optional, for heavy traffic:** a Cache Rule (*URI Path* equals `/_next/image` → **Eligible for cache**,
Edge TTL: use cache-control header) moves these to Cloudflare's edge. Trade-off: Next sends WebP to
browsers that accept it and JPEG to the rest, but Cloudflare's free plan stores one copy per URL
regardless of the browser. Nearly every browser accepts WebP, so the cached copy is almost always WebP,
and a very old device (iOS 13 or earlier) could then get a photo it can't show. Without the rule nothing changes for visitors.

## 10. Firewall (optional but recommended)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

For extra hardening you can allow 443 only from Cloudflare's ranges (see
`deploy/nginx/cloudflare-realip.conf` for the list).

## 11. Verify

- Open `https://toolkit.am/admin/products`, log in with `ADMIN_USER` / `ADMIN_PASSWORD`, create a product, upload a photo, set it to **Published** and save.
- Visit `https://toolkit.am/<slug>` — the page loads over HTTPS with the photo.
- Place a test order, then check `https://toolkit.am/admin` — the order shows with the **real** visitor IP (confirms the Cloudflare real-IP config).
- `pm2 logs toolkit` for app logs; `sudo tail -f /var/log/nginx/error.log` for proxy issues.

## Telegram alerts for new orders

Every new order is sent to Telegram (order number, product, total, name, phone, ad campaign, admin link).
Nothing is sent until both variables are set.

1. In Telegram, open **@BotFather** → `/newbot` → pick a name. Copy the token it gives you.
2. Open your new bot and press **Start**. For a group: add the bot to the group, then send
   `/start@<your_bot_username>` there. Bots don't see ordinary group messages by default, so a plain
   message won't show up in step 3.
3. Find the chat id — run this on the server and copy the `"chat":{"id":…}` value **exactly**, minus
   sign included. Don't add `-100` yourself: a normal group id looks like `-123456789`, and a
   supergroup's id already starts with `-100` when Telegram shows it.
   ```bash
   curl -s "https://api.telegram.org/bot<TOKEN>/getUpdates"
   ```
   Getting `"result":[]`? Send the `/start…` message again and re-run it.
4. Add both to `/var/www/toolkit/.env.local` (several chats: comma-separated ids):
   ```ini
   TELEGRAM_BOT_TOKEN=<TOKEN>
   TELEGRAM_CHAT_ID=<CHAT_ID>
   ```
5. `pm2 reload toolkit` — no rebuild needed, these are read when the app starts.
6. Test the bot on its own, then place a test order:
   ```bash
   curl -s "https://api.telegram.org/bot<TOKEN>/sendMessage" -d chat_id=<CHAT_ID> -d text="ToolKit.Am test"
   ```

If an alert fails, the order is still saved and the reason appears in `pm2 logs toolkit` as `[telegram] …`.
`chat not found` means the id is wrong (often a hand-added `-100`), the bot isn't in that chat, or the
token belongs to a different bot — `curl -s "https://api.telegram.org/bot<TOKEN>/getMe"` shows which bot it is.
Keep the token secret: anyone with it can send messages as your bot.

## Backups

Products, orders and uploads are now real data. A nightly copy of both is enough:

```bash
pg_dump "$DATABASE_URL" | gzip > ~/backups/toolkit-$(date +%F).sql.gz
tar -czf ~/backups/uploads-$(date +%F).tar.gz -C /var/www toolkit-uploads
```

Keep copies off the VPS too (download them, or sync to cloud storage).

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

Product edits made in the admin need none of this: pages refresh as soon as you save.

## One-time upgrade to the product admin (servers deployed before it)

```bash
sudo mkdir -p /var/www/toolkit-uploads && sudo chown $USER:$USER /var/www/toolkit-uploads
printf '\nUPLOAD_DIR=/var/www/toolkit-uploads\n' >> /var/www/toolkit/.env.local

cd /var/www/toolkit
git pull
npm ci
npm run db:migrate      # adds products, product_images and orders.product_id
npm run build
pm2 reload toolkit

# nginx: the upload size limit went from 2 MB to 70 MB
sudo cp deploy/nginx/toolkit.am.conf /etc/nginx/sites-available/toolkit.am
sudo nginx -t && sudo systemctl reload nginx
```

Then create your products at `/admin/products`.
