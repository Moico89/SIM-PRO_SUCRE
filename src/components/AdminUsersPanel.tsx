'use client';

import React, { useState, useEffect } from 'react';
import type { Profile, UserRole } from '@/types/database';
import { getAllUsers, createAdminUserBySuperAdmin, toggleUserActiveStatus, updateUserRoleBySuperAdmin } from '@/actions/auth';

interface AdminUsersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  currentUserEmail: string;
}

export default function AdminUsersPanel({ isOpen, onClose, currentUserRole, currentUserEmail }: AdminUsersPanelProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  
  // Form de nuevo admin
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Sucre2026*');
  const [newFullName, setNewFullName] = useState('');
  const [newOrganization, setNewOrganization] = useState('GAM Sucre');
  const [newRole, setNewRole] = useState<UserRole>('admin_municipal');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isSuperAdmin = currentUserRole === 'superadmin' || currentUserEmail === 'ecotraffic.bo@gmail.com';

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getAllUsers();
    setLoading(false);
    if (res.success && res.users) {
      setUsers(res.users);
    } else {
      // Fallback mock inicial para visualización fluida
      setUsers([
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
      ]);
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

    const res = await createAdminUserBySuperAdmin({
      email: newEmail,
      password: newPassword,
      fullName: newFullName,
      organization: newOrganization,
      role: newRole
    });

    setFormSubmitting(false);

    if (res.success) {
      setActionMessage({ text: res.message || 'Usuario creado correctamente.', type: 'success' });
      setNewEmail('');
      setNewFullName('');
      setActiveTab('list');
      fetchUsers();
    } else {
      setActionMessage({ text: res.error || 'Error al crear usuario.', type: 'error' });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const res = await toggleUserActiveStatus(userId, !currentStatus);
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    }
  };

  const handleRoleChange = async (userId: string, targetRole: UserRole) => {
    const res = await updateUserRoleBySuperAdmin(userId, targetRole);
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: targetRole } : u));
    }
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
              <p className="text-xs text-slate-300">Gestión centralizada de credenciales, roles y acceso institucional</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold transition-colors"
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
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-3">
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
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'list' ? (
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
                              className="p-1 border border-slate-300 rounded-lg text-xs font-semibold bg-white cursor-pointer"
                            >
                              <option value="superadmin">SuperAdmin</option>
                              <option value="admin_municipal">Admin Municipal</option>
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
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
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
          ) : (
            <form onSubmit={handleCreateUser} className="max-w-lg mx-auto space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Crear Nuevo Administrador Institucional</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="Ing. Director de Movilidad Urbana"
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
                  placeholder="director.transporte@gmail.com"
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
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md disabled:opacity-50 transition-all"
              >
                {formSubmitting ? 'Creando Usuario...' : 'Autorizar y Crear Administrador'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
