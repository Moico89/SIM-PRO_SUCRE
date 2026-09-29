'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { SystemParameters, FareCategory, AuditLog, UserRole } from '@/types/database';
import { updateSystemParameter } from '@/actions/parameters';
import { createClient } from '@/lib/supabase/client';
import type { UpdateParameterInput } from '@/lib/validations/parameters';

interface DashboardViewProps {
  initialParameters: SystemParameters;
  initialFares: FareCategory[];
  initialLogs: AuditLog[];
  currentRole: UserRole;
  currentUserEmail: string;
}

type EditableParameterField = UpdateParameterInput['field'];
type ScenarioType = 'social2' | 'social1' | 'technical' | 'current' | 'stress';
type TabType = 'resumen' | 'tarifas' | 'rutas' | 'auditoria';

export default function DashboardView({
  initialParameters,
  initialFares,
  initialLogs,
  currentRole = 'consultor_ecotraffic',
  currentUserEmail = 'consultor@ecotraffic.com.bo'
}: DashboardViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [params, setParams] = useState<SystemParameters>(initialParameters);
  const [fares, setFares] = useState<FareCategory[]>(initialFares);
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('social2');
  const [activeRole, setActiveRole] = useState<UserRole>(currentRole);

  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [, startTransition] = useTransition();
  
  // Modal de edición de parámetros
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editField, setEditField] = useState<EditableParameterField>('fuel_price_bs_l');
  const [editValue, setEditValue] = useState<number>(params.fuel_price_bs_l);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Suscripción en Tiempo Real con Supabase WebSockets
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`negotiation-live-${params.session_id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'system_parameters',
            filter: `session_id=eq.${params.session_id}`,
          },
          (payload) => {
            if (payload.new) {
              startTransition(() => {
                setParams((prev) => ({ ...prev, ...(payload.new as Partial<SystemParameters>) }));
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'fare_categories',
            filter: `session_id=eq.${params.session_id}`,
          },
          (payload) => {
            if (payload.new) {
              const updated = payload.new as FareCategory;
              startTransition(() => {
                setFares((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'audit_logs',
            filter: `session_id=eq.${params.session_id}`,
          },
          (payload) => {
            if (payload.new) {
              const newLog = payload.new as AuditLog;
              startTransition(() => {
                setLogs((prev) => {
                  if (prev.some((l) => l.id === newLog.id)) return prev;
                  return [newLog, ...prev];
                });
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setRealtimeStatus('offline');
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      setRealtimeStatus('offline');
    }
  }, [params.session_id]);


  // Formateador seguro contra errores de hidratación SSR
  const fmt = (num: number, decimals: number = 0) => {
    if (!isMounted) return num.toFixed(decimals);
    return num.toLocaleString('es-BO', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Cálculos de economía del sistema
  const days = params.operating_days_month;
  const turns = params.turns_day;
  const fleet = params.fleet_active;
  const kmDay = params.km_network_day;
  const demandDay = selectedScenario === 'stress' ? params.demand_network_day * 0.9 : params.demand_network_day;
  const dieselPrice = selectedScenario === 'stress' ? params.fuel_price_bs_l * 1.15 : params.fuel_price_bs_l;

  const unitKm = (kmDay / fleet) * days; // 2172.59 km/mes
  const unitPax = (demandDay / fleet) * days; // 6995.74 pax/mes
  const ipk = demandDay / kmDay; // 3.22 pax/km

  const fuelCost = (unitKm / params.fuel_efficiency_km_l) * dieselPrice * (1 + params.idle_congestion_factor);
  const maintVar = params.maintenance_monthly_bs * params.maintenance_var_share;
  const maintFixed = params.maintenance_monthly_bs * params.maintenance_fixed_share;
  const laborCost = params.driver_salary_bs * (1 + params.labor_charges_factor);
  const otherFixed = params.other_fixed_monthly_bs;

  const opex = fuelCost + maintVar + maintFixed + laborCost + otherFixed;
  const depreciation = (params.vehicle_replacement_value_bs - params.vehicle_residual_value_bs) / params.vehicle_useful_life_months;
  const allowedReturn = (params.vehicle_replacement_value_bs - params.vehicle_residual_value_bs) * (params.capital_return_rate_annual / 12);
  const regulatoryCost = opex + depreciation + allowedReturn;
  const technicalWeighted = regulatoryCost / unitPax;

  // Ponderaciones de tarifa
  const currentWeighted = fares.reduce((acc, f) => acc + f.demand_share * f.fare_current_bs, 0);
  const social1Weighted = fares.reduce((acc, f) => acc + f.demand_share * f.fare_social_1_bs, 0);
  const social2Weighted = fares.reduce((acc, f) => acc + f.demand_share * f.fare_social_2_bs, 0);

  let activeAdultFare = 3.50;
  let activeWeightedFare = social2Weighted;

  if (selectedScenario === 'social2') {
    activeAdultFare = 3.50;
    activeWeightedFare = social2Weighted;
  } else if (selectedScenario === 'social1') {
    activeAdultFare = 3.80;
    activeWeightedFare = social1Weighted;
  } else if (selectedScenario === 'technical') {
    activeAdultFare = technicalWeighted * (fares[0]?.fare_current_bs / currentWeighted);
    activeWeightedFare = technicalWeighted;
  } else if (selectedScenario === 'current') {
    activeAdultFare = 4.50;
    activeWeightedFare = currentWeighted;
  } else if (selectedScenario === 'stress') {
    activeAdultFare = 4.50;
    activeWeightedFare = currentWeighted;
  }

  const monthlyRevenue = activeWeightedFare * unitPax;
  const freeCash = monthlyRevenue - opex - depreciation;
  const economicProfit = monthlyRevenue - regulatoryCost;
  const householdIncome = laborCost + freeCash;

  const canEdit = activeRole === 'admin_municipal' || activeRole === 'consultor_ecotraffic';

  // 32 Rutas del sistema
  const routesList = [
    { id: 1, union: "San Cristóbal", line: "Línea 12 amarillo", distance: 15.49, fleet: 30.49 },
    { id: 2, union: "San Cristóbal", line: "Línea 12 Rosado", distance: 29.24, fleet: 25.97 },
    { id: 3, union: "San Cristóbal", line: "Línea 1", distance: 30.62, fleet: 31.62 },
    { id: 4, union: "San Cristóbal", line: "Línea 2", distance: 32.90, fleet: 31.62 },
    { id: 5, union: "San Cristóbal", line: "Línea 3", distance: 28.30, fleet: 32.75 },
    { id: 6, union: "San Cristóbal", line: "Línea 4", distance: 29.76, fleet: 31.62 },
    { id: 7, union: "San Cristóbal", line: "Línea 5", distance: 25.92, fleet: 32.75 },
    { id: 8, union: "San Cristóbal", line: "Línea 6", distance: 26.38, fleet: 31.62 },
    { id: 9, union: "San Cristóbal", line: "Línea 7", distance: 24.50, fleet: 31.62 },
    { id: 10, union: "San Cristóbal", line: "Línea 8", distance: 25.83, fleet: 32.75 },
    { id: 11, union: "San Cristóbal", line: "Línea 10", distance: 35.53, fleet: 30.49 },
    { id: 12, union: "San Cristóbal", line: "Línea 11", distance: 22.96, fleet: 29.36 },
    { id: 13, union: "San Cristóbal", line: "Línea 14 (Tramo A)", distance: 24.21, fleet: 30.49 },
    { id: 14, union: "San Cristóbal", line: "Línea 25", distance: 34.57, fleet: 30.49 },
    { id: 15, union: "San Cristóbal", line: "Línea 33", distance: 30.10, fleet: 30.49 },
    { id: 16, union: "San Cristóbal", line: "Línea 77", distance: 21.02, fleet: 30.49 },
    { id: 17, union: "San Cristóbal", line: "Línea 125", distance: 34.86, fleet: 30.49 },
    { id: 18, union: "San Cristóbal", line: "Línea 01", distance: 31.44, fleet: 30.49 },
    { id: 19, union: "San Cristóbal", line: "Línea 14 (Tramo B)", distance: 24.38, fleet: 30.49 },
    { id: 20, union: "Sindicato Sucre", line: "Línea K 50", distance: 28.00, fleet: 31.62 },
    { id: 21, union: "Sindicato Sucre", line: "Línea 20", distance: 36.00, fleet: 30.49 },
    { id: 22, union: "Sindicato Sucre", line: "Línea B (Amarillo) 21", distance: 31.00, fleet: 30.49 },
    { id: 23, union: "Sindicato Sucre", line: "Línea FX 80", distance: 34.00, fleet: 30.49 },
    { id: 24, union: "Sindicato Sucre", line: "Línea FX 15", distance: 30.00, fleet: 31.62 },
    { id: 25, union: "Sindicato Sucre", line: "Línea Q Rosada", distance: 28.00, fleet: 30.49 },
    { id: 26, union: "Sindicato Sucre", line: "Línea Q Amarillo 55", distance: 32.00, fleet: 30.49 },
    { id: 27, union: "Sindicato Sucre", line: "Línea A 30", distance: 22.00, fleet: 30.49 },
    { id: 28, union: "Sindicato Sucre", line: "Línea G 60", distance: 29.00, fleet: 31.62 },
    { id: 29, union: "Sindicato Sucre", line: "Línea C 70", distance: 20.00, fleet: 30.49 },
    { id: 30, union: "Sindicato Sucre", line: "Línea L 18", distance: 20.00, fleet: 30.49 },
    { id: 31, union: "Sindicato Sucre", line: "Línea B Verde 101", distance: 23.00, fleet: 31.62 },
    { id: 32, union: "Sindicato Sucre", line: "Línea D 87", distance: 26.00, fleet: 30.49 }
  ];

  // Cálculo de rentabilidad por ruta con factor de conciliación (1.0050)
  const factor = 1.004978;
  const calculatedRoutes = routesList.map(r => {
    const kmMes = r.distance * turns * factor * days;
    const paxMes = kmMes * ipk;
    const fuel = (kmMes / params.fuel_efficiency_km_l) * dieselPrice * (1 + params.idle_congestion_factor);
    const mk = maintVar * (kmMes / unitKm);
    const routeOpex = fuel + mk + maintFixed + laborCost + otherFixed;
    const routeReg = routeOpex + depreciation + allowedReturn;
    const routeRev = paxMes * activeWeightedFare;
    const routeProfit = routeRev - routeReg;
    return {
      ...r,
      kmMes,
      paxMes,
      routeOpex,
      routeReg,
      routeRev,
      routeProfit,
      isDeficit: routeProfit < 0
    };
  });

  const deficitRoutesCount = calculatedRoutes.filter(r => r.isDeficit).length;

  // Manejo de exportación a Excel dinámico
  const handleExportExcel = () => {
    try {
      const XLSX = window.XLSX;
      if (XLSX) {
        const wb = XLSX.utils.book_new();
        
        // Hoja 1: Resumen de Parámetros
        const summaryData = [
          ["SISTEMA DE GOBERNANZA TARIFARIA SUCRE v3.3 - GAM SUCRE & ECOTRAFFIC"],
          ["Escenario Activo", selectedScenario],
          ["Fecha de Exportación", new Date().toLocaleString('es-BO')],
          [],
          ["Indicador", "Valor", "Unidad"],
          ["Tarifa Adulto", activeAdultFare, "Bs/viaje"],
          ["Tarifa Técnica Adulto", 3.4485, "Bs/viaje"],
          ["Tarifa Ponderada Red", activeWeightedFare, "Bs/viaje"],
          ["Tarifa Técnica Ponderada", technicalWeighted, "Bs/viaje"],
          ["Ingreso Mensual Hogar", householdIncome, "Bs/mes"],
          ["Utilidad Excedente Mensual", economicProfit, "Bs/mes"],
          ["OPEX Efectivo", opex, "Bs/mes"],
          ["Costo Regulatorio Total", regulatoryCost, "Bs/mes"],
          ["Flota Activa", fleet, "vehículos"],
          ["km Red Día", kmDay, "km/día"],
          ["Demanda Día", demandDay, "pasajeros/día"],
          ["Mantenimiento v2", params.maintenance_monthly_bs, "Bs/mes"]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen_Ejecutivo");

        // Hoja 2: Tarifas por Categoría
        const faresData = [
          ["Categoría Social", "% Demanda", "Viajes/Día", "Vigente (Bs)", "Técnica Eq. (Bs)", "Social 1 (Bs)", "Social 2 (Bs)"],
          ...fares.map(f => [f.name, f.demand_share, f.daily_trips, f.fare_current_bs, f.fare_technical_bs, f.fare_social_1_bs, f.fare_social_2_bs])
        ];
        const wsFares = XLSX.utils.aoa_to_sheet(faresData);
        XLSX.utils.book_append_sheet(wb, wsFares, "Tarifas_Categorias");

        // Hoja 3: Rutas
        const routesData = [
          ["ID", "Sindicato", "Línea", "Distancia Ciclo (km)", "Flota", "km/Mes", "Pasajeros/Mes", "Recaudación (Bs)", "Costo (Bs)", "Utilidad (Bs)", "Estado"],
          ...calculatedRoutes.map(r => [
            r.id, r.union, r.line, r.distance, r.fleet, r.kmMes, r.paxMes, r.routeRev, r.routeReg, r.routeProfit, r.isDeficit ? "DÉFICIT" : "CUBRE COSTO"
          ])
        ];
        const wsRoutes = XLSX.utils.aoa_to_sheet(routesData);
        XLSX.utils.book_append_sheet(wb, wsRoutes, "32_Rutas_Rentabilidad");

        XLSX.writeFile(wb, `Modelo_Tarifario_Sucre_${selectedScenario}_v3.3.xlsx`);
      } else {
        // Redirigir a descarga directa del archivo master de Google Drive
        window.open("https://drive.google.com/file/d/1IjhXzM7y1Awv6ONity8ckblUCdkxCEOg/view?usp=drivesdk", "_blank");
      }
    } catch {
      window.open("https://drive.google.com/file/d/1IjhXzM7y1Awv6ONity8ckblUCdkxCEOg/view?usp=drivesdk", "_blank");
    }
  };

  // Manejo de exportación a PDF
  const handleExportPDF = () => {
    window.print();
  };

  const handleOpenEdit = (field: EditableParameterField, currentValue: number) => {
    if (!canEdit) {
      alert(`Acceso denegado: El rol '${activeRole}' no tiene permisos para modificar parámetros oficiales.`);
      return;
    }
    setEditField(field);
    setEditValue(currentValue);
    setJustification('');
    setIsEditModalOpen(true);
  };

  const handleSaveParameter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (justification.length < 10) {
      alert('La justificación técnica debe contener al menos 10 caracteres para cumplir con los estándares de auditoría.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await updateSystemParameter({
      sessionId: params.session_id,
      parameterId: params.id,
      field: editField,
      newValue: Number(editValue),
      justification: justification
    });

    setIsSubmitting(false);

    if (res.success) {
      setParams(prev => ({ ...prev, [editField]: Number(editValue), version: res.version || prev.version + 1 }));
      setIsEditModalOpen(false);
      setStatusMessage({ text: res.message || 'Parámetro actualizado exitosamente.', type: 'success' });

      const newLog: AuditLog = {
        id: crypto.randomUUID(),
        session_id: params.session_id,
        user_email: currentUserEmail,
        user_role: activeRole,
        user_organization: activeRole === 'admin_municipal' ? 'GAM Sucre' : 'Ecotraffic',
        action: 'CAMBIO_PARAMETRO',
        entity_name: 'system_parameters',
        field_name: editField,
        old_value: { [editField]: params[editField] },
        new_value: { [editField]: Number(editValue) },
        justification: justification,
        created_at: new Date().toISOString()
      };
      setLogs(prev => [newLog, ...prev]);
    } else {
      setStatusMessage({ text: res.error || 'Ocurrió un error al guardar.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-900 font-sans pb-16">
      {/* Script SheetJS para exportación Excel */}
      <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

      {/* Top Enterprise SaaS Bar */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center font-black text-white text-base shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white">
                  TRANSITAR SUCRE
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                  SaaS v3.3
                </span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded font-semibold hidden md:inline">
                  GAM Sucre & Ecotraffic
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Plataforma de Concertación Tarifaria y Auditoría en Tiempo Real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Indicador de Estado Realtime / WebSockets */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-slate-900 border-slate-700">
              <span className={`w-2 h-2 rounded-full ${
                realtimeStatus === 'connected' 
                  ? 'bg-emerald-400 animate-pulse' 
                  : realtimeStatus === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-400'
              }`} />
              <span className="text-slate-300">
                {realtimeStatus === 'connected' ? 'En Vivo' : realtimeStatus === 'connecting' ? 'Conectando...' : 'Offline'}
              </span>
            </div>

            {/* Botón Descargar PDF */}
            <button
              onClick={handleExportPDF}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
              title="Descargar o Imprimir Reporte Oficial en PDF"
            >
              <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              <span>Reporte PDF</span>
            </button>

            {/* Botón Descargar Excel */}
            <button
              onClick={handleExportExcel}
              className="bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
              title="Descargar Hoja Excel .xlsx del Modelo Auditado"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Excel .xlsx</span>
            </button>

            {/* Role Switcher */}
            <div className="relative">
              <select
                value={activeRole}
                onChange={e => setActiveRole(e.target.value as UserRole)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg outline-none cursor-pointer hover:border-slate-600"
              >
                <option value="admin_municipal">Rol: Admin Municipal (GAMS)</option>
                <option value="consultor_ecotraffic">Rol: Consultor (Ecotraffic)</option>
                <option value="delegado_sindical">Rol: Delegado Sindical</option>
                <option value="observador_publico">Rol: Observador / Concejo</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main SaaS Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Banner de Retroalimentación */}
        {statusMessage && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700">&times;</button>
          </div>
        )}

        {/* Header de Negociación y Escenarios SaaS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mesa de Concertación:</span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sesión Activa
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Escenarios de Negociación Tarifaria
            </h2>
          </div>

          {/* Segmented Control de Escenarios */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap gap-1 border border-slate-200">
            {[
              { id: 'social2' as const, label: 'Social 2 (Bs. 3,50)', badge: 'RECOMENDADO', color: 'text-emerald-700 font-extrabold' },
              { id: 'social1' as const, label: 'Social 1 (Bs. 3,80)', badge: '', color: 'text-slate-700' },
              { id: 'technical' as const, label: 'Técnica (Bs. 3,45)', badge: 'EQUILIBRIO', color: 'text-blue-700' },
              { id: 'current' as const, label: 'Vigente (Bs. 4,50)', badge: '', color: 'text-slate-700' },
              { id: 'stress' as const, label: 'Estrés (-10% / +15%)', badge: '', color: 'text-amber-700' }
            ].map(sc => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedScenario === sc.id
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                }`}
              >
                <span className={sc.color}>{sc.label}</span>
                {sc.badge && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">
                    {sc.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Métricas Principales (6 SaaS Metric Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Tarifa Adulto */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tarifa Adulto</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              Bs. {fmt(activeAdultFare, 2)}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <span>+3,9% s/ técnica</span>
            </div>
            <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
          </div>

          {/* Card 2: Tarifa Técnica Eq. */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tarifa Técnica Eq.</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              Bs. 3,45
            </div>
            <div className="text-[11px] text-blue-700 font-semibold mt-1">
              Equilibrio financiero
            </div>
            <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
          </div>

          {/* Card 3: Tarifa Ponderada */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tarifa Ponderada</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              Bs. {fmt(activeWeightedFare, 4)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Téc: Bs. {fmt(technicalWeighted, 4)}
            </div>
            <div className="absolute top-0 right-0 w-2 h-full bg-teal-500"></div>
          </div>

          {/* Card 4: Ingreso Hogar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ingreso Hogar</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              Bs. {fmt(Math.round(householdIncome), 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Salario + Retorno mes
            </div>
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
          </div>

          {/* Card 5: Utilidad Excedente */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Utilidad Excedente</div>
            <div className={`text-2xl font-black mt-1 ${economicProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              Bs. {fmt(Math.round(economicProfit), 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Sobre WACC 11%
            </div>
            <div className={`absolute top-0 right-0 w-2 h-full ${economicProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          </div>

          {/* Card 6: Mantenimiento v2 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mantenimiento v2</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              Bs. {fmt(params.maintenance_monthly_bs, 2)}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-1">
              -32,7% Ahorro auditado
            </div>
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
          </div>
        </div>

        {/* Narrative Box */}
        <div className="bg-gradient-to-r from-amber-50 to-white rounded-2xl border border-amber-200/70 p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-sm">
              ℹ
            </div>
            <div className="text-xs text-slate-800 leading-relaxed font-medium">
              <strong>Diagnóstico Técnico Oficial:</strong> Con la tarifa <strong>Social 2 (Bs. 3,50)</strong>, el microbús recauda <strong>Bs. {fmt(monthlyRevenue, 0)}/mes</strong>, cubriendo el 100% del costo regulatorio (Bs. {fmt(regulatoryCost, 0)}/mes), asegurando la reposición de la flota y generando un ingreso digno de <strong>Bs. {fmt(householdIncome, 0)}/mes</strong> para la familia del operador.
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap hidden lg:block">
            IPK: {fmt(ipk, 2)} pax/km
          </span>
        </div>

        {/* SaaS Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          {[
            { id: 'resumen' as const, label: 'Resumen Ejecutivo & COV' },
            { id: 'tarifas' as const, label: 'Estructura por Categoría Social' },
            { id: 'rutas' as const, label: `Rentabilidad 32 Rutas (${deficitRoutesCount} deficitarias)` },
            { id: 'auditoria' as const, label: `Bitácora de Auditoría (${logs.length} logs)` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeTab === tab.id
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: RESUMEN & COV */}
        {activeTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Parámetros Auditados */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Parámetros Operativos del Sistema</h3>
                  <p className="text-[11px] text-slate-500">Valores auditados de la red y del microbús Nissan Civilian</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  canEdit ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {canEdit ? 'Edición Habilitada' : 'Solo Lectura'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'fuel_price_bs_l' as const, label: 'Precio Diésel', val: params.fuel_price_bs_l, unit: 'Bs/litro' },
                  { key: 'fuel_efficiency_km_l' as const, label: 'Rendimiento Diésel Base', val: params.fuel_efficiency_km_l, unit: 'km/l (+15% ralentí)' },
                  { key: 'maintenance_monthly_bs' as const, label: 'Mantenimiento Mensual v2', val: params.maintenance_monthly_bs, unit: 'Bs/mes (-32,7%)' },
                  { key: 'driver_salary_bs' as const, label: 'Salario Chofer Profesional', val: params.driver_salary_bs, unit: 'Bs/mes (+8,33% aguinaldo)' },
                  { key: 'fleet_active' as const, label: 'Flota Activa en Servicio', val: params.fleet_active, unit: 'microbuses' },
                  { key: 'turns_day' as const, label: 'Vueltas por Día / Unidad', val: params.turns_day, unit: 'vueltas/día' },
                  { key: 'demand_network_day' as const, label: 'Demanda Diaria Total', val: params.demand_network_day, unit: 'pasajeros/día' },
                  { key: 'km_network_day' as const, label: 'Producción de Red (GPS)', val: params.km_network_day, unit: 'km/día' }
                ].map(item => (
                  <div
                    key={item.key}
                    onClick={() => canEdit && handleOpenEdit(item.key, item.val)}
                    className={`p-3 rounded-xl border flex justify-between items-center transition-all ${
                      canEdit
                        ? 'border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer shadow-2xs'
                        : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-90'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-semibold text-slate-700">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.unit}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {fmt(item.val, item.val % 1 !== 0 ? 2 : 0)}
                      </span>
                      {canEdit && (
                        <span className="block text-[9px] text-blue-600 font-semibold mt-0.5">Editar</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estructura de Costos COV */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Estructura del Costo Regulatorio (COV)</h3>
                <p className="text-[11px] text-slate-500">Costo mensual total por unidad: Bs. {fmt(regulatoryCost, 2)}</p>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Combustible Diésel (+15% congestión)', val: fuelCost, share: (fuelCost / regulatoryCost) * 100, color: 'bg-blue-600' },
                  { name: 'Mantenimiento Auditado v2 (Variable + Fijo)', val: params.maintenance_monthly_bs, share: (params.maintenance_monthly_bs / regulatoryCost) * 100, color: 'bg-teal-600' },
                  { name: 'Personal de Conducción (Sueldo + Aguinaldo)', val: laborCost, share: (laborCost / regulatoryCost) * 100, color: 'bg-orange-500' },
                  { name: 'Costos Administrativos y Seguros', val: otherFixed, share: (otherFixed / regulatoryCost) * 100, color: 'bg-amber-500' },
                  { name: 'Costo de Capital (Depreciación + WACC 11%)', val: depreciation + allowedReturn, share: ((depreciation + allowedReturn) / regulatoryCost) * 100, color: 'bg-emerald-600' }
                ].map(cost => (
                  <div key={cost.name}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700">{cost.name}</span>
                      <span className="text-slate-900 font-mono">Bs. {fmt(Math.round(cost.val), 0)} ({fmt(cost.share, 1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${cost.color}`} style={{ width: `${cost.share}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">OPEX Efectivo en Caja:</span>
                  <strong className="text-slate-900 font-mono">Bs. {fmt(opex, 2)} / mes</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Reserva de Reposición Vehicular (10 años):</span>
                  <strong className="text-slate-900 font-mono">Bs. {fmt(depreciation, 2)} / mes</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Retorno Justo al Capital (11% WACC):</span>
                  <strong className="text-slate-900 font-mono">Bs. {fmt(allowedReturn, 2)} / mes</strong>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900">
                  <span>COSTO ECONÓMICO REGULATORIO TOTAL:</span>
                  <span className="text-emerald-700 font-mono">Bs. {fmt(regulatoryCost, 2)} / mes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TARIFAS POR CATEGORÍA */}
        {activeTab === 'tarifas' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Matriz de Tarifas por Categoría Social</h3>
              <p className="text-[11px] text-slate-500">Comparación de recaudación y subsidios cruzados por tipo de pasajero</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3">Categoría Social</th>
                    <th className="p-3 text-right">% Demanda</th>
                    <th className="p-3 text-right">Viajes / Día</th>
                    <th className="p-3 text-right">Vigente (Bs)</th>
                    <th className="p-3 text-right">Técnica Eq. (Bs)</th>
                    <th className="p-3 text-right">Social 1 (Bs)</th>
                    <th className="p-3 text-right bg-emerald-50 text-emerald-900">Social 2 (Bs. 3,50)</th>
                    <th className="p-3 text-right">Dif. Soc2 - Téc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fares.map(f => (
                    <tr key={f.name} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">{f.name}</td>
                      <td className="p-3 text-right font-mono">{fmt(f.demand_share * 100, 1)}%</td>
                      <td className="p-3 text-right font-mono">{fmt(f.daily_trips, 0)}</td>
                      <td className="p-3 text-right font-mono">Bs. {fmt(f.fare_current_bs, 2)}</td>
                      <td className="p-3 text-right font-mono">Bs. {fmt(f.fare_technical_bs, 4)}</td>
                      <td className="p-3 text-right font-mono">Bs. {fmt(f.fare_social_1_bs, 2)}</td>
                      <td className="p-3 text-right font-mono font-bold bg-emerald-50/50 text-emerald-900">
                        Bs. {fmt(f.fare_social_2_bs, 2)}
                      </td>
                      <td className={`p-3 text-right font-mono font-semibold ${
                        f.fare_social_2_bs - f.fare_technical_bs >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {f.fare_social_2_bs - f.fare_technical_bs >= 0 ? '+' : ''}
                        {fmt(f.fare_social_2_bs - f.fare_technical_bs, 4)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="p-3">PROMEDIO PONDERADO</td>
                    <td className="p-3 text-right">100.0%</td>
                    <td className="p-3 text-right">{fmt(demandDay, 0)}</td>
                    <td className="p-3 text-right">Bs. {fmt(currentWeighted, 4)}</td>
                    <td className="p-3 text-right">Bs. {fmt(technicalWeighted, 4)}</td>
                    <td className="p-3 text-right">Bs. {fmt(social1Weighted, 4)}</td>
                    <td className="p-3 text-right bg-emerald-100 text-emerald-950 font-black">
                      Bs. {fmt(social2Weighted, 4)}
                    </td>
                    <td className="p-3 text-right text-emerald-700 font-black">
                      +{fmt(social2Weighted - technicalWeighted, 4)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: 32 RUTAS */}
        {activeTab === 'rutas' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rentabilidad de las 32 Rutas Urbanas</h3>
                <p className="text-[11px] text-slate-500">
                  Conciliación de red (Factor: 1,0050) bajo el escenario activo <strong>{selectedScenario}</strong>
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                {deficitRoutesCount} rutas deficitarias / {calculatedRoutes.length} totales
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 shadow-xs z-10">
                  <tr className="border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Sindicato</th>
                    <th className="p-2.5">Línea de Transporte</th>
                    <th className="p-2.5 text-right">Ciclo (km)</th>
                    <th className="p-2.5 text-right">Flota</th>
                    <th className="p-2.5 text-right">km / Mes</th>
                    <th className="p-2.5 text-right">Pax / Mes</th>
                    <th className="p-2.5 text-right">Recaudación</th>
                    <th className="p-2.5 text-right">Costo Reg.</th>
                    <th className="p-2.5 text-right">Utilidad Excedente</th>
                    <th className="p-2.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculatedRoutes.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="p-2.5 text-slate-400 font-mono">{r.id}</td>
                      <td className="p-2.5 font-semibold text-slate-700">{r.union}</td>
                      <td className="p-2.5 font-bold text-slate-900">{r.line}</td>
                      <td className="p-2.5 text-right font-mono">{fmt(r.distance, 1)}</td>
                      <td className="p-2.5 text-right font-mono">{fmt(r.fleet, 1)}</td>
                      <td className="p-2.5 text-right font-mono">{fmt(r.kmMes, 0)}</td>
                      <td className="p-2.5 text-right font-mono">{fmt(r.paxMes, 0)}</td>
                      <td className="p-2.5 text-right font-mono">Bs. {fmt(r.routeRev, 0)}</td>
                      <td className="p-2.5 text-right font-mono">Bs. {fmt(r.routeReg, 0)}</td>
                      <td className={`p-2.5 text-right font-mono font-bold ${
                        r.routeProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        Bs. {fmt(r.routeProfit, 0)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          r.isDeficit 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.isDeficit ? 'DÉFICIT' : 'CUBRE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BITÁCORA DE AUDITORÍA */}
        {activeTab === 'auditoria' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bitácora Inmutable de Auditoría (Audit Logs)</h3>
                <p className="text-[11px] text-slate-500">
                  Trazabilidad jurídica: cada ajuste exige usuario, rol, fecha, valores y justificación obligatoria
                </p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-bold">
                Append-Only (No Modificable)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-2.5">Fecha y Hora</th>
                    <th className="p-2.5">Usuario / Rol</th>
                    <th className="p-2.5">Organización</th>
                    <th className="p-2.5">Acción</th>
                    <th className="p-2.5">Parámetro</th>
                    <th className="p-2.5">Justificación Registrada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="p-2.5 text-slate-500 font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('es-BO')}
                      </td>
                      <td className="p-2.5 font-medium text-slate-900 whitespace-nowrap">
                        {log.user_email}
                        <span className="block text-[10px] text-blue-600 font-mono">{log.user_role}</span>
                      </td>
                      <td className="p-2.5 text-slate-600 whitespace-nowrap">
                        {log.user_organization}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-800 whitespace-nowrap">
                        {log.field_name || log.entity_name}
                      </td>
                      <td className="p-2.5 text-slate-700 italic">
                        "{log.justification}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Modal de Edición de Parámetros */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-950 text-white px-5 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Modificar Parámetro Oficial</h3>
                <p className="text-[11px] text-slate-400">El cambio quedará registrado en la bitácora de auditoría</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveParameter} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Parámetro Seleccionado:
                </label>
                <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-900">
                  {editField}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nuevo Valor Propuesto:
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={editValue}
                  onChange={e => setEditValue(Number(e.target.value))}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Justificación Técnica Obligatoria:
                </label>
                <textarea 
                  rows={3}
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Fundamente el motivo o acuerdo de mesa para este ajuste..."
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Mínimo 10 caracteres requeridos para trazabilidad municipal.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-all shadow-xs"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar & Registrar Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Dossier Layout (visible solo al imprimir / exportar PDF) */}
      <div className="hidden print:block p-8 font-sans">
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900">GOBIERNO AUTÓNOMO MUNICIPAL DE SUCRE</h1>
            <p className="text-xs text-slate-600 font-semibold">DIRECCIÓN DE TRÁFICO, TRANSPORTE Y VIALIDAD</p>
            <p className="text-sm font-bold text-blue-900 mt-2">
              DOSSIER TÉCNICO OFICIAL DE CONCERTACIÓN TARIFARIA — ESCENARIO {selectedScenario.toUpperCase()}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <strong>CONSULTORÍA: ECOTRAFFIC</strong><br/>
            Fecha: {new Date().toLocaleDateString('es-BO')}<br/>
            Sucre, Bolivia
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-300 rounded">
            <strong>DICTAMEN TÉCNICO DE EQUILIBRIO:</strong> La tarifa propuesta para adulto de <strong>Bs. {fmt(activeAdultFare, 2)}</strong> representa una tarifa ponderada de red de <strong>Bs. {fmt(activeWeightedFare, 4)}</strong>, cubriendo el 100% del costo regulatorio de <strong>Bs. {fmt(regulatoryCost, 2)}/mes</strong> (OPEX Bs. {fmt(opex, 2)} + Reposición Bs. {fmt(depreciation, 2)} + Retorno WACC 11% Bs. {fmt(allowedReturn, 2)}).
          </div>

          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-400 p-2 text-left">Categoría</th>
                <th className="border border-slate-400 p-2 text-right">% Demanda</th>
                <th className="border border-slate-400 p-2 text-right">Tarifa Vigente (Bs)</th>
                <th className="border border-slate-400 p-2 text-right">Tarifa Técnica Eq. (Bs)</th>
                <th className="border border-slate-400 p-2 text-right">Tarifa Social Acordada (Bs)</th>
              </tr>
            </thead>
            <tbody>
              {fares.map(f => (
                <tr key={f.name}>
                  <td className="border border-slate-400 p-2 font-semibold">{f.name}</td>
                  <td className="border border-slate-400 p-2 text-right">{fmt(f.demand_share * 100, 1)}%</td>
                  <td className="border border-slate-400 p-2 text-right">Bs. {fmt(f.fare_current_bs, 2)}</td>
                  <td className="border border-slate-400 p-2 text-right">Bs. {fmt(f.fare_technical_bs, 4)}</td>
                  <td className="border border-slate-400 p-2 text-right font-bold">Bs. {fmt(f.fare_social_2_bs, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs">
            <div className="border-t border-slate-800 pt-2">
              <strong>POR EL EJECUTIVO MUNICIPAL</strong><br/>
              Gobierno Autónomo Municipal de Sucre
            </div>
            <div className="border-t border-slate-800 pt-2">
              <strong>POR LA FEDERACIÓN DE CHOFERES</strong><br/>
              Sindicatos San Cristóbal y Sucre
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
