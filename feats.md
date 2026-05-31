# Features / Fixes a Implementar

## 🔴 Críticos (afectan contratos inter-servicio)

### F1 — Agregar `seller_id` a `OrderItem` y al snapshot
- `src/types/index.ts`: agregar `seller_id: string` a `OrderItem`
- `src/app/api/orders/route.ts`: asegurarse de que `seller_id` llega en el body y se persiste en `items_snapshot`
- Sin esto las liquidaciones por vendedor son imposibles

#### ✅ Resuelto
- **`src/types/index.ts`**: agregado `seller_id: string` a `OrderItem` — TypeScript ahora lo exige en todo lugar donde se construya un item.
- **`src/app/api/orders/route.ts`**: agregada validación runtime que devuelve `400 { error: 'Each item must include seller_id' }` si algún item llega sin el campo. El snapshot se persiste automáticamente ya que se pasa `items` completo al insert.
- **Bonus**: corregido el tipo de `params` y `searchParams` en `checkout/page.tsx` a `Promise<...>` (breaking change de Next.js 15 que ya estaba roto).

#### 🔲 Pendiente
- Nada. Coordinar con el Seller App que envíe `seller_id` en cada item del array al llamar `POST /api/orders`.

---

### F2 — Corregir endpoint de notificación al Buyer
- `src/lib/services/buyer.service.ts`: cambiar la URL de `PATCH /buyer/orders/{orderId}/payment-status` → `PATCH /api/purchases/{id}/status`
- Coordinar con Fernando (Buyer App) cuál es el correcto

#### ✅ Resuelto
- **`src/lib/services/buyer.service.ts`**: URL corregida a `PATCH /api/purchases/{orderId}/status` según `docs/03-apis.md` (Buyer App endpoint #3). El `orderId` de Payments es el `purchase_id` que espera Fernando ya que Payments es la fuente de verdad del identificador.
- **Body**: simplificado de `{ order_id, status }` a solo `{ status }` como indica el contrato.
- **Status format**: agregado `BUYER_STATUS_MAP` que convierte los valores internos en minúsculas (`paid`, `cancelled`) a mayúsculas (`PAID`, `CANCELLED`) que espera la Buyer App. Si el status es `failed` (que Fernando no maneja) la función retorna sin hacer el fetch, evitando enviar un valor inválido.

#### 🔲 Pendiente
- Confirmar con Fernando Champredonde que el `purchase_id` en su endpoint efectivamente corresponde al `order_id` generado por Payments.

---

### F3 — Agregar `SERVICE_TOKEN` validation en `POST /api/payments/issue`
- `src/app/api/payments/issue/route.ts`: agregar el mismo guard que tiene `orders/route.ts`

#### ✅ Ya estaba implementado
- El guard `if (auth !== \`Bearer ${process.env.SERVICE_TOKEN}\`)` ya existía en `issue/route.ts` líneas 6-9. No requirió cambios.

---

### F4 — Corregir status en `notifySellerOrderCreated`
- `src/lib/services/seller.service.ts:12`: cambiar `'pending_payment'` → `'payment_pending'`

#### ✅ Ya estaba implementado
- El valor `'payment_pending'` ya era correcto en `seller.service.ts` línea 11. No requirió cambios.

---

## 🟡 Medios (integridad de datos y tipos)

### F5 — Renombrar `price` → `unit_price` en `OrderItem`
- `src/types/index.ts`: `price` → `unit_price`
- Actualizar todas las referencias en `orders/route.ts` y `checkout/page.tsx`

#### ✅ Resuelto
- **`src/types/index.ts`**: campo `price` renombrado a `unit_price` en `OrderItem`.
- **`src/app/api/orders/route.ts`**: cálculo del total (`unit_price * quantity`) y mapeo a MercadoPago (`unit_price: item.unit_price`) actualizados.
- **`src/app/checkout/[order_id]/page.tsx`**: inline type y expresión de render actualizados.

#### 🔲 Pendiente
- Nada. Coordinar con Seller App que el campo en el payload de `POST /api/orders` se llame `unit_price`.

---

### F6 — Agregar `estimated_minutes` al `delivery_quote_snapshot`
- `src/app/api/orders/route.ts`: el campo debe llegar en el body y persistirse en el snapshot
- `src/types/index.ts` / `CreateOrderPayload`: agregar el campo

#### ✅ Resuelto
- **`src/types/index.ts`**: agregado `quote_estimated_minutes: number` a `CreateOrderPayload`.
- **`src/app/api/orders/route.ts`**: `quote_estimated_minutes` se destructura del body, se incluye en la validación del 400, y se persiste en `delivery_quote_snapshot` como `estimated_minutes`.

#### 🔲 Pendiente
- Coordinar con Seller App (o quien llame `POST /api/orders`) que envíe el campo `quote_estimated_minutes` obtenido de la respuesta de Delivery App (`estimated_time_minutes` en `POST /deliveries/quote`).

---

### F7 — Agregar estado `closed` y quitar `pending` de `OrderStatus`
- `src/types/index.ts`: agregar `closed`, eliminar `pending`

#### ✅ Resuelto
- **`src/types/index.ts`**: `OrderStatus` actualizado — eliminado `'pending'`, agregado `'closed'`. Se verificó con `grep` que ningún archivo usaba `'pending'` como valor hardcodeado.

#### 🔲 Pendiente
- Nada.

---

### F8 — Corregir tipo de `mp_payment_id` en DB
- `process/route.ts` y `webhook/route.ts`: guardar `payment.id` como número (bigint), no como `String(payment.id)`

#### ✅ Resuelto
- **`src/app/api/payments/process/route.ts`**: `String(payment.id)` → `payment.id`.
- **`src/app/api/payments/webhook/route.ts`**: `String(body.data.id)` → `body.data.id`.
- El campo `mp_payment_id` en Supabase debe ser de tipo `bigint` para recibir los IDs numéricos de MercadoPago.

#### 🔲 Pendiente
- Verificar que la columna `mp_payment_id` en la tabla `orders` de Supabase esté definida como `bigint` y no como `text`. Si está como `text`, migrar el tipo vía Supabase dashboard o CLI.

---

## 🟠 Menores (funcionalidad pendiente)

### F9 — Implementar `POST /api/payments/operations/[order_id]/close`
- Crear el endpoint que valida que la orden esté en `paid`, genera liquidaciones y actualiza estado a `closed`

#### ✅ Resuelto
- **Creado** `src/app/api/payments/operations/[order_id]/close/route.ts`.
- Guard de `SERVICE_TOKEN` (solo Delivery App puede llamarlo).
- Respuestas de error según contrato: `404` orden no encontrada, `409` ya cerrada, `422` no estaba en `paid`.
- Liquidaciones calculadas en memoria: agrupa `items_snapshot` por `seller_id` sumando `unit_price × quantity`, más una liquidación para el courier con `delivery_cost`.
- Actualiza el status a `closed` en Supabase y devuelve el detalle de liquidaciones.

#### 🔲 Pendiente
- Las liquidaciones se **calculan y devuelven** en la respuesta pero **no se persisten** en DB — no existe tabla `liquidations` en el schema actual. Si el proyecto requiere trazabilidad de liquidaciones, crear la tabla y persistirlas dentro de la misma transacción que el update de status.

---

### F10 — Implementar validación de Clerk en `/checkout/[order_id]`
- Instalar `@clerk/nextjs`, configurar provider y proteger la ruta

#### ✅ Resuelto
- **Instalado** `@clerk/nextjs` v7.
- **`src/app/layout.tsx`**: agregado `<ClerkProvider>` wrapeando toda la app.
- **`src/middleware.ts`**: reemplazado por `clerkMiddleware` — rutas públicas pasan sin auth, `/checkout/*` protegido con `auth.protect()` (redirige a `/sign-in`), resto de `/api/*` sigue requiriendo `Bearer` token.
- **`src/app/checkout/[order_id]/page.tsx`**: `auth()` descomentado, validación `order.buyer_id !== userId` activa — devuelve 404 si intentás ver una orden ajena.
- **`.env.local`**: agregadas las 4 variables de Clerk vacías con comentario de dónde obtenerlas.

#### 🔲 Pendiente
- Completar las variables de entorno en `.env.local`:
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=   ← dashboard.clerk.com → tu app → API Keys
  CLERK_SECRET_KEY=
  ```
- El `buyer_id` guardado en la tabla `orders` debe ser el `userId` de Clerk (formato `user_clerk_xxxxx`) para que la validación `order.buyer_id !== userId` funcione. Verificar que quien llama `POST /api/orders` envíe el Clerk user ID como `buyer_id`.

---

## 📋 Orden de ejecución sugerido

```
F4 → F3 → F1 → F5 → F6   ← unificar contratos de datos primero
F2                         ← coordinar con Buyer App antes de implementar
F7 → F8 → F9              ← completar lógica de cierre
F10                        ← último (depende de Clerk configurado)
```
