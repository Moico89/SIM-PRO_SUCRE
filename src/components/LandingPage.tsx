'use client';

import React from 'react';

interface LandingPageProps {
  onEnterSystem: () => void;
  onOpenLogin: () => void;
}

export default function LandingPage({ onEnterSystem, onOpenLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  TRANSITAR SUCRE
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  SIM-PRO v3.3
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gobierno Autónomo Municipal de Sucre & Ecotraffic Consultoría
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={onEnterSystem}
              className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-95"
            >
              Acceder al Simulador →
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Mesa Oficial de Concertación & Modelación Econométrica
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Plataforma de <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Gobernanza Tarifaria</span> en Tiempo Real
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Sistema institucional para la determinación transparente del <strong>Costo de Operación Vehicular (COV)</strong>, simulación de escenarios de equilibrio financiero y concertación técnica para el transporte público urbano de Sucre.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onEnterSystem}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Ingresar a la Sala de Negociación</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>

            <button
              onClick={onOpenLogin}
              className="px-6 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span>Panel de Acceso SuperAdmin / GAMS</span>
            </button>
          </div>

        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl font-black">
              📊
            </div>
            <h3 className="text-base font-bold text-white">Modelo Econométrico COV</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cálculo riguroso del costo mensual por unidad Nissan Civilian, considerando 52 ítems de mantenimiento auditado, combustible con congestión y WACC regulatorio del 11%.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center text-xl font-black">
              ⚡
            </div>
            <h3 className="text-base font-bold text-white">Simulación y Escenarios</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Creación, edición y análisis de múltiples escenarios tarifarios (Social, Técnico, Estrés) con proyección inmediata de ingresos del hogar y rentabilidad en 32 rutas.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl font-black">
              🛡️
            </div>
            <h3 className="text-base font-bold text-white">Auditoría & Trazabilidad Legal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bitácora append-only no modificable donde cada ajuste exige justificación técnica formal, exportación de actas oficiales en PDF y planilla maestra Excel.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Gobierno Autónomo Municipal de Sucre & Ecotraffic Consultoría. Todos los derechos reservados.</p>
      </footer>

    </div>
  );
}
