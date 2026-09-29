export type UserRole = 
  | 'superadmin'
  | 'admin_municipal'
  | 'delegado_sindical'
  | 'consultor_ecotraffic'
  | 'observador_publico';


export type SessionStatus = 
  | 'borrador'
  | 'en_negociacion'
  | 'congelada'
  | 'aprobada'
  | 'archivada';

export type AuditActionType = 
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'CAMBIO_PARAMETRO'
  | 'CAMBIO_TARIFA'
  | 'CREACION_ESCENARIO'
  | 'EDICION_ESCENARIO'
  | 'BLOQUEO_SESION'
  | 'DESBLOQUEO_SESION'
  | 'LOGIN'
  | 'EXPORT_REPORT';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NegotiationSession {
  id: string;
  session_code: string;
  title: string;
  description?: string;
  status: SessionStatus;
  active_scenario: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemParameters {
  id: string;
  session_id: string;
  fleet_active: number;
  km_network_day: number;
  demand_network_day: number;
  operating_days_month: number;
  turns_day: number;
  fuel_efficiency_km_l: number;
  idle_congestion_factor: number;
  fuel_price_bs_l: number;
  driver_salary_bs: number;
  labor_charges_factor: number;
  maintenance_monthly_bs: number;
  maintenance_var_share: number;
  maintenance_fixed_share: number;
  other_fixed_monthly_bs: number;
  vehicle_replacement_value_bs: number;
  vehicle_residual_value_bs: number;
  vehicle_useful_life_months: number;
  capital_return_rate_annual: number;
  threshold_laspeyres: number;
  is_locked: boolean;
  version: number;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FareCategory {
  id: string;
  session_id: string;
  name: string;
  demand_share: number;
  daily_trips: number;
  fare_current_bs: number;
  fare_technical_bs: number;
  fare_social_1_bs: number;
  fare_social_2_bs: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NetworkRoute {
  id: string;
  session_id: string;
  route_number: number;
  union_name: string;
  line_name: string;
  cycle_distance_km: number;
  inventory_fleet: number;
  assigned_fleet: number;
  created_at: string;
}

export type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface AuditLog {
  id: string;
  session_id?: string;
  user_id?: string;
  user_email: string;
  user_role: UserRole;
  user_organization: string;
  action: AuditActionType;
  entity_name: string;
  entity_id?: string;
  field_name?: string;
  old_value: Record<string, Json> | Json;
  new_value: Record<string, Json> | Json;
  justification: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

