# Tools landing pages

Landing pages for Meta ads: one page per product (`/hammer-drill`, `/angle-grinder`, …), cash-on-delivery order form, orders saved to PostgreSQL, a password-protected orders admin, and Meta Pixel + Conversions API.

Stack: Next.js 15 (App Router) · Tailwind CSS 4 · Drizzle ORM · PostgreSQL.

## Run locally

```bash
npm install
cp .env.example .env.local      # then fill in DATABASE_URL and the admin password
npm run db:migrate               # creates the orders table
npm run dev                      # http://localhost:3000/hammer-drill
```

Production: `npm run build && npm run start`. Node 20+.

## Where things are

| What | File |
| --- | --- |
| Products (edited in the admin at `/admin/products`) | `products` / `product_images` tables, read via `src/lib/products.ts` |
| Product editor (form, photo/video manager, reviews, server actions) | `src/app/admin/products/` |
| Reviews on the product page | `src/lib/reviews.ts`, `src/components/ReviewList.tsx`, `ProductView.tsx` |
| Upload processing and serving | `src/lib/uploads.ts`, `src/app/uploads/[file]/route.ts` |
| Shop settings (name, phone, messengers, delivery, warranty) | `src/data/site.ts` |
| Product page layout | `src/components/ProductView.tsx` (route: `src/app/[slug]/page.tsx`) |
| Order form | `src/components/OrderSection.tsx` |
| Countdown (top bar + price box) | `src/components/Countdown.tsx` |
| Order API | `src/app/api/orders/route.ts` |
| Orders admin | `src/app/admin/` (`/admin`, CSV at `/admin/export`) |
| Database table | `src/db/schema.ts`, migrations in `drizzle/` |
| Meta Pixel / CAPI | `src/components/MetaPixel.tsx`, `src/lib/tracking.ts`, `src/lib/meta-capi.ts` |

Everything in `[brackets]` is placeholder text to replace.

## Adding a product

1. `/admin/products` → **New product**: name, URL (slug) and price. It starts as a draft.
2. Upload photos: the gallery (first = hero, ideally the ad photo), and optionally a "what's in the box" photo, a video poster and an MP4. Each file is stored once as WebP (videos as-is); nothing is cropped or generated. Square photos around 1200×1200 work best — the editor flags non-square ones.
3. Fill in the rest (anything left empty hides its section), use **Preview** to check, set the status to **Published** and save. The page updates immediately — no rebuild.

The offer end (Yerevan time) sets the countdown. When it passes, the countdown says the offer ended — update the date and price for the next promotion. Archive a product instead of deleting it; old orders keep its name and price either way.

Photos are resized per device by Next.js (`/_next/image`: WebP, or JPEG for browsers without WebP support) and cached on disk; see "How images are cached" in DEPLOY.md.

## Reviews

Added per product in its editor (**Կարծիքներ**): name, city, 1–5 stars, text, date, an optional customer photo, and an optional linked order.

- The page shows `★ 4.8 · 23 կարծիք` under the title and a reviews section before "How to order"; both appear once a product has a visible review.
- Average and star bars count visible reviews only. Hide a review instead of deleting it if you may want it back.
- **Verified buyer** appears only for a review linked to a real order of that product, and each order can back one review — the server and the database both enforce this.
- Reviews are shown in your order (↑↓); new ones go to the top. The first 6 show, the rest behind "Show all".

## Orders

- The browser only sends product id, quantity, upsell, name and phone. **Prices are always recalculated on the server** from the `products` table, and only published products can be ordered.
- Phone numbers are normalised to `+374XXXXXXXX`.
- The same phone ordering the same product within 10 minutes is treated as a double tap (returns the existing order). More than 5 orders from one IP in 10 minutes is refused. A hidden honeypot field drops most bots.
- UTM parameters and `fbclid` from the ad link are saved with each order, so you can see which campaign sold what.
- Each new order can be sent to Telegram (`src/lib/telegram.ts`; set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, see DEPLOY.md). A failed alert never blocks the order.

**Admin:** open `/admin`, log in with `ADMIN_USER` / `ADMIN_PASSWORD`. Filter by status, tap the phone number to call, change status (Նոր → Հաստատված → Ուղարկված → Առաքված, or Չեղարկված / Վերադարձված), add a note, download CSV. If either variable is empty, the admin is switched off.

## Meta Pixel and Conversions API

Nothing is sent until you set the variables, so it's safe to deploy first.

1. In Meta Events Manager create a dataset/pixel and copy the ID into `NEXT_PUBLIC_META_PIXEL_ID`.
2. In the same place, generate a Conversions API access token → `META_CAPI_ACCESS_TOKEN`.
3. Optional: put the Test Events code in `META_TEST_EVENT_CODE`, place a test order, check that the event shows as received from both "Browser" and "Server" and is de-duplicated, then remove the code.

Events: `PageView`, `ViewContent` (product page), `InitiateCheckout` (first tap into the form), and the order event — `Purchase` by default, or `Lead` via `NEXT_PUBLIC_META_ORDER_EVENT`. The browser and server send the order event with the same `event_id`, so Meta counts it once.

`META_GRAPH_API_VERSION` defaults to `v23.0`; bump it if Meta deprecates that version.

Tag ad URLs like `https://your-domain.am/hammer-drill?utm_source=facebook&utm_campaign={{campaign.name}}&utm_content={{ad.name}}` (Meta fills the `{{…}}` values).

## Deploying

Any host that runs Node and can reach PostgreSQL works:

- **A VPS** (Hetzner, DigitalOcean, a local Armenian host): install Node + PostgreSQL, `npm ci && npm run db:migrate && npm run build`, run `npm run start` under pm2 or systemd behind nginx with HTTPS.
- **Vercel + managed Postgres** (Neon, Supabase): set the env variables in the project settings and run `npm run db:migrate` once against that database.

Make sure the server sets `X-Forwarded-For` (nginx: `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`) so per-IP limits and CAPI get the real visitor IP.

## Notes

- Fonts: Noto Sans Armenian from Google Fonts.
- `npm audit` reports issues in dev tooling (eslint plugin, drizzle-kit) and in the PostCSS copy bundled inside Next.js, none of which handle visitor input in production. Re-check after `npm update`.
