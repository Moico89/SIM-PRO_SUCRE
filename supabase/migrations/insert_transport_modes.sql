-- Añadir nuevos modos de transporte para Sucre
DO $$
DECLARE
    v_org_id UUID := '0140e25f-10f6-4099-a778-b42d9d191c06'; -- ID de Sucre
BEGIN
    -- Trufis y Minibuses
    INSERT INTO public.transport_modes (organization_id, code, name, default_capacity_seated, default_capacity_standing)
    VALUES (v_org_id, 'trufi_minibus', 'Trufis y Minibuses (Ruta Fija)', 14, 0)
    ON CONFLICT (organization_id, code) DO UPDATE SET is_active = true;

    -- Taxis y Radiotaxis
    INSERT INTO public.transport_modes (organization_id, code, name, default_capacity_seated, default_capacity_standing)
    VALUES (v_org_id, 'taxi_radiotaxi', 'Taxis y Radiotaxis', 4, 0)
    ON CONFLICT (organization_id, code) DO UPDATE SET is_active = true;

    -- Transporte Libre / Alternativo
    INSERT INTO public.transport_modes (organization_id, code, name, default_capacity_seated, default_capacity_standing)
    VALUES (v_org_id, 'transporte_libre', 'Transporte Libre (Camionetas)', 10, 4)
    ON CONFLICT (organization_id, code) DO UPDATE SET is_active = true;
END $$;
