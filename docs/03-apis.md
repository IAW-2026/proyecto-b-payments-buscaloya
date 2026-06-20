# 1.3 — Diseño de APIs Inter-Servicios

> **Tipo B — Plataforma de Delivery**

Documentar cada endpoint que una app expone para ser consumido por otra app del sistema. Este contrato debe estar acordado por todos los integrantes antes de comenzar la Etapa 2.

---

## Buyer App — Endpoints expuestos

<!-- Documentar los endpoints que expone esta app -->

### 1. `PATCH api/orders/{order_id}/status`
* **Consumidor:** Delivery App | **Auth:** `Authorization: Bearer <SERVICE_TOKEN>`
* **Propósito:** Actualizar el estado logístico de un pedido específico. Se activa cada vez que el repartidor cambia de etapa (Asignado, En camino, Entregado).
* **Request (Body):**
```json
{
  "status": "OUT_FOR_DELIVERY",
  "updatedAt": "2026-04-14T19:15:00Z"
}
```
* **Response (200 OK):**
```json
{
  "order_id": "pkg_123",
  "currentStatus": "OUT_FOR_DELIVERY"
}
```
* **Unauthorized (Error de API Key):**
```json
{
  "error": "unauthorized",
  "message": "La API Key proporcionada es inválida o no tiene permisos para este servicio.",
  "timestamp": "2026-05-10T19:20:00Z"
}
```
* **404 Not Found (Orden inexistente):**
```json
{
  "error": "order_not_found",
  "message": "No se encontró ningún paquete con el ID especificado.",
  "timestamp": "2026-05-10T19:21:00Z"
}
```
* **422 Unprocessable Entity (Transición de estado inválida):**
```json
{
  "error": "invalid_status_transition",
  "message": "No es posible pasar del estado 'DELIVERED' a 'PREPARING'.",
  "timestamp": "2026-05-10T19:22:00Z"
}
```

### 2. `PATCH api/orders/{order_id}/delivery-code`
* **Consumidor:** Delivery App | **Auth:** `Authorization: Bearer <SERVICE_TOKEN>`
* **Propósito:** Registrar el código de seguridad (OTP) que el repartidor generó para ese paquete. El comprador consultará este dato en su interfaz para darselo al repartidor cuando llegue y así validar que la entrega se realizó.
* **Request (Body):**
```json
{
  "customer_id": "customer_123",
  "delivery_code": 4829
}
```
* **Response (200 OK):**
```json
{
  "message": "Delivery code synchronized"
}
```
* **400 Bad Request (Datos malformados):**
```json
{
  "error": "bad_request",
  "message": "El campo 'deliveryCode' debe ser un número entero de 4 dígitos.",
  "timestamp": "2026-05-10T19:25:00Z"
}
```
* **409 Conflict (Código ya existente):**
```json
{
  "error": "conflict",
  "message": "El código de seguridad para esta orden ya ha sido sincronizado previamente.",
  "timestamp": "2026-05-10T19:26:00Z"
}
```

### 3. `PATCH api/purchases/{purchase_id}/status`
* **Consumidor:** Payments App | **Auth:** `Authorization: Bearer <SERVICE_TOKEN>`
* **Propósito:** Actualizar el estado logístico de una compra. Se activa cuando quiere cambiar el estado de una compra de PENDING a PAID o CANCELLED.

* **Request (Body):**

```json
{
"status": "PAID" | "CANCELLED"
}
```

* **200 OK (Estado Actualizado Exitosamente)**

  Emitido cuando la compra se encontraba en estado analizable (PENDING o un estado no definitivo) y el cambio impactó correctamente en Neon DB.

  ```json
  {
    "success": true,
    "message": "Compra a1b2c3d4-e5f6-7890-abcd-ef1234567890 actualizada correctamente a PAID"
  }
  ```

* **200 OK (Operación Ignorada: Idempotencia Asegurada)**

  Emitido cuando el sistema detecta que la compra ya alcanzó un estado final definitivo previamente. Protege los datos contra condiciones de carrera asíncronas.

  ```json
  {
    "success": true,
    "message": "La compra ya tenía un estado definitivo. No se realizaron cambios."
  }
  ```

* **400 Bad Request (Payload Inválido)**

  Emitido si el JSON entrante no contiene el campo obligatorio `status`.

  ```json
  {
    "error": "Falta el campo status"
  }
  ```

* **401 Unauthorized (Credencial M2M Inválida)**

  Emitido si el `SERVICE_TOKEN` del header de autorización falta o no coincide con el secreto compartido entre los microservicios.

  ```json
  {
    "error": "No autorizado"
  }
  ```

* **404 Not Found (Compra Inexistente)**

  Emitido cuando el `purchase_id` enviado en la URL no coincide con ningún registro de la tabla `purchases`.

  ```json
  {
    "error": "Compra no encontrada"
  }
  ```

* **500 Internal Server Error (Fallo Crítico)**

  Emitido ante errores de conectividad o excepciones no controladas en el query del pool HTTP de Neon DB.

  ```json
  {
    "error": "Error interno del servidor"
  }
  ```
---

## Seller App — Endpoints expuestos

<!-- Documentar los endpoints que expone esta app -->

### 1. `GET /api/stores`
* **Consumidor:** Buyer App
* **Propósito:** Retorna el listado de todos los comercios registrados en la plataforma para que el comprador elija dónde comprar.
* **Request:** *(Sin body)*
* **Response (200 OK):**
```json
{
  "store_id": 1,
  "name": "Pizza Palace",
  "email": "contacto@pizza.com",
  "category": "Pizzería",
  "image_url": "https://tu-storage.com/store/store_123.webp"
}
```

### 2. `GET /api/stores/{id}/catalog`
* **Consumidor:** Buyer App
* **Propósito:** Retorna el listado de todos los productos registrados en la plataforma de un comercio específico para que el comprador elija qué comprar.
* **Request:** *(Sin body)*
* **Response (200 OK):**
```json
{
  "store_name":"Pizza Palace",
  "store_image_url":"https://tu-storage.com/store/store_123.webp",
  "products": [
    {
      "product_id": "uuid-123",
      "name": "Pizza Especial",
      "description": "Pizza con jamón, queso mozzarella y aceitunas.",
      "price": 1500.0,
      "stock": 20,
      "image_url": "https://tu-storage.com/productos/pizza-123.webp"
    }
  ]
}
```
### 3. `POST /api/seller/orders`
* **Consumidor:** Buyer App
* **Propósito:** Recibe el carrito, fragmenta por negocio (paquetes), luego devuelve orden de pago, junto con costo del monto total.
* **Request:** **
```json
{
 "buyer_address": {
    "city":"Bahía Blanca","street":"Alem 123","lat": -34.6037, "lng": -58.3816
 },
 "buyer_id": "client_clerk",
 "stores":{
    "items": [
          { "product_name":"item_id", "quantity": 2 }
            ],
    "store_id": 1
 }
}

```
* **Response (200 OK) :**
```json
{
  "payment_order_id": "uuid-pay-789",
  "amount": 4150.0,
  "packages": [
    {
      "package_id": "uuid-pkg-001",
      "store_name": "Pizza Palace",
      "items": [
        { "product_name": "Pizza Especial", "quantity": 2 }
      ]
    }
  ]
}
```

* **Response (200 OK):** *(Sin body)*

### 4. `PATCH /api/orders/{id}/payment-status`
* **Consumidor:** Payment App
* **Propósito:** Webhook para recibir la confirmación de pago validado desde la Payments App.
* **Request:** **
```json
{
  "payment_order_id": "uuid-pay-789",
  "status": "validado"
}
```

---

## Delivery App — Endpoints expuestos

<!-- Documentar los endpoints que expone esta app -->

### 1. `POST /delivery-requests`
* **Consumidor:** Seller App (o Payment App)
* **Propósito:** Inicia la asignación de un repartidor reaccionando a un evento PUSH externo. Recibe un *snapshot* completo con toda la información necesaria para el retiro y la entrega.
* **Request (Body):**
```json
{
  "paquete_id": "ord_123",
  "requested_by": "payments",
  "context_mode": "FULL_SNAPSHOT",
  "seller": {
    "seller_id": "sel_1",
    "address": "Calle 123",
    "contact_masked": "11****4444"
  },
  "buyer": {
    "buyer_id": "buy_1",
    "address": "Av. Siempre Viva 742",
    "contact_masked": "11****2345"
  },
  "ready_at": "2026-04-14T18:30:00Z",
  "otp_required": true
}
```
* **Response (200 OK) (Sin body):**
```json
{
  "delivery_request_id": "req_999",
  "status": "ACCEPTED_FOR_ASSIGNMENT"
}
```

### 2. `POST /deliveries/quote`
* **Consumidor:** Payments App
* **Propósito:** Cotizar el costo y tiempo logístico de envío estimado en función de las coordenadas (lat/lng) de despegue y destino ANTES de efectuar la reserva financiera en el carrito.
* **Request (Body):**
```json
{
  "pickup_location": {"lat": -34.6037, "lng": -58.3816},
  "dropoff_location": {"lat": -34.6055, "lng": -58.3742}
}
```
* **Response (200 OK):**
```json
{
  "quote_id": "quo_888",
  "estimated_cost_ars": 350.50,
  "estimated_time_minutes": 25
}
```

### 3. `GET /deliveries/{id}/tracking`
* **Consumidor:** Buyer App
* **Propósito:** Proveer las coordenadas de telemetría en tiempo real (polling o WS desde el cliente) del repartidor o dron asignado a la misión.
* **Request:** *(Sin body)*
* **Response (200 OK):**
```json
{
  "delivery_id": "req_999",
  "courier_location": {"lat": -34.6044, "lng": -58.3790},
  "status": "OUT_FOR_DELIVERY"
}
```

### 4. `POST /deliveries/{id}/cancel`
* **Consumidor:** Seller App | Buyer App
* **Propósito:** Freno de emergencia (Abortar misión). Avisa a Delivery que la orden se ha cancelado localmente y debe retirar el envío al cadete en curso.
* **Request (Body):**
```json
{
  "reason": "USER_CANCELLED_ORDER"
}
```
* **Response (200 OK):**
```json
{
  "delivery_id": "req_999",
  "status": "CANCELLED_SUCCESSFULLY"
}
```

---

1.3 — API de Payments App

> **Tipo B — Plataforma de Delivery**
>
> Endpoints que expone la **Payments App** para ser consumidos por los demás servicios y por el browser del comprador.

---

### `POST /payments/orders`
**Caller:** Seller App | **Auth:** `Authorization: Bearer <SERVICE_TOKEN>`

Crea una nueva orden de compra. Payments valida que `total = subtotal + delivery_cost`, genera el `order_id`, crea la preferencia en MercadoPago, persiste la orden con snapshots y notifica al Seller (fire-and-forget).

```json
// Request
{
  "buyer_id": "user_clerk_abc123",
  "items": [
    {
      "product_id": "prod_111",
      "seller_id": "user_clerk_seller01",
      "name": "Milanesa napolitana",
      "quantity": 2,
      "unit_price": 1500.00,
      "subtotal": 3000.00
    },
    {
      "product_id": "prod_222",
      "seller_id": "user_clerk_seller02",
      "name": "Papas fritas",
      "quantity": 1,
      "unit_price": 800.00,
      "subtotal": 800.00
    }
  ],
  "delivery_address": {
    "street": "Av. Corrientes 1234",
    "city": "Buenos Aires",
    "zip": "1043"
  },
  "delivery_cost": 350.00,
  "subtotal": 3800.00,
  "total": 4150.00,
  "quote_id": "uuid-cotizacion-de-delivery"
}

// Response 201
{
  "order_id": "uuid-generado-por-payments",
  "mp_preference_id": "MP-123456789",
  "status": "payment_pending",
  "total": 4150.00,
  "created_at": "2026-04-23T14:00:00Z"
}

// Response 400 — total no coincide
{
  "error": "validation_error",
  "message": "El campo 'total' no coincide con subtotal + delivery_cost."
}

// Response 401
{
  "error": "unauthorized",
  "message": "Token inválido o expirado."
}
```

---

### `GET /checkout/{order_id}`
**Caller:** Buyer App (redirección de browser) | **Auth:** JWT de Clerk (cookie de sesión)

Página HTML (Server Component) con el resumen de la orden y el Payment Brick de MercadoPago embebido. No es un endpoint REST — devuelve HTML.

Payments valida internamente que `auth().userId == order.buyer_id`. Si no coincide, responde 404.

Si MP redirige al buyer con `?status=success|failure|pending`, Payments muestra el mensaje de estado correspondiente. Si la orden ya está `paid` o `failed`, oculta el Brick y muestra solo el estado final.

---

### `POST /api/payments/process`
**Caller:** Browser del Buyer (desde el Payment Brick) | **Auth:** JWT de Clerk

Llamado por el SDK de MercadoPago al confirmar el formulario de pago. Payments crea el pago en MP, actualiza el estado de la orden y dispara las notificaciones a Seller y Buyer en paralelo.

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

---

### `POST /api/payments/issue`
**Caller:** Seller App | **Auth:** `Authorization: Bearer <SERVICE_TOKEN>`

Permite al Seller consultar el estado financiero de una orden.

```json
// Request
{ "order_id": "uuid" }

// Response 200
{
  "order_id": "uuid",
  "status": "paid",
  "total_amount": 1750.00,
  "delivery_cost": 350.00,
  "created_at": "2026-05-23T10:00:00Z"
}
```

---

### `POST /api/payments/webhook`
**Caller:** MercadoPago | **Auth:** Público

Notificación asíncrona de cambios de estado de pago desde MercadoPago. Aplica la misma lógica de actualización de estado y notificaciones que `/process`.

```json
// Request (MercadoPago)
{
  "type": "payment",
  "data": { "id": "123456789" }
}

// Response 200
{ "received": true }
```

**Mapeo de estados MP → Payments:**

| MercadoPago `status` | `OrderStatus` en Payments |
|----------------------|--------------------------|
| `approved` | `paid` |
| `rejected` | `failed` |
| `pending` / `in_process` | `payment_pending` |
| `cancelled` | `cancelled` |

---

### `POST /payments/operations/{order_id}/close`
**Caller:** Delivery App | **Auth:** `Authorization: Bearer <SERVICE_TOKEN>`

Cierra la operación financiera tras confirmar la entrega física. Payments valida que la orden esté en estado `paid`, genera una liquidación por cada `seller_id` distinto en los ítems más una liquidación para el repartidor, y marca la operación como `closed`.

```json
// Request
{
  "delivery_id": "trip_xyz789",
  "courier_id": "user_clerk_delivery01",
  "delivered_at": "2026-04-23T15:30:00Z"
}

// Response 200
{
  "order_id": "ord_789xyz",
  "status": "closed",
  "liquidations": [
    {
      "recipient_id": "user_clerk_seller01",
      "recipient_type": "seller",
      "amount": 3000.00,
      "status": "pending"
    },
    {
      "recipient_id": "user_clerk_seller02",
      "recipient_type": "seller",
      "amount": 800.00,
      "status": "pending"
    },
    {
      "recipient_id": "user_clerk_delivery01",
      "recipient_type": "courier",
      "amount": 350.00,
      "status": "pending"
    }
  ]
}

// Response 404 — orden no encontrada
{
  "error": "order_not_found"
}

// Response 409 — operación ya cerrada
{
  "error": "operation_already_closed",
  "message": "Esta operación ya fue liquidada."
}

// Response 422 — transacción no aprobada
{
  "error": "transaction_not_approved",
  "message": "No se puede cerrar una orden que no fue pagada."
}
```

---

### `GET /api/health`
**Caller:** Cualquiera | **Auth:** Público

```json
// Response 200
{ "status": "ok" }
```

