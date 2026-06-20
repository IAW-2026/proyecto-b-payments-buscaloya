# 1.2 — Asignación de Responsabilidades

> **Tipo B — Plataforma de Delivery**

## Distribución de webapps

| App | Responsable | Repositorio |
|-----|-------------|-------------|
| Buyer App | Fernando Champredonde Brandan | `proyecto-b-buyer-[nombre]` |
| Seller App | Laureano Gandrup | `proyecto-b-seller-[nombre]` |
| Delivery App | Tomas Ferner | `proyecto-b-delivery-[nombre]` |
| Payments App | Marcos Simon Fernandez| `proyecto-b-payments-[nombre]` |

---

## Datos propios de cada app

### Buyer App
|Entidad|Descripcion|
|---|---|
| `users` | Perfiles de compradores vinculados a la identidad de Clerk. Almacena datos de contacto (`phone`, `email`) y el `cliente_id` único. |
| `addresses` | Libreta de direcciones del usuario (Casa, Oficina, etc.) con coordenadas geográficas para precisión en el despacho. |
| `purchases` | Registro de la transacción financiera global. Almacena el `purchase_id`ge, el monto total y el estado del pago . |
| `oders` | Entidades de seguimiento para cada paquete individual de la compra. Guarda el `order_id` (paquete), el `store_name`, el `status` logístico actual y el `delivery_code` (OTP). |
| `order_items` | Snapshot histórico de los productos contenidos en cada paquete (`product_name`, `quantity`) para consulta del usuario sin depender de cambios en el catálogo del Seller. |

### Seller App
|Entidad|Descripcion|
|---|---|
| `stores` | Perfiles de los comercios registrados. Almacena store_id, nombre, email, categoría de la tienda, imagen de la tienda, dirección (coordenadas para el Delivery) |
| `products` |El catálogo de cada local. Incluye product_id, store_id (FK), nombre, precio, descripción, imagen y stock disponible. |
| `packages` | Representación de la fragmentación del pedido. Almacena el package_id, el payment_order_id (vinculado a Payments), el store_id, costo de envío, delivery_trip_id(id de seguimiento del viaje del paquete), el buyer_id y demás datos del comprador, así como el estado de preparación interna del comercio. |
| `package_items` | Detalle técnico de qué productos y qué cantidades componen cada paquete individual para la validación en el despacho (contiene los detalles de los productos en el paquete como sus nombres, precio de compra, cantidad, etc). |

### Delivery App
| Entidad | Descripción |
|---|---|
| `vehicles` | Entidades logísticas con su estado de operación corriente (`available`, `on_trip`) y características funcionales del vehículo. |
| `trips` | Registro exclusivo del traslado. Guarda la asociación del viaje (`order_id`, `package_id`), las distancias, el repartidor asignado, timestamps y la evolución de sus estados (`COURIER_ASSIGNED`, `PICKED_UP`, `OUT_FOR_DELIVERY`, `DELIVERED`). |
| `tracking` | Registro espaciotemporal (coordenadas GPS) e historial de checkpoints que conforman la ruta del vehículo hacia el destino. |

---

### Payments App
|Entidad|Descripcion|
|---|---|
| `orders` | Orden de compra generada por Payments al recibir el request de Seller App. Contiene el `order_id` (UUID, fuente de verdad), el `mp_preference_id`, el monto total, `buyer_id`, estado financiero y snapshots inmutables de ítems, dirección y cotización de delivery. |
| `order_items` | Snapshot inmutable de cada ítem al momento de la compra: `product_id`, `seller_id`, `quantity`, `unit_price`, `subtotal`. Los cambios posteriores en el catálogo de Seller no la afectan. |
| `transactions` | Registro del intento de cobro al comprador: método de pago, token del procesador externo, resultado (`approved` / `rejected`) y timestamp. |
| `liquidations` | Pagos salientes a vendedores y repartidores. Se generan únicamente cuando la transacción es `approved` y Delivery confirma la entrega mediante `POST /payments/operations/{order_id}/close`. |

 



---

## Datos o acciones que requieren comunicación entre apps

| App origen | Acción / dato necesario | App destino | API involucrada |
|---|---|---|---|
| Buyer | Consulta lista de negocios | Seller | `GET /api/stores` |
| Buyer | Consulta catálogo de productos de un negocio | Seller | `GET /api/stores/{id}/catalog` |
| Buyer | Confirmar el carrito de compras e iniciar el proceso de pedido | Seller | `POST /api/seller/orders` |
| Seller | Consulta cotización de costo de envío de un paquete | Delivery | `POST /api/deliveries/quote` | 
| Seller | Solicitar creación de orden de compra global | Payment | `POST /payments/orders` |
| Buyer | Redirigir al comprador a la página de checkout con el Payment Brick | Payments | `GET /checkout/{order_id}` |
| Buyer (browser) | Procesar el pago desde el Payment Brick una vez completado el formulario | Payments | `POST /api/payments/process` |
| Payment | Notificar al Seller que una orden fue creada con estado `payment_pending` (fire-and-forget) | Seller | `POST /orders/{order_id}/notify` |
| Payment | Notificar que el pago fue aprobado para que Seller dispare la misión logística | Seller | `PATCH /orders/{order_id}/status` |
| Payment | Notificar al comprador el estado final del pago (simultáneo con Seller) | Buyer | `PATCH /api/purchases/{id}/status` |
| Delivery | Solicitar la liquidación final de la reserva financiera al completar la entrega | Payment | `POST /payments/operations/{order_id}/close` |
| Delivery | Notificar actualización del estado logístico del viaje (`PICKED_UP`, etc.) | Seller, Buyer | `POST /orders/{order_id}/status` |
| Seller | Disparar la misión logística (Petición REST con snapshot completo) | Delivery | `POST /delivery-requests` |
| Buyer | Consultar ubicación GPS en vivo (telemetría / tracking) | Delivery | `GET /deliveries/{id}/tracking` |
| Seller / Buyer | Cancelar una misión logística en curso | Delivery | `POST /deliveries/{id}/cancel` |