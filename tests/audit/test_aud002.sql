-- ============================================================================
-- SUITE DE PRUEBAS AUTOMATIZADAS DE SEGURIDAD: AUD-002
-- Protocolo: Tarify OS / SIM-PRO Sucre
-- Ejecutable en PostgreSQL 15+ / Supabase
-- ============================================================================

\set ON_ERROR_STOP off
\echo '--- INICIANDO SUITE DE PRUEBAS DE SEGURIDAD AUD-002 ---'

-- PREPARACIÓN: Crear usuarios de prueba con roles específicos
DO $$
BEGIN
    -- Usuario Observador
    INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000091', 'test_observador@ciudadano.bo') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id, email, full_name, role, organization) 
    VALUES ('00000000-0000-0000-0000-000000000091', 'test_observador@ciudadano.bo', 'Ciudadano Test', 'observador_publico', 'Sociedad Civil')
    ON CONFLICT (id) DO UPDATE SET role = 'observador_publico';

    -- Usuario Sindical
    INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000092', 'test_chofer@sindicato.bo') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id, email, full_name, role, organization) 
    VALUES ('00000000-0000-0000-0000-000000000092', 'test_chofer@sindicato.bo', 'Chofer Test', 'delegado_sindical', 'Sindicato Choferes')
    ON CONFLICT (id) DO UPDATE SET role = 'delegado_sindical';

    -- Usuario SuperAdmin
    INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000093', 'ecotraffic.bo@gmail.com') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id, email, full_name, role, organization) 
    VALUES ('00000000-0000-0000-0000-000000000093', 'ecotraffic.bo@gmail.com', 'SuperAdmin Test', 'superadmin', 'Ecotraffic')
    ON CONFLICT (id) DO UPDATE SET role = 'superadmin';
END $$;

-- ----------------------------------------------------------------------------
-- PRUEBA 1: UPDATE sobre audit_logs como 'authenticated'
-- Esperado: Falla (Trigger trg_audit_logs_no_update_delete o REVOKE)
-- ----------------------------------------------------------------------------
\echo '>>> PRUEBA 1: UPDATE sobre audit_logs como authenticated'
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000093", "role": "authenticated"}';

UPDATE public.audit_logs 
SET justification = 'Intento no autorizado de modificacion' 
WHERE id = (SELECT id FROM public.audit_logs LIMIT 1);

-- ----------------------------------------------------------------------------
-- PRUEBA 2: DELETE sobre audit_logs como 'service_role'
-- Esperado: Falla (Trigger trg_audit_logs_no_update_delete o REVOKE)
-- ----------------------------------------------------------------------------
\echo '>>> PRUEBA 2: DELETE sobre audit_logs como service_role'
SET ROLE service_role;

DELETE FROM public.audit_logs WHERE id = (SELECT id FROM public.audit_logs LIMIT 1);

-- ----------------------------------------------------------------------------
-- PRUEBA 3: TRUNCATE sobre audit_logs
-- Esperado: Falla (Trigger trg_audit_logs_no_truncate o REVOKE)
-- ----------------------------------------------------------------------------
\echo '>>> PRUEBA 3: TRUNCATE sobre audit_logs'
SET ROLE postgres;

TRUNCATE TABLE public.audit_logs;

-- ----------------------------------------------------------------------------
-- PRUEBA 4: INSERT con justificación corta (< 15 caracteres) o nula
-- Esperado: Falla por restricción CHECK (chk_audit_justification_min_len)
-- ----------------------------------------------------------------------------
\echo '>>> PRUEBA 4: INSERT con justificación insuficiente (< 15 caracteres)'
SET ROLE postgres;

INSERT INTO public.audit_logs (
    session_id, user_email, user_role, user_organization,
    action, entity_name, justification
) VALUES (
    'a0000000-0000-0000-0000-000000000001', 'test@sucre.bo', 'admin_municipal', 'GAM Sucre',
    'CAMBIO_PARAMETRO', 'system_parameters', 'Corta'
);

-- ----------------------------------------------------------------------------
-- PRUEBA 5: Inserciones consecutivas y validación de hash chain
-- Esperado: La cadena se enlaza perfectamente (prev_hash -> row_hash) sin bifurcación
-- ----------------------------------------------------------------------------
\echo '>>> PRUEBA 5: Inserciones consecutivas y verificación de integridad criptográfica'
SET ROLE postgres;

SELECT public.log_audit_event(
    'a0000000-0000-0000-0000-000000000001'::UUID,
    'CAMBIO_PARAMETRO'::audit_action_type,
    'system_parameters',
    'b0000000-0000-0000-0000-000000000001'::UUID,
    'fuel_price_bs_l',
    '{"fuel_price_bs_l": 17.95}'::JSONB,
    '{"fuel_price_bs_l": 18.50}'::JSONB,
    'Ajuste tecnico justificado por variacion del precio internacional del diesel'
);

SELECT public.log_audit_event(
    'a0000000-0000-0000-0000-000000000001'::UUID,
    'CAMBIO_TARIFA'::audit_action_type,
    'fare_categories',
    NULL,
    'fare_social_2_bs',
    '{"adultos": 3.50}'::JSONB,
    '{"adultos": 3.60}'::JSONB,
    'Propuesta de compensacion municipal para proteger el equilibrio financiero'
);

SELECT * FROM public.verify_audit_chain();

-- ----------------------------------------------------------------------------
-- PRUEBA 6: Simulación de alteración maliciosa y detección por verify_audit_chain()
-- Esperado: verify_audit_chain() devuelve 'CORRUPTED_ROW_HASH' con el id alterado
-- ----------------------------------------------------------------------------
\echo '>>> PRUEBA 6: Detección de alteración manual forzada'
-- Deshabilitar trigger temporalmente SOLO en sesión de prueba
ALTER TABLE public.audit_logs DISABLE TRIGGER trg_audit_logs_no_update_delete;

-- Alteración silenciosa del campo justification
UPDATE public.audit_logs 
SET justification = 'Alteracion fraudulenta de auditoria con mas de 15 caracteres'
WHERE id = (SELECT id FROM public.audit_logs ORDER BY created_at DESC LIMIT 1);

-- Ejecutar verificador: debe detectar la corrupción
SELECT * FROM public.verify_audit_chain();

-- Restaurar triggers inmediatamente
ALTER TABLE public.audit_logs ENABLE TRIGGER trg_audit_logs_no_update_delete;

-- ----------------------------------------------------------------------------
-- PRUEBA 7: observador_publico hace SELECT directo sobre tabla audit_logs
-- Esperado: Sin acceso / 0 filas visibles por política RLS
-- ----------------------------------------------------------------------------
\echo '>>> PRUEBA 7: SELECT sobre audit_logs por observador_publico'
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000091", "role": "authenticated"}';

SELECT count(*) AS filas_visibles_observador FROM public.audit_logs;

-- En cambio, puede consultar la vista pública:
SELECT count(*) AS metricas_publicas_observador FROM public.vw_observador_metricas;

-- ----------------------------------------------------------------------------
-- PRUEBA 8: delegado_sindical intenta modificar parámetros oficiales
-- Esperado: 0 filas actualizadas / Falla por política RLS
-- ----------------------------------------------------------------------------
\echo '>>> PRUEBA 8: UPDATE de parámetros por delegado_sindical'
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000092", "role": "authenticated"}';

UPDATE public.system_parameters 
SET fuel_price_bs_l = 10.00 
WHERE session_id = 'a0000000-0000-0000-0000-000000000001';

-- ----------------------------------------------------------------------------
-- PRUEBA 9: Cliente anónimo o sin privilegios intenta INSERT directo en audit_logs
-- Esperado: Falla por REVOKE INSERT ON public.audit_logs FROM anon, public
-- ----------------------------------------------------------------------------
\echo '>>> PRUEBA 9: INSERT directo de cliente no autorizado'
SET ROLE anon;

INSERT INTO public.audit_logs (
    session_id, user_email, user_role, user_organization,
    action, entity_name, justification
) VALUES (
    'a0000000-0000-0000-0000-000000000001', 'hacker@anon.bo', 'observador_publico', 'Ext',
    'INSERT', 'system_parameters', 'Inyeccion directa de auditoria sin pasar por procedimiento'
);

-- ----------------------------------------------------------------------------
-- PRUEBA 10: Acción del SuperAdmin sobre un parámetro
-- Esperado: Actualización permitida y evento registrado en audit_logs
-- ----------------------------------------------------------------------------
\echo '>>> PRUEBA 10: Acción de SuperAdmin auditada'
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000093", "role": "authenticated"}';

-- SuperAdmin actualiza parámetro
UPDATE public.system_parameters 
SET maintenance_monthly_bs = 2840.17 
WHERE session_id = 'a0000000-0000-0000-0000-000000000001';

-- SuperAdmin registra el evento con justificación formal
SELECT public.log_audit_event(
    'a0000000-0000-0000-0000-000000000001'::UUID,
    'CAMBIO_PARAMETRO'::audit_action_type,
    'system_parameters',
    'b0000000-0000-0000-0000-000000000001'::UUID,
    'maintenance_monthly_bs',
    '{"maintenance_monthly_bs": 2869.75}'::JSONB,
    '{"maintenance_monthly_bs": 2840.17}'::JSONB,
    'Alineacion tecnica con la planilla maestro 52 items Nissan Civilian acordada con GAMS'
);

RESET ROLE;
\echo '--- SUITE DE PRUEBAS AUD-002 COMPLETADA ---'
