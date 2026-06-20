# 1.1 — Descripción del Sistema

> **Tipo B — Plataforma de Delivery**

## ¿Qué problema resuelve?

<!-- Describir el problema que resuelve el sistema y el dominio de aplicación específico elegido por la comisión. Ejemplo: una plataforma de delivery de comida saludable llamada FreshRun, orientada a restaurantes locales. -->

El sistema resuelve el desafío de coordinar, procesar y ejecutar pedidos de comida a domicilio a gran escala. Las plataformas tradicionales suelen sufrir al intentar manejar catálogos de productos, pasarelas de pago, coordinación GPS y comunicación bidireccional dentro de un único sistema monolítico, lo que resulta en interfaces sobrecargadas y cuellos de botella técnicos.

Este proyecto aborda el problema dividiendo la plataforma en un ecosistema de **aplicaciones independientes y especializadas** (Buyer, Seller, Delivery y Payment). Esta arquitectura modular permite:
1. Conectar a consumidores con negocios locales de forma ágil.
2. Procesar transacciones financieras de manera segura y aislada.
3. Orquestar la logística física del reparto con herramientas tácticas sin ruido comercial.
4. Brindar a cada actor una experiencia de usuario (UX/UI) diseñada exclusivamente para sus necesidades, operando cada módulo de forma atómica y comunicándose a través de contratos de API estrictos.

## Actores del sistema

| Actor | Descripción | Apps donde interactúa |
|-------|-------------|----------------------|
| **Comprador** | Cliente que explora el catálogo, arma el carrito, realiza el pago y rastrea el pedido hasta su recepción. | Buyer App, Payment App |
| **Tienda / Vendedor** | Comercio que gestiona su menú, acepta órdenes entrantes, prepara los productos y emite la alerta para el despacho. | Seller App |
| **Repartidor / Cadete** | Operador logístico de última milla. Usa interfaz táctica (mapa/telemetría) para efectuar misiones de retiro y entrega. | Delivery App |
| **Administrador Financiero**| Audita y controla las transacciones monetarias, retenciones, liquidaciones a restaurantes y reparto de comisiones. | Payment App |


## Flujo principal de uso

<!-- Describir el flujo de punta a punta del caso de uso central del sistema. Ejemplo:

1. El comprador explora tiendas y arma su carrito en la **Buyer App**.
2. El comprador confirma el pedido y se procesa el cobro en la **Payments App**.
3. El **Seller App** recibe el pedido y lo confirma / prepara.
4. La **Delivery App** asigna un repartidor, quien retira y entrega el pedido.
5. Se acredita el pago al vendedor y al repartidor desde la **Payments App**.
-->
## Flujo Buyer

El ciclo de vida de este módulo se centra en la experiencia final del consumidor. Es el punto de partida y de llegada de toda la operación, encargándose de gestionar la identidad del usuario, la selección de productos, la ejecución del pago y el monitoreo pormenorizado de cada paquete hasta su recepción física.



1. **Gestión de Identidad y Ubicación**: El usuario inicia sesión a través de Clerk y gestiona su libreta de direcciones. La selección de una dirección específica es fundamental, ya que proporciona las coordenadas geográficas (lat/lng) necesarias para que el sistema calcule costos de envío y rutas de entrega.

2. **Exploración y Selección**: El módulo consume activamente la información de la Seller App para presentar al usuario los comercios disponibles y sus catálogos de productos actualizados en tiempo real. Aquí es donde el comprador interactúa con la interfaz para armar su carrito de compras multi-vendedor.

3. **Consolidación y Desglose de Pedido**: Al confirmar el carrito, la Buyer App envía la intención de compra a la Seller App. En este paso crítico, el comprador recibe no solo el monto total a abonar, sino también el identificador global de la compra y los IDs únicos de cada paquete (sub-orders) generados. Esto permite que el comprador tenga visibilidad de cómo se dividirá su pedido antes incluso de realizar el pago.

4. **Gestión de Transacción Financiera**: Con la orden de pago generada, la Buyer App se comunica con el módulo de Payments para procesar el cobro. Una vez validada la transacción, el comprador queda a la espera de las actualizaciones logísticas.

5. **Seguimiento de Logística Granular**: La Buyer App actúa como receptor de eventos del módulo de Delivery. A medida que cada paquete individual cambia de estado (asignado, en camino, etc.), el comprador recibe notificaciones automáticas (vía PATCH) y puede visualizar en un mapa la telemetría del repartidor en tiempo real para cada uno de sus paquetes de forma independiente.

6. **Validación de Entrega (OTP)**: Cuando el repartidor llega al destino, la Buyer App muestra al usuario el código de seguridad generado por el sistema. El comprador debe facilitar este código de forma presencial para autorizar la liberación de la mercancía, cerrando así el ciclo de la orden de forma segura.

## Flujo Seller

El ciclo de este módulo está centrado más que nada en orquestar y gestionar los pedidos del comprador, ofreciendo acceso a los catálogos de los vendedores y stock de los productos, comunicándose también con los módulos de Payments y Delivery para estimación de costos y generación de ordenes de compra.



1. **Sincronización de Catálogo** Expone el listado de vendedores y el catálogo de productos de cada uno, de forma que el comprador pueda armar su carrito de compras consultando los listados.

2. **Fragmentación Multi-comercio** Al confirmarse un carrito, el Seller analiza el pedido y genera paquetes independientes ( distinguibles por ids únicos) para cada comercio involucrado, permitiendo que la logística sea granular.

3. **Estimación de Costos de Envío** Teniendo definidos los productos de cada negocio por paquetes, el Seller consulta los costos de envío asociados a cada paquete al módulo de Delivery para calcular el costo total de la compra.

4. **Pedido de Orden de Compra** Posteriormente, solicita al módulo Payments la creación de la orden de compra para enviarsela al módulo Buyer.

5. **Información adicional al Buyer** Teniendo el id único de la compra generado por Payments, se lo envía al módulo Buyer, así como, el listado de paquetes (de forma que el Buyer sepa lo que contiene el paquete por su id al recibirlo por Delivery) y el monto total.

6. **Preparación de la Ventana de Despacho** Una vez validado el pago, el Seller notifica a los comercios para la preparación y establece la hora exacta de retiro para que el Delivery sepa cuándo el paquete está listo para ser recolectado.

### Flujo Delivery
El ciclo de vida operativo está centrado estrictamente en la logística y traslado de los paquetes. El módulo de Delivery reacciona a estímulos externos y opera de la siguiente manera:

1. **Cotización Previa:** Antes de confirmar una compra, el módulo *Payment* puede solicitar a *Delivery* calcular el costo aproximado del envío en función de las distancias (coordenadas de origen y destino).
2. **Disparo de Misión:** La ejecución formal es disparada por la necesidad de un transporte desde el módulo *Seller*, quien envía a *Delivery* los datos exactos requeridos para la recolección y entrega.
3. **Asignación logística:** El módulo de *Delivery* procesa los datos entrantes y le asigna la misión a un repartidor disponible.
4. **Recolección y Tránsito:** El repartidor se dirige al local de origen, recoge el paquete, y traza la ruta hacia el destino.
5. **Notificación de Estados:** Durante todo el viaje, al pasar por distintos checkpoints (asignado, retirado, en camino), el módulo *Delivery* notifica activamente los cambios de estado a todos los módulos correspondientes.
6. **Entrega y Código de Seguridad (OTP):** El repartidor llega a la ubicación del comprador final. El *Buyer* le facilita presencialmente un código de seguridad para verificar su identidad y autorizar la liberación física de la mercancía.
7. **Liquidación y Cierre de Operación:** El módulo *Delivery* carga este código y lo envía mediante petición directa al módulo *Payment* para dar por completada y validada la entrega, permitiendo así el cierre y cobro definitivo en la pasarela.

### Flujo de Payments
El ciclo de vida de Payments está centrado estrictamente en la operación financiera de la transacción: desde la generación de la orden de compra hasta la liquidación final de los fondos a los participantes del sistema, garantizando que el dinero se mueva correctamente y en el orden adecuado.

1. El **Seller App** envía el carrito del comprador a Payments con el costo de envío ya calculado (`POST /payments/orders`).
2. Payments genera un `order_id` UUID único, crea la preferencia de pago en MercadoPago y registra la orden con estado `payment_pending`, incluyendo snapshots inmutables de ítems, dirección y cotización de delivery.
3. Payments notifica al Seller App (fire-and-forget) que existe una nueva orden pendiente de pago (`POST /orders/{order_id}/notify`), y devuelve al Seller el `order_id`, `mp_preference_id`, total y estado.
4. El Buyer App redirige al comprador a la página de checkout de Payments (`GET /checkout/{order_id}`), donde se muestra el resumen de la orden y el formulario de pago embebido (Payment Brick de MercadoPago).
5. El comprador completa el formulario de pago en el Payment Brick y lo envía: el Brick llama directamente a `POST /api/payments/process` en Payments con los datos del formulario.
6. Payments crea el pago contra MercadoPago y actualiza el estado de la orden en base al resultado.
7. Si el pago es **rechazado o cancelado**, Payments registra el estado como `failed` / `cancelled` y el flujo financiero termina.
8. Si el pago es **aprobado**, Payments actualiza la orden a `paid` y notifica en paralelo (`Promise.allSettled`) a:
   - **Seller App** → `PATCH /orders/{order_id}/status` para que dispare la misión logística.
   - **Buyer App** → `PATCH /api/purchases/{id}/status` para informar al comprador el resultado final.
9. Payments recibe la confirmación de entrega del módulo Delivery una vez completado el reparto (`POST /payments/operations/{order_id}/close`).
10. Payments ejecuta las liquidaciones correspondientes a vendedores y repartidor, y marca la operación como cerrada.