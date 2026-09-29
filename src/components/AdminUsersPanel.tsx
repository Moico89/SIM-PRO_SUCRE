'use client';

import React, { useState, useEffect } from 'react';
import type { Profile, UserRole } from '@/types/database';
import type { ScenarioConfig } from '@/types/scenario';
import { getAllUsers, createAdminUserBySuperAdmin, toggleUserActiveStatus, updateUserRoleBySuperAdmin } from '@/actions/auth';

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
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'scenarios'>('list');
  
  // Form de nuevo admin
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Sucre2026*');
  const [newFullName, setNewFullName] = useState('');
  const [newOrganization, setNewOrganization] = useState('GAM Sucre');
  const [newRole, setNewRole] = useState<UserRole>('admin_municipal');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setActionMessage(null);

    const emailClean = newEmail.toLowerCase().trim();

    const newUser: Profile = {
      id: `usr-${Date.now()}`,
      email: emailClean,
      full_name: newFullName.trim(),
      organization: newOrganization,
      role: newRole,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Persistir inmediatamente en memoria y localStorage
    setUsers(prev => {
      const updated = [newUser, ...prev.filter(u => u.email.toLowerCase() !== emailClean)];
      try { localStorage.setItem('simpro_directory_users', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // 2. Guardar credencial personalizada para autenticación instantánea
    try {
      const creds = JSON.parse(localStorage.getItem('simpro_custom_credentials') || '{}');
      creds[emailClean] = {
        role: newRole,
        organization: newOrganization,
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
        organization: newOrganization,
        role: newRole
      });
    } catch {}

    setFormSubmitting(false);
    setActionMessage({ 
      text: `Usuario ${newRole.toUpperCase()} '${newFullName.trim()}' (${emailClean}) creado y autorizado exitosamente.`, 
      type: 'success' 
    });
    setNewEmail('');
    setNewFullName('');
    setActiveTab('list');
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u);
    setUsers(updatedUsers);
    try { localStorage.setItem('simpro_directory_users', JSON.stringify(updatedUsers)); } catch {}
    try { await toggleUserActiveStatus(userId, !currentStatus); } catch {}
  };

  const handleRoleChange = async (userId: string, targetRole: UserRole) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: targetRole } : u);
    setUsers(updatedUsers);
    try { localStorage.setItem('simpro_directory_users', JSON.stringify(updatedUsers)); } catch {}
    try { await updateUserRoleBySuperAdmin(userId, targetRole); } catch {}
  };

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

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-lg shadow-md">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Panel de Administración & Control RBAC</h2>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  {isSuperAdmin ? 'SuperAdmin Mode' : 'Admin Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-300">Gestión de usuarios, auditoría RBAC y control de escenarios tarifarios</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800"
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
            <button onClick={() => setActionMessage(null)}>&times;</button>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4 flex-wrap">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'list'
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Usuarios Registrados ({users.length})
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('create')}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeTab === 'create'
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              + Crear Nuevo Administrador (Nivel 1)
            </button>
          )}

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'scenarios'
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚡ Gestión de Escenarios ({scenarios.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">Usuario & Nombre</th>
                      <th className="p-3">Organización</th>
                      <th className="p-3">Rol Asignado</th>
                      <th className="p-3 text-center">Estado</th>
                      {isSuperAdmin && <th className="p-3 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">Cargando directorio de usuarios...</td>
                      </tr>
                    ) : users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{u.full_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{u.organization}</td>
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
                              <option value="observador_publico">Observador</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.role === 'superadmin' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              u.role === 'admin_municipal' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                              u.role === 'consultor_ecotraffic' ? 'bg-teal-100 text-teal-900 border border-teal-300' :
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
                            {u.email !== 'ecotraffic.bo@gmail.com' && (
                              <button
                                onClick={() => handleToggleStatus(u.id, u.is_active)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  u.is_active 
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {u.is_active ? 'Desactivar' : 'Reactivar'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateUser} className="max-w-lg mx-auto space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Crear Nuevo Administrador Institucional</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="Lic. Rolando Párraga"
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico (Gmail / Institucional):</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="rolandoparraga@gmail.com"
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Organización:</label>
                  <select
                    value={newOrganization}
                    onChange={e => setNewOrganization(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GAM Sucre">GAM Sucre</option>
                    <option value="Ecotraffic Consultoría">Ecotraffic Consultoría</option>
                    <option value="Concejo Municipal">Concejo Municipal</option>
                    <option value="Sindicato San Cristóbal">Sindicato San Cristóbal</option>
                    <option value="Sindicato Sucre">Sindicato Sucre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nivel de Rol:</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin_municipal">Admin Nivel 1 (GAMS)</option>
                    <option value="consultor_ecotraffic">Consultor Técnico (Ecotraffic)</option>
                    <option value="delegado_sindical">Delegado Sindical</option>
                    <option value="observador_publico">Observador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña Inicial:</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {formSubmitting ? 'Creando y Autorizando...' : 'Autorizar y Crear Administrador'}
              </button>
            </form>
          )}

          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              {!isCreatingScenario && !editingScenario ? (
                <>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <div>
                      <h3 className="text-xs font-bold text-slate-700 uppercase">Control de Escenarios Tarifarios</h3>
                      <p className="text-[11px] text-slate-500">Activar, editar parámetros, eliminar o calibrar nuevas propuestas</p>
                    </div>
                    <button
                      onClick={startCreateScenario}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      + Crear Nuevo Escenario
                    </button>
                  </div>

                  <div className="space-y-3">
                    {scenarios.map(sc => {
                      const isActive = activeScenarioId === sc.id;
                      return (
                        <div
                          key={sc.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                            isActive ? 'border-indigo-500 bg-indigo-50/70 shadow-xs' : 'border-slate-200 bg-slate-50/80 hover:bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900">{sc.label}</span>
                              {isActive && (
                                <span className="text-[10px] bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-black animate-pulse">
                                  ACTIVO
                                </span>
                              )}
                              {sc.badge && !isActive && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                  {sc.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 font-mono mt-1 flex flex-wrap gap-x-3 gap-y-1">
                              <span>Adulto: <strong>Bs. {sc.adultFare.toFixed(2)}</strong></span>
                              <span>Mayores: <strong>Bs. {sc.socialFares.adultosMayores.toFixed(2)}</strong></span>
                              <span>Univ: <strong>Bs. {sc.socialFares.universitarios.toFixed(2)}</strong></span>
                              <span>Demanda: <strong>{(sc.demandFactor * 100).toFixed(0)}%</strong></span>
                              <span>Diésel: <strong>{(sc.fuelPriceFactor * 100).toFixed(0)}%</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                            {isActive ? (
                              <button
                                onClick={() => onSelectScenario && onSelectScenario('technical')}
                                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                              >
                                Desactivar
                              </button>
                            ) : (
                              <button
                                onClick={() => onSelectScenario && onSelectScenario(sc.id)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                              >
                                Activar
                              </button>
                            )}

                            <button
                              onClick={() => startEditScenario(sc)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Editar
                            </button>

                            {scenarios.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar escenario '${sc.label}'?`)) {
                                    onDeleteScenario && onDeleteScenario(sc.id);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveScenarioSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {isCreatingScenario ? 'Crear Nuevo Escenario Tarifario' : `Editar: ${editingScenario?.label}`}
                    </h3>
                    <button
                      type="button"
                      onClick={() => { setIsCreatingScenario(false); setEditingScenario(null); }}
                      className="text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      ← Volver a Escenarios
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre del Escenario:</label>
                      <input
                        type="text"
                        value={scLabel}
                        onChange={e => setScLabel(e.target.value)}
                        required
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Etiqueta / Badge:</label>
                      <input
                        type="text"
                        value={scBadge}
                        onChange={e => setScBadge(e.target.value)}
                        placeholder="Ej. PROPUESTA 2"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Matriz de Tarifas */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-slate-600 block">Tarifas por Categoría (Bs / viaje):</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500">Adulto:</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={scAdultFare}
                          onChange={e => setScAdultFare(Number(e.target.value))}
                          required
                          className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500">Adulto Mayor:</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={scAdultosMayores}
                          onChange={e => setScAdultosMayores(Number(e.target.value))}
                          required
                          className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500">Universitario:</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={scUniversitarios}
                          onChange={e => setScUniversitarios(Number(e.target.value))}
                          required
                          className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500">Colegial:</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={scColegiales}
                          onChange={e => setScColegiales(Number(e.target.value))}
                          required
                          className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500">Escolar:</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={scEscolares}
                          onChange={e => setScEscolares(Number(e.target.value))}
                          required
                          className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Factores de Sensibilidad */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Factor Demanda:</label>
                      <select
                        value={scDemandFactor}
                        onChange={e => setScDemandFactor(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                      >
                        <option value={1.0}>100% (Normal)</option>
                        <option value={0.9}>90% (Estrés -10%)</option>
                        <option value={0.85}>85% (Crisis -15%)</option>
                        <option value={1.1}>110% (Pico +10%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Factor Diésel:</label>
                      <select
                        value={scFuelPriceFactor}
                        onChange={e => setScFuelPriceFactor(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                      >
                        <option value={1.0}>100% (Precio Base Bs. 17.95)</option>
                        <option value={1.15}>115% (+15% Incremento)</option>
                        <option value={1.25}>125% (+25% Estrés)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setIsCreatingScenario(false); setEditingScenario(null); }}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Guardar y Calibrar Escenario
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
