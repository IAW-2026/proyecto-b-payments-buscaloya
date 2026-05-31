## Proyecto: Buscalo YA (Tipo B)

### 1. Resumen General

La documentación de Buscalo YA destaca por un modelo de datos robusto, una separación de responsabilidades bien fundamentada y contratos de API en la Payments App que sirven como estándar de calidad para el resto del proyecto. Sin embargo, existen inconsistencias críticas en el flujo lógico y contradicciones entre la asignación de responsabilidades y la documentación técnica de las APIs que deben subsanarse para garantizar la viabilidad de la integración.

---

### 2. Análisis Detallado por Sección

#### 1.1 — Descripción del Sistema

- **Inconsistencias Lógicas:**
  - Existe una contradicción sobre quién solicita la cotización de envío: la descripción general apunta al Seller (`POST /api/deliveries/quote`), mientras que el diseño de APIs indica que es consumido por la Payments App.
  - Se menciona que el Seller solicita la creación de la orden de compra a Payments, pero en los contratos técnicos esta acción la realiza la Buyer App.

#### 1.2 — Asignación de Responsabilidades

- **Endpoints no Definidos:** La tabla de comunicaciones menciona `POST /api/seller/orders` (Buyer → Seller), pero dicho endpoint no está documentado en la sección técnica.
- **Perspectiva de Documentación:** Endpoints de notificación de pagos (`/orders/{order_id}/notify` y `/orders/{order_id}/status`) solo figuran como "consumidos" por Payments, pero no están definidos en la sección de la Seller App, donde deberían estar sus contratos de exposición.
- **Nomenclatura:** El uso del mismo path (`POST /orders/{order_id}/status`) para notificar a dos aplicaciones distintas genera ambigüedad técnica.

#### 1.3 — Diseño de APIs Inter-Servicios

- **Faltantes en Buyer App:** Solo se definen dos endpoints, omitiendo varios mencionados en la matriz de responsabilidades, como la confirmación de la orden.
- **Perspectiva de Exposición:** En la Seller App, se documenta `POST /api/payments/issue`, que técnicamente es un endpoint de la Payments App; debe aclararse que el Seller es el llamador y no el receptor.
- **Estructura de Datos:** El endpoint `GET /api/stores` devuelve un único objeto en lugar de un array, lo cual es incorrecto para un listado de comercios.
- **Ambigüedad de Consumo:** No queda definido si el Seller o la Payment App es el consumidor único de `POST /delivery-requests`.

#### 1.4 — Modelo de Datos

- **Decisiones de Diseño:** Se valora positivamente el uso de snapshots en Payments y Delivery para mitigar la dependencia de catálogos externos, lo cual demuestra una arquitectura madura.
- **Tipos de Datos:** Existe una discrepancia entre `purchases.purchase_id` (Integer en Buyer) y el tipo UUID que utiliza el Seller; deben alinearse para permitir la trazabilidad.
- **Errores de Tipeo:** En la Seller App, los campos `payment_order_id` y `delivery_id` están marcados erróneamente como claves primarias (PK) en lugar de claves foráneas (FK).
- **Fuente de Verdad:** La tabla de datos duplicados debe establecer una única fuente de verdad para el `order_id`, la cual, según el flujo, debería ser la Payments App.

#### 1.5 — Usuarios Compartidos

- **Resolución de Roles:** La separación de roles es clara y la implementación en la Delivery App es un ejemplo concreto de buena resolución.
- **Interacción Directa:** Se debe aclarar si la Payments App validará los JWT de los compradores para interacciones directas desde el frontend del Buyer o si toda comunicación será backend-to-backend vía service token.

---

### 3. Puntos Críticos

1. **Alineación de Flujo Lógico:** Definir unívocamente quién inicia la cotización de envío y la creación de la orden de compra en la sección 1.1.
2. **Completar Contratos de API:** Documentar en la sección 1.3 todos los endpoints de la Buyer App y Seller App que figuran en la matriz de responsabilidades.
3. **Unificación de Fuente de Verdad:** Establecer formalmente a la Payments App como la generadora y fuente de verdad del `order_id`.
4. **Corrección de Tipos:** Asegurar que los identificadores de órdenes y compras utilicen tipos de datos consistentes (UUID) en todas las aplicaciones involucradas.

---

### Nota de cierre y guía para la Etapa 2

Esta devolución refleja la visión de los evaluadores tras analizar la documentación entregada. Es importante subrayar que puede contener errores de interpretación sobre el dominio específico de su proyecto. En última instancia, deben priorizar su propio juicio técnico y profesional, siempre que sus decisiones de diseño estén debidamente fundamentadas.

**Recomendaciones clave para la fase de implementación:**

- **Definición de contratos:** No inicien la codificación de la lógica de negocio sin haber cerrado los contratos de API. Aseguren que cada endpoint tenga ejemplos JSON (Request/Response) claros y tipos de datos definidos.
- **Independencia de persistencia:** Respeten la separación de bases de datos. Una aplicación nunca debe consultar la base de datos de otra; la comunicación debe ser estrictamente a través de las APIs documentadas.
- **Snapshots e inmutabilidad:** Almacenen copias locales (snapshots) de datos externos críticos (como precios o direcciones) para garantizar que la información de una orden no cambie retroactivamente.
- **Manejo de errores:** Acuerden un formato de error común para todo el sistema para facilitar la integración y el diagnóstico de fallas entre servicios.

Confíen en su diseño y utilicen estas observaciones como una guía para mitigar riesgos antes de la integración final.

Por último, cualquier consulta, aclaración o decisión de diseño que quieran discutir en profundidad la charlamos durante la defensa. Es el espacio ideal para que puedan fundamentar sus decisiones técnicas y resolver cualquier duda que haya quedado abierta en esta revisión. 
