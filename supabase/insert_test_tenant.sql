-- 1. Insertar Organización de Prueba: Cochabamba
DO $$
DECLARE
    v_org_id UUID;
    v_mode_id UUID;
    v_fuel_id UUID;
    v_veh_id UUID;
    v_template_id UUID;
BEGIN
    -- Crear Organización Cochabamba
    INSERT INTO public.organizations (slug, name, short_name, city, country, currency_code, currency_symbol)
    VALUES ('cochabamba', 'Gobierno Autónomo Municipal de Cochabamba', 'GAM Cochabamba', 'Cochabamba', 'Bolivia', 'BOB', 'Bs.')
    ON CONFLICT (slug) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_org_id;

    -- Modo de Transporte: Taxitrufi
    INSERT INTO public.transport_modes (organization_id, code, name, default_capacity_seated, default_capacity_standing)
    VALUES (v_org_id, 'taxitrufi', 'Taxitrufi', 5, 0)
    ON CONFLICT (organization_id, code) DO UPDATE SET is_active = true
    RETURNING id INTO v_mode_id;

    -- Combustible GNV
    SELECT id INTO v_fuel_id FROM public.fuel_types WHERE code = 'gnv';

    -- Tipo de Vehículo: Toyota Probox GNV
    INSERT INTO public.vehicle_types (
        organization_id, transport_mode_id, fuel_type_id,
        brand, model, year_range, capacity_seated, capacity_standing,
        fuel_efficiency, idle_congestion_factor,
        replacement_value, residual_value, useful_life_months
    )
    VALUES (
        v_org_id, v_mode_id, v_fuel_id,
        'Toyota', 'Probox', '2010-2020', 5, 0,
        10.50, 0.1000,
        70000.00, 0.00, 120
    )
    ON CONFLICT (organization_id, brand, model, fuel_type_id) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_veh_id;

    -- Plantilla de Mantenimiento Taxitrufi
    INSERT INTO public.maintenance_templates (
        organization_id, vehicle_type_id, name,
        total_annual_cost, total_monthly_cost, variable_share, fixed_share
    )
    VALUES (
        v_org_id, v_veh_id, 'Taxitrufi — Planilla Básica CBBA',
        15000.00, 1250.00, 0.40, 0.60
    )
    RETURNING id INTO v_template_id;

END $$;
