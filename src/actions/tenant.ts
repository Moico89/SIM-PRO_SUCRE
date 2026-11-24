'use server';

import { createClient } from '@/lib/supabase/server';
import type { SystemParameters, FareCategory, AuditLog } from '@/types/database';

async function withTimeout<T>(promise: PromiseLike<T>, ms = 1500): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('SUPABASE_TIMEOUT')), ms)),
  ]);
}

export async function getTenantDashboardData(organizationSlug: string = 'sucre') {
  try {
    const supabase = createClient();

    // Fast-fail si Supabase no es accesible (ej. entorno local offline / DNS)
    const { data: orgData, error: orgError } = await withTimeout(
      supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', organizationSlug)
        .single(),
      1500
    );

    if (orgError) {
      throw orgError;
    }

    const { data: paramData } = await withTimeout(
      supabase
        .from('system_parameters')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single(),
      1500
    );

    const sessionId = paramData?.session_id || 'a0000000-0000-0000-0000-000000000001';

    const [{ data: fareData }, { data: logData }, { data: maintData }, { data: vehData }] = await withTimeout(
      Promise.all([
        supabase.from('fare_categories').select('*').eq('session_id', sessionId).order('sort_order'),
        supabase.from('audit_logs').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(50),
        supabase.from('maintenance_templates').select('*').eq('organization_id', orgData?.id).eq('is_locked', false).order('created_at', { ascending: false }),
        supabase.from('vehicle_types').select('*, fuel_types(id, code, name, unit), transport_modes(id, code, name)').eq('organization_id', orgData?.id).eq('is_active', true),
      ]),
      2000
    );

    return {
      parameters: paramData as SystemParameters | null,
      fares: (fareData as FareCategory[]) || [],
      logs: (logData as AuditLog[]) || [],
      organization: orgData,
      maintenanceTemplates: maintData || [],
      vehicleTypes: vehData || []
    };
  } catch (err) {
    console.error('Error fetching tenant dashboard data:', err);
    return { parameters: null, fares: [], logs: [], organization: null, maintenanceTemplates: [], vehicleTypes: [] };
  }
}
