# BuscaloYA — Payments App

## 🔗 Deploy

**Producción:** https://proyecto-b-payments-buscaloya.vercel.app

## 👤 Usuarios de prueba

La autenticación es con **Clerk**. Se ingresa por la raíz (`/`), que muestra el login y luego
**enruta automáticamente según el rol** (definido en `publicMetadata.role`):

| Rol | Al iniciar sesión | Credenciales |
|-----|-------------------|--------------|
| **Administrador financiero** (`finance_admin`) | Redirige al panel `/admin`: listado de órdenes, totales por estado y gestión de estado. | Usuario: `payment+clerktest+admin@iaw.com` · Clave: `iawuser#` |
| **Comprador (usuario final)** | Redirige al checkout de su orden pendiente para pagarla con MercadoPago. | Usuario: `payment+clerktest@iaw.com` · Clave: `iawuser#` |

## 🧭 Instrucciones de uso / evaluación

- **Como administrador financiero:** al iniciar sesión llegás al panel `/admin`, con el listado de
  órdenes, totales por estado y la posibilidad de cambiar el estado de cada orden.
- **Como comprador:** al iniciar sesión la app te lleva al checkout de tu orden pendiente para
  pagarla con MercadoPago (sandbox). En la barra superior tenés el botón para **cerrar sesión** y
  poder ingresar con otra cuenta.

### 💳 Tarjetas de prueba (MercadoPago sandbox)

Para pagar como comprador, usá cualquiera de estas tarjetas de prueba:

| Tarjeta | Número | CVV | Vencimiento |
|---------|--------|-----|-------------|
| Mastercard | `5031 7557 3453 0604` | `123` | `11/30` |
| Visa | `4509 9535 6623 3704` | `123` | `11/30` |
| American Express | `3711 803032 57522` | `1234` | `11/30` |
| Mastercard Débito | `5287 3383 1025 3304` | `123` | `11/30` |
| Visa Débito | `4002 7686 9439 5619` | `123` | `11/30` |

El **resultado del pago lo define el nombre del titular** de la tarjeta:

| Titular | Resultado |
|---------|-----------|
| `APRO` | Pago aprobado |
| `OTHE` | Rechazado por error general |
| `CONT` | Pendiente de pago |
| `CALL` | Rechazado con validación para autorizar |
| `FUND` | Rechazado por importe insuficiente |
| `SECU` | Rechazado por código de seguridad inválido |
| `EXPI` | Rechazado por fecha de vencimiento |
| `FORM` | Rechazado por error de formulario |

Documento de identidad: tipo **DNI**, número `12345678`.

### 🚀 Desarrollo local

```bash
cp .env.example .env.local   # completar valores
pnpm install
pnpm dev                     # http://localhost:3000
```

Base de datos: ejecutar `supabase/schema.sql` y luego `supabase/seed.sql` en el SQL editor de Supabase.

## 📋 Descripción del proyecto

Microservicio de **pagos** de la plataforma de delivery BuscaloYA (Tipo B). Orquesta el ciclo
financiero: crea las órdenes de compra (es la fuente de verdad del `order_id`), procesa el cobro vía
**MercadoPago** (sandbox), notifica a las apps de Seller y Buyer, y liquida a vendedores y
repartidores al cerrarse la entrega. Incluye un **panel de administración** web para consultar y
gestionar el estado de las órdenes.

Construido con **Next.js 15** (App Router), **Supabase** (PostgreSQL), **MercadoPago SDK v2** y
**Clerk** para autenticación y roles.

## 📝 Notas para la corrección

- **Pagos en sandbox:** MercadoPago corre en modo sandbox; el resultado del pago se controla con el
  nombre del titular de la tarjeta (ver tabla de tarjetas de prueba).
- **Datos precargados:** `supabase/seed.sql` genera 18 órdenes en los 5 estados
  (`payment_pending`, `paid`, `failed`, `cancelled`, `closed`) para poder recorrer el panel admin.
  De esas, 3 quedan asignadas al comprador de prueba (`payment+clerktest@iaw.com`) para que pueda
  ver y pagar una orden pendiente.
- **Logout en todas las vistas:** se agregó una barra superior con cierre de sesión en el checkout y
  en la pantalla de "sin órdenes", para poder cambiar de cuenta sin quedar atrapado.
- **Roles vía Clerk:** el ruteo desde la raíz depende de `publicMetadata.role`; sin ese rol el
  usuario se trata como comprador.

## 👥 Integrantes

| Integrante | App |
|------------|-----|
| Fernando Champredonde | Buyer App |
| Laureano Gandrup | Seller App |
| Tomas Ferner | Delivery App |
| **Marcos Simon Fernandez** | **Payments App** |
