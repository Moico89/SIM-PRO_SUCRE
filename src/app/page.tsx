import DashboardView from '@/components/DashboardView';
import type { SystemParameters, FareCategory, AuditLog } from '@/types/database';

// Datos iniciales de contingencia / seed oficial v3.3
const defaultParameters: SystemParameters = {
  id: 'b0000000-0000-0000-0000-000000000001',
  session_id: 'a0000000-0000-0000-0000-000000000001',
  fleet_active: 987.0,
  km_network_day: 82475.0,
  demand_network_day: 265569.0,
  operating_days_month: 26,
  turns_day: 3.0,
  fuel_efficiency_km_l: 5.50,
  idle_congestion_factor: 0.1500,
  fuel_price_bs_l: 17.95,
  driver_salary_bs: 3300.0,
  labor_charges_factor: 0.0833333333,
  maintenance_monthly_bs: 2840.17,
  maintenance_var_share: 0.2513736712,
  maintenance_fixed_share: 0.7486263288,
  other_fixed_monthly_bs: 720.42,
  vehicle_replacement_value_bs: 198360.0,
  vehicle_residual_value_bs: 0.0,
  vehicle_useful_life_months: 120,
  capital_return_rate_annual: 0.1100,
  threshold_laspeyres: 0.0500,
  is_locked: false,
  version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const defaultFares: FareCategory[] = [
  { id: '1', session_id: 'a0000000-0000-0000-0000-000000000001', name: 'Adultos', demand_share: 0.58, daily_trips: 154030, fare_current_bs: 4.50, fare_technical_bs: 3.4485, fare_social_1_bs: 3.80, fare_social_2_bs: 3.50, sort_order: 1, created_at: '', updated_at: '' },
  { id: '2', session_id: 'a0000000-0000-0000-0000-000000000001', name: 'Adultos mayores', demand_share: 0.07, daily_trips: 18590, fare_current_bs: 3.50, fare_technical_bs: 2.6822, fare_social_1_bs: 3.00, fare_social_2_bs: 2.50, sort_order: 2, created_at: '', updated_at: '' },
  { id: '3', session_id: 'a0000000-0000-0000-0000-000000000001', name: 'Universitarios', demand_share: 0.18, daily_trips: 47802, fare_current_bs: 2.50, fare_technical_bs: 1.9158, fare_social_1_bs: 2.00, fare_social_2_bs: 2.00, sort_order: 3, created_at: '', updated_at: '' },
  { id: '4', session_id: 'a0000000-0000-0000-0000-000000000001', name: 'Colegiales', demand_share: 0.10, daily_trips: 26557, fare_current_bs: 1.50, fare_technical_bs: 1.1495, fare_social_1_bs: 1.50, fare_social_2_bs: 1.50, sort_order: 4, created_at: '', updated_at: '' },
  { id: '5', session_id: 'a0000000-0000-0000-0000-000000000001', name: 'Escolares', demand_share: 0.05, daily_trips: 13278, fare_current_bs: 1.00, fare_technical_bs: 0.7663, fare_social_1_bs: 1.00, fare_social_2_bs: 1.50, sort_order: 5, created_at: '', updated_at: '' },
  { id: '6', session_id: 'a0000000-0000-0000-0000-000000000001', name: 'Discapacidad / menores de 5', demand_share: 0.02, daily_trips: 5311, fare_current_bs: 0.00, fare_technical_bs: 0.0000, fare_social_1_bs: 0.00, fare_social_2_bs: 0.00, sort_order: 6, created_at: '', updated_at: '' }
];

const defaultLogs: AuditLog[] = [
  {
    id: 'log-1',
    session_id: 'a0000000-0000-0000-0000-000000000001',
    user_email: 'consultor@ecotraffic.com.bo',
    user_role: 'consultor_ecotraffic',
    user_organization: 'Ecotraffic Consultoría',
    action: 'CAMBIO_PARAMETRO',
    entity_name: 'system_parameters',
    field_name: 'maintenance_monthly_bs',
    old_value: { maintenance_monthly_bs: 4266.02 },
    new_value: { maintenance_monthly_bs: 2840.17 },
    justification: 'Planilla técnica de mantenimiento 52 ítems Nissan Civilian (Bs. 34.082,00 anual / Bs. 2.840,17 mensual) acordada con el GAM Sucre.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'log-2',
    session_id: 'a0000000-0000-0000-0000-000000000001',
    user_email: 'admin.transporte@sucre.bo',
    user_role: 'admin_municipal',
    user_organization: 'GAM Sucre',
    action: 'CAMBIO_TARIFA',
    entity_name: 'fare_categories',
    field_name: 'fare_social_2_bs',
    old_value: { Adultos: 3.80 },
    new_value: { Adultos: 3.50, 'Adultos mayores': 2.50, Escolares: 1.50 },
    justification: 'Formulación del segundo escenario de negociación municipal con tarifa adulto en Bs. 3,50 para proteger el ingreso ciudadano.',
    created_at: new Date(Date.now() - 1800000).toISOString()
  }
];

export default function HomePage() {
  return (
    <DashboardView 
      initialParameters={defaultParameters}
      initialFares={defaultFares}
      initialLogs={defaultLogs}
      currentRole="consultor_ecotraffic"
      currentUserEmail="consultor@ecotraffic.com.bo"
    />
  );
}
