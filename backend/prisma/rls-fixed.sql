-- =============================================================================
-- RLS (Row Level Security) - Políticas de Aislamiento por Tenant
-- =============================================================================
-- CORREGIDO: solo tablas con tenant_id, prefijo public., y current_setting
-- con segundo argumento true para rutas públicas (login/register)
-- =============================================================================

-- 1. Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_thread_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_messages ENABLE ROW LEVEL SECURITY;

-- 2. Políticas SELECT
CREATE POLICY tenant_select ON public.tenants
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = id);

CREATE POLICY tenant_select ON public.users
  FOR SELECT USING (
    current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true)::uuid = tenant_id
  );

CREATE POLICY tenant_select ON public.products
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.categories
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.sales
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.sale_items
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.customers
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.suppliers
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.warehouses
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.purchase_orders
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.purchase_order_items
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.inventory_movements
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.accounts_payable
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.payable_payments
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.expenses
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.credit_notes
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

-- credit_note_items NO tiene tenant_id, hereda de credit_notes
CREATE POLICY tenant_select ON public.credit_note_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.credit_notes
      WHERE public.credit_notes.id = credit_note_id
      AND public.credit_notes.tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  );

CREATE POLICY tenant_select ON public.events
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.accounts_receivable
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.receivable_payments
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.cash_sessions
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.cash_transactions
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.refresh_tokens
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.social_profiles
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.social_posts
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.social_catalogs
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.social_catalog_items
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.social_comments
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.social_reactions
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.social_follows
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.social_notifications
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_select ON public.social_threads
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

-- social_thread_members NO tiene tenant_id, hereda de social_threads
CREATE POLICY tenant_select ON public.social_thread_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.social_threads
      WHERE public.social_threads.id = thread_id
      AND public.social_threads.tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  );

CREATE POLICY tenant_select ON public.social_messages
  FOR SELECT USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

-- 3. Políticas INSERT
CREATE POLICY tenant_insert ON public.products
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.categories
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.sales
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.sale_items
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.customers
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.suppliers
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.warehouses
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.purchase_orders
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.purchase_order_items
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.inventory_movements
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.accounts_payable
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.payable_payments
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.expenses
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.credit_notes
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.events
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.accounts_receivable
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.receivable_payments
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.cash_sessions
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.cash_transactions
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.refresh_tokens
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.social_profiles
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.social_posts
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.social_catalogs
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.social_catalog_items
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.social_comments
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.social_reactions
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.social_follows
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.social_notifications
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.social_threads
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_insert ON public.social_messages
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true)::uuid = tenant_id);

-- 4. Políticas FOR ALL (UPDATE/DELETE)
CREATE POLICY tenant_modify ON public.products
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.categories
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.sales
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.customers
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.suppliers
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.warehouses
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.purchase_orders
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.expenses
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.credit_notes
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.inventory_movements
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.events
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.accounts_receivable
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.receivable_payments
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.cash_sessions
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.cash_transactions
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.refresh_tokens
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.social_profiles
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.social_posts
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.social_catalogs
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.social_catalog_items
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.social_comments
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.social_reactions
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.social_follows
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.social_notifications
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.social_threads
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);

CREATE POLICY tenant_modify ON public.social_messages
  FOR ALL USING (current_setting('app.tenant_id', true)::uuid = tenant_id);
