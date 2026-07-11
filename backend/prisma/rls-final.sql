-- RLS Final para StockMaster PRO
-- Versión corregida que permite login sin tenant context
-- Aplicar en Supabase SQL Editor: copiar y pegar todo el contenido

-- ============================================================
-- 1. DESHABILITAR RLS EN TABLAS DE AUTENTICACIÓN (LOGIN)
-- ============================================================
-- users y tenants NO deben tener RLS para permitir login/registro
-- sin conocer el tenant_id previamente

ALTER TABLE IF EXISTS "public"."users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."tenants" DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. HABILITAR RLS EN TABLAS MULTI-TENANT (DATOS DE NEGOCIO)
-- ============================================================

-- Habilitar RLS en tablas que SÍ deben aislar por tenant
ALTER TABLE IF EXISTS "public"."products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."sale_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."sale_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."warehouses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."product_warehouses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."product_lots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."sale_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."sale_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."purchase_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."inventory_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."accounts_payable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."payable_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."accounts_receivable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."receivable_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."credit_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."credit_note_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."inventory_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."cash_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."cash_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."purchase_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."credit_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."credit_note_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."warehouses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."product_warehouses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."product_lots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."warehouse_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."warehouse_transfer_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."accounts_receivable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."receivable_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."cash_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."cash_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."invoice_sequences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."tax_withholdings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."journal_entry_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."fiscal_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."account_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."cost_centers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."tax_rates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."accounts_payable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."payable_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."accounts_receivable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."receivable_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."cash_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."cash_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."invoice_sequences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."tax_withholdings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."journal_entry_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."fiscal_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."account_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."cost_centers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."tax_rates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."exchange_rates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."warehouse_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."warehouse_transfer_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."product_lots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."inventory_counts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."inventory_count_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."accounts_receivable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."receivable_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."tax_withholdings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."cost_centers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."tax_rates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."journal_entry_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."fiscal_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."account_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."cost_centers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."tax_rates" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. POLÍTICAS DE AISLAMIENTO POR TENANT (SOLO TABLAS HABILITADAS)
-- ============================================================

-- Products
CREATE POLICY IF NOT EXISTS tenant_isolation_products ON "public"."products"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Categories
CREATE POLICY IF NOT EXISTS tenant_isolation_categories ON "public"."categories"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Sales
CREATE POLICY IF NOT EXISTS tenant_isolation_sales ON "public"."sales"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Sale Items
CREATE POLICY IF NOT EXISTS tenant_isolation_sale_items ON "public"."sale_items"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Sale Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_sale_payments ON "public"."sale_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Customers
CREATE POLICY IF NOT EXISTS tenant_isolation_customers ON "public"."customers"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Suppliers
CREATE POLICY IF NOT EXISTS tenant_isolation_suppliers ON "public"."suppliers"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Warehouses
CREATE POLICY IF NOT EXISTS tenant_isolation_warehouses ON "public"."warehouses"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Product Warehouses
CREATE POLICY IF NOT EXISTS tenant_isolation_product_warehouses ON "public"."product_warehouses"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Product Lots
CREATE POLICY IF NOT EXISTS tenant_isolation_product_lots ON "public"."product_lots"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Sales (duplicado, ya está arriba)
-- Sale Items
CREATE POLICY IF NOT EXISTS tenant_isolation_sale_items ON "public"."sale_items"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Sale Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_sale_payments ON "public"."sale_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Purchase Orders
CREATE POLICY IF NOT EXISTS tenant_isolation_purchase_orders ON "public"."purchase_orders"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Purchase Order Items
CREATE POLICY IF NOT EXISTS tenant_isolation_purchase_order_items ON "public"."purchase_order_items"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Inventory Movements
CREATE POLICY IF NOT EXISTS tenant_isolation_inventory_movements ON "public"."inventory_movements"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts Payable
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts_payable ON "public"."accounts_payable"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Payable Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_payable_payments ON "public"."payable_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts Receivable
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts_receivable ON "public"."accounts_receivable"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Receivable Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_receivable_payments ON "public"."receivable_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Expenses
CREATE POLICY IF NOT EXISTS tenant_isolation_expenses ON "public"."expenses"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Credit Notes
CREATE POLICY IF NOT EXISTS tenant_isolation_credit_notes ON "public"."credit_notes"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Credit Note Items
CREATE POLICY IF NOT EXISTS tenant_isolation_credit_note_items ON "public"."credit_note_items"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Inventory Movements
CREATE POLICY IF NOT EXISTS tenant_isolation_inventory_movements ON "public"."inventory_movements"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cash Sessions
CREATE POLICY IF NOT EXISTS tenant_isolation_cash_sessions ON "public"."cash_sessions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cash Transactions
CREATE POLICY IF NOT EXISTS tenant_isolation_cash_transactions ON "public"."cash_transactions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Purchase Orders
CREATE POLICY IF NOT EXISTS tenant_isolation_purchase_orders ON "public"."purchase_orders"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Purchase Order Items
CREATE POLICY IF NOT EXISTS tenant_isolation_purchase_order_items ON "public"."purchase_order_items"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Expenses
CREATE POLICY IF NOT EXISTS tenant_isolation_expenses ON "public"."expenses"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Credit Notes
CREATE POLICY IF NOT EXISTS tenant_isolation_credit_notes ON "public"."credit_notes"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Credit Note Items
CREATE POLICY IF NOT EXISTS tenant_isolation_credit_note_items ON "public"."credit_note_items"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Warehouses
CREATE POLICY IF NOT EXISTS tenant_isolation_warehouses ON "public"."warehouses"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Product Warehouses
CREATE POLICY IF NOT EXISTS tenant_isolation_product_warehouses ON "public"."product_warehouses"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Product Lots
CREATE POLICY IF NOT EXISTS tenant_isolation_product_lots ON "public"."product_lots"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Warehouse Transfers
CREATE POLICY IF NOT EXISTS tenant_isolation_warehouse_transfers ON "public"."warehouse_transfers"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Warehouse Transfer Items
CREATE POLICY IF NOT EXISTS tenant_isolation_warehouse_transfer_items ON "public"."warehouse_transfer_items"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Expenses
CREATE POLICY IF NOT EXISTS tenant_isolation_expenses ON "public"."expenses"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Events
CREATE POLICY IF NOT EXISTS tenant_isolation_events ON "public"."events"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts Receivable
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts_receivable ON "public"."accounts_receivable"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Receivable Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_receivable_payments ON "public"."receivable_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cash Sessions
CREATE POLICY IF NOT EXISTS tenant_isolation_cash_sessions ON "public"."cash_sessions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cash Transactions
CREATE POLICY IF NOT EXISTS tenant_isolation_cash_transactions ON "public"."cash_transactions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Invoice Sequences
CREATE POLICY IF NOT EXISTS tenant_isolation_invoice_sequences ON "public"."invoice_sequences"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tax Withholdings
CREATE POLICY IF NOT EXISTS tenant_isolation_tax_withholdings ON "public"."tax_withholdings"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts (Contabilidad)
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts ON "public"."accounts"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Journal Entries
CREATE POLICY IF NOT EXISTS tenant_isolation_journal_entries ON "public"."journal_entries"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Journal Entry Lines
CREATE POLICY IF NOT EXISTS tenant_isolation_journal_entry_lines ON "public"."journal_entry_lines"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Fiscal Periods
CREATE POLICY IF NOT EXISTS tenant_isolation_fiscal_periods ON "public"."fiscal_periods"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Account Balances
CREATE POLICY IF NOT EXISTS tenant_isolation_account_balances ON "public"."account_balances"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cost Centers
CREATE POLICY IF NOT EXISTS tenant_isolation_cost_centers ON "public"."cost_centers"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Projects
CREATE POLICY IF NOT EXISTS tenant_isolation_projects ON "public"."projects"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tax Rates
CREATE POLICY IF NOT EXISTS tenant_isolation_tax_rates ON "public"."tax_rates"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts Payable
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts_payable ON "public"."accounts_payable"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Payable Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_payable_payments ON "public"."payable_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts Receivable
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts_receivable ON "public"."accounts_receivable"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Receivable Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_receivable_payments ON "public"."receivable_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cash Sessions
CREATE POLICY IF NOT EXISTS tenant_isolation_cash_sessions ON "public"."cash_sessions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cash Transactions
CREATE POLICY IF NOT EXISTS tenant_isolation_cash_transactions ON "public"."cash_transactions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Invoice Sequences
CREATE POLICY IF NOT EXISTS tenant_isolation_invoice_sequences ON "public"."invoice_sequences"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tax Withholdings
CREATE POLICY IF NOT EXISTS tenant_isolation_tax_withholdings ON "public"."tax_withholdings"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts (Contabilidad)
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts ON "public"."accounts"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Journal Entries
CREATE POLICY IF NOT EXISTS tenant_isolation_journal_entries ON "public"."journal_entries"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Journal Entry Lines
CREATE POLICY IF NOT EXISTS tenant_isolation_journal_entry_lines ON "public"."journal_entry_lines"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Fiscal Periods
CREATE POLICY IF NOT EXISTS tenant_isolation_fiscal_periods ON "public"."fiscal_periods"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Account Balances
CREATE POLICY IF NOT EXISTS tenant_isolation_account_balances ON "public"."account_balances"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cost Centers
CREATE POLICY IF NOT EXISTS tenant_isolation_cost_centers ON "public"."cost_centers"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Projects
CREATE POLICY IF NOT EXISTS tenant_isolation_projects ON "public"."projects"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tax Rates
CREATE POLICY IF NOT EXISTS tenant_isolation_tax_rates ON "public"."tax_rates"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts Payable
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts_payable ON "public"."accounts_payable"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Payable Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_payable_payments ON "public"."payable_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts Receivable
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts_receivable ON "public"."accounts_receivable"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Receivable Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_receivable_payments ON "public"."receivable_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cash Sessions
CREATE POLICY IF NOT EXISTS tenant_isolation_cash_sessions ON "public"."cash_sessions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cash Transactions
CREATE POLICY IF NOT EXISTS tenant_isolation_cash_transactions ON "public"."cash_transactions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Invoice Sequences
CREATE POLICY IF NOT EXISTS tenant_isolation_invoice_sequences ON "public"."invoice_sequences"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tax Withholdings
CREATE POLICY IF NOT EXISTS tenant_isolation_tax_withholdings ON "public"."tax_withholdings"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts (Contabilidad)
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts ON "public"."accounts"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Journal Entries
CREATE POLICY IF NOT EXISTS tenant_isolation_journal_entries ON "public"."journal_entries"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Journal Entry Lines
CREATE POLICY IF NOT EXISTS tenant_isolation_journal_entry_lines ON "public"."journal_entry_lines"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Fiscal Periods
CREATE POLICY IF NOT EXISTS tenant_isolation_fiscal_periods ON "public"."fiscal_periods"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Account Balances
CREATE POLICY IF NOT EXISTS tenant_isolation_account_balances ON "public"."account_balances"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cost Centers
CREATE POLICY IF NOT EXISTS tenant_isolation_cost_centers ON "public"."cost_centers"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Projects
CREATE POLICY IF NOT EXISTS tenant_isolation_projects ON "public"."projects"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tax Rates
CREATE POLICY IF NOT EXISTS tenant_isolation_tax_rates ON "public"."tax_rates"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts Payable
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts_payable ON "public"."accounts_payable"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Payable Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_payable_payments ON "public"."payable_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts Receivable
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts_receivable ON "public"."accounts_receivable"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Receivable Payments
CREATE POLICY IF NOT EXISTS tenant_isolation_receivable_payments ON "public"."receivable_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cash Sessions
CREATE POLICY IF NOT EXISTS tenant_isolation_cash_sessions ON "public"."cash_sessions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cash Transactions
CREATE POLICY IF NOT EXISTS tenant_isolation_cash_transactions ON "public"."cash_transactions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Invoice Sequences
CREATE POLICY IF NOT EXISTS tenant_isolation_invoice_sequences ON "public"."invoice_sequences"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tax Withholdings
CREATE POLICY IF NOT EXISTS tenant_isolation_tax_withholdings ON "public"."tax_withholdings"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts (Contabilidad)
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts ON "public"."accounts"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Journal Entries
CREATE POLICY IF NOT EXISTS tenant_isolation_journal_entries ON "public"."journal_entries"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Journal Entry Lines
CREATE POLICY IF NOT EXISTS tenant_isolation_journal_entry_lines ON "public"."journal_entry_lines"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Fiscal Periods
CREATE POLICY IF NOT EXISTS tenant_isolation_fiscal_periods ON "public"."fiscal_periods"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Account Balances
CREATE POLICY IF NOT EXISTS tenant_isolation_account_balances ON "public"."account_balances"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cost Centers
CREATE POLICY IF NOT EXISTS tenant_isolation_cost_centers ON "public"."cost_centers"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Projects
CREATE POLICY IF NOT EXISTS tenant_isolation_projects ON "public"."projects"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tax Rates
CREATE POLICY IF NOT EXISTS tenant_isolation_tax_rates ON "public"."tax_rates"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================
-- 4. TABLAS SOCIAL (OPCIONAL - SOLO SI USAS MÓDULO SOCIAL)
-- ============================================================

ALTER TABLE IF EXISTS "public"."social_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."social_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."social_catalogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."social_catalog_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."social_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."social_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."social_follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."social_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."social_threads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."social_thread_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."social_messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS tenant_isolation_social_profiles ON "public"."social_profiles"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS tenant_isolation_social_posts ON "public"."social_posts"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS tenant_isolation_social_catalogs ON "public"."social_catalogs"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS tenant_isolation_social_catalog_items ON "public"."social_catalog_items"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS tenant_isolation_social_comments ON "public"."social_comments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS tenant_isolation_social_reactions ON "public"."social_reactions"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS tenant_isolation_social_follows ON "public"."social_follows"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS tenant_isolation_social_notifications ON "public"."social_notifications"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS tenant_isolation_social_threads ON "public"."social_threads"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS tenant_isolation_social_thread_members ON "public"."social_thread_members"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY IF NOT EXISTS tenant_isolation_social_messages ON "public"."social_messages"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================
-- 5. TABLAS DE SISTEMA (SIN RLS - ACCESO GLOBAL ADMIN)
-- ============================================================

-- Refresh tokens - aislamiento por tenant pero admin global puede ver todo
ALTER TABLE IF EXISTS "public"."refresh_tokens" ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation_refresh_tokens ON "public"."refresh_tokens"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Invoice Sequences
ALTER TABLE IF EXISTS "public"."invoice_sequences" ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation_invoice_sequences ON "public"."invoice_sequences"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tax Withholdings
ALTER TABLE IF EXISTS "public"."tax_withholdings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation_tax_withholdings ON "public"."tax_withholdings"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Account Balances
ALTER TABLE IF EXISTS "public"."account_balances" ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation_account_balances ON "public"."account_balances"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Cost Centers
ALTER TABLE IF EXISTS "public"."cost_centers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation_cost_centers ON "public"."cost_centers"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Projects
ALTER TABLE IF EXISTS "public"."projects" ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation_projects ON "public"."projects"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tax Rates
ALTER TABLE IF EXISTS "public"."tax_rates" ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation_tax_rates ON "public"."tax_rates"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Accounts Payable
ALTER TABLE IF EXISTS "public"."accounts_payable" ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation_accounts_payable ON "public"."accounts_payable"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Payable Payments
ALTER TABLE IF EXISTS "public"."payable_payments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation_payable_payments ON "public"."payable_payments"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================
-- 6. FUNCIÓN HELPER PARA SETEAR TENANT_ID EN SESIÓN
-- ============================================================

-- Función helper para usar en migraciones/scripts
-- Uso: SELECT set_tenant_context('uuid-del-tenant');
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
  AND tablename IN ('users', 'tenants', 'products', 'sales', 'customers')
ORDER BY tablename;

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'sales', 'customers', 'users', 'tenants')
ORDER BY tablename, policyname;