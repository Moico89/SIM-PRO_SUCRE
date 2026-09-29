'use server';

import { createClient } from '@/lib/supabase/server';
import { UpdateParameterSchema, type UpdateParameterInput } from '@/lib/validations/parameters';
import { revalidatePath } from 'next/cache';

export async function updateSystemParameter(input: UpdateParameterInput) {
  const validation = UpdateParameterSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  const { sessionId, parameterId, field, newValue, justification } = validation.data;
  const supabase = createClient();

  // 1. Obtener usuario autenticado y su perfil con rol
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'No autorizado. Debe iniciar sesión en el sistema.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, organization')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Perfil de usuario no encontrado en la base de datos.' };
  }

  // 2. Control de Acceso Basado en Roles (RBAC)
  if (profile.role !== 'superadmin' && profile.role !== 'admin_municipal' && profile.role !== 'consultor_ecotraffic') {
    return { 
      success: false, 
      error: `Acceso denegado. El rol '${profile.role}' no tiene privilegios para modificar parámetros del modelo oficial.` 
    };
  }

  // 3. Verificar si los parámetros de la sesión están bloqueados
  const { data: currentParams, error: fetchError } = await supabase
    .from('system_parameters')
    .select('*')
    .eq('id', parameterId)
    .single();

  if (fetchError || !currentParams) {
    return { success: false, error: 'Parámetros del sistema no encontrados.' };
  }

  if (currentParams.is_locked) {
    return { 
      success: false, 
      error: 'La sesión se encuentra congelada oficialmente. No se permiten modificaciones adicionales.' 
    };
  }

  const oldValue = currentParams[field];

  // 4. Actualizar parámetro en la base de datos
  const { error: updateError } = await supabase
    .from('system_parameters')
    .update({
      [field]: newValue,
      version: currentParams.version + 1,
      updated_by: profile.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', parameterId);

  if (updateError) {
    return { success: false, error: `Error al actualizar parámetro: ${updateError.message}` };
  }

  // 5. Inserción obligatoria en AUDIT_LOGS (Registro Inmutable)
  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      session_id: sessionId,
      user_id: profile.id,
      user_email: profile.email,
      user_role: profile.role,
      user_organization: profile.organization,
      action: 'CAMBIO_PARAMETRO',
      entity_name: 'system_parameters',
      entity_id: parameterId,
      field_name: field,
      old_value: { [field]: oldValue },
      new_value: { [field]: newValue },
      justification: justification
    });

  if (auditError) {
    console.error('Alerta crítica: No se pudo registrar log de auditoría', auditError);
  }

  revalidatePath('/dashboard');
  return { 
    success: true, 
    message: `Parámetro '${field}' actualizado de ${oldValue} a ${newValue} con registro de auditoría.`,
    version: currentParams.version + 1
  };
}
