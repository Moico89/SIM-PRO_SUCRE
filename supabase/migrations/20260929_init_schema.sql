-- ============================================================================
-- GOBIERNO AUTÓNOMO MUNICIPAL DE SUCRE & ECOTRAFFIC CONSULTORÍA
-- SISTEMA DE GOBERNANZA TARIFARIA Y AUDITORÍA EN TIEMPO REAL
-- BASE DE DATOS: PostgreSQL 15+ / Supabase
-- ============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUMERADOS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin_municipal',
        'delegado_sindical',
        'consultor_ecotraffic',
        'observador_publico'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM (
        'borrador',
        'en_negociacion',
        'congelada',
        'aprobada',
        'archivada'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE audit_action_type AS ENUM (
        'INSERT',
        'UPDATE',
        'DELETE',
        'CAMBIO_PARAMETRO',
        'CAMBIO_TARIFA',
        'BLOQUEO_SESION',
        'DESBLOQUEO_SESION',
        'LOGIN',
        'EXPORT_REPORT'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLA DE PERFILES DE USUARIO (Vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'observador_publico',
    organization TEXT NOT NULL, -- 'GAM Sucre', 'Ecotraffic', 'Sindicato San Cristóbal', 'Sindicato Sucre', 'Concejo Municipal'
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA DE SESIONES DE NEGOCIACIÓN
CREATE TABLE IF NOT EXISTS public.negotiation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code TEXT UNIQUE NOT NULL, -- ej. 'SUCRE-TARIFA-2026-S1'
    title TEXT NOT NULL,
    description TEXT,
    status session_status NOT NULL DEFAULT 'en_negociacion',
    active_scenario TEXT NOT NULL DEFAULT 'social2', -- 'vigente', 'tecnico', 'social1', 'social2', 'estres', 'dos_choferes'
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA DE PARÁMETROS OPERATIVOS Y ECONÓMICOS DEL SISTEMA
CREATE TABLE IF NOT EXISTS public.system_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.negotiation_sessions(id) ON DELETE CASCADE,
    -- Productividad y Red
    fleet_active NUMERIC(8,2) NOT NULL DEFAULT 987.0,
    km_network_day NUMERIC(10,2) NOT NULL DEFAULT 82475.0,
    demand_network_day NUMERIC(10,2) NOT NULL DEFAULT 265569.0,
    operating_days_month INTEGER NOT NULL DEFAULT 26,
    turns_day NUMERIC(4,2) NOT NULL DEFAULT 3.0,
    -- Combustible
    fuel_efficiency_km_l NUMERIC(5,2) NOT NULL DEFAULT 5.50,
    idle_congestion_factor NUMERIC(5,4) NOT NULL DEFAULT 0.15,
    fuel_price_bs_l NUMERIC(6,2) NOT NULL DEFAULT 17.95,
    -- Costo Laboral
    driver_salary_bs NUMERIC(8,2) NOT NULL DEFAULT 3300.0,
    labor_charges_factor NUMERIC(5,4) NOT NULL DEFAULT 0.0833333333,
    -- Mantenimiento Nissan v2
    maintenance_monthly_bs NUMERIC(8,2) NOT NULL DEFAULT 2869.75,
    maintenance_var_share NUMERIC(5,4) NOT NULL DEFAULT 0.2513736712,
    maintenance_fixed_share NUMERIC(5,4) NOT NULL DEFAULT 0.7486263288,
    other_fixed_monthly_bs NUMERIC(8,2) NOT NULL DEFAULT 720.42,
    -- Capital y Regulación
    vehicle_replacement_value_bs NUMERIC(10,2) NOT NULL DEFAULT 198360.0,
    vehicle_residual_value_bs NUMERIC(10,2) NOT NULL DEFAULT 0.0,
    vehicle_useful_life_months INTEGER NOT NULL DEFAULT 120,
    capital_return_rate_annual NUMERIC(5,4) NOT NULL DEFAULT 0.11,
    threshold_laspeyres NUMERIC(5,4) NOT NULL DEFAULT 0.05,
    -- Control de Versión y Bloqueo
    is_locked BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLA DE CATEGORÍAS TARIFARIAS SOCIALES
CREATE TABLE IF NOT EXISTS public.fare_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.negotiation_sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    demand_share NUMERIC(5,4) NOT NULL,
    daily_trips NUMERIC(10,2) NOT NULL,
    fare_current_bs NUMERIC(5,2) NOT NULL,
    fare_technical_bs NUMERIC(6,4) NOT NULL,
    fare_social_1_bs NUMERIC(5,2) NOT NULL, -- Adulto Bs. 3,80
    fare_social_2_bs NUMERIC(5,2) NOT NULL, -- Adulto Bs. 3,50
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABLA DE RUTAS URBANAS (32 LÍNEAS)
CREATE TABLE IF NOT EXISTS public.network_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.negotiation_sessions(id) ON DELETE CASCADE,
    route_number INTEGER NOT NULL,
    union_name TEXT NOT NULL,
    line_name TEXT NOT NULL,
    cycle_distance_km NUMERIC(6,2) NOT NULL,
    inventory_fleet NUMERIC(6,2) NOT NULL,
    assigned_fleet NUMERIC(6,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABLA DE AUDITORÍA INMUTABLE (AUDIT LOGS - APPEND ONLY)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.negotiation_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    user_role user_role NOT NULL,
    user_organization TEXT NOT NULL,
    action audit_action_type NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id UUID,
    field_name TEXT,
    old_value JSONB,
    new_value JSONB,
    justification TEXT NOT NULL, -- Obligatoria para justificar en el acta de negociación
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ÍNDICES DE OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_status ON public.negotiation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_system_parameters_session ON public.system_parameters(session_id);
CREATE INDEX IF NOT EXISTS idx_fare_categories_session ON public.fare_categories(session_id);
CREATE INDEX IF NOT EXISTS idx_network_routes_session ON public.network_routes(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_created ON public.audit_logs(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 10. FUNCIONES DE ACTUALIZACIÓN DE TIMESTAMP
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON public.negotiation_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_parameters_updated_at BEFORE UPDATE ON public.system_parameters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_fare_categories_updated_at BEFORE UPDATE ON public.fare_categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Políticas para PROFILES
CREATE POLICY "Lectura pública de perfiles autorizados" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin municipal puede gestionar perfiles" ON public.profiles
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'admin_municipal');

-- Políticas para NEGOTIATION_SESSIONS
CREATE POLICY "Lectura de sesiones de negociación" ON public.negotiation_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin y Consultor pueden crear y editar sesiones" ON public.negotiation_sessions
    FOR ALL TO authenticated USING (
        public.get_current_user_role() IN ('admin_municipal', 'consultor_ecotraffic')
    );

-- Políticas para SYSTEM_PARAMETERS
CREATE POLICY "Lectura de parámetros del sistema" ON public.system_parameters
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin y Consultor pueden actualizar parámetros si la sesión no está congelada" ON public.system_parameters
    FOR UPDATE TO authenticated USING (
        public.get_current_user_role() IN ('admin_municipal', 'consultor_ecotraffic')
        AND is_locked = false
    );

-- Políticas para FARE_CATEGORIES
CREATE POLICY "Lectura de tarifas por categoría" ON public.fare_categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin y Consultor pueden actualizar tarifas" ON public.fare_categories
    FOR UPDATE TO authenticated USING (
        public.get_current_user_role() IN ('admin_municipal', 'consultor_ecotraffic')
    );

-- Políticas para NETWORK_ROUTES
CREATE POLICY "Lectura de 32 rutas urbanas" ON public.network_routes
    FOR SELECT TO authenticated USING (true);

-- Políticas para AUDIT_LOGS (INMUTABILIDAD ESTRICTA)
CREATE POLICY "Lectura de auditoría para todos los autorizados" ON public.audit_logs
    FOR SELECT TO authenticated USING (
        public.get_current_user_role() IN ('admin_municipal', 'consultor_ecotraffic', 'delegado_sindical')
    );

CREATE POLICY "Inserción permitida en auditoría" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- IMPORTANTE: No se crean políticas de UPDATE ni DELETE en audit_logs.
-- La tabla es APPEND-ONLY inmutable por diseño.

-- 12. VISTA RECAPITULATIVA CALCULADA EN VIVO (MODELO COV POSTGRESQL)
CREATE OR REPLACE VIEW public.vw_resumen_economico_unidad AS
SELECT 
    p.session_id,
    p.fleet_active,
    p.km_network_day,
    p.demand_network_day,
    p.turns_day,
    -- km mes por unidad
    (p.km_network_day / p.fleet_active) * p.operating_days_month AS km_unidad_mes,
    -- pasajeros mes por unidad
    (p.demand_network_day / p.fleet_active) * p.operating_days_month AS pax_unidad_mes,
    -- IPK de red
    p.demand_network_day / p.km_network_day AS ipk_sistema,
    -- Costo combustible mes
    (((p.km_network_day / p.fleet_active) * p.operating_days_month) / p.fuel_efficiency_km_l) * p.fuel_price_bs_l * (1 + p.idle_congestion_factor) AS combustible_mes,
    -- Mantenimiento mensual auditado
    p.maintenance_monthly_bs AS mantenimiento_mes,
    -- Personal mensual (chofer + aguinaldo)
    p.driver_salary_bs * (1 + p.labor_charges_factor) AS personal_mes,
    -- Otros fijos
    p.other_fixed_monthly_bs AS otros_fijos_mes,
    -- OPEX total en efectivo
    ((((p.km_network_day / p.fleet_active) * p.operating_days_month) / p.fuel_efficiency_km_l) * p.fuel_price_bs_l * (1 + p.idle_congestion_factor)) +
    p.maintenance_monthly_bs +
    (p.driver_salary_bs * (1 + p.labor_charges_factor)) +
    p.other_fixed_monthly_bs AS opex_efectivo_mes,
    -- Depreciación lineal
    (p.vehicle_replacement_value_bs - p.vehicle_residual_value_bs) / p.vehicle_useful_life_months AS depreciacion_mes,
    -- Retorno normal capital 11%
    (p.vehicle_replacement_value_bs - p.vehicle_residual_value_bs) * (p.capital_return_rate_annual / 12.0) AS retorno_capital_mes,
    -- Costo Regulatorio Total
    (((((p.km_network_day / p.fleet_active) * p.operating_days_month) / p.fuel_efficiency_km_l) * p.fuel_price_bs_l * (1 + p.idle_congestion_factor)) +
    p.maintenance_monthly_bs +
    (p.driver_salary_bs * (1 + p.labor_charges_factor)) +
    p.other_fixed_monthly_bs) +
    ((p.vehicle_replacement_value_bs - p.vehicle_residual_value_bs) / p.vehicle_useful_life_months) +
    ((p.vehicle_replacement_value_bs - p.vehicle_residual_value_bs) * (p.capital_return_rate_annual / 12.0)) AS costo_regulatorio_total_mes,
    -- Tarifa Técnica Ponderada
    ((((((p.km_network_day / p.fleet_active) * p.operating_days_month) / p.fuel_efficiency_km_l) * p.fuel_price_bs_l * (1 + p.idle_congestion_factor)) +
    p.maintenance_monthly_bs +
    (p.driver_salary_bs * (1 + p.labor_charges_factor)) +
    p.other_fixed_monthly_bs) +
    ((p.vehicle_replacement_value_bs - p.vehicle_residual_value_bs) / p.vehicle_useful_life_months) +
    ((p.vehicle_replacement_value_bs - p.vehicle_residual_value_bs) * (p.capital_return_rate_annual / 12.0))) /
    ((p.demand_network_day / p.fleet_active) * p.operating_days_month) AS tarifa_tecnica_ponderada
FROM public.system_parameters p;

COMMENT ON TABLE public.audit_logs IS 'Registro inmutable de trazabilidad de propuestas, justificaciones y cambios durante la concertación tarifaria';
