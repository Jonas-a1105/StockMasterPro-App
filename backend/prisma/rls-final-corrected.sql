-- ============================================================
-- RLS FINAL PARA STOCKMASTER PRO - VERSIÓN POSTGRESQL CORREGIDA
-- ============================================================
-- Ejecutar en Supabase SQL Editor (un solo bloque)
-- Corrección: tablas sin tenant_id usan subquery al padre

-- ============================================================
-- 1. DESHABILITAR RLS EN TABLAS DE AUTENTICACIÓN (LOGIN)
-- ============================================================
ALTER TABLE IF EXISTS "public"."users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."tenants" DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. HABILITAR RLS EN TABLAS CON tenant_id DIRECTA
-- ============================================================
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'products', 'categories', 'customers', 'suppliers',
        'warehouses', 'product_warehouses', 'product_lots',
        'sales', 'sale_items', 'sale_payments',
        'warehouse_transfers',
        'purchase_orders', 'purchase_order_items',
        'inventory_movements',
        'accounts_payable', 'payable_payments',
        'accounts_receivable', 'receivable_payments',
        'expenses', 'credit_notes',
        'cash_sessions', 'cash_transactions',
        'refresh_tokens', 'invoice_sequences',
        'tax_withholdings', 'accounts',
        'journal_entries', 'journal_entry_lines',
        'fiscal_periods', 'account_balances',
        'cost_centers', 'projects', 'tax_rates',
        'exchange_rates', 'inventory_counts',
        'inventory_count_items', 'events', 'licenses',
        'social_profiles', 'social_posts', 'social_catalogs',
        'social_catalog_items', 'social_comments',
        'social_reactions', 'social_follows',
        'social_notifications', 'social_threads', 'social_messages',
        'tenant_settings'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE IF EXISTS "public"."%s" ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

-- ============================================================
-- 3. POLÍTICAS tenant_id PARA TABLAS CON tenant_id DIRECTA
-- ============================================================
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'products', 'categories', 'customers', 'suppliers',
        'warehouses', 'product_warehouses', 'product_lots',
        'sales', 'sale_items', 'sale_payments',
        'warehouse_transfers',
        'purchase_orders', 'purchase_order_items',
        'inventory_movements',
        'accounts_payable', 'payable_payments',
        'accounts_receivable', 'receivable_payments',
        'expenses', 'credit_notes',
        'cash_sessions', 'cash_transactions',
        'refresh_tokens', 'invoice_sequences',
        'tax_withholdings', 'accounts',
        'journal_entries', 'journal_entry_lines',
        'fiscal_periods', 'account_balances',
        'cost_centers', 'projects', 'tax_rates',
        'exchange_rates', 'inventory_counts',
        'inventory_count_items', 'events', 'licenses',
        'social_profiles', 'social_posts', 'social_catalogs',
        'social_catalog_items', 'social_comments',
        'social_reactions', 'social_follows',
        'social_notifications', 'social_threads', 'social_messages',
        'tenant_settings'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS tenant_isolation_%s ON "public"."%s"',
            tbl, tbl
        );
        EXECUTE format(
            'CREATE POLICY tenant_isolation_%s ON "public"."%s" USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid)',
            tbl, tbl
        );
    END LOOP;
END $$;

-- ============================================================
-- 4. TABLAS SIN tenant_id DIRECTA (heredan vía JOIN con padre)
-- ============================================================

-- 4a. credit_note_items -> credit_notes.tenant_id
ALTER TABLE IF EXISTS "public"."credit_note_items" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_credit_note_items ON "public"."credit_note_items";
CREATE POLICY tenant_isolation_credit_note_items ON "public"."credit_note_items"
  USING (
    credit_note_id IN (
      SELECT id FROM "public"."credit_notes"
      WHERE tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  );

-- 4b. warehouse_transfer_items -> warehouse_transfers.tenant_id
ALTER TABLE IF EXISTS "public"."warehouse_transfer_items" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_warehouse_transfer_items ON "public"."warehouse_transfer_items";
CREATE POLICY tenant_isolation_warehouse_transfer_items ON "public"."warehouse_transfer_items"
  USING (
    transfer_id IN (
      SELECT id FROM "public"."warehouse_transfers"
      WHERE tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  );

-- 4c. social_thread_members -> social_threads.tenant_id
ALTER TABLE IF EXISTS "public"."social_thread_members" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_social_thread_members ON "public"."social_thread_members";
CREATE POLICY tenant_isolation_social_thread_members ON "public"."social_thread_members"
  USING (
    thread_id IN (
      SELECT id FROM "public"."social_threads"
      WHERE tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  );

-- ============================================================
-- 5. FUNCIÓN HELPER PARA SETEAR tenant_id EN SESIÓN
-- ============================================================
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id::text, true);
END;
$$;

-- ============================================================
-- 6. VERIFICACIÓN
-- ============================================================

-- Verificar que RLS está habilitado en tablas correctas
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'tenants', 'products', 'sales', 'customers', 'licenses', 'credit_note_items')
ORDER BY tablename;

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('products', 'sales', 'customers', 'users', 'tenants', 'licenses', 'credit_note_items')
ORDER BY tablename, policyname;

-- ============================================================
-- NOTAS IMPORTANTES:
-- ============================================================
-- 1. Las tablas users y tenants NO tienen RLS (deshabilitado al inicio)
-- 2. El login usa AuthPrismaService que conecta con rol postgres (bypass RLS)
-- 3. El RLSInterceptor setea app.tenant_id en cada request autenticado
-- 4. credit_note_items, warehouse_transfer_items, social_thread_members
--    NO tienen columna tenant_id directa; su RLS usa subquery al padre
-- 5. Ejecutar este script COMPLETO en Supabase SQL Editor (un solo bloque)
