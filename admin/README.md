# Home Decor Furniture — admin panel

A separate, private app for running the shop and editing the website. It
uses the same MongoDB database as the shop (`../web`) but has its own
address, its own login and its own admin accounts. Customers cannot sign in
here, and the shop has no admin pages.

## Run it locally

```bash
cd admin
npm install
cp .env.example .env.local   # fill in the values (see below)
npm run create-admin         # make your first admin account
npm run dev                  # http://localhost:3001
```

Run the shop at the same time (`cd web && npm run dev`, port 3000) so changes
show up there and image previews load.

Other commands: `npm run build`, `npm start`, `npm run lint`.

## What it does

| Section | Pages |
| --- | --- |
| Shop | Dashboard, Products (create, edit, hide, delete, image upload), Orders (filter, change status), Customers, Messages |
| Website | Home page hero, Announcement bar (with dates), Blog (drafts, publish dates), FAQ (groups, reorder), Store settings (contact details, social links) |
| Security | Admins (add, disable), change your password, sign out everywhere, activity log |

Each save is written to MongoDB, logged, and then the shop is told to
refresh its cache (`POST <shop>/api/revalidate`), so the change shows right away.

## Security

- **Separate accounts.** Admins live in their own `admins` collection with
  bcrypt passwords (12+ characters). There is no sign-up page: the first admin
  is created with `npm run create-admin`, more from the Admins page.
  Running `create-admin` with an existing username resets that password.
- **Own session cookie.** Signed with `ADMIN_AUTH_SECRET` (must differ from
  the shop's `AUTH_SECRET`), httpOnly, `SameSite=Strict`, `__Host-` prefix in
  production, 8 hours. Every page and every action re-checks the account in
  the database, so disabling an admin, changing a password or "Sign out
  everywhere" ends old sessions at once.
- **Login protection.** 5 failed attempts per username and 20 attempts per
  IP address per 15 minutes; the same message for a wrong username or
  password, with equal timing.
- **Browser protections.** A strict Content-Security-Policy with a fresh nonce
  per request (`src/proxy.ts`), `X-Frame-Options: DENY`, no caching, `noindex`
  everywhere and a `robots.txt` that blocks all crawlers.
- **Uploads** check the real file type from its bytes (JPG, PNG, WebP, AVIF),
  max 4 MB, and never keep the uploaded file name.
- **Shop refresh** requests are signed (HMAC-SHA256 with `REVALIDATE_SECRET`)
  and expire after 5 minutes; the shop refuses anything else.
- **Activity log.** Sign-ins (including failed ones) and every change, with
  IP address, kept for 180 days. See Admins & log.

## Environment variables

| Name | What |
| --- | --- |
| `MONGODB_URI` | Same database as the shop |
| `ADMIN_AUTH_SECRET` | 32+ random characters, different from the shop's `AUTH_SECRET` |
| `REVALIDATE_SECRET` | 32+ random characters, **same value** in `web/.env.local` |
| `NEXT_PUBLIC_SHOP_URL` | The shop's address. Built into the app, so set it **before** `npm run build` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob, for image uploads in production (locally, uploads go to `../web/public/uploads`) |

Generate a secret with:
`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

## Deploying (Vercel)

1. New Vercel project from the same repository, **Root Directory** `admin`.
2. Add the variables above. Use a different `ADMIN_AUTH_SECRET` from the shop,
   and the same `REVALIDATE_SECRET` in both projects.
3. Create a Vercel Blob store and connect it to both projects.
4. Give it its own address, for example `admin.yourdomain.com`. Optionally
   turn on Vercel's Deployment Protection or a firewall IP allow-list for
   this project as an extra lock in front of the login page.
5. Run `npm run create-admin` locally against the production database once.

## Where things live

| Path | What it holds |
| --- | --- |
| `src/proxy.ts` | Login redirect and Content-Security-Policy |
| `src/lib/auth.ts`, `session.ts` | Who is signed in; the admin cookie |
| `src/lib/actions/` | Server actions (every one starts with `assertAdmin()`) |
| `src/lib/data/` | Database reads for the pages |
| `src/lib/models/` | Mongoose models. `product`, `order`, `user`, `review`, `contact-message` and `content` are copies of the shop's; keep them in sync |
| `src/lib/content-types.ts` | Fields and rules for each editable website block |
| `src/lib/revalidate.ts` | Signed "refresh your cache" call to the shop |
| `scripts/create-admin.mjs` | Create an admin / reset a password |
