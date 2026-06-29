# Flujo de Pago — Payments App

> Documento interno del módulo Payments. Describe la lógica completa del proceso de compra, las decisiones de arquitectura tomadas y los contratos de comunicación entre servicios.

---

## 1. Resumen del rol de Payments

Payments es el **orquestador financiero** del sistema. No tiene interfaz de usuario propia para el comprador más allá de la página de checkout. Sus responsabilidades son:

- Generar y ser fuente de verdad del `order_id` (UUID)
- Crear la preferencia de pago en MercadoPago
- Persistir la orden con snapshots inmutables de los datos externos
- Exponer la página de checkout con el Payment Brick embebido
- Procesar el resultado del pago contra MercadoPago
- Notificar el estado del pago a Seller y Buyer simultáneamente

---

## 2. Flujo completo de compra

```
Buyer App      Seller App     Payments App   Delivery App   MercadoPago
    │               │               │               │              │
    ║ FASE 1 — EXPLORACIÓN                                         ║
    │               │               │               │              │
    │ GET /stores   │               │               │              │
    │──────────────>│               │               │              │
    │<──────────────│               │               │              │
    │ GET /stores/{id}/catalog      │               │              │
    │──────────────>│               │               │              │
    │<──────────────│               │               │              │
    │               │               │               │              │
    ║ FASE 2 — CONFIRMACIÓN DE CARRITO                             ║
    │               │               │               │              │
    │ confirma      │               │               │              │
    │ carrito       │               │               │              │
    │──────────────>│               │               │              │
    │               │               │               │              │
    │               │ POST /deliveries/quote         │              │
    │               │ { store_id, delivery_address } │              │
    │               │───────────────────────────────>│              │
    │               │<───────────────────────────────│              │
    │               │  { quote_id, cost, minutes }   │              │
    │               │               │               │              │
    ║ FASE 3 — CREACIÓN DE ORDEN                                   ║
    │               │               │               │              │
    │               │ POST /payments/orders          │              │
    │               │ { buyer_id, store_id, items,  │              │
    │               │   delivery_address,            │              │
    │               │   delivery_cost, quote_id }    │              │
    │               │──────────────>│               │              │
    │               │               │ crea preference              │
    │               │               │──────────────────────────────>
    │               │               │<──────────────────────────────
    │               │               │  { preference_id }           │
    │               │               │ INSERT orders                │
    │               │               │ status: payment_pending      │
    │               │               │               │              │
    │               │               │ Promise.all   │              │
    │               │               │ ┌──────────────────────────────┐
    │               │  { order_id,  │ │ response HTTP  → Seller      │
    │               │  mp_pref_id,  │ │ POST /orders/{id}/notify     │
    │               │  total,       │ │ → Seller (fire-and-forget)   │
    │               │  status }     │ └──────────────────────────────┘
    │               │<──────────────│               │              │
    │               │               │               │              │
    │ POST /buyer/order-confirmation│               │              │
    │ { order_id, mp_pref_id,       │               │              │
    │   packages }                  │               │              │
    │<──────────────│               │               │              │
    │               │               │               │              │
    ║ FASE 4 — CHECKOUT (Payment Brick)                            ║
    │               │               │               │              │
    │ GET /checkout/[order_id]      │               │              │
    │──────────────────────────────>│               │              │
    │               │               │ SELECT order  │              │
    │               │               │ → mp_pref_id  │              │
    │  HTML con     │               │               │              │
    │  Payment Brick│               │               │              │
    │<──────────────────────────────│               │              │
    │               │               │               │              │
    │  (browser carga assets del Brick desde CDN de MP)            │
    │────────────────────────────────────────────────────────────> │
    │<──────────────────────────────────────────────────────────── │
    │  (formulario visible)         │               │              │
    │               │               │               │              │
    ║ FASE 5 — PROCESAMIENTO DEL PAGO                              ║
    │               │               │               │              │
    │ buyer llena   │               │               │              │
    │ y confirma    │               │               │              │
    │ POST /api/payments/process    │               │              │
    │ { formData, order_id }        │               │              │
    │──────────────────────────────>│               │              │
    │               │               │ mpPayment     │              │
    │               │               │ .create()     │              │
    │               │               │──────────────────────────────>
    │               │               │<──────────────────────────────
    │               │               │ { status:     │              │
    │               │               │   approved /  │              │
    │               │               │   rejected }  │              │
    │               │               │ UPDATE orders │              │
    │               │               │ status,       │              │
    │               │               │ mp_payment_id │              │
    │               │               │               │              │
    ║ FASE 6 — NOTIFICACIÓN SIMULTÁNEA                             ║
    │               │               │               │              │
    │               │               │ Promise.allSettled           │
    │               │               │ ┌──────────────────────────────────┐
    │               │               │ │ PATCH /orders/{id}/status        │
    │               │               │ │   → Seller                       │
    │               │               │ │ PATCH /buyer/orders/{id}/        │
    │               │               │ │   payment-status → Buyer         │
    │               │               │ └──────────────────────────────────┘
    │               │               │               │              │
    │ PATCH         │ PATCH         │               │              │
    │ /buyer/orders/│ /orders/{id}/ │               │              │
    │ {id}/payment- │ status        │               │              │
    │ status        │<──────────────│               │              │
    │<──────────────│               │               │              │
    │               │               │               │              │
    ║ FASE 7 — POST-PAGO (Seller orquesta la logística)            ║
    │               │               │               │              │
    │ POST /buyer/order-confirmation│               │              │
    │ { packages, store_name, ... } │               │              │
    │<──────────────│               │               │              │
    │               │               │               │              │
    │               │ POST /delivery-requests        │              │
    │               │───────────────────────────────>│              │
```

---

## 3. Modelo de autenticación

El sistema usa dos mecanismos según el origen del request:

### JWT de Clerk (credencial portable)
Todas las apps comparten la misma instancia de Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY` idénticos). El JWT emitido en la Buyer App es verificable en cualquier otra app sin llamar a Clerk, usando el endpoint JWKS:

```
https://clerk.TU-DOMINIO.com/.well-known/jwks.json
```

El campo `sub` del payload es el `user_id` del comprador.

### SERVICE_TOKEN (M2M)
Cadena secreta compartida entre todos los servicios para llamadas entre máquinas donde no hay un usuario activo.

### Tabla de autenticación por endpoint

| Llamada | Auth |
|---------|------|
| Buyer → Seller (explorar, confirmar carrito) | JWT de Clerk |
| Seller → Payments `POST /payments/orders` | SERVICE_TOKEN |
| Payments → Seller `POST /orders/{id}/notify` | SERVICE_TOKEN |
| Payments → Seller `PATCH /orders/{id}/status` | SERVICE_TOKEN |
| Payments → Buyer `PATCH /buyer/orders/{id}/payment-status` | SERVICE_TOKEN |
| Payments → Delivery `POST /deliveries/quote` | SERVICE_TOKEN |
| Buyer → Payments `GET /checkout/[order_id]` | JWT de Clerk + validar `buyer_id == order.buyer_id` |
| Buyer → Payments `POST /api/payments/process` | JWT de Clerk (desde el Payment Brick) |
| MercadoPago → Payments `POST /api/payments/webhook` | Público |
| `GET /api/health` | Público |

---

## 4. Ejemplo — `GET /checkout/[order_id]`

Esta ruta **no es una API REST** — es una página HTML renderizada en el servidor. El Buyer App redirige el browser del usuario a esta URL y Payments responde con la vista de checkout.

### Request

```
GET /checkout/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Host: payments-app.vercel.app
Cookie: __session=<clerk_session_cookie>    ← browser lo envía automáticamente
```

No hay body ni Authorization header — es una navegación de browser.

### Lo que Payments hace internamente

```ts
// 1. Verifica identidad del buyer (Clerk)
const { userId } = await auth();              // extrae sub del JWT
if (!userId) redirect('/sign-in');

// 2. Busca la orden en DB
const { data: order } = await supabase
  .from('orders')
  .select('order_id, status, total_amount, delivery_cost,
           mp_preference_id, items_snapshot, buyer_id')
  .eq('order_id', 'a1b2c3d4-...')
  .single();

// 3. Valida que el buyer es dueño de la orden
if (order.buyer_id !== userId) notFound();    // 404 si no es su orden
```

### Datos que Payments obtiene de DB

```json
{
  "order_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "payment_pending",
  "total_amount": 1750.00,
  "delivery_cost": 350.00,
  "mp_preference_id": "MP-123456789-abc",
  "buyer_id": "user_2abc123def456",
  "items_snapshot": [
    { "product_id": "uuid", "name": "Milanesa napolitana", "price": 500, "quantity": 2 },
    { "product_id": "uuid", "name": "Papas fritas",        "price": 400, "quantity": 1 }
  ]
}
```

### Lo que Payments retorna al browser

No retorna JSON — retorna **HTML** con tres elementos:

**① Resumen de la orden** *(construido desde el snapshot)*
```
Milanesa napolitana x2  →  $1.000
Papas fritas x1         →  $400
Envío                   →  $350
─────────────────────────────────
Total                   →  $1.750
```

**② Payment Brick** *(inicializado con los datos de la orden)*
```tsx
<PaymentBrick
  preferenceId="MP-123456789-abc"   // ← mp_preference_id de la DB
  totalAmount={1750.00}
  orderId="a1b2c3d4-..."
/>
```

El browser carga el formulario directamente desde los servidores de MercadoPago usando `preferenceId`. Payments nunca llama a MP para obtener el formulario — solo provee el `preferenceId` como prop.

**③ Feedback de estado** *(solo si MP redirigió con `?status=`)*

Cuando MercadoPago redirige al buyer tras el pago via `back_url`, agrega un query param:
```
GET /checkout/a1b2c3d4-...?status=success
GET /checkout/a1b2c3d4-...?status=failure
GET /checkout/a1b2c3d4-...?status=pending
```

Payments lo lee de `searchParams` y muestra el mensaje correspondiente. Si el pago ya está `paid` o `failed` en DB, oculta el Brick y muestra solo el estado final.

---

## 5. Contratos de API — Payments como receptor

### `POST /payments/orders`
**Caller:** Seller App | **Auth:** SERVICE_TOKEN

```json
// Request
{
  "buyer_id": "user_clerk_sub",
  "store_id": "uuid",
  "items": [
    { "product_id": "uuid", "name": "Milanesa", "price": 500, "quantity": 2 }
  ],
  "delivery_address": {
    "street": "Av. Corrientes 1234",
    "city": "Buenos Aires",
    "zip": "1043"
  },
  "delivery_cost": 350.00,
  "quote_id": "uuid-cotizacion-de-delivery"
}

// Response 201
{
  "order_id": "uuid-generado-por-payments",
  "mp_preference_id": "MP-123456789",
  "total_amount": 1350.00,
  "delivery_cost": 350.00,
  "status": "payment_pending"
}
```

### `POST /api/payments/process`
**Caller:** Browser del Buyer (desde Payment Brick) | **Auth:** JWT de Clerk

```json
// Request
{
  "formData": { /* objeto provisto por el SDK de MercadoPago */ },
  "order_id": "uuid"
}

// Response 200
{
  "status": "paid" | "failed" | "payment_pending",
  "payment_id": 123456789
}
```

### `POST /api/payments/webhook`
**Caller:** MercadoPago | **Auth:** Público

```json
// Request (MercadoPago)
{
  "type": "payment",
  "data": { "id": "123456789" }
}

// Response 200
{ "received": true }
```

### `POST /api/payments/issue`
**Caller:** Seller App | **Auth:** SERVICE_TOKEN

```json
// Request
{ "order_id": "uuid" }

// Response 200
{
  "order_id": "uuid",
  "status": "paid",
  "total_amount": 1350.00,
  "delivery_cost": 350.00,
  "created_at": "2026-05-23T10:00:00Z"
}
```

---

## 6. Contratos de API — Payments como caller

### `POST /orders/{order_id}/notify` → Seller App
Notifica a Seller que existe una nueva orden pendiente de pago.

```json
// Body
{ "order_id": "uuid", "status": "pending_payment" }
```

### `PATCH /orders/{order_id}/status` → Seller App
Notifica a Seller el resultado final del pago para que dispare la misión logística.

```json
// Body
{ "order_id": "uuid", "status": "paid" | "failed" }
```

### `PATCH /buyer/orders/{order_id}/payment-status` → Buyer App
Notifica a Buyer el resultado final del pago simultáneamente con Seller.

```json
// Body
{ "order_id": "uuid", "status": "paid" | "failed" }
```

---

## 6. El Payment Brick — cómo funciona

El Payment Brick **no es una página de MercadoPago** a la que el buyer es redirigido. Es un componente React (`@mercadopago/sdk-react`) que Payments embebe en su propia página.

```
Buyer navega a /checkout/[order_id]
           │
           ▼
Payments (Server Component)
  1. SELECT order WHERE order_id = ? → obtiene mp_preference_id
  2. Verifica que userId (Clerk) == order.buyer_id
  3. Renderiza la página con <PaymentBrick preferenceId={mp_preference_id} />
           │
           ▼
Browser ejecuta el SDK de MercadoPago
  1. initMercadoPago(NEXT_PUBLIC_MP_PUBLIC_KEY)
  2. Carga assets visuales directamente desde CDN de MP
  3. Renderiza el formulario (campos de tarjeta, cuotas, etc.)
           │
           ▼
Buyer completa y confirma
  → Brick llama a POST /api/payments/process con formData
```

Payments es el **host** de la página. MercadoPago provee el formulario visual via JS client-side. El buyer nunca abandona el dominio de Payments durante el pago.

---

## 8. Estrategia de notificación post-pago (Promise.allSettled)

Luego de confirmar el resultado con MercadoPago, Payments notifica a Seller y Buyer **en paralelo** para evitar el overhead de la cadena secuencial Payments → Seller → Buyer.

```ts
await Promise.allSettled([
  notifySellerPaymentStatus(orderId, newStatus),  // PATCH Seller
  notifyBuyerPaymentStatus(orderId, newStatus),   // PATCH Buyer
]);
```

Se usa `Promise.allSettled` (no `Promise.all`) para que un fallo en la notificación a uno **no cancele** la notificación al otro. Ambas se ejecutan independientemente.

### Por qué no es suficiente con solo notificar a Seller

Seller hace su propia notificación a Buyer post-pago (`POST /buyer/order-confirmation`) pero con **datos de paquetes logísticos**, no con el estado del pago. Son dos notificaciones con propósitos distintos:

| Notificación | Origen | Destino | Contenido |
|---|---|---|---|
| Estado del pago | Payments | Buyer + Seller | `{ order_id, status: "paid" }` |
| Detalle de paquetes | Seller | Buyer | `{ packages, store_name, ... }` |

---

## 9. Webhook de MercadoPago

`POST /api/payments/webhook` es la vía por la que MercadoPago notifica **asíncronamente** cambios de estado de pago (timeouts, pagos desde la app de MP, etc.). Es independiente del flujo del Payment Brick.

Ambas rutas (`/process` y `/webhook`) aplican la misma lógica post-pago para garantizar consistencia:

```
MP_STATUS_MAP:
  approved    → paid
  rejected    → failed
  pending     → payment_pending
  in_process  → payment_pending
  cancelled   → cancelled
```

---

## 10. Decisiones de diseño relevantes

| Decisión | Justificación |
|---|---|
| Seller cotiza Delivery, no Payments | Payments recibe `delivery_cost` ya calculado. Reduce acoplamiento de Payments con Delivery en el flujo de creación. |
| `order_id` es UUID generado por Payments | Payments es fuente de verdad. Todos los servicios referencian este ID. |
| Snapshots en `items_snapshot`, `delivery_address_snapshot`, `delivery_quote_snapshot` | Inmutabilidad retroactiva: cambios en catálogo de Seller no afectan órdenes históricas. |
| Fire-and-forget en `notifySellerOrderCreated` | La respuesta HTTP a Seller no debe bloquearse esperando que Seller procese la notificación. |
| `Promise.allSettled` (no `Promise.all`) para notificaciones | Resiliencia: si Buyer App está caída, Seller igual recibe su notificación y viceversa. |
| SERVICE_TOKEN único compartido | Para un sistema universitario con 4 servicios controlados, un secreto compartido es suficiente. En producción se usaría un token por servicio. |

---

## 11. Deuda técnica pendiente

| Ítem | Descripción |
|---|---|
| Instalar `@clerk/nextjs` | Necesario para proteger `/checkout/[order_id]` con `auth()` y validar `buyer_id == order.buyer_id` |
| Verificación de firma del webhook MP | `MP_WEBHOOK_SECRET` está en `.env` pero la validación de la firma no está implementada en `webhook/route.ts` |
| Liquidaciones | La tabla `liquidations` del modelo de datos se genera cuando Delivery confirma entrega vía `POST /payments/operations/{order_id}/close` — endpoint no implementado |
