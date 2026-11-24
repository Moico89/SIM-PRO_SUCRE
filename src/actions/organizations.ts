'use server';

import { createClient } from '@/lib/supabase/server';
import type { Organization, TransportMode, FuelType, VehicleType } from '@/types/database';

export async function getOrganizations(): Promise<Organization[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .order('name');
      
    if (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error in getOrganizations:', err);
    return [];
  }
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getOrganizationVehicleTypes(organizationId: string) {
  try {
    const supabase = createClient();
    
    // We fetch the vehicle types along with their transport mode and fuel type
    // Since Supabase returns nested objects for foreign keys, we structure the query
    const { data, error } = await supabase
      .from('vehicle_types')
      .select(`
        *,
        transport_modes (*),
        fuel_types (*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true);
      
    if (error) {
      console.error('Error fetching vehicle types:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error in getOrganizationVehicleTypes:', err);
    return [];
  }
}
