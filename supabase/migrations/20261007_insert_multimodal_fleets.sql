-- ============================================================================
-- AMPLIACIÓN DE CASOS DE MOVILIDAD: GNV Y ELÉCTRICOS
-- ============================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_mode_minibus_id UUID;
    v_mode_brt_id UUID;
    v_gnv_id UUID;
    v_electric_id UUID;
    v_veh_gnv_id UUID;
    v_veh_elec_id UUID;
BEGIN
    -- Recuperar Organización Sucre
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'sucre';

    -- Crear modos de transporte si no existen
    INSERT INTO public.transport_modes (organization_id, code, name, default_capacity_seated, default_capacity_standing)
    VALUES 
        (v_org_id, 'minibus', 'Minibús Colectivo (GNV)', 14, 0),
        (v_org_id, 'brt_electrico', 'BRT Eléctrico Articulado', 40, 60)
    ON CONFLICT (organization_id, code) DO UPDATE SET is_active = true;

    SELECT id INTO v_mode_minibus_id FROM public.transport_modes WHERE code = 'minibus' AND organization_id = v_org_id;
    SELECT id INTO v_mode_brt_id FROM public.transport_modes WHERE code = 'brt_electrico' AND organization_id = v_org_id;

    -- Tipos de combustible
    SELECT id INTO v_gnv_id FROM public.fuel_types WHERE code = 'gnv';
    SELECT id INTO v_electric_id FROM public.fuel_types WHERE code = 'electric';

    -- 1. Minibús GNV (Capex bajo, Opex combustible muy bajo)
    INSERT INTO public.vehicle_types (
        organization_id, transport_mode_id, fuel_type_id,
        brand, model, year_range, capacity_seated, capacity_standing,
        fuel_efficiency, idle_congestion_factor,
        replacement_value, residual_value, useful_life_months
    )
    VALUES (
        v_org_id, v_mode_minibus_id, v_gnv_id,
        'King Long', 'Minibus GNV', '2020-2024', 14, 0,
        6.00, 0.1500, -- 6 km/m3
        150000.00, 15000.00, 96
    )
    ON CONFLICT (organization_id, brand, model, fuel_type_id) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_veh_gnv_id;

    -- Plantilla Mantenimiento Minibús GNV
    INSERT INTO public.maintenance_templates (
        organization_id, vehicle_type_id, name,
        total_annual_cost, total_monthly_cost, variable_share, fixed_share
    )
    VALUES (
        v_org_id, v_veh_gnv_id, 'Plantilla Minibús GNV',
        25000.00, 2083.33, 0.30, 0.70
    );

    -- 2. Bus Eléctrico (Capex Alto, Opex bajo)
    INSERT INTO public.vehicle_types (
        organization_id, transport_mode_id, fuel_type_id,
        brand, model, year_range, capacity_seated, capacity_standing,
        fuel_efficiency, idle_congestion_factor,
        replacement_value, residual_value, useful_life_months
    )
    VALUES (
        v_org_id, v_mode_brt_id, v_electric_id,
        'BYD', 'K9', '2023-2026', 40, 40,
        1.10, 0.0500, -- 1.1 km/kWh, idle congestion is much lower for EVs
        1400000.00, 140000.00, 120
    )
    ON CONFLICT (organization_id, brand, model, fuel_type_id) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_veh_elec_id;

    -- Plantilla Mantenimiento Bus Eléctrico
    INSERT INTO public.maintenance_templates (
        organization_id, vehicle_type_id, name,
        total_annual_cost, total_monthly_cost, variable_share, fixed_share
    )
    VALUES (
        v_org_id, v_veh_elec_id, 'Plantilla Bus Eléctrico BYD K9',
        18000.00, 1500.00, 0.15, 0.85
    );

END $$;
