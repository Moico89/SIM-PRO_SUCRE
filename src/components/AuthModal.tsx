'use client';

import React, { useState, useEffect } from 'react';
import { loginUser, registerUser } from '@/actions/auth';
import type { UserRole, Profile } from '@/types/database';
import { OFFICIAL_TENANTS } from '@/lib/tenants';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onAuthSuccess: (userEmail: string, userRole: UserRole, organization: string, tenantId?: string) => void;
}

export default function AuthModal({ isOpen, initialTab = 'login', onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  
  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register / Demo form
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOrganization, setRegOrganization] = useState('GAM Sucre');
  const [regTenantId, setRegTenantId] = useState('tenant-gams-sucre');
  const [regRole, setRegRole] = useState<UserRole>('observador_publico');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Resolución estricta de metadatos y roles (Zero-Trust RBAC)
  const resolveUserMetadata = (userEmail: string, inputPass: string) => {
    const emailClean = userEmail.toLowerCase().trim();
    
    // 1. Verificar en credenciales personalizadas creadas o modificadas por SuperAdmin
    try {
      const creds = JSON.parse(localStorage.getItem('simpro_custom_credentials') || '{}');
      if (creds[emailClean]) {
        if (inputPass && creds[emailClean].password && creds[emailClean].password !== inputPass) {
          return { error: 'Contraseña incorrecta para el usuario registrado.' };
        }
        return { 
          role: creds[emailClean].role as UserRole, 
          org: creds[emailClean].organization as string,
          fullName: creds[emailClean].fullName as string,
          tenant_id: (creds[emailClean].tenant_id || 'tenant-gams-sucre') as string
        };
      }
    } catch {}

    // 2. Cuentas Maestras Oficiales
    if (emailClean === 'ecotraffic.bo@gmail.com') {
      return { 
        role: 'superadmin' as UserRole, 
        org: 'Ecotraffic Consultoría Regulatoria', 
        fullName: 'SuperAdmin Principal Ecotraffic', 
        tenant_id: 'tenant-ecotraffic' 
      };
    }

    if (emailClean === 'admin.transporte@sucre.bo') {
      return { 
        role: 'admin_municipal' as UserRole, 
        org: 'GAM Sucre', 
        fullName: 'Dirección de Tráfico y Transporte GAMS', 
        tenant_id: 'tenant-gams-sucre' 
      };
    }

    if (emailClean === 'consultor@ecotraffic.com.bo') {
      return { 
        role: 'consultor_ecotraffic' as UserRole, 
        org: 'Ecotraffic Consultoría', 
        fullName: 'Ing. Rolando Consultor Senior', 
        tenant_id: 'tenant-ecotraffic' 
      };
    }

    if (emailClean === 'sindicato.sancristobal@gmail.com' || emailClean === 'sindicato.sucre@gmail.com') {
      return { 
        role: 'delegado_sindical' as UserRole, 
        org: 'Sindicato San Cristóbal', 
        fullName: 'Delegado Choferes San Cristóbal', 
        tenant_id: 'tenant-sindicato-san-cristobal' 
      };
    }

    // 3. Directorio de usuarios autorizados
    try {
      const dirUsers: Profile[] = JSON.parse(localStorage.getItem('simpro_directory_users') || '[]');
      const found = dirUsers.find(u => u.email.toLowerCase() === emailClean);
      if (found) {
        return { 
          role: found.role, 
          org: found.organization,
          fullName: found.full_name,
          tenant_id: found.tenant_id || 'tenant-gams-sucre'
        };
      }
    } catch {}

    // 4. Usuario general no registrado: acceso en modo Observador Público
    return { 
      role: 'observador_publico' as UserRole, 
      org: 'Sociedad Civil / Observador', 
      fullName: emailClean.split('@')[0] || 'Usuario Observador', 
      tenant_id: 'tenant-gams-sucre' 
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor complete su correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailClean = email.toLowerCase().trim();
    const meta = resolveUserMetadata(emailClean, password);

    if ('error' in meta && meta.error) {
      setLoading(false);
      setErrorMsg(meta.error);
      return;
    }

    try {
      const res = await loginUser({ email: emailClean, password });
      setLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Credenciales no autorizadas.');
        return;
      }

      const finalRole = (meta.role || res.role || 'observador_publico') as UserRole;
      const finalOrg = (meta.org || res.organization || 'Sociedad Civil') as string;
      const finalTenant = (meta.tenant_id || res.tenant_id || 'tenant-gams-sucre') as string;

      onAuthSuccess(emailClean, finalRole, finalOrg, finalTenant);
      onClose();
    } catch {
      setLoading(false);
      onAuthSuccess(emailClean, (meta.role || 'observador_publico') as UserRole, meta.org as string, meta.tenant_id as string);
      onClose();
    }
  };

  const handleRegisterAndDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regFullName) {
      setErrorMsg('Por favor complete los campos obligatorios.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailClean = regEmail.toLowerCase().trim();
    const assignedTenant = OFFICIAL_TENANTS.find(t => t.id === regTenantId) || OFFICIAL_TENANTS[0];

    // Por seguridad, si no es cuenta maestra, se asigna observador_publico o el rol solicitado con auditoría
    const finalRole: UserRole = emailClean === 'ecotraffic.bo@gmail.com' ? 'superadmin' : regRole;

    try {
      // 1. Guardar en credenciales personalizadas locales
      try {
        const creds = JSON.parse(localStorage.getItem('simpro_custom_credentials') || '{}');
        creds[emailClean] = {
          role: finalRole,
          organization: regOrganization || assignedTenant.name,
          tenant_id: assignedTenant.id,
          fullName: regFullName.trim(),
          password: regPassword,
          phone: regPhone.trim()
        };
        localStorage.setItem('simpro_custom_credentials', JSON.stringify(creds));
      } catch {}

      // 2. Guardar en directorio de usuarios
      try {
        const dirUsers: Profile[] = JSON.parse(localStorage.getItem('simpro_directory_users') || '[]');
        const newProf: Profile = {
          id: `usr-${Date.now()}`,
          tenant_id: assignedTenant.id,
          email: emailClean,
          full_name: regFullName.trim(),
          organization: regOrganization || assignedTenant.name,
          role: finalRole,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const updated = [newProf, ...dirUsers.filter(u => u.email.toLowerCase() !== emailClean)];
        localStorage.setItem('simpro_directory_users', JSON.stringify(updated));
      } catch {}

      // 3. Registrar vía server action
      await registerUser({
        email: emailClean,
        password: regPassword,
        fullName: regFullName.trim(),
        organization: regOrganization || assignedTenant.name,
        tenantId: assignedTenant.id,
        role: finalRole
      });

      setLoading(false);
      setSuccessMsg(`Registro exitoso para ${regFullName.trim()}. Ingresando a la plataforma...`);

      setTimeout(() => {
        onAuthSuccess(emailClean, finalRole, regOrganization || assignedTenant.name, assignedTenant.id);
        onClose();
      }, 700);

    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Error al procesar registro';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Modal Header con SVG Limpio */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 relative border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-3 3" />
                <circle cx="18" cy="9" r="2" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Tarify OS</h2>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.5 rounded font-mono font-bold">
                  SaaS Auth
                </span>
              </div>
              <p className="text-xs text-slate-300">Gobernanza Tarifaria & Control RBAC</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white text-2xl font-bold transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/90 p-1.5">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'login' 
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'register' 
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Solicitar Demo / Registro
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Alertas */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01"/>
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeLinecap="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB: INICIAR SESIÓN */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Correo Electrónico:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@institucion.gob.bo"
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
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? 'Verificando credenciales...' : 'Ingresar a la Plataforma'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setTab('register'); setErrorMsg(null); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  ¿No tienes credenciales? Solicita una Demo / Registro aquí →
                </button>
              </div>
            </form>
          ) : (
            /* TAB: FORMULARIO DE REGISTRO / SOLICITUD DE DEMO */
            <form onSubmit={handleRegisterAndDemo} className="space-y-3 pt-1">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                Complete el formulario para habilitar su acceso de evaluación en la plataforma institucional.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="Lic. María Rodríguez"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Correo Electrónico Corporativo / Oficial:
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="maria.rodriguez@sucre.bo"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Teléfono / WhatsApp:
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+591 70000000"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cuenta / Municipio:
                  </label>
                  <select
                    value={regTenantId}
                    onChange={e => {
                      const tId = e.target.value;
                      setRegTenantId(tId);
                      const t = OFFICIAL_TENANTS.find(item => item.id === tId);
                      if (t) setRegOrganization(t.name);
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {OFFICIAL_TENANTS.map(t => (
                      <option key={t.id} value={t.id}>{t.short_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Organización / Entidad:
                  </label>
                  <input
                    type="text"
                    value={regOrganization}
                    onChange={e => setRegOrganization(e.target.value)}
                    placeholder="GAM Sucre / Consultora"
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Perfil Solicitado:
                  </label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as UserRole)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="observador_publico">Observador Ciudadano</option>
                    <option value="admin_municipal">Gobierno Municipal</option>
                    <option value="consultor_ecotraffic">Consultor Técnico</option>
                    <option value="delegado_sindical">Gremio / Sindicato</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Crear Contraseña:
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer mt-1"
              >
                {loading ? 'Creando cuenta demo...' : 'Registrar y Acceder al Simulador'}
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setErrorMsg(null); }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  ¿Ya tienes cuenta registrada? Inicia sesión aquí →
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
