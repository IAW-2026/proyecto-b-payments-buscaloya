[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/5GGlgeOr)

# BuscaloYA — Payments App

**Tipo B — Plataforma de Delivery** · Microservicio de pagos · Responsable: **Marcos Simon Fernandez**

Orquesta el ciclo financiero de la plataforma: crea las órdenes de compra (fuente de verdad del
`order_id`), procesa el cobro vía **MercadoPago** (sandbox), notifica a las apps de Seller y Buyer,
y liquida a vendedores y repartidores al cerrarse la entrega.

## 🔗 Deploy

**Producción:** _<completar con el link de Vercel>_

## 👤 Acceso / credenciales

| Rol | Cómo acceder |
|-----|--------------|
| **Administrador financiero** | Iniciar sesión y abrir `/admin`. Usuario: `_<email admin>_` · Clave: `_<clave>_` |
| **Comprador (usuario final)** | Iniciar sesión y abrir `/checkout/{order_id}` de una orden propia. Usuario: `_<email buyer>_` · Clave: `_<clave>_` |

> El rol se gestiona con `publicMetadata.role` en Clerk (`finance_admin` para el admin). Para que el
> rol viaje en el JWT, en **Clerk Dashboard → Sessions → Customize session token** agregar:
> `{ "metadata": "{{user.public_metadata}}" }`.

## 🧱 Stack

- **Next.js 15** (App Router) + TypeScript
- **Supabase** (PostgreSQL) — tabla `orders` con snapshots inmutables
- **MercadoPago SDK v2** + Payment Brick (`@mercadopago/sdk-react`)
- **Clerk** — autenticación y roles

## ✨ Funcionalidades

- **Panel financiero** (`/admin`, sólo `finance_admin`): listado de órdenes con **búsqueda y
  paginación por URL**, reporte de totales/ingresos por estado, detalle de orden y gestión de estado
  (con validación del lado del servidor).
- **Checkout** (`/checkout/{order_id}`): resumen + Payment Brick, protegido por Clerk (el comprador
  sólo ve sus órdenes).
- **API REST** para los demás servicios (ver `docs/03-apis.md`).
- Páginas de **404** y **error** propias.

## 🗺️ Endpoints principales

| Ruta | Auth | Descripción |
|------|------|-------------|
| `POST /api/orders` | SERVICE_TOKEN | Crear orden + preferencia MP |
| `GET /api/orders/[order_id]` | Bearer | Detalle de orden |
| `POST /api/payments/process` | Browser | Confirmar pago desde el Brick |
| `POST /api/payments/webhook` | Público | Webhook de MercadoPago |
| `POST /api/payments/issue` | SERVICE_TOKEN | Consulta de estado (Seller) |
| `POST /api/payments/operations/[order_id]/close` | SERVICE_TOKEN | Cierre + liquidaciones (Delivery) |
| `GET /api/health` | Público | Health check |

## 🚀 Desarrollo local

```bash
cp .env.example .env.local   # completar valores
npm install
npm run dev                  # http://localhost:3000
```

Base de datos: correr `supabase/schema.sql` y luego `supabase/seed.sql` en el SQL editor de Supabase.

## 📚 Documentación (Etapa 1)

| # | Entregable | Archivo |
|---|------------|---------|
| 1.1 | Descripción del sistema | [docs/01-descripcion.md](docs/01-descripcion.md) |
| 1.2 | Asignación de responsabilidades | [docs/02-responsabilidades.md](docs/02-responsabilidades.md) |
| 1.3 | Diseño de APIs inter-servicios | [docs/03-apis.md](docs/03-apis.md) |
| 1.4 | Modelo de datos | [docs/04.modelo-de-datos.md](docs/04.modelo-de-datos.md) |
| 1.5 | Usuarios compartidos | [docs/05.usuarios.md](docs/05.usuarios.md) |

## 👥 Integrantes

| Integrante | App |
|------------|-----|
| Fernando Champredonde | Buyer App |
| Laureano Gandrup | Seller App |
| Tomas Ferner | Delivery App |
| **Marcos Simon Fernandez** | **Payments App** |
