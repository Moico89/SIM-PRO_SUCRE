'use server';

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  return createClient(supabaseUrl, supabaseKey);
}

export async function getFuelTypes() {
  try {
    const { data, error } = await Promise.race([
      Promise.resolve(getSupabase().from('fuel_types').select('*').order('name')),
      new Promise<{ data: null; error: Error }>((resolve) => setTimeout(() => resolve({ data: null, error: new Error('TIMEOUT') }), 1500)),
    ]);
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getTransportModes(organizationId: string) {
  try {
    const { data, error } = await Promise.race([
      Promise.resolve(
        getSupabase()
          .from('transport_modes')
          .select('*')
          .eq('organization_id', organizationId)
          .order('name')
      ),
      new Promise<{ data: null; error: Error }>((resolve) => setTimeout(() => resolve({ data: null, error: new Error('TIMEOUT') }), 1500)),
    ]);
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getVehicleTypes(organizationId: string) {
  try {
    const { data, error } = await Promise.race([
      Promise.resolve(
        getSupabase()
          .from('vehicle_types')
          .select(`
            *,
            transport_modes (name),
            fuel_types (name, unit)
          `)
          .eq('organization_id', organizationId)
          .order('brand')
      ),
      new Promise<{ data: null; error: Error }>((resolve) => setTimeout(() => resolve({ data: null, error: new Error('TIMEOUT') }), 1500)),
    ]);
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

import { VehicleType } from '@/types/database';

export async function createVehicleType(vehicleData: Omit<VehicleType, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await getSupabase()
    .from('vehicle_types')
    .insert([vehicleData])
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data as VehicleType;
}

export async function updateVehicleType(id: string, vehicleData: Partial<Omit<VehicleType, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await getSupabase()
    .from('vehicle_types')
    .update(vehicleData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data as VehicleType;
}

export async function toggleVehicleActive(id: string, is_active: boolean) {
  const { data, error } = await getSupabase()
    .from('vehicle_types')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteVehicleType(id: string) {
  const { error } = await getSupabase()
    .from('vehicle_types')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(error.message);
  return true;
}
