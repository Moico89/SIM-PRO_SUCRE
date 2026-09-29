'use client';

import React, { useState, useEffect } from 'react';
import { OFFICIAL_TENANTS } from '@/lib/tenants';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export default function LandingPage({ onOpenLogin }: LandingPageProps) {
  const [activeTabFeature, setActiveTabFeature] = useState<'distribucion' | 'demanda' | 'comparativa'>('distribucion');
  const [emailNewsletter, setEmailNewsletter] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-carousel para casos de éxito
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % OFFICIAL_TENANTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailNewsletter) {
      setNewsletterSubscribed(true);
      setEmailNewsletter('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* ========================================================================= */}
      {/* 🧭 1. TOP NAVBAR INSTITUCIONAL                                            */}
      {/* ========================================================================= */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Marca */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-cyan-500/25">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-3 3" />
                <circle cx="18" cy="9" r="2" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Tarify <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">OS</span>
                </span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  SaaS v3.3
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Suite de Gobernanza & Regulación Tarifaria
              </p>
            </div>
          </div>

          {/* Links de Navegación */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#inicio" className="text-cyan-400 hover:text-white transition-colors">Inicio</a>
            <a href="#caracteristicas" className="hover:text-cyan-400 transition-colors">Características</a>
            <a href="#casos-exito" className="hover:text-cyan-400 transition-colors">Casos de Éxito</a>
            <a href="#precios" className="hover:text-cyan-400 transition-colors">Precios</a>
            <a href="#blog" className="hover:text-cyan-400 transition-colors">Blog</a>
            <a href="#contacto" className="hover:text-cyan-400 transition-colors">Contacto</a>
          </nav>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-300 hover:from-cyan-300 hover:to-teal-200 rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
            >
              Solicitar Demo
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 🚀 2. HERO SECTION CON PORTADA ANIMADA & MODELACIÓN ECONOMÉTRICA          */}
      {/* ========================================================================= */}
      <section id="inicio" className="relative pt-12 pb-24 overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-[#070e1c] to-[#0a162b]">
        
        {/* Fondo Animado con Gráfica Geométrica & Partículas */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-indigo-600/15 blur-[140px] rounded-full animate-pulse" />
          
          {/* Grid tecnológico en perspectiva */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-70" />
          
          {/* Nodos de red animados */}
          <div className="absolute top-1/3 left-10 w-72 h-72 bg-cyan-500/5 rounded-full filter blur-3xl animate-ping" style={{ animationDuration: '8s' }} />
          <div className="absolute top-1/2 right-10 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl animate-ping" style={{ animationDuration: '10s' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Mesa Oficial de Regulación Tarifaria & COV — GAMS Sucre & Ecotraffic</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Modelación Econométrica de <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">Tarifas de Transporte</span> en Tiempo Real
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
              <strong>Tarify OS:</strong> La plataforma SaaS institucional para modelar con precisión el <strong>Costo de Operación Vehicular (COV)</strong>, balancear el equilibrio financiero del operador y determinar tarifas técnicas y sociales equitativas.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={onOpenLogin}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-300 text-slate-950 font-black text-sm shadow-xl shadow-cyan-400/20 hover:shadow-cyan-400/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Solicitar una Demo Personalizada</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>

              <button
                onClick={onOpenLogin}
                className="px-7 py-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-800 hover:border-slate-600 transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span>Acceder a la Sala de Concertación</span>
              </button>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* 💎 4 CARDS FLOTANTES SUPERIORES (VECTORES PROFESIONALES)             */}
          {/* ===================================================================== */}
          <div id="caracteristicas" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-8">
            
            {/* Card 1: Modelación del COV */}
            <div className="bg-white text-slate-900 p-6 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-200 hover:border-cyan-400 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200/80 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Modelación del COV con precisión
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Tarify OS:</strong> La plataforma SaaS con metodologías auditadas para modelar el Costo de Operación Vehicular con 52 ítems Nissan (Bs. 2.840,17/mes), combustible con congestión y WACC 11%.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition-transform">
                <span>Ver Metodología</span>
                <span className="ml-1">→</span>
              </div>
            </div>

            {/* Card 2: Simulación de Escenarios */}
            <div className="bg-white text-slate-900 p-6 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-200 hover:border-cyan-400 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Simulación de Escenarios en tiempo real
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Formulación instantánea de propuestas tarifarias (Social, Técnico, Estrés) y análisis de sensibilidad de demanda, combustible e ingresos del hogar.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                <span>Explorar Escenarios</span>
                <span className="ml-1">→</span>
              </div>
            </div>

            {/* Card 3: Concertación Tarifaria */}
            <div className="bg-white text-slate-900 p-6 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-200 hover:border-cyan-400 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Concertación Tarifaria Transparente
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mesas técnicas transparentes entre gobiernos municipales, federaciones de transporte y juntas vecinales respaldadas en bitácora inmutable.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Protocolo de Mesa</span>
                <span className="ml-1">→</span>
              </div>
            </div>

            {/* Card 4: Determinación Tarifa Técnica */}
            <div className="bg-white text-slate-900 p-6 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-200 hover:border-cyan-400 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                  </svg>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Determinación de Tarifa Técnica y Social
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cálculo científico del equilibrio financiero para el transportista y esquemas de compensación social para adultos mayores, universitarios y escolares.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                <span>Calcular Equilibrio</span>
                <span className="ml-1">→</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 📊 3. SECCIÓN: VISUALICE E INTERVENGA CON DATOS REALES                     */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-100 text-slate-900 border-b border-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-600 bg-cyan-100 px-3 py-1 rounded-full">
              Entorno Interactivo
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              Visualice e Intervenga con Datos Reales
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Modelación dinámica con parámetros en vivo del parque automotor, matrices de costo por kilómetro y equilibrio en 32 líneas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Mockup Interactivo del Simulador (Lado Izquierdo) */}
            <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-6 shadow-2xl border border-slate-800 text-slate-100 space-y-5">
              
              {/* Ventana Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 ml-2">Tarify OS // Monitor Sucre</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">LIVE SYNC</span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">COV Total / Mes</span>
                  <span className="text-sm sm:text-base font-black text-cyan-400 font-mono">Bs. 18.761,28</span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">Calibrado Nissan</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Mantenimiento</span>
                  <span className="text-sm sm:text-base font-black text-teal-400 font-mono">Bs. 2.840,17</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">52 Ítems Auditados</span>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarifa Técnica</span>
                  <span className="text-sm sm:text-base font-black text-amber-400 font-mono">Bs. 2,68</span>
                  <span className="text-[10px] text-amber-400 block mt-0.5">Media Red</span>
                </div>
              </div>

              {/* Gráfico Simulado & Barras */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Desglose Operativo y Equilibrio Financiero</span>
                  <span className="text-[10px] font-mono text-cyan-400">987 Micros / 32 Líneas</span>
                </div>
                
                {/* Barras de Costo */}
                <div className="space-y-2 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Combustible Diésel (+15% congestión)</span>
                      <span className="font-mono text-slate-200">Bs. 8.154,39 (43,5%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: '43.5%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Personal de Conducción (Sueldo + Aguinaldo)</span>
                      <span className="font-mono text-slate-200">Bs. 3.575,00 (19,1%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '19.1%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Mantenimiento Nissan Civilian (52 Ítems)</span>
                      <span className="font-mono text-slate-200">Bs. 2.840,17 (15,1%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-400 h-full rounded-full" style={{ width: '15.1%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Costo de Capital (Depreciación + WACC 11%)</span>
                      <span className="font-mono text-slate-200">Bs. 3.471,30 (18,5%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '18.5%' }} />
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Bullets Explicativos (Lado Derecho) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div 
                onClick={() => setActiveTabFeature('distribucion')}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  activeTabFeature === 'distribucion' 
                    ? 'bg-white border-cyan-500 shadow-md' 
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Distribución de Costos por KM</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Distribución exacta de costos de operación vehicular para fijar tarifas justas en base a kilometraje real de la red (82.475 km/día).
                    </p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setActiveTabFeature('demanda')}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  activeTabFeature === 'demanda' 
                    ? 'bg-white border-blue-500 shadow-md' 
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Simulación de Demanda & IPK</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Modelación de elasticidad de la demanda en 265.569 pasajeros/día y cálculo de recaudación proyectada por categoría social.
                    </p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setActiveTabFeature('comparativa')}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  activeTabFeature === 'comparativa' 
                    ? 'bg-white border-teal-500 shadow-md' 
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Comparativa de Tarifas & Rentabilidad</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Análisis comparativo de tarifa actual vs costo técnico y variantes sociales, evaluando balance en las 32 rutas urbanas.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenLogin}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Visualice e Intervenga con Datos Reales →
              </button>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🏛️ 4. SECCIÓN: BENEFICIOS PARA SU INSTITUCIÓN                              */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              Valor Agregado
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              Beneficios para su Institución
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Plataforma diseñada para transformar la gestión tarifaria en un proceso técnico, pacífico y transparente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 hover:border-cyan-500 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Transparencia Total</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trazabilidad inmutable donde cada modificación genera un log inalterable con justificación técnica formal, evitando suspicacias políticas.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 hover:border-emerald-500 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Sostenibilidad Financiera</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Asegura la reposición oportuna del parque automotor (10 años de vida útil) y garantiza un retorno justo sobre el capital invertido (WACC 11%).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 hover:border-indigo-500 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Equidad Social</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Modelación de esquemas de subsidio cruzado para proteger la economía de familias, escolares, universitarios y personas de la tercera edad.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 hover:border-amber-500 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Empoderamiento Técnico</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Brinda a las alcaldías herramientas de software avanzadas para negociar con datos duros y resolver discrepancias gremiales en minutos.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🏆 5. SECCIÓN: CASOS DE ÉXITO & ENTIDADES CONECTADAS                       */}
      {/* ========================================================================= */}
      <section id="casos-exito" className="py-16 bg-slate-50 text-slate-900 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Casos de Éxito & Entidades Reguladas
            </h2>
            <p className="text-xs text-slate-500">
              Modelos econométricos aplicados con éxito en municipios y federaciones de transporte urbano
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {OFFICIAL_TENANTS.map(t => (
              <div key={t.id} className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-3 hover:border-cyan-400 hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900">{t.name}</div>
                  <div className="text-[10px] text-slate-500">{t.city}, {t.country} — {t.badge}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 💳 6. SECCIÓN: PLANES Y PRECIOS SAAS MULTI-TENANT                          */}
      {/* ========================================================================= */}
      <section id="precios" className="py-20 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-600 bg-cyan-100 px-3 py-1 rounded-full">
              Licenciamiento SaaS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              Planes y Precios Adaptados a su Ciudad
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Desde diagnósticos rápidos para ciudades intermedias hasta despliegues metropolitanos con telemetría en vivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Plan Básico */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 space-y-6 flex flex-col justify-between hover:shadow-xl transition-all">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-bold rounded-full">PLAN INICIAL</span>
                  <h3 className="text-xl font-extrabold text-slate-900">Básico</h3>
                  <p className="text-xs text-slate-500">Para consultas técnicas y auditorías puntuales de COV.</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">✓ Modelo Econométrico COV Base</li>
                  <li className="flex items-center gap-2">✓ 52 Ítems de Mantenimiento</li>
                  <li className="flex items-center gap-2">✓ Cálculo de Tarifa Técnica</li>
                  <li className="flex items-center gap-2">✓ Exportación en PDF Estándar</li>
                  <li className="flex items-center gap-2 text-slate-400">✗ Mesas en Vivo con WebSockets</li>
                  <li className="flex items-center gap-2 text-slate-400">✗ Multi-Tenant Aislado</li>
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Contactar por Cotización
              </button>
            </div>

            {/* Plan Estándar (Destacado) */}
            <div className="p-7 rounded-3xl bg-gradient-to-b from-cyan-900 via-slate-900 to-slate-950 text-white border-2 border-cyan-400 shadow-2xl space-y-6 flex flex-col justify-between relative transform md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-cyan-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full shadow-md">
                RECOMENDADO PARA ALCALDÍAS
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-cyan-400/20 text-cyan-300 text-[10px] font-bold rounded-full border border-cyan-400/30">MESA EN VIVO</span>
                  <h3 className="text-xl font-extrabold text-white">Estándar Municipal</h3>
                  <p className="text-xs text-slate-300">Gobernanza completa para alcaldías y federaciones.</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2 text-cyan-300">✓ Todo lo del Plan Básico</li>
                  <li className="flex items-center gap-2">✓ Mesas de Negociación WebSockets en Vivo</li>
                  <li className="flex items-center gap-2">✓ Gestión de 32 Rutas & Flota Completa</li>
                  <li className="flex items-center gap-2">✓ Exportación Excel Maestro 5 Hojas</li>
                  <li className="flex items-center gap-2">✓ Control de Acceso RBAC & Bitácora Legal</li>
                  <li className="flex items-center gap-2">✓ PWA Offline-First para Móvil y Tablets</li>
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-400/30 transition-all cursor-pointer"
              >
                Comenzar con Estándar →
              </button>
            </div>

            {/* Plan Enterprise */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 space-y-6 flex flex-col justify-between hover:shadow-xl transition-all">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">METROPOLITANO</span>
                  <h3 className="text-xl font-extrabold text-slate-900">Enterprise</h3>
                  <p className="text-xs text-slate-500">Para departamentos, ministerios y consorcios múltiples.</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">✓ Multi-Tenant Ilimitado para Ciudades</li>
                  <li className="flex items-center gap-2">✓ Integración con GPS y Telemetría de Flota</li>
                  <li className="flex items-center gap-2">✓ Servidor Dedicado & Respaldo On-Premise</li>
                  <li className="flex items-center gap-2">✓ Soporte Técnico y Legal 24/7</li>
                  <li className="flex items-center gap-2">✓ Capacitación a Equipos Técnicos</li>
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Contactar para Enterprise
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 📚 7. SECCIÓN: BLOG Y DOCUMENTACIÓN TÉCNICA DESTACADA                      */}
      {/* ========================================================================= */}
      <section id="blog" className="py-20 bg-slate-950 text-slate-100 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-3 py-1 rounded-full">
              Publicaciones Técnicas
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Blog y Guías de Regulación Tarifaria
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Metodologías y análisis econométricos publicados por especialistas en movilidad urbana.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Artículo 1 */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-cyan-500/60 transition-all space-y-4 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-36 rounded-2xl bg-gradient-to-tr from-cyan-950 to-blue-950 flex items-center justify-center border border-slate-800 text-cyan-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/>
                  </svg>
                </div>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full font-mono">
                  MANTENIMIENTO
                </span>
                <h3 className="font-extrabold text-sm text-white leading-snug">
                  Metodología de 52 Ítems de Mantenimiento Nissan Civilian y su impacto en el COV
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Análisis del costo mensual calibrado en Bs. 2.840,17 y desglose de repuestos, lubricantes y mano de obra.
                </p>
              </div>
              <a href="#inicio" onClick={onOpenLogin} className="text-xs font-bold text-cyan-400 hover:underline inline-block pt-2">
                Leer artículo completo →
              </a>
            </div>

            {/* Artículo 2 */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-cyan-500/60 transition-all space-y-4 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-36 rounded-2xl bg-gradient-to-tr from-blue-950 to-indigo-950 flex items-center justify-center border border-slate-800 text-blue-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                  COMBUSTIBLE
                </span>
                <h3 className="font-extrabold text-sm text-white leading-snug">
                  Factor de Congestión (+15%) en el Consumo de Diésel Urbano
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cómo calibrar la velocidad comercial reducida y el ralentí en pendientes para no desfinanciar al operador.
                </p>
              </div>
              <a href="#inicio" onClick={onOpenLogin} className="text-xs font-bold text-cyan-400 hover:underline inline-block pt-2">
                Leer artículo completo →
              </a>
            </div>

            {/* Artículo 3 */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-cyan-500/60 transition-all space-y-4 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-36 rounded-2xl bg-gradient-to-tr from-teal-950 to-emerald-950 flex items-center justify-center border border-slate-800 text-emerald-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                  </svg>
                </div>
                <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded-full font-mono">
                  EQUIDAD SOCIAL
                </span>
                <h3 className="font-extrabold text-sm text-white leading-snug">
                  Matrices de Elasticidad e Impacto en el Ingreso de los Hogares
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Determinación del techo tarifario tolerable para evitar caídas abruptas en la demanda de transporte público.
                </p>
              </div>
              <a href="#inicio" onClick={onOpenLogin} className="text-xs font-bold text-cyan-400 hover:underline inline-block pt-2">
                Leer artículo completo →
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 📬 8. FOOTER CORPORATIVO TARIFY OS                                        */}
      {/* ========================================================================= */}
      <footer id="contacto" className="bg-[#050b14] text-slate-400 pt-16 pb-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-900">
            
            {/* Columna Marca */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M18 9l-5 5-4-4-3 3" />
                    <circle cx="18" cy="9" r="2" fill="currentColor" />
                  </svg>
                </div>
                <span className="text-xl font-black text-white">Tarify OS</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Plataforma SaaS multi-tenant líder en modelación econométrica del Costo de Operación Vehicular (COV) y concertación tarifaria para ciudades inteligentes.
              </p>
              <div className="text-xs text-slate-500">
                Sucre — La Paz — Cochabamba (Bolivia)
              </div>
            </div>

            {/* Columna Enlaces */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#inicio" className="hover:text-white transition-colors">Inicio</a></li>
                <li><a href="#caracteristicas" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#casos-exito" className="hover:text-white transition-colors">Casos de Éxito</a></li>
                <li><a href="#precios" className="hover:text-white transition-colors">Precios SaaS</a></li>
              </ul>
            </div>

            {/* Columna Información */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Documentación</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#blog" className="hover:text-white transition-colors">Metodología COV</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">52 Ítems Nissan</a></li>
                <li><button onClick={onOpenLogin} className="hover:text-white transition-colors cursor-pointer text-left">Acceso SuperAdmin</button></li>
                <li><button onClick={onOpenLogin} className="hover:text-white transition-colors cursor-pointer text-left">Manual de Mesa</button></li>
              </ul>
            </div>

            {/* Columna Newsletter */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Boletín Regulatorio</h4>
              <p className="text-xs text-slate-400">
                Reciba actualizaciones sobre costos de combustible, normativas y metodologías de transporte.
              </p>
              {newsletterSubscribed ? (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-semibold">
                  ✓ Gracias por suscribirse al boletín técnico.
                </div>
              ) : (
                <form onSubmit={handleNewsletter} className="flex gap-2">
                  <input
                    type="email"
                    value={emailNewsletter}
                    onChange={e => setEmailNewsletter(e.target.value)}
                    placeholder="correo@institucion.gob.bo"
                    required
                    className="flex-1 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Suscribir
                  </button>
                </form>
              )}
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Tarify OS — Gobierno Autónomo Municipal de Sucre & Ecotraffic Consultoría. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#inicio" className="hover:text-slate-400">Privacidad</a>
              <a href="#inicio" className="hover:text-slate-400">Términos de Servicio</a>
              <a href="#inicio" className="hover:text-slate-400">Auditoría RLS</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
