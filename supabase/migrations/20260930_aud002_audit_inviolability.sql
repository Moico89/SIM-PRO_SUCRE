-- ============================================================================
-- AUD-002: MIGRACIÓN DE INVIOLABILIDAD E INTEGRIDAD CRÍTICA DE AUDIT_LOGS Y RLS
-- Fecha: 2026-09-30
-- Objetivos:
--   1. Append-Only estricto en public.audit_logs (REVOKE + Triggers anti-mutación)
--   2. Cadena criptográfica de hashes SHA-256 (prev_hash -> row_hash con lock)
--   3. Función verify_audit_chain() para validación matemática de inmutabilidad
--   4. Restricción CHECK de longitud mínima para justificaciones (>= 15 caracteres)
--   5. FORCE ROW LEVEL SECURITY en el 100% de las tablas públicas
--   6. Registro obligatorio y trazabilidad de mutaciones administrativas
-- ============================================================================

-- 1. ASEGURAR EXTENSIÓN PGCRYPTO EN ESQUEMA EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. CADENA CRIPTOGRÁFICA DE HASHES EN PUBLIC.AUDIT_LOGS
-- Añadir columnas prev_hash y row_hash si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'prev_hash') THEN
        ALTER TABLE public.audit_logs ADD COLUMN prev_hash TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'row_hash') THEN
        ALTER TABLE public.audit_logs ADD COLUMN row_hash TEXT;
    END IF;
END $$;

-- Rellenar filas preexistentes de audit_logs con hashes génesis si existen registros
UPDATE public.audit_logs 
SET prev_hash = 'GENESIS',
    row_hash = encode(extensions.digest('GENESIS' || id::text || entity_name || justification || created_at::text, 'sha256'), 'hex')
WHERE row_hash IS NULL;

-- Fijar NOT NULL en prev_hash y row_hash
ALTER TABLE public.audit_logs ALTER COLUMN prev_hash SET NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN row_hash SET NOT NULL;

-- 3. CHECK CONSTRAINT DE JUSTIFICACIÓN REFORZADA (MÍNIMO 15 CARACTERES REALES)
DO $$ 
BEGIN
    ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS chk_audit_justification_min_len;
    ALTER TABLE public.audit_logs ADD CONSTRAINT chk_audit_justification_min_len 
        CHECK (char_length(trim(justification)) >= 15);
END $$;

-- 4. REVOCACIÓN TOTAL DE PERMISOS DESTRUCTIVOS (INCLUSO PARA SERVICE_ROLE)
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM public, anon, authenticated, service_role;

-- 5. TRIGGERS ANTI-MUTACIÓN (DEFENSA EN PROFUNDIDAD A NIVEL MOTOR POSTGRESQL)
CREATE OR REPLACE FUNCTION public.audit_logs_block_mutation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACION DE SEGURIDAD CRITICA: public.audit_logs es estrictamente APPEND-ONLY. Modificaciones y eliminaciones prohibidas por protocolo AUD-002.'
        USING ERRCODE = '23505';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_no_update_delete ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_no_update_delete
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.audit_logs_block_mutation();

DROP TRIGGER IF EXISTS trg_audit_logs_no_truncate ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_no_truncate
    BEFORE TRUNCATE ON public.audit_logs
    FOR EACH STATEMENT EXECUTE FUNCTION public.audit_logs_block_mutation();

-- 6. TRIGGER DE ENCADENAMIENTO HASH SERIALIZADO CON ADVISORY LOCK
CREATE OR REPLACE FUNCTION public.trg_audit_logs_hash_chain()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_last_hash TEXT;
    v_payload TEXT;
    v_lock_id CONSTANT BIGINT := 74298982026; -- Identificador único para el advisory lock de auditoría
BEGIN
    -- A. Serializar inserciones concurrentes mediante advisory lock en la transacción
    PERFORM pg_advisory_xact_lock(v_lock_id);

    -- B. Obtener el hash de la última fila insertada
    SELECT row_hash INTO v_last_hash 
    FROM public.audit_logs 
    ORDER BY created_at DESC, id DESC 
    LIMIT 1;

    -- Si es la primera fila en el sistema, anclar a GENESIS
    IF v_last_hash IS NULL THEN
        NEW.prev_hash := 'GENESIS';
    ELSE
        NEW.prev_hash := v_last_hash;
    END IF;

    -- C. Concatenar los componentes inmutables de la fila
    -- prev_hash || id || tabla || registro_id || campo || valor_anterior || valor_nuevo || justificacion || actor_id || created_at
    v_payload := NEW.prev_hash 
        || '|' || COALESCE(NEW.id::text, '')
        || '|' || COALESCE(NEW.entity_name, '')
        || '|' || COALESCE(NEW.entity_id::text, '')
        || '|' || COALESCE(NEW.field_name, '')
        || '|' || COALESCE(NEW.old_value::text, '')
        || '|' || COALESCE(NEW.new_value::text, '')
        || '|' || COALESCE(NEW.justification, '')
        || '|' || COALESCE(NEW.user_id::text, '')
        || '|' || COALESCE(NEW.user_email, '')
        || '|' || COALESCE(NEW.created_at::text, now()::text);

    -- D. Calcular SHA-256 criptográfico
    NEW.row_hash := encode(extensions.digest(v_payload, 'sha256'), 'hex');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_chain_hasher ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_chain_hasher
    BEFORE INSERT ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.trg_audit_logs_hash_chain();

-- 7. FUNCIÓN VERIFICADORA DE LA CADENA DE AUDITORÍA (AUDIT CHAIN VERIFIER)
CREATE OR REPLACE FUNCTION public.verify_audit_chain()
RETURNS TABLE (
    status TEXT,
    verified_count BIGINT,
    corrupted_log_id UUID,
    expected_prev_hash TEXT,
    actual_prev_hash TEXT,
    expected_row_hash TEXT,
    actual_row_hash TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    r RECORD;
    v_computed_hash TEXT;
    v_previous_hash TEXT := 'GENESIS';
    v_count BIGINT := 0;
    v_payload TEXT;
BEGIN
    FOR r IN 
        SELECT id, entity_name, entity_id, field_name, old_value, new_value, 
               justification, user_id, user_email, created_at, prev_hash, row_hash
        FROM public.audit_logs
        ORDER BY created_at ASC, id ASC
    LOOP
        v_count := v_count + 1;

        -- 1. Validar que el prev_hash coincida con el row_hash anterior
        IF r.prev_hash <> v_previous_hash THEN
            RETURN QUERY SELECT 
                'CORRUPTED_PREV_HASH'::TEXT,
                v_count,
                r.id,
                v_previous_hash,
                r.prev_hash,
                NULL::TEXT,
                r.row_hash;
            RETURN;
        END IF;

        -- 2. Recalcular el hash del registro
        v_payload := r.prev_hash 
            || '|' || COALESCE(r.id::text, '')
            || '|' || COALESCE(r.entity_name, '')
            || '|' || COALESCE(r.entity_id::text, '')
            || '|' || COALESCE(r.field_name, '')
            || '|' || COALESCE(r.old_value::text, '')
            || '|' || COALESCE(r.new_value::text, '')
            || '|' || COALESCE(r.justification, '')
            || '|' || COALESCE(r.user_id::text, '')
            || '|' || COALESCE(r.user_email, '')
            || '|' || COALESCE(r.created_at::text, '');

        v_computed_hash := encode(extensions.digest(v_payload, 'sha256'), 'hex');

        -- 3. Validar coincidencia de contenido
        IF r.row_hash <> v_computed_hash THEN
            RETURN QUERY SELECT 
                'CORRUPTED_ROW_HASH'::TEXT,
                v_count,
                r.id,
                v_previous_hash,
                r.prev_hash,
                v_computed_hash,
                r.row_hash;
            RETURN;
        END IF;

        v_previous_hash := r.row_hash;
    END LOOP;

    RETURN QUERY SELECT 
        'OK'::TEXT,
        v_count,
        NULL::UUID,
        NULL::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        v_previous_hash;
END;
$$;

-- 8. FORZAR ROW LEVEL SECURITY EN EL 100% DE LAS TABLAS DE PUBLIC
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.negotiation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_parameters FORCE ROW LEVEL SECURITY;

ALTER TABLE public.fare_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_categories FORCE ROW LEVEL SECURITY;

ALTER TABLE public.network_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_routes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- 9. RESTRICCIÓN DE ACCESOS Y POLÍTICAS RLS DEFENSIVAS
-- A. Revocar inserción directa de clientes arbitrarios en audit_logs
REVOKE INSERT ON public.audit_logs FROM anon, public;

-- Función controlada para registrar auditoría (Security Definer con search_path)
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_session_id UUID,
    p_action audit_action_type,
    p_entity_name TEXT,
    p_entity_id UUID,
    p_field_name TEXT,
    p_old_value JSONB,
    p_new_value JSONB,
    p_justification TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_email TEXT;
    v_role user_role := 'observador_publico';
    v_org TEXT := 'Sociedad Civil';
    v_log_id UUID := gen_random_uuid();
BEGIN
    IF v_user_id IS NOT NULL THEN
        SELECT email, role, organization INTO v_email, v_role, v_org
        FROM public.profiles WHERE id = v_user_id;
    END IF;

    IF v_email IS NULL THEN
        v_email := 'sistema@sucre.bo';
    END IF;

    INSERT INTO public.audit_logs (
        id, session_id, user_id, user_email, user_role, user_organization,
        action, entity_name, entity_id, field_name, old_value, new_value,
        justification, created_at
    ) VALUES (
        v_log_id, p_session_id, v_user_id, v_email, v_role, v_org,
        p_action, p_entity_name, p_entity_id, p_field_name, p_old_value, p_new_value,
        p_justification, now()
    );

    RETURN v_log_id;
END;
$$;

-- B. Políticas reforzadas de system_parameters: Delegados sindicales y observadores no tienen UPDATE
DROP POLICY IF EXISTS "Delegados sindicales no pueden modificar parametros" ON public.system_parameters;
DROP POLICY IF EXISTS "Admin y Consultor pueden actualizar parámetros si la sesión no está congelada" ON public.system_parameters;

CREATE POLICY "Admin y Consultor pueden actualizar parámetros si la sesión no está congelada" ON public.system_parameters
    FOR UPDATE TO authenticated 
    USING (
        public.get_current_user_role() IN ('admin_municipal', 'consultor_ecotraffic', 'superadmin')
        AND is_locked = false
    )
    WITH CHECK (
        public.get_current_user_role() IN ('admin_municipal', 'consultor_ecotraffic', 'superadmin')
        AND is_locked = false
    );

-- C. Vista Segura para Observadores Públicos (Limitación estricta de columnas y datos sensibles)
CREATE OR REPLACE VIEW public.vw_observador_metricas 
WITH (security_invoker = true) AS
SELECT 
    p.session_id,
    p.fleet_active,
    p.km_network_day,
    p.demand_network_day,
    p.operating_days_month,
    v.km_unidad_mes,
    v.pax_unidad_mes,
    v.ipk_sistema,
    v.opex_efectivo_mes,
    v.depreciacion_mes,
    v.retorno_capital_mes,
    v.costo_regulatorio_total_mes,
    v.tarifa_tecnica_ponderada
FROM public.system_parameters p
JOIN public.vw_resumen_economico_unidad v ON p.session_id = v.session_id;

-- D. Prohibir SELECT directo de observador_publico sobre audit_logs
DROP POLICY IF EXISTS "Lectura de auditoría para todos los autorizados" ON public.audit_logs;
CREATE POLICY "Lectura de auditoría restringida a roles de gobierno y consultoria" ON public.audit_logs
    FOR SELECT TO authenticated USING (
        public.get_current_user_role() IN ('superadmin', 'admin_municipal', 'consultor_ecotraffic')
    );
