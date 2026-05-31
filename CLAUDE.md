# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

**BuscaloYA — Payments App (Tipo B — Delivery Platform)**
University project for IAW 2026. This is one of four microservices:

| App | Owner |
|-----|-------|
| Buyer App | Fernando Champredonde |
| Seller App | Laureano Gandrup |
| Delivery App | Tomas Ferner |
| **Payments App** | **Marcos Simon Fernandez** |

## Commands

```bash
npm run dev       # start dev server on :3000
npm run build     # production build
npm run lint      # ESLint via next lint
```

No test suite is configured yet. The `supabase/migrations/` directory does not exist yet — the schema must be created and applied manually via the Supabase dashboard or Supabase CLI.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript — all routes are under `src/app/api/`
- **Supabase** (`@supabase/supabase-js`) — Postgres DB, single `orders` table
- **MercadoPago SDK v2** — preference creation (`mpPreference`) and payment lookup/create (`mpPayment`) in `src/lib/mercadopago.ts`
- **`@mercadopago/sdk-react`** — `<Payment>` Brick rendered client-side in `src/app/checkout/[order_id]/PaymentBrick.tsx`
- **uuid v9** — generates `order_id` values at order creation time

## Environment Variables

Copy `.env.local` and fill in values (`.env.example` is provided as reference):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | DB access |
| `MP_ACCESS_TOKEN` | MercadoPago sandbox token (server-side) |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | MercadoPago public key for Payment Brick (client-side) |
| `MP_WEBHOOK_SECRET` | Webhook signature verification (not yet implemented) |
| `SERVICE_TOKEN` | Shared secret for backend-to-backend calls |
| `DELIVERY_APP_URL` / `SELLER_APP_URL` / `BUYER_APP_URL` | Base URLs for sibling services |
| `NEXT_PUBLIC_APP_URL` | Public URL used in MP back_urls and checkout links |

## Architecture Principles

These were established in the design phase and must be preserved in implementation:

- **No cross-DB queries.** Services communicate exclusively through HTTP APIs — never direct database access to another service's DB.
- **Snapshots for external data.** The Payments App must store local copies of critical external data (prices, addresses, store info) at order creation time so records are immutable retroactively.
- **Payments App owns `order_id`.** Payments is the source of truth and generator of `order_id`. All other services reference this UUID.
- **Consistent ID types.** All order and purchase identifiers must be UUID across all services (not Integer).
- **Auth model.** Buyer-initiated flows use JWT; backend-to-backend communication between services uses service tokens.

## Route Map

| Route | Auth | Description |
|-------|------|-------------|
| `POST /api/orders` | Bearer JWT | Create order — calls Delivery App for quote, creates MP preference, inserts row with snapshots |
| `GET /api/orders?buyer_id=` | Bearer JWT | List orders for a buyer |
| `GET /api/orders/[order_id]` | Bearer JWT | Order detail |
| `POST /api/payments/issue` | Bearer service token | Called by Seller App to query payment status |
| `POST /api/payments/webhook` | Public | MercadoPago webhook — updates order status, calls Seller App on `paid` |
| `POST /api/payments/process` | Public (from browser) | Called by Payment Brick on submit — creates MP payment and updates order status |
| `GET /api/health` | Public | Health check |
| `/checkout/[order_id]` | Public | Checkout page — shows order summary and embeds MercadoPago Payment Brick; also handles back_url redirects from MP (via `?status=` query param) |

## Inter-Service Communication

Outbound calls live in `src/lib/services/`. Currently implemented:
- `seller.service.ts` — `notifySellerPayment` and `updateSellerOrderStatus` (uses `SERVICE_TOKEN`)
- `delivery.service.ts` — **file not yet created**; `orders/route.ts` imports `getDeliveryQuote` from it. Must export `getDeliveryQuote({ store_id, delivery_address })` returning a `DeliveryQuote` (`quote_id`, `cost`, `estimated_minutes`).

The Payments App acts as an orchestrator in the order flow:
- Receives order creation requests from the **Buyer App**
- Calls the **Seller App** to notify payment and order status
- Calls the **Delivery App** to request delivery quotes and create delivery requests
- Exposes endpoints consumed by other services (see `docs/03-apis.md`)

Key integration points to watch:
- `POST /api/payments/issue` — called by Seller App; Payments is the receiver
- `POST /api/deliveries/quote` — consumed by Payments App from Delivery App
- `/orders/{order_id}/notify` and `/orders/{order_id}/status` — Payments calls these on Seller; they must be defined in Seller's contract

## Middleware

`src/middleware.ts` enforces `Authorization: Bearer <token>` on all `/api/*` routes except `/api/health`, `/api/payments/webhook`, and `/checkout`. Actual JWT/service-token validation is left to individual route handlers.

## Data Model

Single table `orders`. Three JSONB snapshot columns (`items_snapshot`, `delivery_address_snapshot`, `delivery_quote_snapshot`) freeze external data at creation time. `updated_at` is maintained by a Postgres trigger. Canonical TypeScript types for all shapes live in `src/types/index.ts`.

MP status → order status mapping used in both `webhook/route.ts` and `process/route.ts` (keep in sync):

| MercadoPago status | `OrderStatus` |
|--------------------|---------------|
| `approved` | `paid` |
| `rejected` | `failed` |
| `pending` / `in_process` | `payment_pending` |
| `cancelled` | `cancelled` |

## Documentation

| File | Purpose |
|------|---------|
| `docs/01-descripcion.md` | System description |
| `docs/02-responsabilidades.md` | Responsibility matrix and endpoint ownership |
| `docs/03-apis.md` | Inter-service API contracts |
| `docs/04.modelo-de-datos.md` | Data model per application |
| `docs/05.usuarios.md` | Shared users and authentication design |
| `docs/issue.md` | Stage 1 evaluator feedback (critical reading before implementation) |
