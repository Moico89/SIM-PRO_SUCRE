'use client';

import React, { useState } from 'react';
import { loginUser, registerUser } from '@/actions/auth';
import type { UserRole } from '@/types/database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userEmail: string, userRole: UserRole, organization: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('GAM Sucre');
  const [role, setRole] = useState<UserRole>('admin_municipal');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await loginUser({ email, password });
    setLoading(false);

    if (res.success && res.user) {
      const detectedRole: UserRole = email === 'ecotraffic.bo@gmail.com' ? 'superadmin' : 'admin_municipal';
      const detectedOrg = email === 'ecotraffic.bo@gmail.com' ? 'Ecotraffic Consultoría' : organization;
      onAuthSuccess(res.user.email || email, detectedRole, detectedOrg);
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al iniciar sesión. Verifique sus credenciales.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await registerUser({
      email,
      password,
      fullName,
      organization,
      role
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Usuario creado correctamente. Ahora puede iniciar sesión.');
      setTab('login');
    } else {
      setErrorMsg(res.error || 'Error al registrar usuario.');
    }
  };

  // Autocompletar credenciales predefinidas
  const fillPreset = (presetEmail: string, presetRole: UserRole, presetOrg: string) => {
    setEmail(presetEmail);
    setPassword('Sucre2026*');
    setFullName(presetRole === 'superadmin' ? 'SuperAdmin Ecotraffic' : 'Administrador Municipal GAMS');
    setOrganization(presetOrg);
    setRole(presetRole);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center font-black text-lg shadow-md">
              S
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Acceso Institucional SIM-PRO</h2>
              <p className="text-xs text-slate-300">Gobernanza Tarifaria — GAM Sucre & Ecotraffic</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white text-2xl font-bold transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'login' 
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'register' 
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Registro de Usuario
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {/* Alertas */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {successMsg}
            </div>
          )}

          {/* Preset Buttons para acceso rápido */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Accesos Rápidos Institucionales:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillPreset('ecotraffic.bo@gmail.com', 'superadmin', 'Ecotraffic Consultoría')}
                className="p-2 text-left bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl hover:border-blue-500 transition-all text-xs"
              >
                <div className="font-bold text-blue-950 flex items-center gap-1">
                  👑 SuperAdmin
                </div>
                <div className="text-[10px] text-blue-700 font-mono truncate">ecotraffic.bo@gmail.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillPreset('admin.transporte@sucre.bo', 'admin_municipal', 'GAM Sucre')}
                className="p-2 text-left bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl hover:border-emerald-500 transition-all text-xs"
              >
                <div className="font-bold text-emerald-950 flex items-center gap-1">
                  🏛️ Admin Municipal
                </div>
                <div className="text-[10px] text-emerald-700 font-mono truncate">admin@sucre.bo</div>
              </button>
            </div>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Correo Electrónico (Gmail / Institucional):
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contraseña:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {loading ? 'Validando Credenciales...' : 'Ingresar al Sistema'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ing. Juan Pérez"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Correo Electrónico:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@gmail.com"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Organización:
                  </label>
                  <select
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="GAM Sucre">GAM Sucre</option>
                    <option value="Ecotraffic Consultoría">Ecotraffic Consultoría</option>
                    <option value="Sindicato San Cristóbal">Sindicato San Cristóbal</option>
                    <option value="Sindicato Sucre">Sindicato Sucre</option>
                    <option value="Concejo Municipal">Concejo Municipal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Rol Solicitado:
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="admin_municipal">Admin Municipal</option>
                    <option value="consultor_ecotraffic">Consultor Técnico</option>
                    <option value="delegado_sindical">Delegado Sindical</option>
                    <option value="observador_publico">Observador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contraseña:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md disabled:opacity-50 transition-all"
              >
                {loading ? 'Registrando...' : 'Completar Registro'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
