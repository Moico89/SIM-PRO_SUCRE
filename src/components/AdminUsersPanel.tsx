'use client';

import React, { useState, useEffect } from 'react';
import type { Profile, UserRole } from '@/types/database';
import type { ScenarioConfig } from '@/types/scenario';
import { 
  getAllUsers, 
  createAdminUserBySuperAdmin, 
  toggleUserActiveStatus, 
  updateUserRoleBySuperAdmin,
  updateUserBySuperAdmin,
  deleteUserBySuperAdmin
} from '@/actions/auth';
import { OFFICIAL_TENANTS } from '@/lib/tenants';

interface AdminUsersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  currentUserEmail: string;
  scenarios?: ScenarioConfig[];
  activeScenarioId?: string;
  onSaveScenario?: (scenario: ScenarioConfig) => void;
  onDeleteScenario?: (scenarioId: string) => void;
  onSelectScenario?: (scenarioId: string) => void;
}

const defaultDirectoryUsers: Profile[] = [
  {
    id: 'u-1',
    tenant_id: 'tenant-ecotraffic',
    email: 'ecotraffic.bo@gmail.com',
    full_name: 'SuperAdmin Principal Ecotraffic',
    role: 'superadmin',
    organization: 'Ecotraffic Consultoría',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'u-2',
    tenant_id: 'tenant-gams-sucre',
    email: 'admin.transporte@sucre.bo',
    full_name: 'Dirección de Tráfico y Transporte GAMS',
    role: 'admin_municipal',
    organization: 'GAM Sucre',
    is_active: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'u-3',
    tenant_id: 'tenant-ecotraffic',
    email: 'consultor@ecotraffic.com.bo',
    full_name: 'Ing. Rolando Consultor Senior',
    role: 'consultor_ecotraffic',
    organization: 'Ecotraffic Consultoría',
    is_active: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'u-4',
    tenant_id: 'tenant-sindicato-san-cristobal',
    email: 'sindicato.sancristobal@gmail.com',
    full_name: 'Delegado Choferes San Cristóbal',
    role: 'delegado_sindical',
    organization: 'Sindicato San Cristóbal',
    is_active: true,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function AdminUsersPanel({
  isOpen,
  onClose,
  currentUserRole,
  currentUserEmail,
  scenarios = [],
  activeScenarioId = 'social2',
  onSaveScenario,
  onDeleteScenario,
  onSelectScenario
}: AdminUsersPanelProps) {
  const [users, setUsers] = useState<Profile[]>(defaultDirectoryUsers);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'tenants' | 'scenarios'>('list');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Form de nuevo usuario
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('tenant-gams-sucre');
  const [newOrganization, setNewOrganization] = useState('GAM Sucre');
  const [newRole, setNewRole] = useState<UserRole>('admin_municipal');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Estado para editar usuario
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('admin_municipal');
  const [editTenantId, setEditTenantId] = useState('');
  const [editOrganization, setEditOrganization] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Form de escenario dentro del panel
  const [editingScenario, setEditingScenario] = useState<ScenarioConfig | null>(null);
  const [isCreatingScenario, setIsCreatingScenario] = useState(false);
  const [scLabel, setScLabel] = useState('');
  const [scBadge, setScBadge] = useState('');
  const [scAdultFare, setScAdultFare] = useState(3.50);
  const [scAdultosMayores, setScAdultosMayores] = useState(2.50);
  const [scUniversitarios, setScUniversitarios] = useState(2.00);
  const [scColegiales, setScColegiales] = useState(1.50);
  const [scEscolares, setScEscolares] = useState(1.50);
  const [scDemandFactor, setScDemandFactor] = useState(1.0);
  const [scFuelPriceFactor, setScFuelPriceFactor] = useState(1.0);

  const isSuperAdmin = currentUserRole === 'superadmin' || currentUserEmail.toLowerCase() === 'ecotraffic.bo@gmail.com';

  const fetchUsers = async () => {
    setLoading(true);
    let cachedUsers: Profile[] = [];
    try {
      const saved = localStorage.getItem('simpro_directory_users');
      if (saved) {
        cachedUsers = JSON.parse(saved);
      }
    } catch {}

    const res = await getAllUsers();
    setLoading(false);

    if (cachedUsers.length > 0) {
      const base = [...cachedUsers];
      if (res.success && res.users) {
        for (const u of res.users) {
          if (!base.some(b => b.email.toLowerCase() === u.email.toLowerCase())) {
            base.push(u);
          }
        }
      }
      setUsers(base);
    } else if (res.success && res.users) {
      setUsers(res.users);
      try { localStorage.setItem('simpro_directory_users', JSON.stringify(res.users)); } catch {}
    } else {
      setUsers(defaultDirectoryUsers);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. CREAR NUEVO USUARIO EN CATEGORÍAS
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setActionMessage(null);

    const emailClean = newEmail.toLowerCase().trim();
    const assignedTenant = OFFICIAL_TENANTS.find(t => t.id === selectedTenantId) || OFFICIAL_TENANTS[0];

    const newUser: Profile = {
      id: `usr-${Date.now()}`,
      tenant_id: assignedTenant.id,
      email: emailClean,
      full_name: newFullName.trim(),
      organization: newOrganization || assignedTenant.name,
      role: newRole,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Guardar en memoria y localStorage de directorio
    const updatedList = [newUser, ...users.filter(u => u.email.toLowerCase() !== emailClean)];
    setUsers(updatedList);
    try { localStorage.setItem('simpro_directory_users', JSON.stringify(updatedList)); } catch {}

    // 2. Guardar credencial personalizada para autenticación directa
    try {
      const creds = JSON.parse(localStorage.getItem('simpro_custom_credentials') || '{}');
      creds[emailClean] = {
        role: newRole,
        organization: newOrganization || assignedTenant.name,
        tenant_id: assignedTenant.id,
        fullName: newFullName.trim(),
        password: newPassword
      };
      localStorage.setItem('simpro_custom_credentials', JSON.stringify(creds));
    } catch {}

    // 3. Notificar al backend de servidor
    try {
      await createAdminUserBySuperAdmin({
        email: emailClean,
        password: newPassword,
        fullName: newFullName.trim(),
        organization: newOrganization || assignedTenant.name,
        tenantId: assignedTenant.id,
        role: newRole
      });
    } catch {}

    setFormSubmitting(false);
    setActionMessage({ 
      text: `Usuario ${newRole.toUpperCase()} '${newFullName.trim()}' (${emailClean}) creado y autorizado exitosamente en '${assignedTenant.short_name}'.`, 
      type: 'success' 
    });
    setNewEmail('');
    setNewFullName('');
    setActiveTab('list');
  };

  // 2. ABRIR MODAL / FORM DE EDICIÓN
  const startEditUser = (user: Profile) => {
    setEditingUser(user);
    setEditFullName(user.full_name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditTenantId(user.tenant_id || 'tenant-gams-sucre');
    setEditOrganization(user.organization);
    setEditPassword('');
  };

  // 3. GUARDAR EDICIÓN DE USUARIO
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setFormSubmitting(true);
    setActionMessage(null);

    const oldEmail = editingUser.email.toLowerCase().trim();
    const newEmailClean = editEmail.toLowerCase().trim();
    const assignedTenant = OFFICIAL_TENANTS.find(t => t.id === editTenantId) || OFFICIAL_TENANTS[0];

    const updatedUser: Profile = {
      ...editingUser,
      full_name: editFullName.trim(),
      email: newEmailClean,
      role: editRole,
      tenant_id: assignedTenant.id,
      organization: editOrganization.trim() || assignedTenant.name,
      updated_at: new Date().toISOString()
    };

    // Actualizar lista en estado y localStorage
    const updatedUsers = users.map(u => u.id === editingUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    try { localStorage.setItem('simpro_directory_users', JSON.stringify(updatedUsers)); } catch {}

    // Actualizar en credenciales personalizadas
    try {
      const creds = JSON.parse(localStorage.getItem('simpro_custom_credentials') || '{}');
      if (oldEmail !== newEmailClean) {
        delete creds[oldEmail];
      }
      creds[newEmailClean] = {
        role: editRole,
        organization: editOrganization.trim() || assignedTenant.name,
        tenant_id: assignedTenant.id,
        fullName: editFullName.trim(),
        password: editPassword || creds[oldEmail]?.password || ''
      };
      localStorage.setItem('simpro_custom_credentials', JSON.stringify(creds));
    } catch {}

    // Servidor
    try {
      await updateUserBySuperAdmin({
        userId: editingUser.id,
        email: newEmailClean,
        fullName: editFullName.trim(),
        organization: editOrganization.trim() || assignedTenant.name,
        role: editRole,
        tenantId: assignedTenant.id,
        password: editPassword || undefined
      });
    } catch {}

    setFormSubmitting(false);
    setEditingUser(null);
    setActionMessage({
      text: `Usuario '${editFullName.trim()}' (${newEmailClean}) actualizado correctamente con rol ${editRole.toUpperCase()}.`,
      type: 'success'
    });
  };

  // 4. ELIMINAR USUARIO
  const handleDeleteUser = async (userId: string, userEmail: string, userName: string) => {
    if (userEmail.toLowerCase() === 'ecotraffic.bo@gmail.com') {
      setActionMessage({ text: 'No es posible eliminar la cuenta principal de SuperAdmin.', type: 'error' });
      return;
    }

    if (!confirm(`¿Confirma eliminar definitivamente al usuario '${userName}' (${userEmail})?`)) {
      return;
    }

    const emailClean = userEmail.toLowerCase().trim();
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    try { localStorage.setItem('simpro_directory_users', JSON.stringify(updatedUsers)); } catch {}

    try {
      const creds = JSON.parse(localStorage.getItem('simpro_custom_credentials') || '{}');
      delete creds[emailClean];
      localStorage.setItem('simpro_custom_credentials', JSON.stringify(creds));
    } catch {}

    try {
      await deleteUserBySuperAdmin(userId);
    } catch {}

    setActionMessage({
      text: `Usuario '${userName}' (${userEmail}) eliminado del sistema.`,
      type: 'success'
    });
  };

  // 5. ALTERNAR ESTADO ACTIVO / DESACTIVADO
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u);
    setUsers(updatedUsers);
    try { localStorage.setItem('simpro_directory_users', JSON.stringify(updatedUsers)); } catch {}
    try { await toggleUserActiveStatus(userId, !currentStatus); } catch {}
    setActionMessage({
      text: `Estado actualizado a ${!currentStatus ? 'Activo' : 'Desactivado'}.`,
      type: 'success'
    });
  };

  // 6. CAMBIO RÁPIDO DE ROL
  const handleRoleChange = async (userId: string, targetRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: targetRole } : u);
    setUsers(updatedUsers);
    try { localStorage.setItem('simpro_directory_users', JSON.stringify(updatedUsers)); } catch {}
    
    if (targetUser) {
      try {
        const creds = JSON.parse(localStorage.getItem('simpro_custom_credentials') || '{}');
        const emailClean = targetUser.email.toLowerCase().trim();
        if (creds[emailClean]) {
          creds[emailClean].role = targetRole;
          localStorage.setItem('simpro_custom_credentials', JSON.stringify(creds));
        }
      } catch {}
    }

    try { await updateUserRoleBySuperAdmin(userId, targetRole); } catch {}
    setActionMessage({
      text: `Rol modificado a ${targetRole.toUpperCase()}.`,
      type: 'success'
    });
  };

  // Gestor de Escenarios
  const startEditScenario = (sc: ScenarioConfig) => {
    setIsCreatingScenario(false);
    setEditingScenario(sc);
    setScLabel(sc.label);
    setScBadge(sc.badge || '');
    setScAdultFare(sc.adultFare);
    setScAdultosMayores(sc.socialFares.adultosMayores);
    setScUniversitarios(sc.socialFares.universitarios);
    setScColegiales(sc.socialFares.colegiales);
    setScEscolares(sc.socialFares.escolares);
    setScDemandFactor(sc.demandFactor);
    setScFuelPriceFactor(sc.fuelPriceFactor);
  };

  const startCreateScenario = () => {
    setIsCreatingScenario(true);
    setEditingScenario(null);
    setScLabel('Propuesta Tarifaria Municipal');
    setScBadge('NUEVO');
    setScAdultFare(3.50);
    setScAdultosMayores(2.50);
    setScUniversitarios(2.00);
    setScColegiales(1.50);
    setScEscolares(1.50);
    setScDemandFactor(1.0);
    setScFuelPriceFactor(1.0);
  };

  const handleSaveScenarioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveScenario) return;

    const updated: ScenarioConfig = {
      id: editingScenario ? editingScenario.id : `sc-${Date.now()}`,
      label: scLabel,
      badge: scBadge.trim() || undefined,
      adultFare: Number(scAdultFare),
      socialFares: {
        adultos: Number(scAdultFare),
        adultosMayores: Number(scAdultosMayores),
        universitarios: Number(scUniversitarios),
        colegiales: Number(scColegiales),
        escolares: Number(scEscolares),
        discapacidad: 0
      },
      demandFactor: Number(scDemandFactor),
      fuelPriceFactor: Number(scFuelPriceFactor),
      isCustom: true,
      color: 'text-indigo-700 font-extrabold'
    };

    onSaveScenario(updated);
    setIsCreatingScenario(false);
    setEditingScenario(null);
    setActionMessage({ text: `Escenario '${scLabel}' guardado exitosamente.`, type: 'success' });
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter(u => {
    const matchesTenant = tenantFilter === 'all' || (u.tenant_id ? u.tenant_id === tenantFilter : (tenantFilter === 'tenant-gams-sucre' && u.organization.includes('GAM Sucre')));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesTenant && matchesRole;
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 flex flex-col font-sans">
        
        {/* Header con vectores SVG - Cero emojis */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.66 0 3 1.34 3 3 0 1.25-.77 2.31-1.86 2.74l1.36 4.26h-5l1.36-4.26C9.77 12.31 9 11.25 9 10c0-1.66 1.34-3 3-3z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Panel de Administración & Control RBAC</h2>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  {isSuperAdmin ? 'SuperAdmin Mode' : 'Admin Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-300">Gestión integral de usuarios, asignación de roles y control de escenarios</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Action Status Message */}
        {actionMessage && (
          <div className={`p-3 text-xs font-semibold flex items-center justify-between ${
            actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200' : 'bg-rose-50 text-rose-900 border-b border-rose-200'
          }`}>
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="cursor-pointer font-bold text-sm">&times;</button>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4 flex-wrap">
          <button
            onClick={() => { setActiveTab('list'); setEditingUser(null); }}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'list'
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Usuarios ({users.length})
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => { setActiveTab('create'); setEditingUser(null); }}
              className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'create'
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              + Agregar Usuario en Categorías
            </button>
          )}

          <button
            onClick={() => { setActiveTab('tenants'); setEditingUser(null); }}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tenants'
                ? 'text-emerald-700 border-b-2 border-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            Cuentas SaaS & Tenants ({OFFICIAL_TENANTS.length})
          </button>

          <button
            onClick={() => { setActiveTab('scenarios'); setEditingUser(null); }}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scenarios'
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Gestión de Escenarios ({scenarios.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: LISTADO Y GESTIÓN DE USUARIOS */}
          {activeTab === 'list' && !editingUser && (
            <div className="space-y-4">
              
              {/* Filtros */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Tenant:</span>
                    <select
                      value={tenantFilter}
                      onChange={e => setTenantFilter(e.target.value)}
                      className="p-1.5 border border-slate-300 rounded-xl text-xs bg-white font-medium outline-none"
                    >
                      <option value="all">Todos los Tenants</option>
                      {OFFICIAL_TENANTS.map(t => (
                        <option key={t.id} value={t.id}>{t.short_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Categoría / Rol:</span>
                    <select
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      className="p-1.5 border border-slate-300 rounded-xl text-xs bg-white font-medium outline-none"
                    >
                      <option value="all">Todos los Roles</option>
                      <option value="superadmin">SuperAdmin</option>
                      <option value="admin_municipal">Admin Municipal (GAMS)</option>
                      <option value="consultor_ecotraffic">Consultor Ecotraffic</option>
                      <option value="delegado_sindical">Delegado Sindical</option>
                      <option value="observador_publico">Observador Ciudadano</option>
                    </select>
                  </div>
                </div>

                {isSuperAdmin && (
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    + Nuevo Usuario
                  </button>
                )}
              </div>

              {/* Tabla de Usuarios */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">Usuario & Nombre</th>
                      <th className="p-3">Cuenta Tenant</th>
                      <th className="p-3">Rol / Categoría</th>
                      <th className="p-3 text-center">Estado</th>
                      {isSuperAdmin && <th className="p-3 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">Cargando directorio de usuarios...</td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">No se encontraron usuarios con los filtros seleccionados.</td>
                      </tr>
                    ) : filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{u.full_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{u.organization}</div>
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-mono">
                            {OFFICIAL_TENANTS.find(t => t.id === u.tenant_id)?.short_name || 'GAMS - Sucre'}
                          </span>
                        </td>
                        <td className="p-3">
                          {isSuperAdmin && u.email !== 'ecotraffic.bo@gmail.com' ? (
                            <select
                              value={u.role}
                              onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="p-1 border border-slate-300 rounded-lg text-xs font-semibold bg-white cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="superadmin">SuperAdmin</option>
                              <option value="admin_municipal">Admin Municipal (GAMS)</option>
                              <option value="consultor_ecotraffic">Consultor Ecotraffic</option>
                              <option value="delegado_sindical">Delegado Sindical</option>
                              <option value="observador_publico">Observador Ciudadano</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.role === 'superadmin' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              u.role === 'admin_municipal' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                              u.role === 'consultor_ecotraffic' ? 'bg-teal-100 text-teal-900 border border-teal-300' :
                              u.role === 'delegado_sindical' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {u.is_active ? 'Activo' : 'Desactivado'}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Editar */}
                              <button
                                onClick={() => startEditUser(u)}
                                title="Editar usuario"
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                </svg>
                                Editar
                              </button>

                              {/* Botón Desactivar / Reactivar */}
                              {u.email !== 'ecotraffic.bo@gmail.com' && (
                                <button
                                  onClick={() => handleToggleStatus(u.id, u.is_active)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    u.is_active 
                                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' 
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  }`}
                                >
                                  {u.is_active ? 'Desactivar' : 'Activar'}
                                </button>
                              )}

                              {/* Botón Eliminar */}
                              {u.email !== 'ecotraffic.bo@gmail.com' && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email, u.full_name)}
                                  title="Eliminar usuario"
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                  </svg>
                                  Borrar
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FORMULARIO DE EDICIÓN DE USUARIO */}
          {editingUser && (
            <form onSubmit={handleSaveEditUser} className="max-w-lg mx-auto space-y-4 bg-slate-50 p-6 rounded-2xl border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Modificar Usuario</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{editingUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  required
                  disabled={editingUser.email === 'ecotraffic.bo@gmail.com'}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría / Rol Asignado:</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    disabled={editingUser.email === 'ecotraffic.bo@gmail.com'}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="superadmin">SuperAdmin</option>
                    <option value="admin_municipal">Admin Municipal (GAMS)</option>
                    <option value="consultor_ecotraffic">Consultor Ecotraffic</option>
                    <option value="delegado_sindical">Delegado Sindical</option>
                    <option value="observador_publico">Observador Ciudadano</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cuenta Tenant Asignada:</label>
                  <select
                    value={editTenantId}
                    onChange={e => {
                      const tId = e.target.value;
                      setEditTenantId(tId);
                      const t = OFFICIAL_TENANTS.find(item => item.id === tId);
                      if (t) setEditOrganization(t.name);
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {OFFICIAL_TENANTS.map(t => (
                      <option key={t.id} value={t.id}>{t.short_name} — {t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Organización / Entidad:</label>
                <input
                  type="text"
                  value={editOrganization}
                  onChange={e => setEditOrganization(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nueva Contraseña (dejar en blanco para mantener la actual):
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: AGREGAR NUEVO USUARIO EN CATEGORÍAS */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateUser} className="max-w-lg mx-auto space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Crear y Autorizar Usuario en Categoría</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cuenta / Tenant Asignado:</label>
                <select
                  value={selectedTenantId}
                  onChange={e => {
                    const tId = e.target.value;
                    setSelectedTenantId(tId);
                    const tenant = OFFICIAL_TENANTS.find(t => t.id === tId);
                    if (tenant) setNewOrganization(tenant.name);
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {OFFICIAL_TENANTS.map(t => (
                    <option key={t.id} value={t.id}>{t.short_name} — {t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="Lic. María Rodríguez"
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="usuario@sucre.bo o usuario@gmail.com"
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Organización / Entidad:</label>
                  <input
                    type="text"
                    value={newOrganization}
                    onChange={e => setNewOrganization(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría / Rol:</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="superadmin">SuperAdmin</option>
                    <option value="admin_municipal">Admin Municipal (GAMS)</option>
                    <option value="consultor_ecotraffic">Consultor Ecotraffic</option>
                    <option value="delegado_sindical">Delegado Sindical</option>
                    <option value="observador_publico">Observador Ciudadano</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña de Acceso:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres con números y símbolos"
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {formSubmitting ? 'Registrando en Directorio...' : 'Crear y Autorizar Usuario'}
              </button>
            </form>
          )}

          {/* TAB 3: CUENTAS SAAS & TENANTS */}
          {activeTab === 'tenants' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 uppercase">Catálogo de Cuentas SaaS Multi-Tenant</h3>
                  <p className="text-[11px] text-emerald-800">Espacios de trabajo independientes para gobiernos municipales y federaciones de transporte</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white font-mono font-bold text-xs rounded-xl shadow-xs">
                  {OFFICIAL_TENANTS.length} Activos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {OFFICIAL_TENANTS.map(t => (
                  <div key={t.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:border-blue-400 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                        <span className="text-[11px] text-slate-500">{t.city}, {t.country} ({t.currency})</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full border border-blue-200">
                        {t.badge || 'SaaS Tenant'}
                      </span>
                    </div>
                    <div className="pt-2 flex justify-between items-center text-xs text-slate-600 border-t border-slate-100">
                      <span className="font-mono text-[11px]">ID: {t.slug}</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        100% Operativo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GESTIÓN DE ESCENARIOS */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
                <div>
                  <h3 className="text-xs font-bold text-indigo-950 uppercase">Gestor Oficial de Escenarios Tarifarios</h3>
                  <p className="text-[11px] text-indigo-800">Cree, calibre o elimine propuestas de concertación socioeconómica.</p>
                </div>
                {isSuperAdmin && !editingScenario && !isCreatingScenario && (
                  <button
                    onClick={startCreateScenario}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    + Nuevo Escenario
                  </button>
                )}
              </div>

              {(editingScenario || isCreatingScenario) ? (
                <form onSubmit={handleSaveScenarioSubmit} className="bg-slate-50 p-5 rounded-2xl border border-indigo-200 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase">
                      {editingScenario ? `Editando: ${editingScenario.label}` : 'Crear Nueva Propuesta Tarifaria'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => { setEditingScenario(null); setIsCreatingScenario(false); }}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-bold"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nombre / Título:</label>
                      <input
                        type="text"
                        value={scLabel}
                        onChange={e => setScLabel(e.target.value)}
                        required
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Distintivo (Badge):</label>
                      <input
                        type="text"
                        value={scBadge}
                        onChange={e => setScBadge(e.target.value)}
                        placeholder="Ej. PROPUESTA GREMIAL"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Tarifa Adulto (Bs):</label>
                      <input
                        type="number"
                        step="0.10"
                        value={scAdultFare}
                        onChange={e => setScAdultFare(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Adultos Mayores (Bs):</label>
                      <input
                        type="number"
                        step="0.10"
                        value={scAdultosMayores}
                        onChange={e => setScAdultosMayores(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Universitarios (Bs):</label>
                      <input
                        type="number"
                        step="0.10"
                        value={scUniversitarios}
                        onChange={e => setScUniversitarios(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Colegiales (Bs):</label>
                      <input
                        type="number"
                        step="0.10"
                        value={scColegiales}
                        onChange={e => setScColegiales(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">Escolares (Bs):</label>
                      <input
                        type="number"
                        step="0.10"
                        value={scEscolares}
                        onChange={e => setScEscolares(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => { setEditingScenario(null); setIsCreatingScenario(false); }}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Guardar Escenario
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  {scenarios.map(sc => (
                    <div 
                      key={sc.id} 
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        activeScenarioId === sc.id 
                          ? 'bg-blue-50/80 border-blue-400 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs">{sc.label}</h4>
                          {sc.badge && (
                            <span className="px-2 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                              {sc.badge}
                            </span>
                          )}
                          {activeScenarioId === sc.id && (
                            <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                              Activo en Simulador
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Tarifa Adulto: <strong className="text-slate-800">Bs. {sc.adultFare.toFixed(2)}</strong> | 
                          Universitarios: Bs. {sc.socialFares.universitarios.toFixed(2)} | 
                          Escolares: Bs. {sc.socialFares.escolares.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onSelectScenario && (
                          <button
                            onClick={() => onSelectScenario(sc.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              activeScenarioId === sc.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {activeScenarioId === sc.id ? 'Seleccionado' : 'Activar'}
                          </button>
                        )}
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => startEditScenario(sc)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Editar
                            </button>
                            {sc.isCustom && onDeleteScenario && (
                              <button
                                onClick={() => onDeleteScenario(sc.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Eliminar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
