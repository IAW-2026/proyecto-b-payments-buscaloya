-- ──────────────────────────────────────────────────────────────
-- Payments App — datos de ejemplo (Etapa 2)
-- Correr DESPUÉS de schema.sql, en Supabase → SQL Editor.
--
-- Genera 18 órdenes en los 5 estados, con snapshots realistas.
-- NOTA: 3 órdenes están asignadas al comprador de prueba
-- payment+clerktest@iaw.com (userId real de Clerk: user_3EXuXSCyg9lcGDrEyySk4Zfedrq).
-- Al loguearse, la raíz lo lleva a la payment_pending. Para usar OTRA
-- cuenta, reemplazá ese userId abajo.
-- ──────────────────────────────────────────────────────────────

insert into orders
  (order_id, buyer_id, store_id, status, total_amount, delivery_cost,
   mp_preference_id, mp_payment_id,
   items_snapshot, delivery_address_snapshot, delivery_quote_snapshot, created_at)
values
-- ── payment_pending ──────────────────────────────────────────
(gen_random_uuid(), 'user_3EXuXSCyg9lcGDrEyySk4Zfedrq', gen_random_uuid(), 'payment_pending', 4150.00, 350.00,
 'MP-1001', null,
 '[{"product_id":"prod_pizza","seller_id":"user_seller_pizza","name":"Pizza Especial","unit_price":1500.00,"quantity":2},{"product_id":"prod_papas","seller_id":"user_seller_pizza","name":"Papas fritas","unit_price":800.00,"quantity":1}]'::jsonb,
 '{"street":"Av. Corrientes 1234","city":"Buenos Aires","zip":"1043"}'::jsonb,
 '{"quote_id":"quo_1001","cost":350.00,"estimated_minutes":25}'::jsonb, now() - interval '2 hours'),

(gen_random_uuid(), 'user_buyer_beto',  gen_random_uuid(), 'payment_pending', 2480.00, 480.00,
 'MP-1002', null,
 '[{"product_id":"prod_sushi","seller_id":"user_seller_sushi","name":"Combo Sushi 20p","unit_price":2000.00,"quantity":1}]'::jsonb,
 '{"street":"Alem 742","city":"Bahía Blanca","zip":"8000"}'::jsonb,
 '{"quote_id":"quo_1002","cost":480.00,"estimated_minutes":35}'::jsonb, now() - interval '1 hour'),

(gen_random_uuid(), 'user_buyer_caro',  gen_random_uuid(), 'payment_pending', 1300.00, 300.00,
 'MP-1003', null,
 '[{"product_id":"prod_emp","seller_id":"user_seller_emp","name":"Docena de empanadas","unit_price":1000.00,"quantity":1}]'::jsonb,
 '{"street":"San Martín 50","city":"Córdoba","zip":"5000"}'::jsonb,
 '{"quote_id":"quo_1003","cost":300.00,"estimated_minutes":20}'::jsonb, now() - interval '30 minutes'),

-- ── paid ─────────────────────────────────────────────────────
(gen_random_uuid(), 'user_3EXuXSCyg9lcGDrEyySk4Zfedrq', gen_random_uuid(), 'paid', 5600.00, 600.00,
 'MP-2001', 112233445566,
 '[{"product_id":"prod_milanapo","seller_id":"user_seller_bodegon","name":"Milanesa napolitana","unit_price":2500.00,"quantity":2}]'::jsonb,
 '{"street":"Rivadavia 980","city":"Rosario","zip":"2000"}'::jsonb,
 '{"quote_id":"quo_2001","cost":600.00,"estimated_minutes":40}'::jsonb, now() - interval '5 hours'),

(gen_random_uuid(), 'user_buyer_dani',  gen_random_uuid(), 'paid', 3200.00, 200.00,
 'MP-2002', 112233445567,
 '[{"product_id":"prod_burger","seller_id":"user_seller_burger","name":"Doble cheeseburger","unit_price":1500.00,"quantity":2}]'::jsonb,
 '{"street":"Belgrano 321","city":"Mendoza","zip":"5500"}'::jsonb,
 '{"quote_id":"quo_2002","cost":200.00,"estimated_minutes":18}'::jsonb, now() - interval '6 hours'),

(gen_random_uuid(), 'user_buyer_beto',  gen_random_uuid(), 'paid', 4750.00, 250.00,
 'MP-2003', 112233445568,
 '[{"product_id":"prod_parrilla","seller_id":"user_seller_parri","name":"Parrillada para 2","unit_price":4500.00,"quantity":1}]'::jsonb,
 '{"street":"Mitre 1500","city":"La Plata","zip":"1900"}'::jsonb,
 '{"quote_id":"quo_2003","cost":250.00,"estimated_minutes":30}'::jsonb, now() - interval '1 day'),

(gen_random_uuid(), 'user_buyer_caro',  gen_random_uuid(), 'paid', 2100.00, 350.00,
 'MP-2004', 112233445569,
 '[{"product_id":"prod_helado","seller_id":"user_seller_helado","name":"1kg helado artesanal","unit_price":1750.00,"quantity":1}]'::jsonb,
 '{"street":"Sarmiento 77","city":"Bahía Blanca","zip":"8000"}'::jsonb,
 '{"quote_id":"quo_2004","cost":350.00,"estimated_minutes":22}'::jsonb, now() - interval '1 day 3 hours'),

-- ── failed ───────────────────────────────────────────────────
(gen_random_uuid(), 'user_buyer_dani',  gen_random_uuid(), 'failed', 980.00, 280.00,
 'MP-3001', 112233440001,
 '[{"product_id":"prod_cafe","seller_id":"user_seller_cafe","name":"Café + medialunas","unit_price":700.00,"quantity":1}]'::jsonb,
 '{"street":"9 de Julio 12","city":"Tucumán","zip":"4000"}'::jsonb,
 '{"quote_id":"quo_3001","cost":280.00,"estimated_minutes":15}'::jsonb, now() - interval '8 hours'),

(gen_random_uuid(), 'user_buyer_ele',   gen_random_uuid(), 'failed', 6300.00, 300.00,
 'MP-3002', 112233440002,
 '[{"product_id":"prod_asado","seller_id":"user_seller_parri","name":"Asado completo","unit_price":3000.00,"quantity":2}]'::jsonb,
 '{"street":"Colón 450","city":"Mar del Plata","zip":"7600"}'::jsonb,
 '{"quote_id":"quo_3002","cost":300.00,"estimated_minutes":28}'::jsonb, now() - interval '2 days'),

(gen_random_uuid(), 'user_3EXuXSCyg9lcGDrEyySk4Zfedrq', gen_random_uuid(), 'failed', 1620.00, 420.00,
 'MP-3003', 112233440003,
 '[{"product_id":"prod_wok","seller_id":"user_seller_wok","name":"Wok de pollo","unit_price":1200.00,"quantity":1}]'::jsonb,
 '{"street":"Güemes 200","city":"Salta","zip":"4400"}'::jsonb,
 '{"quote_id":"quo_3003","cost":420.00,"estimated_minutes":33}'::jsonb, now() - interval '2 days 5 hours'),

-- ── cancelled ────────────────────────────────────────────────
(gen_random_uuid(), 'user_buyer_beto',  gen_random_uuid(), 'cancelled', 2200.00, 200.00,
 'MP-4001', null,
 '[{"product_id":"prod_pizza","seller_id":"user_seller_pizza","name":"Pizza muzzarella","unit_price":1000.00,"quantity":2}]'::jsonb,
 '{"street":"Lavalle 600","city":"Buenos Aires","zip":"1047"}'::jsonb,
 '{"quote_id":"quo_4001","cost":200.00,"estimated_minutes":20}'::jsonb, now() - interval '3 days'),

(gen_random_uuid(), 'user_buyer_caro',  gen_random_uuid(), 'cancelled', 3550.00, 550.00,
 'MP-4002', null,
 '[{"product_id":"prod_sushi","seller_id":"user_seller_sushi","name":"Combo Sushi 30p","unit_price":3000.00,"quantity":1}]'::jsonb,
 '{"street":"Entre Ríos 100","city":"Paraná","zip":"3100"}'::jsonb,
 '{"quote_id":"quo_4002","cost":550.00,"estimated_minutes":45}'::jsonb, now() - interval '3 days 6 hours'),

-- ── closed (entregada + liquidada) ───────────────────────────
(gen_random_uuid(), 'user_buyer_dani',  gen_random_uuid(), 'closed', 4400.00, 400.00,
 'MP-5001', 112233550001,
 '[{"product_id":"prod_milanapo","seller_id":"user_seller_bodegon","name":"Milanesa napolitana","unit_price":2000.00,"quantity":2}]'::jsonb,
 '{"street":"Av. Pellegrini 1500","city":"Rosario","zip":"2000"}'::jsonb,
 '{"quote_id":"quo_5001","cost":400.00,"estimated_minutes":38}'::jsonb, now() - interval '4 days'),

(gen_random_uuid(), 'user_buyer_ana',   gen_random_uuid(), 'closed', 1850.00, 350.00,
 'MP-5002', 112233550002,
 '[{"product_id":"prod_emp","seller_id":"user_seller_emp","name":"Docena empanadas árabes","unit_price":1500.00,"quantity":1}]'::jsonb,
 '{"street":"Brown 88","city":"Bahía Blanca","zip":"8000"}'::jsonb,
 '{"quote_id":"quo_5002","cost":350.00,"estimated_minutes":24}'::jsonb, now() - interval '5 days'),

(gen_random_uuid(), 'user_buyer_ele',   gen_random_uuid(), 'closed', 7200.00, 700.00,
 'MP-5003', 112233550003,
 '[{"product_id":"prod_parrilla","seller_id":"user_seller_parri","name":"Parrillada premium","unit_price":6500.00,"quantity":1}]'::jsonb,
 '{"street":"Av. Luro 3000","city":"Mar del Plata","zip":"7600"}'::jsonb,
 '{"quote_id":"quo_5003","cost":700.00,"estimated_minutes":42}'::jsonb, now() - interval '6 days'),

(gen_random_uuid(), 'user_buyer_beto',  gen_random_uuid(), 'closed', 2650.00, 150.00,
 'MP-5004', 112233550004,
 '[{"product_id":"prod_burger","seller_id":"user_seller_burger","name":"Combo burger + papas","unit_price":2500.00,"quantity":1}]'::jsonb,
 '{"street":"Yrigoyen 45","city":"Neuquén","zip":"8300"}'::jsonb,
 '{"quote_id":"quo_5004","cost":150.00,"estimated_minutes":16}'::jsonb, now() - interval '7 days'),

(gen_random_uuid(), 'user_buyer_caro',  gen_random_uuid(), 'closed', 3300.00, 300.00,
 'MP-5005', 112233550005,
 '[{"product_id":"prod_wok","seller_id":"user_seller_wok","name":"Wok de cerdo","unit_price":1500.00,"quantity":2}]'::jsonb,
 '{"street":"España 222","city":"Córdoba","zip":"5000"}'::jsonb,
 '{"quote_id":"quo_5005","cost":300.00,"estimated_minutes":27}'::jsonb, now() - interval '8 days');
