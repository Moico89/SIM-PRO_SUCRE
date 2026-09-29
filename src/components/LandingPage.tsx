'use client';

import React, { useState } from 'react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export default function LandingPage({ onOpenLogin }: LandingPageProps) {
  const [activeNav, setActiveNav] = useState('inicio');
  const [emailNewsletter, setEmailNewsletter] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailNewsletter.trim()) {
      setNewsletterSubscribed(true);
      setEmailNewsletter('');
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans antialiased selection:bg-cyan-500 selection:text-white min-h-screen flex flex-col scroll-smooth">
      
      {/* ========================================================================= */}
      {/* 🧭 1. MAIN HEADER (Sticky con fondo blanco/blur institucional)            */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs" data-purpose="site-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <a href="#inicio" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                Tarify <span className="text-cyan-600 font-extrabold">OS</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mt-0.5">
                Econometría de Transporte
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 font-medium text-sm text-slate-600">
            <a
              href="#inicio"
              onClick={() => setActiveNav('inicio')}
              className={`${activeNav === 'inicio' ? 'text-cyan-600 font-semibold border-b-2 border-cyan-600' : 'hover:text-cyan-600'} py-1 transition-colors`}
            >
              Inicio
            </a>
            <a
              href="#caracteristicas"
              onClick={() => setActiveNav('caracteristicas')}
              className={`${activeNav === 'caracteristicas' ? 'text-cyan-600 font-semibold border-b-2 border-cyan-600' : 'hover:text-cyan-600'} py-1 transition-colors`}
            >
              Características
            </a>
            <a
              href="#casos"
              onClick={() => setActiveNav('casos')}
              className={`${activeNav === 'casos' ? 'text-cyan-600 font-semibold border-b-2 border-cyan-600' : 'hover:text-cyan-600'} py-1 transition-colors`}
            >
              Casos de Éxito
            </a>
            <a
              href="#precios"
              onClick={() => setActiveNav('precios')}
              className={`${activeNav === 'precios' ? 'text-cyan-600 font-semibold border-b-2 border-cyan-600' : 'hover:text-cyan-600'} py-1 transition-colors`}
            >
              Precios
            </a>
            <a
              href="#blog"
              onClick={() => setActiveNav('blog')}
              className={`${activeNav === 'blog' ? 'text-cyan-600 font-semibold border-b-2 border-cyan-600' : 'hover:text-cyan-600'} py-1 transition-colors`}
            >
              Blog
            </a>
            <a
              href="#contacto"
              onClick={() => setActiveNav('contacto')}
              className={`${activeNav === 'contacto' ? 'text-cyan-600 font-semibold border-b-2 border-cyan-600' : 'hover:text-cyan-600'} py-1 transition-colors`}
            >
              Contacto
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="text-sm font-semibold text-slate-700 hover:text-cyan-600 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={onOpenLogin}
              className="text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 px-5 py-2.5 rounded-lg shadow-sm shadow-blue-900/10 hover:shadow-md transition-all cursor-pointer"
            >
              Solicitar Demo
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 🚀 2. HERO SECTION CON PORTADA ANIMADA & CONSOLA EN VIVO                  */}
      {/* ========================================================================= */}
      <section className="relative bg-[#0b1329] hero-glow text-white pt-16 pb-28 lg:pb-36 overflow-hidden" id="inicio">
        {/* Isometric Grid Background Overlay */}
        <div className="absolute inset-0 isometric-grid opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Plataforma SaaS Institucional v3.4
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
                Modelación Econométrica de Tarifas de Transporte en{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                  Tiempo Real
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
                <strong className="text-cyan-300 font-medium">Tarify OS:</strong> La plataforma SaaS institucional para modelar con precisión el Costo de Operación Vehicular (COV), balancear el equilibrio financiero del operador y determinar tarifas técnicas y sociales equitativas.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button
                  onClick={onOpenLogin}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#0b1329] font-bold text-base shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  Solicitar una Demo Personalizada
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                </button>
                <button
                  onClick={onOpenLogin}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 text-sm font-semibold transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  Acceder a la Sala de Concertación
                </button>
              </div>
            </div>

            {/* Right Content: Isometric 3D City & Econometric Dashboard Graphic */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none rounded-2xl bg-[#15223e]/90 border border-cyan-500/20 p-5 shadow-2xl shadow-cyan-950/80 backdrop-blur-sm">
                
                {/* Window header bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs font-mono text-slate-400 ml-2">SIM-MATRIZ-URBANA-COV v4.2</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    Live Telemetry
                  </div>
                </div>

                {/* Dashboard Mockup Internals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Top Left: Cost Breakdown Bars */}
                  <div className="bg-[#0b1329]/90 p-4 rounded-xl border border-slate-700/50">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Composición del COV / km
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Combustible Diésel / GNV</span>
                          <span className="text-cyan-400 font-semibold font-mono">42.4%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: '42.4%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Mano de Obra & Operador</span>
                          <span className="text-sky-400 font-semibold font-mono">28.1%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-400 rounded-full" style={{ width: '28.1%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Neumáticos & Desgaste</span>
                          <span className="text-blue-400 font-semibold font-mono">15.2%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: '15.2%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Amortización de Capital</span>
                          <span className="text-indigo-400 font-semibold font-mono">14.3%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: '14.3%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Right: Micro Map & Heat Grid */}
                  <div className="bg-[#0b1329]/90 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between relative overflow-hidden">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Red de Corredores Troncales
                    </div>
                    
                    {/* Mini isometric simulation graphic */}
                    <div className="relative h-28 bg-slate-900 rounded-lg border border-cyan-500/20 overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] opacity-30" />
                      
                      {/* Diagonal road representation */}
                      <div className="absolute w-44 h-10 bg-cyan-950/70 border-y-2 border-cyan-400/50 -rotate-12 flex items-center justify-around">
                        <div className="w-8 h-3 bg-amber-400 rounded-xs shadow-md shadow-amber-400/50 flex items-center justify-center text-[7px] font-black text-slate-950 animate-pulse">
                          BUS-01
                        </div>
                        <div className="w-8 h-3 bg-cyan-400 rounded-xs shadow-md shadow-cyan-400/50 flex items-center justify-center text-[7px] font-black text-slate-950">
                          BUS-02
                        </div>
                      </div>

                      <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Troncal A1: Óptimo
                      </div>
                    </div>

                    <div className="mt-2 text-center text-xs font-mono text-cyan-300">
                      Tarifa Óptima: Bs. 2.45 / Pasaje
                    </div>
                  </div>

                </div>

                {/* Bottom Data Matrix in Dashboard Graphic */}
                <div className="mt-4 bg-[#0b1329]/90 p-3.5 rounded-xl border border-slate-700/50 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Tarifa Técnica</div>
                    <div className="text-base font-bold text-white font-mono">Bs. 2.82</div>
                    <div className="text-[9px] text-emerald-400 font-semibold">+1.2% inflac.</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Tarifa Social</div>
                    <div className="text-base font-bold text-cyan-400 font-mono">Bs. 1.75</div>
                    <div className="text-[9px] text-cyan-300 font-semibold">Subsidio 37.9%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Equilibrio Operativo</div>
                    <div className="text-base font-bold text-amber-400 font-mono">98.4%</div>
                    <div className="text-[9px] text-slate-400 font-semibold">Riesgo Bajo</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 💳 3. HERO FEATURE CARDS (4 Tarjetas Blancas Flotantes con Solapamiento)  */}
      {/* ========================================================================= */}
      <section className="relative z-20 -mt-16 sm:-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-purpose="core-feature-cards">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/80 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2">Modelación del COV con precisión</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tarify OS: La plataforma SaaS con formulación paramétrica para modelar el Costo de Operación Vehicular con rigor econométrico.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/80 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2">Simulación de Escenarios en tiempo real</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tarify OS: Análisis dinámico de sensibilidad ante variación en precios de combustible, subsidios fiscales y tipos de cambio.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/80 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2">Concertación Tarifaria Transparente</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tarify OS: Datos auditables y tableros compartidos para mesas técnicas tripartitas entre municipios, gremios y sociedad civil.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/80 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2">Determinación de Tarifa Técnica y Social</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tarify OS: Fórmulas transparentes que concilian la rentabilidad justa del operador y la asequibilidad del usuario final.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 📊 4. INTERACTIVE DASHBOARD SECTION (Showcase con Ventana de Telemetría)  */}
      {/* ========================================================================= */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-purpose="dashboard-showcase" id="caracteristicas">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Realistic SaaS Dashboard Window */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              
              {/* Top Application Bar */}
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 tracking-wide">
                    Tarify OS — Consola de Fiscalización Tarifaria
                  </span>
                </div>
                <div className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded border border-slate-700">
                  Red Metropolitana Central
                </div>
              </div>

              {/* Dashboard Internal Stats Row */}
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500">COV Promedio / KM</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">Bs. 20.58</div>
                    <span className="text-[10px] text-emerald-600 font-semibold">▲ +1.4% vs mes ant.</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500">Subsidio Requerido</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">Bs. 3.347</div>
                    <span className="text-[10px] text-cyan-600 font-semibold">Focalizado</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500">Eficiencia Operativa</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">57.8%</div>
                    <span className="text-[10px] text-amber-600 font-semibold">Factor de carga</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500">Rutas Fiscalizadas</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">23</div>
                    <span className="text-[10px] text-slate-500 font-semibold">1,240 Unidades</span>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Body Charts */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Bar Chart: Cost Distribution */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-800">Distribución de Costos por KM</h4>
                      <span className="text-[10px] text-slate-500 font-mono">BOB / Bus-km</span>
                    </div>
                    {/* Simulated Bar Graph */}
                    <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-cyan-600 rounded-t h-24" />
                        <span className="text-[9px] text-slate-500">Comb.</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-sky-500 rounded-t h-16" />
                        <span className="text-[9px] text-slate-500">Personal</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-blue-500 rounded-t h-10" />
                        <span className="text-[9px] text-slate-500">Manten.</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-indigo-400 rounded-t h-12" />
                        <span className="text-[9px] text-slate-500">Seguros</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-slate-300 rounded-t h-8" />
                        <span className="text-[9px] text-slate-500">Admin</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Chart: Simulated Demand curve */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800">Curva de Sensibilidad Tarifaria</h4>
                      <span className="text-[10px] text-cyan-600 font-medium">Elasticidad -0.28</span>
                    </div>
                    {/* Curved demand representation */}
                    <div className="relative h-32 flex items-center justify-center">
                      <svg className="w-full h-full text-cyan-500 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                        <path d="M0,45 Q25,35 50,20 T100,5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                        <path d="M0,45 Q25,35 50,20 T100,5 L100,50 L0,50 Z" fill="rgba(6, 182, 212, 0.1)" />
                      </svg>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 border-t border-slate-100 pt-2">
                      <span>Bs. 1.50 Tarifa</span>
                      <span>Bs. 2.50 Óptimo</span>
                      <span>Bs. 3.50 Quiebre</span>
                    </div>
                  </div>

                </div>

                {/* Table: Comparative Tariffs */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800">Comparativa de Tarifas Técnicas vs Reguladas</h4>
                    <span className="text-[10px] text-slate-500">Última actualización: Hoy</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Corredor</th>
                          <th className="py-2.5 px-4 font-semibold">COV/km</th>
                          <th className="py-2.5 px-4 font-semibold">T. Técnica</th>
                          <th className="py-2.5 px-4 font-semibold">T. Social</th>
                          <th className="py-2.5 px-4 font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="py-2 px-4 font-medium text-slate-900">Troncal Norte 101</td>
                          <td className="py-2 px-4 font-mono">Bs. 18.90</td>
                          <td className="py-2 px-4 font-mono font-bold">Bs. 2.65</td>
                          <td className="py-2 px-4 font-mono text-cyan-600">Bs. 1.80</td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              Equilibrado
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-medium text-slate-900">Corredor Expreso Sur</td>
                          <td className="py-2 px-4 font-mono">Bs. 22.40</td>
                          <td className="py-2 px-4 font-mono font-bold">Bs. 3.10</td>
                          <td className="py-2 px-4 font-mono text-cyan-600">Bs. 2.10</td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Subsidio Pendiente
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-medium text-slate-900">Alimentador Periférico</td>
                          <td className="py-2 px-4 font-mono">Bs. 15.30</td>
                          <td className="py-2 px-4 font-mono font-bold">Bs. 2.20</td>
                          <td className="py-2 px-4 font-mono text-cyan-600">Bs. 1.50</td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              Equilibrado
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Right Column: Institutional Value Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Control Institucional Integral</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-4">
                Visualice e Intervenga con Datos Reales
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Tarify OS transforma hojas de cálculo vulnerables a la manipulación en una infraestructura institucional blindada para la toma de decisiones tarifarias transparentes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Distribución de Costos por KM</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Desglose algorítmico y auditable del impacto de costos fijos, insumos críticos, combustible e inversión de capital para cada tipo de flota.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Simulación de Demanda</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Modelos de elasticidad precio-demanda que predicen con precisión la fuga o ganancia de pasajeros frente a diferentes escalones tarifarios.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Comparativa de Tarifas</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Evaluación continua de la brecha fiscal entre la tarifa técnica requerida y la tarifa social implementada por la autoridad gubernamental.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center text-sm font-bold text-cyan-600 hover:text-cyan-700 group cursor-pointer"
              >
                Visualice e Intervenga con Datos Reales
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                </svg>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🏛️ 5. INSTITUTIONAL BENEFITS SECTION                                      */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-100/70 border-y border-slate-200" data-purpose="institutional-benefits">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Beneficios para su Institución</h2>
            <p className="text-sm text-slate-500 mt-2">
              Plataforma diseñada para ministerios, secretarías de movilidad y entes reguladores de transporte metropolitano.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Benefit Item 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-500 text-white flex items-center justify-center mb-5 shadow-md shadow-cyan-500/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Transparencia</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Elimine asimetrías de información. Metodología 100% matemática, abierta a auditorías parlamentarias, judiciales y de la ciudadanía.
              </p>
            </div>

            {/* Benefit Item 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-5 shadow-md shadow-sky-600/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sostenibilidad Financiera</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Protección de la salud financiera del sistema, garantizando que el canon y la tarifa cubran los ciclos de reposición vehicular.
              </p>
            </div>

            {/* Benefit Item 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-md shadow-blue-600/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Equidad Social</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mecanismos para focalizar subsidios cruzados y proteger a estratos vulnerables sin generar déficits presupuestarios imprevistos.
              </p>
            </div>

            {/* Benefit Item 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-5 shadow-md shadow-teal-600/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Empoderamiento de Gestión</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Los reguladores negocian con los gremios y concesionarios de buses con evidencia incontrovertible y capacidad analítica superior.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🌟 6. SUCCESS CASES SECTION (Casos de Éxito)                              */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white" data-purpose="success-cases-and-clients" id="casos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Casos de Éxito</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Ministerios y agencias de transporte en Iberoamérica toman decisiones con Tarify OS
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {/* Entity 1 */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                MT
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800">Ministerio de Transporte</div>
                <div className="text-[10px] text-slate-500">República de Colombia</div>
              </div>
            </div>

            {/* Entity 2 */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                ATU
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800">Autoridad de Transporte</div>
                <div className="text-[10px] text-slate-500">Área Metropolitana</div>
              </div>
            </div>

            {/* Entity 3 */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                DGM
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800">Dirección de Movilidad Urbana</div>
                <div className="text-[10px] text-slate-500">Gobierno Federal</div>
              </div>
            </div>

            {/* Entity 4 */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                STM
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800">Secretaría de Movilidad</div>
                <div className="text-[10px] text-slate-500">Sistema BRT Troncal</div>
              </div>
            </div>
          </div>

          {/* Pagination dots indicator */}
          <div className="flex justify-center items-center gap-2 mt-8">
            <span className="w-2 h-2 rounded-full bg-cyan-600" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 💰 7. PRICING PLANS SECTION (Planes y Precios)                            */}
      {/* ========================================================================= */}
      <section className="py-24 bg-slate-50 border-t border-slate-200" data-purpose="pricing-tiers" id="precios">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Planes y Precios</h2>
            <p className="text-sm text-slate-500 mt-2">
              Licenciamiento adaptado a la envergadura y complejidad del parque automotor territorial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Plan Básico */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <div className="text-center pb-6 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nivel Municipal</span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">Básico</h3>
                  <p className="text-xs text-slate-500 mt-2">Para municipios y redes urbanas de hasta 150 buses.</p>
                </div>
                <ul className="py-6 space-y-3.5 text-xs text-slate-600">
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Modelación COV estándar
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Hasta 5 rutas o corredores
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Reportes PDF institucionales
                  </li>
                  <li className="flex items-center gap-3 text-slate-400">
                    <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                    Sin simulador dinámico en tiempo real
                  </li>
                  <li className="flex items-center gap-3 text-slate-400">
                    <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                    Soporte por correo electrónico 48h
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full block text-center py-3 px-4 rounded-xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Contactar por Cotización
              </button>
            </div>

            {/* Plan Estándar (Featured) */}
            <div className="bg-white rounded-2xl border-2 border-cyan-500 shadow-xl p-8 flex flex-col justify-between relative transform lg:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full shadow-xs">
                Más Implementado
              </div>
              <div>
                <div className="text-center pb-6 border-b border-slate-100">
                  <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Gobiernos Regionales</span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">Estándar</h3>
                  <p className="text-xs text-slate-500 mt-2">Para autoridades metropolitanas de 150 a 1,000 buses.</p>
                </div>
                <ul className="py-6 space-y-3.5 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Modelación COV avanzada multi-tecnología
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Simulador de Escenarios en Tiempo Real
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Módulo de Concertación Tarifaria Gremial
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Auditoría algorítmica de subsidios
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Soporte prioritario y capacitación técnica
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full block text-center py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 font-bold text-sm text-white shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
              >
                Optimizar para Gobierno
              </button>
            </div>

            {/* Plan Enterprise */}
            <div className="bg-[#0b1329] rounded-2xl border border-slate-700 shadow-lg p-8 flex flex-col justify-between text-white">
              <div>
                <div className="text-center pb-6 border-b border-slate-800">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Nivel Nacional</span>
                  <h3 className="text-2xl font-bold text-white mt-1">Enterprise</h3>
                  <p className="text-xs text-slate-300 mt-2">Para ministerios de transporte y redes masivas &gt; 1,000 buses.</p>
                </div>
                <ul className="py-6 space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Rutas y flotas ilimitadas a escala país
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Gemelo digital macroeconómico
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Integración API con sistemas GPS y Recaudo
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    SLA 99.9% y despliegue On-Premise opcional
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Acompañamiento econométrico presencial
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenLogin}
                className="w-full block text-center py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                Generar por Cotización
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 📰 8. FEATURED BLOG SECTION (Publicaciones & Análisis)                    */}
      {/* ========================================================================= */}
      <section className="py-24 bg-white" data-purpose="institutional-blog" id="blog">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Publicaciones & Análisis</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Blog Destacado</h2>
            </div>
            <a className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 mt-3 sm:mt-0" href="#blog">
              Ver todas las publicaciones
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Post 1 */}
            <article className="group rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="h-48 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
                <div className="text-slate-500 flex flex-col items-center">
                  <svg className="w-12 h-12 text-cyan-400/80 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                  <span className="text-xs font-mono text-slate-300">Macroeconomía Urbana</span>
                </div>
                <span className="absolute top-3 left-3 bg-cyan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  Econometría
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-slate-500">12 Octubre, 2024</span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors mt-1 mb-2 leading-snug">
                    Metodología macroeconómica para transporte interurbano post-crisis
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    Criterios analíticos para ajustar la canasta de insumos de las empresas de transporte sin mermar la capacidad adquisitiva de los usuarios de cercanías.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-cyan-600">
                  Leer artículo completo →
                </div>
              </div>
            </article>

            {/* Post 2 */}
            <article className="group rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="h-48 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
                <div className="text-slate-500 flex flex-col items-center">
                  <svg className="w-12 h-12 text-sky-400/80 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                  <span className="text-xs font-mono text-slate-300">Flotas Eléctricas & COV</span>
                </div>
                <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  Electromovilidad
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-slate-500">28 Septiembre, 2024</span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors mt-1 mb-2 leading-snug">
                    Concertación de tarifas y canasta de insumos para flotas eléctricas
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    Cómo estructurar contratos de concesión considerando la amortización de baterías, infraestructura de carga electroterminal y costo marginal por km.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-cyan-600">
                  Leer artículo completo →
                </div>
              </div>
            </article>

            {/* Post 3 */}
            <article className="group rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="h-48 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
                <div className="text-slate-500 flex flex-col items-center">
                  <svg className="w-12 h-12 text-teal-400/80 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                  <span className="text-xs font-mono text-slate-300">Política Pública</span>
                </div>
                <span className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  Políticas Públicas
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-slate-500">14 Septiembre, 2024</span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors mt-1 mb-2 leading-snug">
                    Transición energética y su impacto en la tarifa técnica social
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    Evaluación del balance financiero cuando se introducen buses a gas natural e híbridos en redes troncales tradicionalmente diésel.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-cyan-600">
                  Leer artículo completo →
                </div>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🏢 9. INSTITUTIONAL FOOTER (Pie de Página Corporativo)                    */}
      {/* ========================================================================= */}
      <footer className="bg-[#0b1329] text-slate-400 pt-16 pb-12 border-t border-slate-800" data-purpose="site-footer" id="contacto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
            
            {/* Brand Description */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  Tarify <span className="text-cyan-400">OS</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                Plataforma econométrica SaaS institucional para el cálculo, auditoría y concertación de tarifas técnicas y sociales en sistemas de transporte masivo urbano.
              </p>
              <div className="flex items-center gap-3 pt-2">
                {/* LinkedIn */}
                <a className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors" href="#contacto">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
                {/* Twitter / X */}
                <a className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors" href="#contacto">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                {/* YouTube */}
                <a className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors" href="#contacto">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
              </div>
            </div>

            {/* Quick Links: Platform */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Plataforma</h4>
              <ul className="space-y-2 text-xs">
                <li><a className="hover:text-white transition-colors" href="#inicio">Inicio</a></li>
                <li><a className="hover:text-white transition-colors" href="#caracteristicas">Motor Econométrico</a></li>
                <li><a className="hover:text-white transition-colors" href="#caracteristicas">Simulador COV</a></li>
                <li><a className="hover:text-white transition-colors" href="#casos">Casos de Éxito</a></li>
                <li><a className="hover:text-white transition-colors" href="#precios">Precios de Licencia</a></li>
              </ul>
            </div>

            {/* Quick Links: Institutional Info */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Información</h4>
              <ul className="space-y-2 text-xs">
                <li><a className="hover:text-white transition-colors" href="#contacto">Regulación y Normativa</a></li>
                <li><a className="hover:text-white transition-colors" href="#contacto">Metodología Técnica</a></li>
                <li><a className="hover:text-white transition-colors" href="#contacto">Políticas de Privacidad</a></li>
                <li><a className="hover:text-white transition-colors" href="#contacto">Términos de Servicio</a></li>
                <li><a className="hover:text-white transition-colors" href="#contacto">Seguridad de Datos Gov</a></li>
              </ul>
            </div>

            {/* Newsletter Subscription */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Boletín Regulatorio</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Reciba mensualmente análisis técnicos sobre tendencias en financiamiento y tarifas de transporte urbano.
              </p>
              
              {newsletterSubscribed ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-medium">
                  Suscripción confirmada. Recibirá el próximo informe técnico mensual.
                </div>
              ) : (
                <form className="space-y-2" onSubmit={handleNewsletterSubmit}>
                  <div className="flex gap-2">
                    <input
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                      placeholder="su-correo@institucion.gob"
                      required
                      type="email"
                      value={emailNewsletter}
                      onChange={(e) => setEmailNewsletter(e.target.value)}
                    />
                    <button
                      className="bg-cyan-500 hover:bg-cyan-400 text-[#0b1329] font-bold px-4 py-2 rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
                      type="submit"
                    >
                      Suscribir
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Exclusivo para funcionarios y técnicos del sector.</span>
                </form>
              )}
            </div>

          </div>

          {/* Copyright Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
            <div>
              © 2024 Tarify OS Inc. Todos los derechos reservados.
            </div>
            <div className="mt-4 sm:mt-0 flex gap-6">
              <a className="hover:text-slate-200" href="#contacto">Aviso Legal</a>
              <a className="hover:text-slate-200" href="#contacto">Privacidad Institucional</a>
              <a className="hover:text-slate-200" href="#contacto">Soporte Gov</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
