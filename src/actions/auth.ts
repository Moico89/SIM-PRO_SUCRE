'use server';

import { createClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/types/database';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SignInSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const SignUpSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().min(3, 'Nombre completo requerido'),
  organization: z.string().min(2, 'Organización requerida'),
  role: z.enum(['superadmin', 'admin_municipal', 'delegado_sindical', 'consultor_ecotraffic', 'observador_publico']).default('observador_publico')
});

const CreateAdminSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().min(3, 'Nombre requerido'),
  organization: z.string().min(2, 'Organización requerida'),
  role: z.enum(['superadmin', 'admin_municipal', 'delegado_sindical', 'consultor_ecotraffic', 'observador_publico'])
});

export async function loginUser(input: z.infer<typeof SignInSchema>) {
  const validation = SignInSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  const { email, password } = validation.data;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    // Si es ecotraffic.bo@gmail.com asegurar rol superadmin
    if (data.user.email === 'ecotraffic.bo@gmail.com') {
      await supabase
        .from('profiles')
        .update({ role: 'superadmin', organization: 'Ecotraffic Consultoría' })
        .eq('id', data.user.id);
    }
  }

  revalidatePath('/');
  return { success: true, user: data.user };
}

export async function registerUser(input: z.infer<typeof SignUpSchema>) {
  const validation = SignUpSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  const { email, password, fullName, organization, role } = validation.data;
  const supabase = createClient();

  // Asignación automática de rol SuperAdmin
  const assignedRole: UserRole = email === 'ecotraffic.bo@gmail.com' ? 'superadmin' : role;
  const assignedOrg = email === 'ecotraffic.bo@gmail.com' ? 'Ecotraffic Consultoría' : organization;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organization: assignedOrg,
        role: assignedRole
      }
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    // Insertar o asegurar perfil en profiles
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email!,
      full_name: fullName,
      role: assignedRole,
      organization: assignedOrg,
      is_active: true
    });
  }

  revalidatePath('/');
  return { 
    success: true, 
    message: 'Usuario registrado exitosamente. Si la confirmación de email está activa, verifique su bandeja.',
    user: data.user 
  };
}

export async function logoutUser() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/');
  return { success: true };
}

export async function getCurrentUserProfile(): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'No autenticado' };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // Si no existe perfil pero es superadmin, crearlo
    if (user.email === 'ecotraffic.bo@gmail.com') {
      const newSuperProfile: Profile = {
        id: user.id,
        email: user.email,
        full_name: 'SuperAdmin Ecotraffic',
        role: 'superadmin',
        organization: 'Ecotraffic Consultoría',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await supabase.from('profiles').upsert(newSuperProfile);
      return { success: true, profile: newSuperProfile };
    }
    return { success: false, error: 'Perfil no encontrado' };
  }

  return { success: true, profile: profile as Profile };
}

// ==========================================
// GESTIÓN DE USUARIOS (PANEL SUPERADMIN)
// ==========================================

export async function getAllUsers(): Promise<{ success: boolean; users?: Profile[]; error?: string }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, users: data as Profile[] };
}

export async function createAdminUserBySuperAdmin(input: z.infer<typeof CreateAdminSchema>) {
  const validation = CreateAdminSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentProfile?.role !== 'superadmin' && user.email !== 'ecotraffic.bo@gmail.com') {
    return { success: false, error: 'Acceso denegado: Solo el SuperAdmin puede crear y asignar usuarios administradores.' };
  }

  const { email, password, fullName, organization, role } = validation.data;

  // Registrar usuario en Supabase Auth
  const { data: newUser, error: createError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organization,
        role
      }
    }
  });

  if (createError) {
    return { success: false, error: createError.message };
  }

  if (newUser.user) {
    await supabase.from('profiles').upsert({
      id: newUser.user.id,
      email: newUser.user.email!,
      full_name: fullName,
      organization,
      role,
      is_active: true
    });
  }

  revalidatePath('/');
  return { success: true, message: `Usuario ${role} creado exitosamente con el correo ${email}` };
}

export async function toggleUserActiveStatus(userId: string, isActive: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  return { success: true, message: `Estado de usuario actualizado a: ${isActive ? 'Activo' : 'Inactivo'}` };
}

export async function updateUserRoleBySuperAdmin(userId: string, newRole: UserRole) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  return { success: true, message: `Rol actualizado a ${newRole}` };
}
