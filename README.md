# BuscaloYA — Payments App

Microservicio de **pagos** de la plataforma de delivery BuscaloYA (Tipo B). Orquesta el ciclo
financiero: crea las órdenes de compra (es la fuente de verdad del `order_id`), procesa el cobro vía
**MercadoPago** (sandbox), notifica a las apps de Seller y Buyer, y liquida a vendedores y
repartidores al cerrarse la entrega. Incluye un **panel de administración** web para consultar y
gestionar el estado de las órdenes.

Construido con **Next.js 15** (App Router), **Supabase** (PostgreSQL), **MercadoPago SDK v2** y
**Clerk** para autenticación y roles.

## 🔗 Deploy

**Producción:** https://proyecto-b-payments-buscaloya.vercel.app

## 👤 Acceso por tipo de usuario

La autenticación es con **Clerk**. Se ingresa por la raíz (`/`), que muestra el login y luego
**enruta automáticamente según el rol** (definido en `publicMetadata.role`):

| Rol | Al iniciar sesión | Credenciales |
|-----|-------------------|--------------|
| **Administrador financiero** (`finance_admin`) | Redirige al panel `/admin`: listado de órdenes, totales por estado y gestión de estado. | Usuario: `adminpayment@iaw.com` · Clave: `Iaw#5656` |
| **Comprador (usuario final)** | Redirige al checkout de su orden pendiente para pagarla con MercadoPago. | Usuario: `userpayment@iaw.com` · Clave: `Iaw#5656` |

## 💳 Tarjetas de prueba (MercadoPago sandbox)

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

## 🚀 Desarrollo local

```bash
cp .env.example .env.local   # completar valores
npm install
npm run dev                  # http://localhost:3000
```

Base de datos: ejecutar `supabase/schema.sql` y luego `supabase/seed.sql` en el SQL editor de Supabase.

## 👥 Integrantes

| Integrante | App |
|------------|-----|
| Fernando Champredonde | Buyer App |
| Laureano Gandrup | Seller App |
| Tomas Ferner | Delivery App |
| **Marcos Simon Fernandez** | **Payments App** |
