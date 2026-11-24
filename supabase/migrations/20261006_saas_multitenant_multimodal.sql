-- ============================================================================
-- TARIFY OS v4.0 SaaS — MIGRACIÓN MULTI-TENANT, MULTIMODAL & MULTI-COMBUSTIBLE
-- Fecha: 2026-10-06
-- ============================================================================

-- 1. TABLA DE ORGANIZACIONES / TENANTS DINÁMICOS
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,                  -- ej: 'sucre', 'cochabamba', 'la-paz', 'ecotraffic'
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Bolivia',
    currency_code TEXT NOT NULL DEFAULT 'BOB',  -- ISO 4217 (BOB, USD, COP, CLP)
    currency_symbol TEXT NOT NULL DEFAULT 'Bs.',
    timezone TEXT NOT NULL DEFAULT 'America/La_Paz',
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. MODOS DE TRANSPORTE (Multimodalidad)
CREATE TABLE IF NOT EXISTS public.transport_modes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,                         -- 'bus_urbano', 'minibus', 'brt', 'taxi_trufi', 'electrico_pax'
    name TEXT NOT NULL,                         -- 'Microbús Urbano', 'BRT Articulado', 'Minibús Colectivo'
    description TEXT,
    icon_name TEXT DEFAULT 'bus',
    default_capacity_seated INTEGER NOT NULL DEFAULT 25,
    default_capacity_standing INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, code)
);

-- 3. TIPOS DE COMBUSTIBLE (Multi-energía)
CREATE TABLE IF NOT EXISTS public.fuel_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,                  -- 'diesel', 'gasoline', 'gnv', 'electric', 'hybrid_diesel', 'hydrogen'
    name TEXT NOT NULL,
    unit TEXT NOT NULL,                         -- 'litros', 'm³', 'kWh', 'kg'
    energy_density_mj_per_unit NUMERIC(8,2),    -- MJ por unidad para comparación termodinámica
    co2_emission_factor NUMERIC(8,4),           -- kg CO₂ / unidad
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CATÁLOGO DE VEHÍCULOS PARAMETRIZABLES
CREATE TABLE IF NOT EXISTS public.vehicle_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    transport_mode_id UUID NOT NULL REFERENCES public.transport_modes(id) ON DELETE RESTRICT,
    fuel_type_id UUID NOT NULL REFERENCES public.fuel_types(id) ON DELETE RESTRICT,
    brand TEXT NOT NULL,                        -- 'Nissan', 'Toyota', 'BYD', 'Volvo', 'Mercedes-Benz'
    model TEXT NOT NULL,                        -- 'Civilian', 'Coaster', 'K7', 'B8R', 'Sprinter'
    year_range TEXT,                            -- '2015-2024'
    capacity_seated INTEGER NOT NULL,
    capacity_standing INTEGER NOT NULL DEFAULT 0,
    fuel_efficiency NUMERIC(8,4) NOT NULL,      -- km / unidad de combustible
    idle_congestion_factor NUMERIC(5,4) NOT NULL DEFAULT 0.1500,
    replacement_value NUMERIC(12,2) NOT NULL,   -- Valor de reposición de la unidad nueva
    residual_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    useful_life_months INTEGER NOT NULL DEFAULT 120,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, brand, model, fuel_type_id)
);

-- 5. PLANTILLAS DE MANTENIMIENTO DINÁMICAS
CREATE TABLE IF NOT EXISTS public.maintenance_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    vehicle_type_id UUID REFERENCES public.vehicle_types(id) ON DELETE SET NULL,
    name TEXT NOT NULL,                         -- ej: 'Nissan Civilian — Planilla Oficial 52 Ítems'
    total_annual_cost NUMERIC(12,2) NOT NULL DEFAULT 34082.00,
    total_monthly_cost NUMERIC(12,2) NOT NULL DEFAULT 2840.17,
    variable_share NUMERIC(5,4) NOT NULL DEFAULT 0.25137,
    fixed_share NUMERIC(5,4) NOT NULL DEFAULT 0.74863,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.maintenance_templates(id) ON DELETE CASCADE,
    category TEXT NOT NULL,                     -- 'Motor', 'Frenos', 'Transmisión', 'Suspensión', 'Eléctrico', 'Neumáticos', 'Carrocería'
    item_name TEXT NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    frequency_per_year NUMERIC(6,2) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. POLÍTICAS DE AISLAMIENTO MULTI-TENANT (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_items ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública/autenticada
CREATE POLICY "Lectura de organizaciones activas"
    ON public.organizations FOR SELECT
    USING (is_active = true);

CREATE POLICY "Lectura de modos de transporte"
    ON public.transport_modes FOR SELECT
    USING (is_active = true);

CREATE POLICY "Lectura de tipos de combustible"
    ON public.fuel_types FOR SELECT
    USING (is_active = true);

CREATE POLICY "Lectura de catálogo de vehículos"
    ON public.vehicle_types FOR SELECT
    USING (is_active = true);

CREATE POLICY "Lectura de plantillas de mantenimiento"
    ON public.maintenance_templates FOR SELECT
    USING (true);

CREATE POLICY "Lectura de ítems de mantenimiento"
    ON public.maintenance_items FOR SELECT
    USING (true);

-- 7. SEED INICIAL: Tipos de Combustible Universales
INSERT INTO public.fuel_types (code, name, unit, energy_density_mj_per_unit, co2_emission_factor)
VALUES
    ('diesel', 'Diésel Oil', 'litros', 35.80, 2.6800),
    ('gasoline', 'Gasolina Especial / Premium', 'litros', 32.20, 2.3100),
    ('gnv', 'Gas Natural Vehicular (GNV)', 'm³', 38.00, 1.8800),
    ('electric', 'Electricidad (Red / Batería)', 'kWh', 3.60, 0.4500),
    ('hybrid_diesel', 'Híbrido Diésel-Eléctrico', 'litros', 35.80, 2.1400),
    ('hydrogen', 'Hidrógeno Verde (Pila de Combustible)', 'kg', 120.00, 0.0000)
ON CONFLICT (code) DO NOTHING;

-- 8. SEED INICIAL: Tenant Sucre & Catálogo Nissan Civilian
DO $$
DECLARE
    v_org_id UUID;
    v_mode_id UUID;
    v_fuel_id UUID;
    v_veh_id UUID;
    v_template_id UUID;
BEGIN
    -- Crear o recuperar Organización Sucre
    INSERT INTO public.organizations (slug, name, short_name, city, country, currency_code, currency_symbol)
    VALUES ('sucre', 'Gobierno Autónomo Municipal de Sucre', 'GAM Sucre', 'Sucre', 'Bolivia', 'BOB', 'Bs.')
    ON CONFLICT (slug) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_org_id;

    -- Modo de Transporte: Microbús Urbano
    INSERT INTO public.transport_modes (organization_id, code, name, default_capacity_seated, default_capacity_standing)
    VALUES (v_org_id, 'microbus_urbano', 'Microbús Urbano Tradicional', 25, 10)
    ON CONFLICT (organization_id, code) DO UPDATE SET is_active = true
    RETURNING id INTO v_mode_id;

    -- Combustible Diésel
    SELECT id INTO v_fuel_id FROM public.fuel_types WHERE code = 'diesel';

    -- Tipo de Vehículo: Nissan Civilian Diésel
    INSERT INTO public.vehicle_types (
        organization_id, transport_mode_id, fuel_type_id,
        brand, model, year_range, capacity_seated, capacity_standing,
        fuel_efficiency, idle_congestion_factor,
        replacement_value, residual_value, useful_life_months
    )
    VALUES (
        v_org_id, v_mode_id, v_fuel_id,
        'Nissan', 'Civilian', '2005-2018', 25, 10,
        5.50, 0.1500,
        198360.00, 0.00, 120
    )
    ON CONFLICT (organization_id, brand, model, fuel_type_id) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_veh_id;

    -- Plantilla de Mantenimiento Nissan Civilian
    INSERT INTO public.maintenance_templates (
        organization_id, vehicle_type_id, name,
        total_annual_cost, total_monthly_cost, variable_share, fixed_share
    )
    VALUES (
        v_org_id, v_veh_id, 'Nissan Civilian — Planilla Oficial GAM Sucre / Ecotraffic v2',
        34082.00, 2840.17, 0.25137, 0.74863
    )
    RETURNING id INTO v_template_id;

    -- Organización Ecotraffic Consultoría
    INSERT INTO public.organizations (slug, name, short_name, city, country, currency_code, currency_symbol)
    VALUES ('ecotraffic', 'Ecotraffic Consultoría Regulatoria & Movilidad', 'Ecotraffic', 'Nacional', 'Bolivia', 'BOB', 'Bs.')
    ON CONFLICT (slug) DO NOTHING;

END $$;
