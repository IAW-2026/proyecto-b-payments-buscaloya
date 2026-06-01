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
| **Administrador financiero** (`finance_admin`) | Redirige al panel `/admin`: listado de órdenes, totales por estado y gestión de estado. | Usuario: `<email-admin>` · Clave: `<clave-admin>` |
| **Comprador (usuario final)** | Redirige al checkout de su orden pendiente para pagarla con MercadoPago. | Usuario: `<email-comprador>` · Clave: `<clave-comprador>` |

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
