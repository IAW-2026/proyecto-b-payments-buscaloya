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

La autenticación es con **Clerk**. El rol se define en `publicMetadata.role`: `finance_admin`
habilita el panel `/admin`; cualquier otro usuario es comprador.

| Rol | Cómo acceder | Credenciales |
|-----|--------------|--------------|
| **Administrador financiero** | Iniciar sesión y abrir `/admin` (listado de órdenes, totales y gestión de estado). | Usuario: `<email-admin>` · Clave: `<clave-admin>` |
| **Comprador (usuario final)** | Iniciar sesión y abrir `/checkout/{order_id}` de una orden propia para pagar. | Usuario: `<email-comprador>` · Clave: `<clave-comprador>` |

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
