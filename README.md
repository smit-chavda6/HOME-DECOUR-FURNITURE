# Home Decor Furniture

Two Next.js apps that share one MongoDB database:

| Folder | What | Local address |
| --- | --- | --- |
| [`web/`](web/README.md) | The shop: catalogue, 3D and AR, cart, checkout, accounts, journal | http://localhost:3000 |
| [`admin/`](admin/README.md) | The private admin panel: products, orders, customers, messages and all website content | http://localhost:3001 |

Each is deployed as its own Vercel project (Root Directory `web` and `admin`).

## Run locally

```bash
cd web && npm install && npm run dev        # shop
cd admin && npm install && npm run dev      # admin panel (second terminal)
```

Copy each folder's `.env.example` to `.env.local` first. `REVALIDATE_SECRET` must
be the same in both, so admin changes show in the shop straight away. Create
the first admin account with `cd admin && npm run create-admin`.
