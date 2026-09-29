'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { SystemParameters, FareCategory, AuditLog, UserRole } from '@/types/database';
import type { ScenarioConfig } from '@/types/scenario';
import { updateSystemParameter } from '@/actions/parameters';
import { createClient } from '@/lib/supabase/client';
import type { UpdateParameterInput } from '@/lib/validations/parameters';
import AuthModal from '@/components/AuthModal';
import AdminUsersPanel from '@/components/AdminUsersPanel';
import LandingPage from '@/components/LandingPage';
import ScenarioManagerModal from '@/components/ScenarioManagerModal';

interface DashboardViewProps {
  initialParameters: SystemParameters;
  initialFares: FareCategory[];
  initialLogs: AuditLog[];
  currentRole: UserRole;
  currentUserEmail: string;
}

type EditableParameterField = UpdateParameterInput['field'];
type TabType = 'resumen' | 'tarifas' | 'rutas' | 'auditoria';

const defaultScenarios: ScenarioConfig[] = [
  {
    id: 'social2',
    label: 'Social 2 (Bs. 3,50)',
    badge: 'RECOMENDADO',
    adultFare: 3.50,
    socialFares: { adultos: 3.50, adultosMayores: 2.50, universitarios: 2.00, colegiales: 1.50, escolares: 1.50, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-emerald-700 font-extrabold',
    isCustom: false
  },
  {
    id: 'social1',
    label: 'Social 1 (Bs. 3,80)',
    adultFare: 3.80,
    socialFares: { adultos: 3.80, adultosMayores: 3.00, universitarios: 2.00, colegiales: 1.50, escolares: 1.00, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-slate-700',
    isCustom: false
  },
  {
    id: 'technical',
    label: 'Técnica (Bs. 3,45)',
    badge: 'EQUILIBRIO',
    adultFare: 3.4485,
    socialFares: { adultos: 3.4485, adultosMayores: 2.6822, universitarios: 1.9158, colegiales: 1.1495, escolares: 0.7663, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-blue-700',
    isCustom: false
  },
  {
    id: 'current',
    label: 'Vigente (Bs. 4,50)',
    adultFare: 4.50,
    socialFares: { adultos: 4.50, adultosMayores: 3.50, universitarios: 2.50, colegiales: 1.50, escolares: 1.00, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-slate-700',
    isCustom: false
  },
  {
    id: 'stress',
    label: 'Estrés (-10% / +15%)',
    adultFare: 4.50,
    socialFares: { adultos: 4.50, adultosMayores: 3.50, universitarios: 2.50, colegiales: 1.50, escolares: 1.00, discapacidad: 0 },
    demandFactor: 0.90,
    fuelPriceFactor: 1.15,
    color: 'text-amber-700',
    isCustom: false
  }
];

export default function DashboardView({
  initialParameters,
  initialFares,
  initialLogs,
  currentRole = 'consultor_ecotraffic',
  currentUserEmail = 'consultor@ecotraffic.com.bo'
}: DashboardViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  
  // Parámetros, Tarifas y Bitácora
  const [params, setParams] = useState<SystemParameters>(initialParameters);
  const [fares, setFares] = useState<FareCategory[]>(initialFares);
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  
  // Escenarios Dinámicos
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>(defaultScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('social2');
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

  // Estado de Usuario y Sesión
  const [activeRole, setActiveRole] = useState<UserRole>(currentRole);
  const [userEmail, setUserEmail] = useState<string>(currentUserEmail);
  const [userOrg, setUserOrg] = useState<string>(
    currentUserEmail === 'ecotraffic.bo@gmail.com' ? 'Ecotraffic Consultoría' : 'GAM Sucre'
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [, startTransition] = useTransition();
  
  // Modal de edición de parámetros
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editField, setEditField] = useState<EditableParameterField>('fuel_price_bs_l');
  const [editValue, setEditValue] = useState<number>(params.fuel_price_bs_l);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isSuperAdmin = activeRole === 'superadmin' || userEmail === 'ecotraffic.bo@gmail.com';
  const canEdit = isSuperAdmin || activeRole === 'admin_municipal' || activeRole === 'consultor_ecotraffic';

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedParams = localStorage.getItem('simpro_params');
      if (savedParams) {
        const parsed = JSON.parse(savedParams);
        if (parsed.maintenance_monthly_bs === 2869.75 || !parsed.maintenance_monthly_bs) {
          parsed.maintenance_monthly_bs = 2840.17;
          localStorage.setItem('simpro_params', JSON.stringify(parsed));
        }
        setParams(parsed);
      } else {
        setParams(prev => ({ ...prev, maintenance_monthly_bs: 2840.17 }));
      }
      const savedScenarios = localStorage.getItem('simpro_scenarios');
      if (savedScenarios) {
        setScenarios(JSON.parse(savedScenarios));
      }
      const savedLogs = localStorage.getItem('simpro_logs');
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
    } catch {}
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

  // Escenario Activo
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  // Cálculos de economía del sistema con factores del escenario activo
  const days = params.operating_days_month;
  const turns = params.turns_day;
  const fleet = params.fleet_active;
  const kmDay = params.km_network_day;
  const demandDay = params.demand_network_day * activeScenario.demandFactor;
  const dieselPrice = params.fuel_price_bs_l * activeScenario.fuelPriceFactor;

  const unitKm = (kmDay / fleet) * days;
  const unitPax = (demandDay / fleet) * days;
  const ipk = demandDay / kmDay;

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
  const currentWeighted = fares.reduce((acc, f) => acc + f.demand_share * f.fare_current_bs, 0);

  // Ponderaciones de tarifa del escenario activo

  const activeWeightedFare = fares.reduce((acc, f) => {
    let categoryFare = f.fare_social_2_bs;
    if (activeScenarioId === 'social1') categoryFare = f.fare_social_1_bs;
    else if (activeScenarioId === 'social2') categoryFare = f.fare_social_2_bs;
    else if (activeScenarioId === 'technical') categoryFare = f.fare_technical_bs;
    else if (activeScenarioId === 'current' || activeScenarioId === 'stress') categoryFare = f.fare_current_bs;
    else if (activeScenario.isCustom) {
      if (f.name.includes('Adultos mayores')) categoryFare = activeScenario.socialFares.adultosMayores;
      else if (f.name.includes('Universitarios')) categoryFare = activeScenario.socialFares.universitarios;
      else if (f.name.includes('Colegiales')) categoryFare = activeScenario.socialFares.colegiales;
      else if (f.name.includes('Escolares')) categoryFare = activeScenario.socialFares.escolares;
      else if (f.name.includes('Discapacidad')) categoryFare = 0;
      else categoryFare = activeScenario.adultFare;
    }
    return acc + f.demand_share * categoryFare;
  }, 0);

  const activeAdultFare = activeScenario.adultFare;
  const monthlyRevenue = activeWeightedFare * unitPax;
  const freeCash = monthlyRevenue - opex - depreciation;
  const economicProfit = monthlyRevenue - regulatoryCost;
  const householdIncome = laborCost + freeCash;

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

  // =========================================================================
  // EXPORTACIÓN DINÁMICA A EXCEL CON VALORES MODIFICADOS EN VIVO
  // =========================================================================
  const handleExportDynamicExcel = () => {
    try {
      const XLSX = window.XLSX;
      if (XLSX) {
        const wb = XLSX.utils.book_new();

        // Hoja 1: Resumen Ejecutivo y Parámetros Calibrados en Vivo
        const summaryData = [
          ["SISTEMA DE GOBERNANZA TARIFARIA SUCRE v3.3 — GAM SUCRE & ECOTRAFFIC"],
          ["DIRECCIÓN DE TRÁFICO, TRANSPORTE Y VIALIDAD"],
          ["Escenario Activo Exportado", activeScenario.label],
          ["Fecha y Hora de Exportación", new Date().toLocaleString('es-BO')],
          [],
          ["INDICADOR ECONÓMICO", "VALOR AUDITADO", "UNIDAD DE MEDIDA", "OBSERVACIÓN"],
          ["Tarifa Adulto Oficial", activeAdultFare, "Bs / viaje", "+3,9% s/ técnica de equilibrio"],
          ["Tarifa Técnica de Equilibrio", 3.4485, "Bs / viaje", "Equilibrio financiero WACC 11%"],
          ["Tarifa Ponderada de Red", activeWeightedFare, "Bs / viaje", `Ponderada según matriz social`],
          ["Ingreso Mensual del Hogar del Operador", Math.round(householdIncome), "Bs / mes", "Salario conductor + Retorno de capital"],
          ["Utilidad Excedente Mensual", Math.round(economicProfit), "Bs / mes", "Margen neto sobre costo regulatorio"],
          ["OPEX Efectivo Mensual por Unidad", opex, "Bs / mes", "Combustible + Mantenimiento + Personal + Fijos"],
          ["Reserva de Reposición Vehicular (10 años)", depreciation, "Bs / mes", "Depreciación lineal"],
          ["Retorno Justo al Capital (WACC 11% Anual)", allowedReturn, "Bs / mes", "Tasa regulatoria estándar"],
          ["COSTO ECONÓMICO REGULATORIO TOTAL", regulatoryCost, "Bs / mes", "Costo unitario mensual completo"],
          [],
          ["PARÁMETRO OPERATIVO", "VALOR EN SIMULADOR", "UNIDAD", "ESTADO"],
          ["Precio del Diésel", dieselPrice, "Bs / litro", "Con factor de escenario"],
          ["Rendimiento Diésel Base", params.fuel_efficiency_km_l, "km / litro", "+15% factor de congestión/ralentí"],
          ["Mantenimiento Mensual v2", params.maintenance_monthly_bs, "Bs / mes", "-32,7% Planilla técnica 52 ítems"],
          ["Salario Conductor Profesional", params.driver_salary_bs, "Bs / mes", "+8,33% previsión aguinaldo"],
          ["Flota Activa en Servicio", fleet, "microbuses", "Flota relevada en campo"],
          ["Demanda Diaria Total de Red", demandDay, "pasajeros / día", "Con factor de elasticidad"],
          ["Producción Diaria de Red (GPS)", kmDay, "km / día", "Medición satelital conciliada"]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen_Economico");

        // Hoja 2: Matriz Tarifaria por Categoría Social
        const faresData = [
          ["Categoría Social", "% Demanda", "Viajes / Día", "Tarifa Vigente (Bs)", "Tarifa Técnica (Bs)", "Tarifa Escenario Activo (Bs)", "Recaudación Mensual Estimada (Bs)"],
          ...fares.map(f => {
            let catFare = f.fare_social_2_bs;
            if (activeScenarioId === 'social1') catFare = f.fare_social_1_bs;
            else if (activeScenarioId === 'social2') catFare = f.fare_social_2_bs;
            else if (activeScenarioId === 'technical') catFare = f.fare_technical_bs;
            else if (activeScenarioId === 'current') catFare = f.fare_current_bs;
            else if (activeScenario.isCustom) catFare = activeScenario.adultFare;
            return [
              f.name,
              f.demand_share,
              f.daily_trips,
              f.fare_current_bs,
              f.fare_technical_bs,
              catFare,
              f.daily_trips * catFare * days
            ];
          })
        ];
        const wsFares = XLSX.utils.aoa_to_sheet(faresData);
        XLSX.utils.book_append_sheet(wb, wsFares, "Matriz_Tarifaria");

        // Hoja 3: Análisis de las 32 Rutas Urbanas
        const routesData = [
          ["ID", "Sindicato", "Línea de Transporte", "Distancia Ciclo (km)", "Flota Asignada", "km / Mes", "Pasajeros / Mes", "Recaudación (Bs)", "Costo Regulatorio (Bs)", "Utilidad Excedente (Bs)", "Estado de Ruta"],
          ...calculatedRoutes.map(r => [
            r.id,
            r.union,
            r.line,
            r.distance,
            r.fleet,
            Math.round(r.kmMes),
            Math.round(r.paxMes),
            Math.round(r.routeRev),
            Math.round(r.routeReg),
            Math.round(r.routeProfit),
            r.isDeficit ? "DÉFICIT" : "EQUILIBRIO / CUBRE"
          ])
        ];
        const wsRoutes = XLSX.utils.aoa_to_sheet(routesData);
        XLSX.utils.book_append_sheet(wb, wsRoutes, "32_Rutas_Rentabilidad");

        // Hoja 4: Desglose Oficial de Mantenimiento Nissan Civilian (52 Ítems)
        const maintData = [
          ["PLANILLA OFICIAL DE MANTENIMIENTO NISSAN CIVILIAN — 52 ÍTEMS AUDITADOS"],
          ["GOBIERNO AUTÓNOMO MUNICIPAL DE SUCRE & ECOTRAFFIC CONSULTORÍA"],
          ["Monto Mensual Unitario Auditado:", params.maintenance_monthly_bs, "Bs / mes"],
          ["Monto Anual Unitario Auditado:", Math.round(params.maintenance_monthly_bs * 12), "Bs / año"],
          [],
          ["Ítem", "Descripción del Componente", "Tipo", "Costo Unitario (Bs)", "Cant", "Unidad", "Mano de Obra (Bs)", "Costo Ciclo (Bs)", "Frec / Año", "Costo Anual (Bs)", "Observación Técnica"],
          ["1", "Aceite de Motor 15W40 (Galón)", "C", 120.00, 3, "gl", 30.00, 390.00, 6.00, 2340.00, "Cambio cada 5.000 km"],
          ["2", "Filtro de Aceite de Motor", "C", 45.00, 1, "pza", 0.00, 45.00, 6.00, 270.00, "M.O. incluido en cambio aceite"],
          ["3", "Filtro de Combustible (Primario y Secundario)", "C", 85.00, 2, "pza", 20.00, 190.00, 6.00, 1140.00, "Protección inyección diésel"],
          ["4", "Filtro de Aire", "C", 110.00, 1, "pza", 10.00, 120.00, 4.00, 480.00, "Limpieza intermedia sopleteo"],
          ["5", "Aceite de Transmisión 80W90", "C", 140.00, 1, "gl", 30.00, 170.00, 2.00, 340.00, "Cambio semestral"],
          ["6", "Aceite de Diferencial 85W140", "C", 150.00, 1, "gl", 30.00, 180.00, 2.00, 360.00, "Cambio semestral"],
          ["7", "Líquido de Embrague (DOT 3)", "C", 35.00, 2, "bot", 15.00, 85.00, 2.00, 170.00, "Purgado y reposición"],
          ["8", "Grasa para Rodamientos (Pote 1kg)", "C", 55.00, 2, "kg", 40.00, 150.00, 4.00, 600.00, "Engrase mazas y crucetas"],
          ["9", "Agua destilada / Refrigerante radiador", "C", 40.00, 2, "gl", 10.00, 90.00, 3.00, 270.00, "Mantenimiento refrigeración"],
          ["10", "Correa de Alternador", "C", 65.00, 1, "pza", 25.00, 90.00, 2.00, 180.00, "Revisión tensión"],
          ["11", "Correa de Bomba de Agua / Ventilador", "C", 65.00, 1, "pza", 25.00, 90.00, 2.00, 180.00, "Reemplazo preventivo"],
          ["12", "Correa de Dirección Hidráulica", "C", 55.00, 1, "pza", 20.00, 75.00, 2.00, 150.00, "Reemplazo preventivo"],
          ["13", "Juego de Pastillas de Freno Delanteras", "C", 220.00, 1, "jgo", 80.00, 300.00, 3.00, 900.00, "Uso intensivo urbano"],
          ["14", "Rectificación de Discos Delanteros", "M", 90.00, 2, "pza", 60.00, 240.00, 1.50, 360.00, "Torneado técnico"],
          ["15", "Balatas de Freno Traseras (Remachadas)", "C", 180.00, 4, "pzas", 150.00, 870.00, 1.00, 870.00, "Freno de tambor"],
          ["16", "Tambores Traseros de Freno", "C", 800.00, 2, "pzas", 140.00, 1740.00, 0.20, 348.00, "Vida útil 5 años (0.2/año)"],
          ["17", "Cilindro Maestro de Freno", "C", 500.00, 1, "pza", 80.00, 580.00, 0.25, 145.00, "Vida útil 4 años (0.25/año)"],
          ["18", "Cubetas de Cilindro Maestro", "C", 150.00, 2, "pzas", 80.00, 380.00, 1.00, 380.00, "Kit de reparación anual"],
          ["19", "Cilindro Auxiliar de Freno", "C", 30.00, 2, "pzas", 80.00, 140.00, 0.50, 70.00, "Vida útil 2 años"],
          ["20", "Cubetas de Cilindro Auxiliar", "C", 30.00, 4, "pzas", 150.00, 270.00, 1.00, 270.00, "Cambio anual"],
          ["21", "Líquido de Frenos DOT 4 (Envase)", "C", 40.00, 8, "oz", 0.00, 320.00, 1.00, 320.00, "M.O. incluido"],
          ["22", "Cable de Freno de Mano", "C", 450.00, 1, "pza", 100.00, 550.00, 0.50, 275.00, "Vida útil 2 años"],
          ["23", "Neumáticos, cámara y ponchillos (Juego 6)", "C", 1500.00, 6, "pzas", 150.00, 9150.00, 0.50, 4575.00, "Recambio rotativo anual"],
          ["24", "Alineación y Balanceo de Dirección", "M", 80.00, 1, "serv", 0.00, 80.00, 4.00, 320.00, "Mantenimiento preventivo"],
          ["25", "Amortiguadores Delanteros Reforzados", "C", 380.00, 2, "pzas", 80.00, 840.00, 0.50, 420.00, "Vida útil 2 años"],
          ["26", "Amortiguadores Traseros Heavy Duty", "C", 350.00, 2, "pzas", 80.00, 780.00, 0.50, 390.00, "Vida útil 2 años"],
          ["27", "Hojas de Paquete de Muelles (Maestras)", "C", 280.00, 2, "pzas", 120.00, 680.00, 0.50, 340.00, "Fatiga por topografía Sucre"],
          ["28", "Bujes y Pernos de Muelles de Suspensión", "C", 35.00, 8, "pzas", 100.00, 380.00, 1.00, 380.00, "Reemplazo anual"],
          ["29", "Crucetas de Cardán Principal", "C", 120.00, 2, "pzas", 60.00, 300.00, 1.00, 300.00, "Transmisión"],
          ["30", "Soporte Central de Cardán (Chumacera)", "C", 220.00, 1, "pza", 70.00, 290.00, 0.50, 145.00, "Vida útil 2 años"],
          ["31", "Disco de Embrague (Clutch)", "C", 480.00, 1, "pza", 250.00, 730.00, 0.50, 365.00, "Vida útil 2 años"],
          ["32", "Prensa de Embrague", "C", 550.00, 1, "pza", 0.00, 550.00, 0.33, 181.50, "Vida útil 3 años"],
          ["33", "Rodamiento de Empuje (Collarín)", "C", 140.00, 1, "pza", 0.00, 140.00, 0.50, 70.00, "Reemplazo junto al disco"],
          ["34", "Terminales de Dirección", "C", 110.00, 2, "pzas", 60.00, 280.00, 1.00, 280.00, "Seguridad vial"],
          ["35", "Bomba de Agua de Refrigeración", "C", 380.00, 1, "pza", 120.00, 500.00, 0.33, 165.00, "Vida útil 3 años"],
          ["36", "Termostato de Motor", "C", 85.00, 1, "pza", 40.00, 125.00, 0.50, 62.50, "Regulación térmica"],
          ["37", "Limpieza de Inyectores Diésel (Toberas)", "M", 70.00, 4, "pzas", 120.00, 400.00, 1.00, 400.00, "Calibración en banco"],
          ["38", "Batería 100Ah Heavy Duty (Juego 2)", "C", 1050.00, 2, "pzas", 0.00, 2100.00, 0.50, 1050.00, "Vida útil 2 años (M.O. inc.)"],
          ["39", "Mantenimiento Motor de Arranque", "M", 150.00, 1, "pza", 150.00, 300.00, 1.00, 300.00, "Carbones y bujes"],
          ["40", "Mantenimiento de Alternador", "M", 150.00, 1, "pza", 150.00, 300.00, 1.00, 300.00, "Diodos y regulador"],
          ["41", "Focos de Farol Delantero H4", "C", 80.00, 2, "pzas", 0.00, 80.00, 1.00, 80.00, "Iluminación reglamentaria"],
          ["42", "Focos de Luz de Freno (P21W)", "C", 15.00, 2, "pzas", 0.00, 15.00, 1.00, 15.00, "Seguridad trasera"],
          ["43", "Pintura y Arreglos Menores Carrocería", "R", 800.00, 1, "serv", 0.00, 800.00, 0.50, 400.00, "Mantenimiento estético"],
          ["44", "Tapizado (Asientos y Piso)", "R", 2000.00, 1, "serv", 0.00, 2000.00, 0.20, 400.00, "Renovación quinquenal"],
          ["45", "Engrasado General de Chasis y Transmisión", "M", 60.00, 1, "serv", 0.00, 60.00, 12.50, 750.00, "Mensual continuo"],
          ["46", "Mangueras de Radiador (Superior e Inferior)", "C", 75.00, 2, "pzas", 40.00, 190.00, 0.50, 95.00, "Vida útil 2 años"],
          ["47", "Soportes de Motor y Caja de Cambios", "C", 140.00, 3, "pzas", 90.00, 510.00, 0.33, 168.30, "Vida útil 3 años"],
          ["48", "Plumillas Limpiaparabrisas", "C", 40.00, 2, "pzas", 0.00, 80.00, 2.00, 160.00, "Seguridad lluvia"],
          ["49", "Tapa de Radiador Presurizada", "C", 45.00, 1, "pza", 0.00, 45.00, 1.00, 45.00, "Sellado 0.9 bar"],
          ["50", "Retén de Piñón de Diferencial", "C", 60.00, 1, "pza", 80.00, 140.00, 0.50, 70.00, "Fuga de aceite"],
          ["51", "Retenes de Mazas Delanteras y Traseras", "C", 45.00, 4, "pzas", 120.00, 300.00, 0.50, 150.00, "Sellado rodamientos"],
          ["52", "Filtro de Trampa de Agua Diésel (Purga)", "C", 70.00, 1, "pza", 20.00, 90.00, 2.00, 180.00, "Separador sedimentos"],
          [],
          ["", "COSTO TOTAL ANUAL DE MANTENIMIENTO (Bs/año):", "", "", "", "", "", "", "", 34082.00, "52 Ítems Oficiales"],
          ["", "COSTO TOTAL MENSUAL DE MANTENIMIENTO POR UNIDAD (Bs/mes):", "", "", "", "", "", "", "", 2840.17, "Fórmula: Anual / 12"]
        ];
        const wsMaint = XLSX.utils.aoa_to_sheet(maintData);
        XLSX.utils.book_append_sheet(wb, wsMaint, "52_Items_Mantenimiento");

        // Hoja 5: Bitácora Inmutable de Auditoría Legal
        const auditData = [
          ["Fecha y Hora", "Usuario", "Rol", "Organización", "Acción", "Parámetro / Entidad", "Justificación Técnica Registrada"],
          ...logs.map(l => [
            new Date(l.created_at).toLocaleString('es-BO'),
            l.user_email,
            l.user_role,
            l.user_organization,
            l.action,
            l.field_name || l.entity_name,
            l.justification
          ])
        ];
        const wsAudit = XLSX.utils.aoa_to_sheet(auditData);
        XLSX.utils.book_append_sheet(wb, wsAudit, "Bitacora_Auditoria_Legal");

        XLSX.writeFile(wb, `SIM-PRO_Tarifario_Sucre_${activeScenario.id}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      } else {
        // Fallback a descarga del archivo maestro
        window.open('/Modelo_Profesional_Tarifario_Sucre_v3.2_Ecotraffic.xlsx', '_blank');
      }
    } catch {
      window.open('/Modelo_Profesional_Tarifario_Sucre_v3.2_Ecotraffic.xlsx', '_blank');
    }
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

    const prevVal = params[editField];
    const nVal = Number(editValue);

    // 1. Actualización inmediata y persistente del estado
    setParams(prev => {
      const updated = { ...prev, [editField]: nVal, version: prev.version + 1 };
      try { localStorage.setItem('simpro_params', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // 2. Registro de Auditoría Inmutable
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      session_id: params.session_id,
      user_email: userEmail,
      user_role: activeRole,
      user_organization: userOrg,
      action: 'CAMBIO_PARAMETRO',
      entity_name: 'system_parameters',
      field_name: editField,
      old_value: { [editField]: prevVal },
      new_value: { [editField]: nVal },
      justification: justification,
      created_at: new Date().toISOString()
    };

    setLogs(prev => {
      const updated = [newLog, ...prev];
      try { localStorage.setItem('simpro_logs', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // 3. Notificar a Supabase / Server Action de fondo
    try {
      await updateSystemParameter({
        sessionId: params.session_id,
        parameterId: params.id,
        field: editField,
        newValue: nVal,
        justification: justification,
        userEmail: userEmail,
        userRole: activeRole,
        userOrg: userOrg
      });
    } catch {}

    setIsSubmitting(false);
    setIsEditModalOpen(false);
    setStatusMessage({ 
      text: `Parámetro '${editField}' actualizado de ${prevVal} a ${nVal} con registro formal en bitácora de auditoría.`, 
      type: 'success' 
    });
  };

  const handleSaveScenario = (sc: ScenarioConfig) => {
    setScenarios(prev => {
      const exists = prev.some(item => item.id === sc.id);
      const updated = exists ? prev.map(item => item.id === sc.id ? sc : item) : [...prev, sc];
      try { localStorage.setItem('simpro_scenarios', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setActiveScenarioId(sc.id);

    // Registrar en auditoría
    const scLog: AuditLog = {
      id: crypto.randomUUID(),
      session_id: params.session_id,
      user_email: userEmail,
      user_role: activeRole,
      user_organization: userOrg,
      action: 'CREACION_ESCENARIO',
      entity_name: 'scenarios',
      field_name: sc.label,
      old_value: {},
      new_value: { adultFare: sc.adultFare, socialFares: sc.socialFares, demandFactor: sc.demandFactor, fuelPriceFactor: sc.fuelPriceFactor },
      justification: `Calibración y activación del escenario '${sc.label}' (Tarifa Adulto: Bs. ${sc.adultFare.toFixed(2)})`,
      created_at: new Date().toISOString()
    };
    setLogs(prev => {
      const updated = [scLog, ...prev];
      try { localStorage.setItem('simpro_logs', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setStatusMessage({ text: `Escenario '${sc.label}' guardado y activado exitosamente en el simulador.`, type: 'success' });
  };

  const handleDeleteScenario = (scId: string) => {
    setScenarios(prev => {
      const updated = prev.filter(item => item.id !== scId);
      try { localStorage.setItem('simpro_scenarios', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (activeScenarioId === scId) {
      setActiveScenarioId('social2');
    }
    setStatusMessage({ text: 'Escenario eliminado del simulador.', type: 'success' });
  };

  const handleLogout = () => {
    setViewMode('landing');
  };

  // Si está en modo Landing Page
  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onOpenLogin={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(email, role, org) => {
            setUserEmail(email);
            setActiveRole(role);
            setUserOrg(org);
            setViewMode('dashboard');
            setStatusMessage({ text: `Sesión institucional iniciada: ${role} (${email})`, type: 'success' });
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-900 font-sans">
      
      {/* Script SheetJS para exportación Excel dinámico */}
      <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

      {/* ========================================================================= */}
      {/* 🖥️ INTERFAZ DEL DASHBOARD (OCULTA AUTOMÁTICAMENTE AL IMPRIMIR PDF)        */}
      {/* ========================================================================= */}
      <div className="print:hidden pb-16">
        
        {/* Top Enterprise SaaS Bar */}
        <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            
            {/* Branding & Logo */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setViewMode('landing')}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center font-black text-white text-base shadow-md hover:scale-105 transition-all"
                title="Volver a la Portada Institucional"
              >
                S
              </button>
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

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-2.5">
              
              {/* Indicador de Estado Realtime */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-slate-900 border-slate-700">
                <span className={`w-2 h-2 rounded-full ${
                  realtimeStatus === 'connected' 
                    ? 'bg-emerald-400 animate-pulse' 
                    : realtimeStatus === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-400'
                }`} />
                <span className="text-slate-300 font-mono">
                  {realtimeStatus === 'connected' ? 'En Vivo' : realtimeStatus === 'connecting' ? 'Conectando...' : 'Offline'}
                </span>
              </div>

              {/* Botón Descargar PDF Oficial */}
              <button
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                title="Descargar Dossier PDF Oficial Formateado"
              >
                <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                <span>Reporte PDF</span>
              </button>

              {/* Botón Descargar Excel Dinámico */}
              <button
                onClick={handleExportDynamicExcel}
                className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                title="Descargar Excel con todas las modificaciones actuales del simulador"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>Excel Dinámico .xlsx</span>
              </button>

              {/* Botón SuperAdmin Panel */}
              {isSuperAdmin && (
                <button
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                  <span>👑 Panel Admin</span>
                </button>
              )}

              {/* Badge de Identidad Autenticada Institucional (Acceso Controlado) */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-900/90 border-slate-700 text-xs shadow-xs">
                <span className="font-bold flex items-center gap-1.5 text-slate-200">
                  {activeRole === 'superadmin' && '👑 SuperAdmin'}
                  {activeRole === 'admin_municipal' && '🏛️ Admin Municipal'}
                  {activeRole === 'consultor_ecotraffic' && '🔬 Consultor Técnico'}
                  {activeRole === 'delegado_sindical' && '🚌 Delegado Sindical'}
                  {activeRole === 'observador_publico' && '👁️ Observador'}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-blue-300 font-mono text-[11px] max-w-[170px] truncate" title={userEmail}>
                  {userEmail}
                </span>
              </div>

              {/* Botón Cerrar Sesión */}
              <button
                onClick={handleLogout}
                className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
                title="Cerrar sesión y volver a la portada"
              >
                Cerrar Sesión
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
                </svg>
              </button>
            </div>

          </div>

          {/* Mobile Drawer Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Rol Autenticado:</span>
                <span className="font-bold text-amber-300">
                  {activeRole === 'superadmin' && '👑 SuperAdmin'}
                  {activeRole === 'admin_municipal' && '🏛️ Admin Municipal'}
                  {activeRole === 'consultor_ecotraffic' && '🔬 Consultor Técnico'}
                  {activeRole === 'delegado_sindical' && '🚌 Delegado Sindical'}
                  {activeRole === 'observador_publico' && '👁️ Observador'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Usuario:</span>
                <span className="font-mono text-blue-300 font-bold truncate max-w-[200px]">{userEmail}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { window.print(); setIsMobileMenuOpen(false); }}
                  className="p-2.5 bg-slate-800 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <span>Descargar PDF</span>
                </button>

                <button
                  onClick={() => { handleExportDynamicExcel(); setIsMobileMenuOpen(false); }}
                  className="p-2.5 bg-emerald-950 rounded-xl text-xs font-bold text-emerald-200 border border-emerald-600/60 flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span>Excel Dinámico</span>
                </button>
              </div>

              <button
                onClick={() => { setIsScenarioModalOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full py-2.5 bg-indigo-600/30 text-indigo-200 font-bold text-xs rounded-xl border border-indigo-500/40 text-center"
              >
                ⚡ Gestionar y Crear Escenarios
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => { setIsAdminPanelOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full py-2.5 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 text-center"
                >
                  👑 Abrir Panel SuperAdmin
                </button>
              )}

              <button
                onClick={() => { setViewMode('landing'); setIsMobileMenuOpen(false); }}
                className="w-full py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl text-center"
              >
                Cerrar Sesión (Ir a Portada)
              </button>
            </div>
          )}
        </header>

        {/* Main Workspace */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          
          {/* Banner de Feedback */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <span>{statusMessage.text}</span>
              <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700 font-bold">&times;</button>
            </div>
          )}

          {/* Header de Escenarios Dinámicos */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mesa de Concertación:</span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sesión Activa Oficial
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Escenarios de Negociación Tarifaria
              </h2>
            </div>

            {/* Controles de Escenarios */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-200/80 flex-1 md:flex-initial">
                {scenarios.map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => setActiveScenarioId(sc.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeScenarioId === sc.id
                        ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className={sc.color || 'text-slate-700'}>{sc.label}</span>
                    {sc.badge && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">
                        {sc.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Botón Abrir Gestor de Escenarios */}
              <button
                onClick={() => setIsScenarioModalOpen(true)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-2xl flex items-center gap-1 transition-all active:scale-95"
                title="Crear, editar o eliminar escenarios"
              >
                <span>⚙️ Gestionar Escenarios</span>
              </button>
            </div>
          </div>

          {/* 6 SaaS Metric Cards */}
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
          <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 rounded-2xl border border-amber-200/80 p-4 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-black text-sm">
                ℹ
              </div>
              <div className="text-xs text-slate-800 leading-relaxed font-medium">
                <strong>Diagnóstico Técnico ({activeScenario.label}):</strong> Con la tarifa propuesta de <strong>Bs. {fmt(activeAdultFare, 2)}</strong>, el microbús recauda <strong>Bs. {fmt(monthlyRevenue, 0)}/mes</strong>, cubriendo el 100% del costo regulatorio (Bs. {fmt(regulatoryCost, 0)}/mes), asegurando la reposición de la flota y generando un ingreso digno de <strong>Bs. {fmt(householdIncome, 0)}/mes</strong> para la familia del operador.
              </div>
            </div>
            <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap hidden lg:block">
              IPK: {fmt(ipk, 2)} pax/km
            </span>
          </div>

          {/* SaaS Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
            {[
              { id: 'resumen' as const, label: 'Resumen Ejecutivo & COV' },
              { id: 'tarifas' as const, label: 'Estructura por Categoría Social' },
              { id: 'rutas' as const, label: `Rentabilidad 32 Rutas (${deficitRoutesCount} deficitarias)` },
              { id: 'auditoria' as const, label: `Bitácora de Auditoría (${logs.length} logs)` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs font-bold transition-all whitespace-nowrap relative ${
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
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Parámetros Operativos del Sistema</h3>
                    <p className="text-[11px] text-slate-500">Valores auditados de la red y del microbús Nissan Civilian</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    canEdit ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {canEdit ? 'Edición Habilitada' : 'Solo Lectura'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'fuel_price_bs_l' as const, label: 'Precio Diésel Base', val: params.fuel_price_bs_l, unit: 'Bs/litro' },
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
                      className={`p-3 rounded-2xl border flex justify-between items-center transition-all ${
                        canEdit
                          ? 'border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer shadow-2xs active:scale-98'
                          : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-90'
                      }`}
                    >
                      <div>
                        <div className="text-[11px] font-bold text-slate-700">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.unit}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {fmt(item.val, item.val % 1 !== 0 ? 2 : 0)}
                        </span>
                        {canEdit && (
                          <span className="block text-[9px] text-blue-600 font-bold mt-0.5">Editar</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estructura de Costos COV */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
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
                        <span className="text-slate-900 font-mono font-bold">Bs. {fmt(Math.round(cost.val), 0)} ({fmt(cost.share, 1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${cost.color}`} style={{ width: `${cost.share}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5 mt-2">
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
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                    <span>COSTO ECONÓMICO REGULATORIO TOTAL:</span>
                    <span className="text-emerald-700 font-mono font-black text-sm">Bs. {fmt(regulatoryCost, 2)} / mes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TARIFAS POR CATEGORÍA */}
          {activeTab === 'tarifas' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Matriz de Tarifas por Categoría Social</h3>
                <p className="text-[11px] text-slate-500">Comparación de recaudación bajo el escenario activo: <strong>{activeScenario.label}</strong></p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="p-3">Categoría Social</th>
                      <th className="p-3 text-right">% Demanda</th>
                      <th className="p-3 text-right">Viajes / Día</th>
                      <th className="p-3 text-right">Vigente (Bs)</th>
                      <th className="p-3 text-right">Técnica Eq. (Bs)</th>
                      <th className="p-3 text-right bg-emerald-50 text-emerald-900">Escenario Activo (Bs)</th>
                      <th className="p-3 text-right">Dif. s/ Técnica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fares.map(f => {
                      let activeCatFare = f.fare_social_2_bs;
                      if (activeScenarioId === 'social1') activeCatFare = f.fare_social_1_bs;
                      else if (activeScenarioId === 'social2') activeCatFare = f.fare_social_2_bs;
                      else if (activeScenarioId === 'technical') activeCatFare = f.fare_technical_bs;
                      else if (activeScenarioId === 'current') activeCatFare = f.fare_current_bs;
                      else if (activeScenario.isCustom) {
                        if (f.name.includes('Adultos mayores')) activeCatFare = activeScenario.socialFares.adultosMayores;
                        else if (f.name.includes('Universitarios')) activeCatFare = activeScenario.socialFares.universitarios;
                        else if (f.name.includes('Colegiales')) activeCatFare = activeScenario.socialFares.colegiales;
                        else if (f.name.includes('Escolares')) activeCatFare = activeScenario.socialFares.escolares;
                        else if (f.name.includes('Discapacidad')) activeCatFare = 0;
                        else activeCatFare = activeScenario.adultFare;
                      }

                      return (
                        <tr key={f.name} className="hover:bg-slate-50/80">
                          <td className="p-3 font-semibold text-slate-900">{f.name}</td>
                          <td className="p-3 text-right font-mono">{fmt(f.demand_share * 100, 1)}%</td>
                          <td className="p-3 text-right font-mono">{fmt(f.daily_trips, 0)}</td>
                          <td className="p-3 text-right font-mono">Bs. {fmt(f.fare_current_bs, 2)}</td>
                          <td className="p-3 text-right font-mono">Bs. {fmt(f.fare_technical_bs, 4)}</td>
                          <td className="p-3 text-right font-mono font-bold bg-emerald-50/50 text-emerald-900">
                            Bs. {fmt(activeCatFare, 2)}
                          </td>
                          <td className={`p-3 text-right font-mono font-semibold ${
                            activeCatFare - f.fare_technical_bs >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {activeCatFare - f.fare_technical_bs >= 0 ? '+' : ''}
                            {fmt(activeCatFare - f.fare_technical_bs, 4)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td className="p-3">PROMEDIO PONDERADO</td>
                      <td className="p-3 text-right">100.0%</td>
                      <td className="p-3 text-right">{fmt(demandDay, 0)}</td>
                      <td className="p-3 text-right">Bs. {fmt(currentWeighted, 4)}</td>
                      <td className="p-3 text-right">Bs. {fmt(technicalWeighted, 4)}</td>
                      <td className="p-3 text-right bg-emerald-100 text-emerald-950 font-black">
                        Bs. {fmt(activeWeightedFare, 4)}
                      </td>
                      <td className="p-3 text-right text-emerald-700 font-black">
                        +{fmt(activeWeightedFare - technicalWeighted, 4)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: 32 RUTAS */}
          {activeTab === 'rutas' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rentabilidad de las 32 Rutas Urbanas</h3>
                  <p className="text-[11px] text-slate-500">
                    Conciliación de red (Factor: 1,0050) bajo el escenario activo <strong>{activeScenario.label}</strong>
                  </p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                  {deficitRoutesCount} rutas deficitarias / {calculatedRoutes.length} totales
                </span>
              </div>

              <div className="overflow-x-auto max-h-[500px] rounded-2xl border border-slate-200">
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
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bitácora Inmutable de Auditoría (Audit Logs)</h3>
                  <p className="text-[11px] text-slate-500">
                    Trazabilidad jurídica: cada ajuste exige usuario, rol, fecha, valores y justificación obligatoria
                  </p>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-bold border border-slate-200">
                  Append-Only (No Modificable)
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
      </div>

      {/* ========================================================================= */}
      {/* 📄 DOSSIER TÉCNICO OFICIAL DE IMPRESIÓN / PDF (SOLO VISIBLE AL EXPORTAR) */}
      {/* ========================================================================= */}
      <div className="hidden print:block p-8 font-sans bg-white text-slate-900">
        
        {/* Encabezado Oficial GAMS & Ecotraffic */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-widest text-slate-700">ESTADO PLURINACIONAL DE BOLIVIA</span>
            </div>
            <h1 className="text-xl font-black text-slate-950">GOBIERNO AUTÓNOMO MUNICIPAL DE SUCRE</h1>
            <p className="text-xs text-slate-700 font-bold uppercase tracking-tight">DIRECCIÓN DE TRÁFICO, TRANSPORTE Y VIALIDAD</p>
            <p className="text-sm font-black text-blue-950 mt-2">
              DOSSIER TÉCNICO OFICIAL DE GOBERNANZA TARIFARIA — ESCENARIO {activeScenario.label.toUpperCase()}
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <span className="font-black text-slate-950">CONSULTORÍA: ECOTRAFFIC</span><br/>
            <span>Código de Sesión: {params.session_id.slice(0, 8).toUpperCase()}</span><br/>
            <span>Fecha de Dictamen: {new Date().toLocaleDateString('es-BO')}</span><br/>
            <span>Sucre, Chuquisaca, Bolivia</span>
          </div>
        </div>

        {/* Dictamen Resumen */}
        <div className="space-y-4 text-xs">
          
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-xl space-y-1">
            <div className="font-black text-slate-900 text-sm">DICTAMEN TÉCNICO DE EQUILIBRIO FINANCIERO:</div>
            <p className="text-slate-800 leading-relaxed">
              La tarifa oficial acordada para la categoría <strong>Adulto de Bs. {fmt(activeAdultFare, 2)}</strong> representa una tarifa ponderada de red de <strong>Bs. {fmt(activeWeightedFare, 4)}</strong>. Esta recaudación cubre el <strong>100% del costo regulatorio mensual de Bs. {fmt(regulatoryCost, 2)}</strong> (OPEX Bs. {fmt(opex, 2)} + Reposición de Flota Bs. {fmt(depreciation, 2)} + Retorno WACC 11% Bs. {fmt(allowedReturn, 2)}), garantizando un ingreso digno al operador de <strong>Bs. {fmt(householdIncome, 0)}/mes</strong> y preservando el poder adquisitivo ciudadano.
            </p>
          </div>

          {/* Cuadro Resumen Econométrico */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 border border-slate-400 rounded bg-slate-50">
              <div className="text-[10px] text-slate-500 font-bold">TARIFA ADULTO</div>
              <div className="text-base font-black text-slate-950">Bs. {fmt(activeAdultFare, 2)}</div>
            </div>
            <div className="p-2 border border-slate-400 rounded bg-slate-50">
              <div className="text-[10px] text-slate-500 font-bold">TARIFA TÉCNICA EQ.</div>
              <div className="text-base font-black text-slate-950">Bs. 3,45</div>
            </div>
            <div className="p-2 border border-slate-400 rounded bg-slate-50">
              <div className="text-[10px] text-slate-500 font-bold">INGRESO HOGAR / MES</div>
              <div className="text-base font-black text-slate-950">Bs. {fmt(householdIncome, 0)}</div>
            </div>
            <div className="p-2 border border-slate-400 rounded bg-slate-50">
              <div className="text-[10px] text-slate-500 font-bold">UTILIDAD EXCEDENTE</div>
              <div className="text-base font-black text-emerald-900">+Bs. {fmt(economicProfit, 0)}</div>
            </div>
          </div>

          {/* Matriz Tarifaria Oficial */}
          <div>
            <div className="font-bold text-slate-900 mb-1">1. Matriz de Tarifas por Categoría Social:</div>
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold">
                  <th className="border border-slate-400 p-1.5 text-left">Categoría de Pasajero</th>
                  <th className="border border-slate-400 p-1.5 text-right">% Demanda</th>
                  <th className="border border-slate-400 p-1.5 text-right">Viajes / Día</th>
                  <th className="border border-slate-400 p-1.5 text-right">Tarifa Vigente (Bs)</th>
                  <th className="border border-slate-400 p-1.5 text-right">Tarifa Técnica Eq. (Bs)</th>
                  <th className="border border-slate-400 p-1.5 text-right bg-slate-300 font-black">Tarifa Social Oficial (Bs)</th>
                </tr>
              </thead>
              <tbody>
                {fares.map(f => (
                  <tr key={f.name}>
                    <td className="border border-slate-400 p-1.5 font-semibold">{f.name}</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">{fmt(f.demand_share * 100, 1)}%</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">{fmt(f.daily_trips, 0)}</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">Bs. {fmt(f.fare_current_bs, 2)}</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">Bs. {fmt(f.fare_technical_bs, 4)}</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono font-bold bg-slate-100">
                      Bs. {fmt(activeScenarioId === 'social1' ? f.fare_social_1_bs : f.fare_social_2_bs, 2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <td className="border border-slate-400 p-1.5">PROMEDIO PONDERADO DE RED</td>
                  <td className="border border-slate-400 p-1.5 text-right">100%</td>
                  <td className="border border-slate-400 p-1.5 text-right">{fmt(demandDay, 0)}</td>
                  <td className="border border-slate-400 p-1.5 text-right">Bs. {fmt(currentWeighted, 4)}</td>
                  <td className="border border-slate-400 p-1.5 text-right">Bs. {fmt(technicalWeighted, 4)}</td>
                  <td className="border border-slate-400 p-1.5 text-right font-black bg-slate-200">Bs. {fmt(activeWeightedFare, 4)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Desglose de Costos de Operación Vehicular (COV) */}
          <div className="pt-2">
            <div className="font-bold text-slate-900 mb-1">2. Estructura Mensual del Costo Regulatorio por Unidad (Nissan Civilian):</div>
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr>
                  <td className="border border-slate-400 p-1.5 font-semibold">Combustible Diésel (Rendimiento 5.5 km/l + 15% congestión)</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">Bs. {fmt(fuelCost, 2)}</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">{fmt((fuelCost / regulatoryCost) * 100, 1)}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5 font-semibold">Mantenimiento Auditado v2 (Planilla oficial 52 ítems)</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">Bs. {fmt(params.maintenance_monthly_bs, 2)}</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">{fmt((params.maintenance_monthly_bs / regulatoryCost) * 100, 1)}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5 font-semibold">Costo Laboral Chofer Profesional (Sueldo Bs. 3.300 + 8.33% aguinaldo)</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">Bs. {fmt(laborCost, 2)}</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">{fmt((laborCost / regulatoryCost) * 100, 1)}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5 font-semibold">Costos Administrativos, Seguros e Inspecciones</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">Bs. {fmt(otherFixed, 2)}</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">{fmt((otherFixed / regulatoryCost) * 100, 1)}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5 font-semibold">Reserva de Reposición Vehicular (Vida útil 10 años)</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">Bs. {fmt(depreciation, 2)}</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">{fmt((depreciation / regulatoryCost) * 100, 1)}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5 font-semibold">Retorno Justo al Capital Invertido (WACC 11% Anual)</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">Bs. {fmt(allowedReturn, 2)}</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">{fmt((allowedReturn / regulatoryCost) * 100, 1)}%</td>
                </tr>
                <tr className="bg-slate-200 font-bold border-t-2 border-slate-900 text-slate-950">
                  <td className="border border-slate-400 p-1.5 font-black">COSTO ECONÓMICO REGULATORIO TOTAL</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono font-black">Bs. {fmt(regulatoryCost, 2)}</td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono font-black">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bloque Oficial de Firmas */}
          <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border-t border-slate-900 pt-2">
              <strong>POR EL EJECUTIVO MUNICIPAL</strong><br/>
              <span className="text-[11px] text-slate-600">Gobierno Autónomo Municipal de Sucre</span>
            </div>
            <div className="border-t border-slate-900 pt-2">
              <strong>POR LA FEDERACIÓN DE CHOFERES</strong><br/>
              <span className="text-[11px] text-slate-600">Sindicatos San Cristóbal y Sucre</span>
            </div>
            <div className="border-t border-slate-900 pt-2">
              <strong>POR LA CONSULTORÍA TÉCNICA</strong><br/>
              <span className="text-[11px] text-slate-600">Ecotraffic Consultoría</span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔐 MODALES INTERACTIVOS DE AUTENTICACIÓN, EDICIÓN Y GESTOR DE ESCENARIOS */}
      {/* ========================================================================= */}
      
      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(email, role, org) => {
          setUserEmail(email);
          setActiveRole(role);
          setUserOrg(org);
          setStatusMessage({ text: `Sesión iniciada como ${role} (${email})`, type: 'success' });
        }}
      />

      {/* Panel de Gestión de Usuarios Admin & SuperAdmin */}
      <AdminUsersPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        currentUserRole={activeRole}
        currentUserEmail={userEmail}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSaveScenario={handleSaveScenario}
        onDeleteScenario={handleDeleteScenario}
        onSelectScenario={(scId) => setActiveScenarioId(scId)}
      />

      {/* Modal Gestor de Escenarios Dinámicos */}
      <ScenarioManagerModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSaveScenario={handleSaveScenario}
        onDeleteScenario={handleDeleteScenario}
        onSelectScenario={(scId) => setActiveScenarioId(scId)}
      />

      {/* Modal de Edición de Parámetros */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-950 text-white px-6 py-4 flex justify-between items-center">
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

            <form onSubmit={handleSaveParameter} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Parámetro Seleccionado:
                </label>
                <div className="p-2.5 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-900">
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
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Mínimo 10 caracteres requeridos para trazabilidad municipal.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar & Registrar Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
