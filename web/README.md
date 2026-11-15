# Home Decor Furniture — storefront

The rebuilt Home Decor Furniture website. It reads and writes the same MongoDB
database as the old Express site in the parent folder, so products, customers,
orders and reviews carry over unchanged.

## Run it locally

```bash
cd web
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Other commands: `npm run build` (production build), `npm start` (serve the
build), `npm run lint`.

## What is in it

| Area | Pages |
| --- | --- |
| Shop | `/` home, `/shop` with filters, search and sorting, `/shop/[slug]` product pages with gallery, 3D viewer and reviews |
| 3D and AI | `/ar` 3D viewer with "View in your room" AR on phones, plus the AI room advisor (upload a room photo, get matching products); shopping assistant chat on every page |
| Buying | Cart drawer, `/wishlist`, `/checkout` (cash on delivery, and Razorpay when configured), `/checkout/success` |
| Customers | `/login`, `/register`, `/account` profile and password, `/account/orders` order history and reviews |
| Content | `/about`, `/contact`, `/faq`, `/blog`, `/privacy`, `/terms` |

The admin panel is a **separate app** in `../admin` (its own login, its own
accounts, its own address). See `admin/README.md`. The shop has no admin pages.

## How the important parts work

- **Prices are always calculated on the server.** The browser only sends
  product ids and quantities; names, prices, shipping (₹499, free from ₹50,000)
  and 18% GST come from `src/lib/pricing.ts` and the database.
- **Stock** is reserved when a cash order is placed or an online payment is
  confirmed, and returned if an admin cancels the order.
- **Reviews** can only be written for products in a delivered order.
- **Logins** use a signed, httpOnly cookie (`src/lib/session.ts`), so they work
  on serverless hosting. Existing passwords keep working.
- **Rate limits** on login, registration, contact, chat and orders are stored
  in a `ratelimits` collection that cleans itself up.
- **Caching:** catalogue and content pages are prebuilt and cached. After a
  change the admin panel calls `POST /api/revalidate`, signed with
  `REVALIDATE_SECRET` (same value in both apps), so the shop updates at once.
- **Editable content:** store details, the home hero, the announcement bar,
  the FAQ and the blog are read from MongoDB (`sitecontent` and `posts`) by
  `src/lib/data/content.ts`. If the database has nothing yet, the built-in text
  in `src/lib/site.ts` and `src/lib/content.ts` is shown. To copy that text into
  the database once: `node --experimental-strip-types scripts/content/seed-content.mjs`.

## Deploying to Vercel

1. Create a Vercel project with **Root Directory** set to `web`.
2. Add the environment variables from `.env.example`. Required:
   `MONGODB_URI`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`.
3. Connect the same Vercel Blob store as the admin project, so uploaded images load.
4. Add Razorpay keys when you want online payments.
5. In MongoDB Atlas, allow connections from Vercel.

## Where things live

| Path | What it holds |
| --- | --- |
| `src/app/` | Pages, layouts and API routes |
| `src/components/` | UI, grouped by feature |
| `src/lib/actions/` | Server actions (forms and mutations) |
| `src/lib/data/` | Database reads |
| `src/lib/models/` | Mongoose models matching the existing collections |
| `src/lib/data/content.ts` | Content edited in the admin panel, with fallbacks |
| `src/lib/content.ts` | Built-in FAQ and blog text (fallback) |
| `src/lib/site.ts` | Navigation, categories, built-in contact details |
| `src/app/globals.css` | Colour and font tokens for light and dark mode |

This Next.js version (16) differs from older ones. Before changing framework
code, read the matching guide in `node_modules/next/dist/docs/`.
