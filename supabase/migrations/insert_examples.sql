-- Habilitar inserciones para usuarios anónimos temporalmente (Fase de Pruebas MVP)
CREATE POLICY "Permitir inserciones anónimas en vehículos" 
    ON public.vehicle_types FOR INSERT 
    WITH CHECK (true);

-- Cargar 3 Ejemplos Reales (Multimodalidad)
DO $$
DECLARE
    v_org_id UUID := '0140e25f-10f6-4099-a778-b42d9d191c06'; -- ID de Sucre
    v_mode_id UUID;
    v_bus_mode_id UUID;
    v_diesel_id UUID;
    v_gnv_id UUID;
    v_ev_id UUID;
BEGIN
    -- Obtener IDs de Combustibles
    SELECT id INTO v_diesel_id FROM public.fuel_types WHERE code = 'diesel';
    SELECT id INTO v_gnv_id FROM public.fuel_types WHERE code = 'gnv';
    SELECT id INTO v_ev_id FROM public.fuel_types WHERE code = 'electric';

    -- Obtener Modo Microbús
    SELECT id INTO v_mode_id FROM public.transport_modes WHERE code = 'microbus_urbano';

    -- Crear Modo Bus (si no existe)
    INSERT INTO public.transport_modes (organization_id, code, name, default_capacity_seated, default_capacity_standing)
    VALUES (v_org_id, 'bus_brt', 'Bus Urbano / BRT', 40, 40)
    ON CONFLICT (organization_id, code) DO UPDATE SET is_active = true
    RETURNING id INTO v_bus_mode_id;

    -- 1. Microbús Diésel (Estándar Actual)
    INSERT INTO public.vehicle_types (organization_id, transport_mode_id, fuel_type_id, brand, model, capacity_seated, capacity_standing, fuel_efficiency, idle_congestion_factor, replacement_value, useful_life_months)
    VALUES (v_org_id, v_mode_id, v_diesel_id, 'Nissan', 'Civilian (Diésel)', 24, 10, 5.5, 0.15, 198360, 120)
    ON CONFLICT DO NOTHING;

    -- 2. Microbús GNV (Transición Ecológica)
    INSERT INTO public.vehicle_types (organization_id, transport_mode_id, fuel_type_id, brand, model, capacity_seated, capacity_standing, fuel_efficiency, idle_congestion_factor, replacement_value, useful_life_months)
    VALUES (v_org_id, v_mode_id, v_gnv_id, 'King Long', 'Microbús GNV 7m', 22, 12, 4.8, 0.12, 260000, 120)
    ON CONFLICT DO NOTHING;

    -- 3. Bus Eléctrico (Cero Emisiones)
    INSERT INTO public.vehicle_types (organization_id, transport_mode_id, fuel_type_id, brand, model, capacity_seated, capacity_standing, fuel_efficiency, idle_congestion_factor, replacement_value, useful_life_months)
    VALUES (v_org_id, v_bus_mode_id, v_ev_id, 'BYD', 'K7 (Eléctrico)', 26, 20, 1.1, 0.00, 1100000, 180)
    ON CONFLICT DO NOTHING;

END $$;
