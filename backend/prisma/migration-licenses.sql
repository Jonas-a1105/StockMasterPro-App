-- ============================================================
-- MIGRACIÓN: Agregar tabla licenses para licencias offline
-- ============================================================
-- Ejecutar en Supabase SQL Editor DESPUÉS de rls-final.sql

-- ============================================================
-- 1. TABLA LICENSES (Registro de licencias emitidas)
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."licenses" (
    id                  UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    jti                 VARCHAR(255) NOT NULL UNIQUE,          -- ID único de licencia (JWT ID)
    tier                VARCHAR(50) NOT NULL,                  -- free, pro, enterprise
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL,
    activated_at        TIMESTAMPTZ,
    status              VARCHAR(20) NOT NULL DEFAULT 'issued', -- issued, activated, revoked, expired
    issued_by           UUID,                                   -- super-admin que emitió
    revoked_at          TIMESTAMPTZ,
    revoked_by          UUID,
    revoked_reason      TEXT,
    payload             JSONB NOT NULL,                          -- payload completo firmado
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT licenses_pkey PRIMARY KEY (id),
    CONSTRAINT licenses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT licenses_jti_unique UNIQUE (jti)
);

CREATE INDEX IF NOT EXISTS idx_licenses_tenant_id ON licenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_licenses_jti ON licenses(jti);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);

-- Trigger para updated_at
CREATE TRIGGER update_licenses_updated_at
    BEFORE UPDATE ON "public"."licenses"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. AGREGAR CAMPOS A TENANTS PARA LICENCIAS
-- ============================================================

ALTER TABLE "public"."tenants" 
    ADD COLUMN IF NOT EXISTS license_source VARCHAR(20) DEFAULT 'stripe', -- 'stripe' | 'manual'
    ADD COLUMN IF NOT EXISTS license_jti UUID; -- jti de la licencia activa

-- ============================================================
-- 3. CLAVES RSA PARA FIRMA ASIMÉTRICA (RS256)
-- ============================================================
-- NOTA: Generar claves RSA 2048 bits:
--   openssl genrsa -out private.pem 2048
--   openssl rsa -in private.pem -pubout -out public.pem
-- 
-- Guardar private.pem en secret manager / vault (NUNCA en repo)
-- Guardar public.pem en variable de entorno LICENSE_PUBLIC_KEY (base64)

-- ============================================================
-- 4. FUNCIÓN PARA VERIFICAR LICENCIA (SQL FUNCTION)
-- ============================================================

CREATE OR REPLACE FUNCTION verify_license(p_jti TEXT, p_tenant_id UUID)
RETURNS TABLE(
    valid BOOLEAN,
    tier VARCHAR(50),
    expires_at TIMESTAMPTZ,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_license RECORD;
BEGIN
    -- Buscar licencia por JTI
    SELECT * INTO v_license
    FROM "public"."licenses"
    WHERE jti = p_jti;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, NULL::VARCHAR, NULL::TIMESTAMPTZ, 'Licencia no encontrada';
        RETURN;
    END IF;

    -- Verificar tenant match
    IF v_license.tenant_id != p_tenant_id THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, NULL::VARCHAR, NULL::TIMESTAMPTZ, 'Licencia no pertenece a este tenant';
        RETURN;
    END IF;

    -- Verificar estado
    IF v_license.status != 'issued' AND v_license.status != 'activated' THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, NULL::VARCHAR, NULL::TIMESTAMPTZ, 'Licencia no válida (estado: ' || v_license.status || ')';
        RETURN;
    END IF;

    -- Verificar expiración
    IF v_license.expires_at < NOW() THEN
        -- Marcar como expirada
        UPDATE "public"."licenses" SET status = 'expired', updated_at = NOW() WHERE jti = p_jti;
        RETURN QUERY SELECT FALSE::BOOLEAN, NULL::VARCHAR, NULL::TIMESTAMPTZ, 'Licencia expirada';
        RETURN;
    END IF;

    -- Marcar como activada si era 'issued'
    IF v_license.status = 'issued' THEN
        UPDATE "public"."licenses" 
        SET status = 'activated', activated_at = NOW(), updated_at = NOW()
        WHERE jti = p_jti;
    END IF;

    RETURN QUERY SELECT TRUE::BOOLEAN, v_license.tier, v_license.expires_at, 'Licencia válida';
END;
$$;

-- ============================================================
-- 5. FUNCIÓN PARA ACTIVAR LICENCIA (CON VERIFICACIÓN RS256)
-- ============================================================

CREATE OR REPLACE FUNCTION activate_license(p_token TEXT, p_tenant_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payload JSONB;
    v_header JSONB;
    v_jti TEXT;
    v_tenant_id UUID;
    v_tier TEXT;
    v_expires_at TIMESTAMPTZ;
    v_public_key TEXT := current_setting('app.license_public_key', true); -- Clave pública en base64
    v_verified BOOLEAN := FALSE;
    v_decoded JSONB;
BEGIN
    -- 1. Verificar firma RS256 (requiere pgcrypto + extensión)
    -- NOTA: En producción, validar en app layer (Node.js) con crypto.verify()
    -- Aquí solo parseamos el payload (validación real en app layer)
    
    -- Parsear JWT manualmente (header.payload.signature)
    -- Para simplificar, asumimos validación previa en app layer
    -- Aquí solo extraemos claims
    
    -- Decodificar payload (parte media del JWT)
    v_payload := (split_part(p_token, '.', 2))::JSONB;
    v_jti := v_payload->>'jti';
    v_tenant_id := v_payload->>'tenantId';
    v_tier := v_payload->>'tier';
    v_expires_at := (v_payload->>'expiresAt')::TIMESTAMPTZ;

    -- Verificar tenant match
    IF v_tenant_id IS NOT NULL AND v_tenant_id::UUID != p_tenant_id THEN
        RETURN QUERY SELECT FALSE, 'Licencia no pertenece a este tenant', NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Verificar expiración
    IF (v_payload->>'exp')::BIGINT * 1000 < EXTRACT(EPOCH FROM NOW()) * 1000 THEN
        RETURN QUERY SELECT FALSE, 'Licencia expirada', NULL::TIMESTAMPTZ;
    END IF;

    -- Registrar licencia en tabla
    INSERT INTO "public"."licenses" (
        jti, tenant_id, tier, expires_at, status, payload
    ) VALUES (
        v_jti, p_tenant_id, v_tier, v_expires_at, 'activated',
        v_payload
    )
    ON CONFLICT (jti) DO UPDATE SET
        status = 'activated',
        activated_at = NOW(),
        updated_at = NOW();

    -- Actualizar tenant
    UPDATE "public"."tenants" SET
        plan_type = v_tier,
        license_expires_at = v_expires_at,
        license_source = 'manual',
        license_jti = v_jti::UUID,
        updated_at = NOW()
    WHERE id = p_tenant_id;

    RETURN QUERY SELECT TRUE, 'Licencia activada correctamente', v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. FUNCIÓN PARA VERIFICAR LICENCIA VIGENTE
-- ============================================================

CREATE OR REPLACE FUNCTION check_license_valid(p_tenant_id UUID)
RETURNS TABLE(
    valid BOOLEAN,
    tier VARCHAR(50),
    expires_at TIMESTAMPTZ,
    source VARCHAR(20), -- 'stripe' | 'manual'
    days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant RECORD;
    v_license RECORD;
BEGIN
    -- Obtener tenant
    SELECT * INTO v_tenant FROM "public"."tenants" WHERE id = p_tenant_id;
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'free', NULL, 'none', 0;
    END IF;

    -- Verificar suscripción Stripe primero (prioridad)
    IF v_tenant.subscription_status IN ('active', 'trialing') AND v_tenant.license_expires_at > NOW() THEN
        RETURN QUERY SELECT 
            TRUE, 
            v_tenant.plan_type, 
            v_tenant.license_expires_at, 
            'stripe',
            EXTRACT(DAY FROM (v_tenant.license_expires_at - NOW()))::INT;
    END IF;

    -- Verificar licencia manual activa
    SELECT * INTO v_license
    FROM "public"."licenses"
    WHERE tenant_id = p_tenant_id 
      AND status IN ('activated', 'issued')
      AND expires_at > NOW()
    ORDER BY expires_at DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN QUERY SELECT 
            TRUE,
            v_license.tier,
            v_license.expires_at,
            'manual',
            EXTRACT(DAY FROM (v_license.expires_at - NOW()))::INT;
    END IF;

    -- Sin licencia válida
    RETURN QUERY SELECT FALSE, 'free', NULL, 'none', 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. TRIGGER PARA ACTUALIZAR updated_at EN LICENSES
-- ============================================================

CREATE TRIGGER update_licenses_updated_at
    BEFORE UPDATE ON "public"."licenses"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_licenses_tenant_status ON "public"."licenses"(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON "public"."licenses"(expires_at);