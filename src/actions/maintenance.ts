'use server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  return createClient(supabaseUrl, supabaseKey);
}

export async function getTemplatesByOrg(orgId: string) {
  const { data, error } = await getSupabase()
    .from('maintenance_templates')
    .select(`
      *,
      vehicle_types (
        brand, model, capacity_seated, capacity_standing
      )
    `)
    .eq('organization_id', orgId);
  
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getItemsByTemplate(templateId: string) {
  const { data, error } = await getSupabase()
    .from('maintenance_items')
    .select('*')
    .eq('template_id', templateId)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });
  
  if (error) throw new Error(error.message);
  return data || [];
}

import { MaintenanceTemplate, MaintenanceItem } from '@/types/database';

export async function createTemplate(templateData: Omit<MaintenanceTemplate, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await getSupabase()
    .from('maintenance_templates')
    .insert([templateData])
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  revalidatePath('/admin/mantenimiento');
  revalidatePath('/');
  return data as MaintenanceTemplate;
}

export async function saveMaintenanceItems(templateId: string, items: Omit<MaintenanceItem, 'id' | 'created_at'>[]) {
  // Para MVP borramos y re-insertamos (bulk replace)
  const { error: delError } = await getSupabase()
    .from('maintenance_items')
    .delete()
    .eq('template_id', templateId);
  
  if (delError) throw new Error(delError.message);

  if (items.length === 0) return true;

  const insertData = items.map((item, index) => ({
    ...item,
    template_id: templateId,
    sort_order: index
  }));

  const { error: insError } = await getSupabase()
    .from('maintenance_items')
    .insert(insertData);
  
  if (insError) throw new Error(insError.message);
  return true;
}

export async function updateTemplateTotals(templateId: string, totals: { total_annual_cost: number, total_monthly_cost: number, variable_share: number, fixed_share: number }) {
  const { error } = await getSupabase()
    .from('maintenance_templates')
    .update(totals)
    .eq('id', templateId);
    
  if (error) throw new Error(error.message);

  // Sync to system parameters so Dashboard updates in real time via WebSockets
  const { data: latestParam } = await getSupabase()
    .from('system_parameters')
    .select('id, version')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (latestParam) {
    await getSupabase()
      .from('system_parameters')
      .update({
        maintenance_monthly_bs: totals.total_monthly_cost,
        maintenance_var_share: totals.variable_share,
        maintenance_fixed_share: totals.fixed_share,
        version: latestParam.version + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', latestParam.id);
  }

  revalidatePath('/admin/mantenimiento');
  revalidatePath('/');
  return true;
}
