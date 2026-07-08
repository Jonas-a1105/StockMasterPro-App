-- =============================================================================
-- RLS (Row Level Security) - Políticas de Aislamiento por Tenant
-- =============================================================================
-- Ejecutar este script en Supabase SQL Editor (o psql) después de las migraciones.
--
-- IMPORTANTE: La app usa su propio JWT (NestJS + Passport), no Supabase Auth.
-- Por eso las políticas usan `current_setting('app.tenant_id')` en lugar de
-- `auth.jwt() -> 'tenant_id'`.
--
-- Para que esto funcione, cada consulta debe ejecutarse dentro de una transacción
-- que primero llame a:
--   SELECT set_config('app.tenant_id', tenantId, true);
--
-- Ejemplo desde NestJS con Prisma:
--   this.prisma.$transaction([
--     this.prisma.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '${tenantId}', true)`),
--     this.prisma.product.findMany({ where: { tenantId } }),
--   ]);
-- =============================================================================

-- 1. Habilitar RLS en todas las tablas multi-tenant
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE payable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_thread_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_messages ENABLE ROW LEVEL SECURITY;

-- 2. Políticas SELECT (lectura)
-- Cada usuario solo ve registros de su propio tenant
CREATE POLICY tenant_select ON tenants
  FOR SELECT USING (id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON users
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON products
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON categories
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON sales
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON sale_items
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON customers
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON suppliers
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON warehouses
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON purchase_orders
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON purchase_order_items
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON inventory_movements
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON accounts_payable
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON payable_payments
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON expenses
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON credit_notes
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON credit_note_items
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON events
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON accounts_receivable
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON receivable_payments
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON cash_sessions
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON cash_transactions
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON refresh_tokens
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_profiles
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_posts
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_catalogs
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_catalog_items
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_comments
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_reactions
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_follows
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_notifications
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_threads
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_thread_members
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_select ON social_messages
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- 3. Políticas INSERT (creación)
CREATE POLICY tenant_insert ON products
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON categories
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON sales
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON sale_items
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON customers
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON suppliers
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON warehouses
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON purchase_orders
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON purchase_order_items
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON inventory_movements
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON accounts_payable
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON payable_payments
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON expenses
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON credit_notes
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON credit_note_items
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON events
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON accounts_receivable
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON receivable_payments
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON cash_sessions
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON cash_transactions
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON refresh_tokens
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_profiles
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_posts
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_catalogs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_catalog_items
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_comments
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_reactions
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_follows
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_notifications
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_threads
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_thread_members
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_insert ON social_messages
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- 4. Políticas UPDATE y DELETE se manejan con USING (igual que SELECT)
-- Nota: se crea una política FOR ALL que cubre UPDATE y DELETE
CREATE POLICY tenant_modify ON products
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON categories
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON sales
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON customers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON suppliers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON warehouses
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON purchase_orders
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON accounts_payable
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON expenses
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON credit_notes
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON inventory_movements
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON events
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON accounts_receivable
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON receivable_payments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON cash_sessions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON cash_transactions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON refresh_tokens
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_profiles
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_posts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_catalogs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_catalog_items
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_comments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_reactions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_follows
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_notifications
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_threads
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_thread_members
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_modify ON social_messages
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- =============================================================================
-- Nota: Las políticas FOR ALL no afectan INSERT (WITH CHECK es separado).
-- Las políticas INSERT ya están definidas arriba.
-- =============================================================================
