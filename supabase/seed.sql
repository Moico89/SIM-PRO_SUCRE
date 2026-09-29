-- ============================================================================
-- SEED DATA OFICIAL — SUCRE v3.3
-- SESIÓN BASE, PARÁMETROS AUDITADOS, 6 CATEGORÍAS, 32 RUTAS Y USUARIOS
-- ============================================================================

-- 1. Crear sesión de negociación inicial
INSERT INTO public.negotiation_sessions (
    id, session_code, title, description, status, active_scenario
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SUCRE-MESA-CONCERTACION-2026',
    'Mesa Técnica de Concertación Tarifaria del Transporte Urbano de Sucre',
    'Sesión oficial de deliberación técnica entre el GAM Sucre y los Sindicatos San Cristóbal y Sucre sobre la base de costos auditados v3.3',
    'en_negociacion',
    'social2'
) ON CONFLICT DO NOTHING;

-- 2. Parámetros del sistema auditados
INSERT INTO public.system_parameters (
    id, session_id, fleet_active, km_network_day, demand_network_day,
    operating_days_month, turns_day, fuel_efficiency_km_l, idle_congestion_factor,
    fuel_price_bs_l, driver_salary_bs, labor_charges_factor,
    maintenance_monthly_bs, maintenance_var_share, maintenance_fixed_share,
    other_fixed_monthly_bs, vehicle_replacement_value_bs, vehicle_residual_value_bs,
    vehicle_useful_life_months, capital_return_rate_annual, threshold_laspeyres, is_locked, version
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    987.0, 82475.0, 265569.0,
    26, 3.0, 5.50, 0.1500,
    17.95, 3300.0, 0.0833333333,
    2869.75, 0.2513736712, 0.7486263288,
    720.42, 198360.0, 0.0,
    120, 0.1100, 0.0500, false, 1
) ON CONFLICT DO NOTHING;

-- 3. Categorías de demanda y tarifas
INSERT INTO public.fare_categories (
    session_id, name, demand_share, daily_trips, fare_current_bs, fare_technical_bs, fare_social_1_bs, fare_social_2_bs, sort_order
) VALUES
('a0000000-0000-0000-0000-000000000001', 'Adultos', 0.58, 154030.0, 4.50, 3.4485, 3.80, 3.50, 1),
('a0000000-0000-0000-0000-000000000001', 'Adultos mayores', 0.07, 18590.0, 3.50, 2.6822, 3.00, 2.50, 2),
('a0000000-0000-0000-0000-000000000001', 'Universitarios', 0.18, 47802.0, 2.50, 1.9158, 2.00, 2.00, 3),
('a0000000-0000-0000-0000-000000000001', 'Colegiales', 0.10, 26557.0, 1.50, 1.1495, 1.50, 1.50, 4),
('a0000000-0000-0000-0000-000000000001', 'Escolares', 0.05, 13278.0, 1.00, 0.7663, 1.00, 1.50, 5),
('a0000000-0000-0000-0000-000000000001', 'Discapacidad / menores de 5', 0.02, 5311.0, 0.00, 0.0000, 0.00, 0.00, 6)
ON CONFLICT DO NOTHING;

-- 4. Inserción de las 32 Rutas Urbanas
INSERT INTO public.network_routes (session_id, route_number, union_name, line_name, cycle_distance_km, inventory_fleet, assigned_fleet) VALUES
('a0000000-0000-0000-0000-000000000001', 1, 'San Cristóbal', 'Línea 12 amarillo', 15.49, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 2, 'San Cristóbal', 'Línea 12 Rosado', 29.24, 23, 25.97),
('a0000000-0000-0000-0000-000000000001', 3, 'San Cristóbal', 'Línea 1', 30.62, 28, 31.62),
('a0000000-0000-0000-0000-000000000001', 4, 'San Cristóbal', 'Línea 2', 32.90, 28, 31.62),
('a0000000-0000-0000-0000-000000000001', 5, 'San Cristóbal', 'Línea 3', 28.30, 29, 32.75),
('a0000000-0000-0000-0000-000000000001', 6, 'San Cristóbal', 'Línea 4', 29.76, 28, 31.62),
('a0000000-0000-0000-0000-000000000001', 7, 'San Cristóbal', 'Línea 5', 25.92, 29, 32.75),
('a0000000-0000-0000-0000-000000000001', 8, 'San Cristóbal', 'Línea 6', 26.38, 28, 31.62),
('a0000000-0000-0000-0000-000000000001', 9, 'San Cristóbal', 'Línea 7', 24.50, 28, 31.62),
('a0000000-0000-0000-0000-000000000001', 10, 'San Cristóbal', 'Línea 8', 25.83, 29, 32.75),
('a0000000-0000-0000-0000-000000000001', 11, 'San Cristóbal', 'Línea 10', 35.53, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 12, 'San Cristóbal', 'Línea 11', 22.96, 26, 29.36),
('a0000000-0000-0000-0000-000000000001', 13, 'San Cristóbal', 'Línea 14 (Tramo A)', 24.21, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 14, 'San Cristóbal', 'Línea 25', 34.57, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 15, 'San Cristóbal', 'Línea 33', 30.10, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 16, 'San Cristóbal', 'Línea 77', 21.02, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 17, 'San Cristóbal', 'Línea 125', 34.86, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 18, 'San Cristóbal', 'Línea 01', 31.44, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 19, 'San Cristóbal', 'Línea 14 (Tramo B)', 24.38, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 20, 'Sindicato Sucre', 'Línea K 50', 28.00, 28, 31.62),
('a0000000-0000-0000-0000-000000000001', 21, 'Sindicato Sucre', 'Línea 20', 36.00, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 22, 'Sindicato Sucre', 'Línea B (Amarillo) 21', 31.00, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 23, 'Sindicato Sucre', 'Línea FX 80', 34.00, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 24, 'Sindicato Sucre', 'Línea FX 15', 30.00, 28, 31.62),
('a0000000-0000-0000-0000-000000000001', 25, 'Sindicato Sucre', 'Línea Q Rosada', 28.00, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 26, 'Sindicato Sucre', 'Línea Q Amarillo 55', 32.00, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 27, 'Sindicato Sucre', 'Línea A 30', 22.00, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 28, 'Sindicato Sucre', 'Línea G 60', 29.00, 28, 31.62),
('a0000000-0000-0000-0000-000000000001', 29, 'Sindicato Sucre', 'Línea C 70', 20.00, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 30, 'Sindicato Sucre', 'Línea L 18', 20.00, 27, 30.49),
('a0000000-0000-0000-0000-000000000001', 31, 'Sindicato Sucre', 'Línea B Verde 101', 23.00, 28, 31.62),
('a0000000-0000-0000-0000-000000000001', 32, 'Sindicato Sucre', 'Línea D 87', 26.00, 27, 30.49)
ON CONFLICT DO NOTHING;

-- 5. Registro inicial en la bitácora de auditoría
INSERT INTO public.audit_logs (
    session_id, user_email, user_role, user_organization,
    action, entity_name, field_name, old_value, new_value, justification
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'consultor@ecotraffic.com.bo',
    'consultor_ecotraffic',
    'Ecotraffic Consultoría',
    'INSERT',
    'system_parameters',
    'init_baseline',
    NULL,
    '{"fleet": 987, "km_day": 82475, "demand_day": 265569, "maintenance": 2869.75, "fuel_eff": 5.5, "salary": 3300}'::jsonb,
    'Inicialización oficial de la línea base auditada v3.3 acordada para el proceso de concertación tarifaria con el GAM Sucre.'
);
