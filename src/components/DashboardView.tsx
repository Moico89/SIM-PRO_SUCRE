'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { SystemParameters, FareCategory, AuditLog, UserRole } from '@/types/database';
import type { ScenarioConfig } from '@/types/scenario';
import { updateSystemParameter } from '@/actions/parameters';
import { getSharedScenarios, saveSharedScenario, deleteSharedScenario } from '@/actions/scenarios';
import { OFFICIAL_SCENARIOS } from '@/data/officialScenarios';
import { createClient } from '@/lib/supabase/client';
import { calculateTariffSystem } from '@/lib/engine/calculator';
import { exportDynamicExcelWorkbook } from '@/lib/export/excel-generator';
import type { UpdateParameterInput } from '@/lib/validations/parameters';
import AuthModal from '@/components/AuthModal';
import AdminUsersPanel from '@/components/AdminUsersPanel';
import LandingPage from '@/components/LandingPage';
import ScenarioManagerModal from '@/components/ScenarioManagerModal';
import SheetMantenimientoNissan from '@/components/excel-sheets/SheetMantenimientoNissan';
import SheetSupuestosParametros from '@/components/excel-sheets/SheetSupuestosParametros';
import SheetCostosOperacionCov from '@/components/excel-sheets/SheetCostosOperacionCov';
import SheetEconomiaPropietario from '@/components/excel-sheets/SheetEconomiaPropietario';
import SheetTarifasCategoria from '@/components/excel-sheets/SheetTarifasCategoria';
import SheetRentabilidadRutas from '@/components/excel-sheets/SheetRentabilidadRutas';
import SheetBitacoraAuditoria from '@/components/excel-sheets/SheetBitacoraAuditoria';
import AiAssistantWidget from '@/components/AiAssistantWidget';
import ExecutivePriceReportModal, {
  buildExecutivePriceReport,
  type PriceChangeExecutiveReport,
} from '@/components/ExecutivePriceReportModal';

import { VehicleTypeWithRelations, MaintenanceTemplate, FuelCode } from '@/types/database';

interface DashboardViewProps {
  initialParameters: SystemParameters;
  initialFares: FareCategory[];
  initialLogs: AuditLog[];
  initialScenarios?: ScenarioConfig[];
  initialVehicleTypes?: VehicleTypeWithRelations[];
  initialMaintenanceTemplates?: MaintenanceTemplate[];
  currentRole: UserRole;
  currentUserEmail: string;
}

type EditableParameterField = UpdateParameterInput['field'];
type TabType = 'resumen' | 'cov' | 'propietario' | 'mantenimiento' | 'parametros' | 'tarifas' | 'rutas' | 'auditoria';

const defaultScenarios: ScenarioConfig[] = OFFICIAL_SCENARIOS;

export default function DashboardView({
  initialParameters,
  initialFares,
  initialLogs,
  initialScenarios,
  initialVehicleTypes = [],
  initialMaintenanceTemplates = [],
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
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>(
    initialScenarios && initialScenarios.length > 0 ? initialScenarios : defaultScenarios
  );
  const [activeScenarioId, setActiveScenarioId] = useState<string>('social1');
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isPriceReportOpen, setIsPriceReportOpen] = useState(false);
  const [customPriceReport, setCustomPriceReport] = useState<PriceChangeExecutiveReport | null>(null);

  // Estado de Usuario y Sesión
  const [activeRole, setActiveRole] = useState<UserRole>(currentRole);
  const [userEmail, setUserEmail] = useState<string>(currentUserEmail);
  const [userOrg, setUserOrg] = useState<string>(
    currentUserEmail === 'ecotraffic.bo@gmail.com' ? 'Ecotraffic Consultoría' : 'GAM Sucre'
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [, startTransition] = useTransition();
  
  const [activeVehicleId, setActiveVehicleId] = useState<string>('');
  const [activeFuelType, setActiveFuelType] = useState<{code: FuelCode, name: string, unit: string}>({ code: 'diesel', name: 'Diésel', unit: 'litro' });
  
  // Modal de edición de parámetros
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editField, setEditField] = useState<EditableParameterField>('fuel_price_bs_l');
  const [editValue, setEditValue] = useState<number>(params.fuel_price_bs_l);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isSuperAdmin = activeRole === 'superadmin' || userEmail === 'ecotraffic.bo@gmail.com';
  const canEdit = isSuperAdmin || activeRole === 'admin_municipal' || activeRole === 'consultor_ecotraffic';

  const [activeTenantId, setActiveTenantId] = useState<string>('tenant-gams-sucre');

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedSession = localStorage.getItem('tarfy_session');
      if (savedSession) {
        const parsedSess = JSON.parse(savedSession);
        if (parsedSess.email) {
          setUserEmail(parsedSess.email);
          setActiveRole(parsedSess.role || 'admin_municipal');
          setUserOrg(parsedSess.org || 'GAM Sucre');
          if (parsedSess.tenantId) setActiveTenantId(parsedSess.tenantId);
          setViewMode('dashboard');
        }
      }

      // No leemos params del localStorage para garantizar la sincronización en tiempo real y SSR
      const savedScenarios = localStorage.getItem('simpro_scenarios');
      if (savedScenarios) {
        try {
          const parsed = JSON.parse(savedScenarios);
          if (Array.isArray(parsed) && parsed?.length > 0) {
            setScenarios(parsed);
          }
        } catch {}
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

  // =========================================================================
  // MOTOR TARIFARIO UNIVERSAL (MEMOIZADO PARA ALTA PERFORMANCE)
  // =========================================================================
  const {
    engineFareCategories,
    engineOutput,
    days,
    turns,
    fleet,
    kmDay,
    demandDay,
    dieselPrice,
    unitKm,
    unitPax,
    ipk,
    fuelCost,
    maintVar,
    maintFixed,
    laborCost,
    otherFixed,
    opex,
    depreciation,
    allowedReturn,
    regulatoryCost,
    technicalWeighted,
    currentWeighted,
    technicalAdultFare,
    activeWeightedFare,
    activeAdultFare,
    monthlyRevenue,
    freeCash,
    economicProfit,
    householdIncome,
    calculatedRoutes,
    deficitRoutesCount
  } = React.useMemo(() => {
    // 32 Rutas del sistema (estático)
    const _routesList = [
      { id: '1', unionName: "San Cristóbal", lineName: "Línea 12 amarillo", cycleDistanceKm: 15.49, assignedFleet: 30.49 },
      { id: '2', unionName: "San Cristóbal", lineName: "Línea 12 Rosado", cycleDistanceKm: 29.24, assignedFleet: 25.97 },
      { id: '3', unionName: "San Cristóbal", lineName: "Línea 1", cycleDistanceKm: 30.62, assignedFleet: 31.62 },
      { id: '4', unionName: "San Cristóbal", lineName: "Línea 2", cycleDistanceKm: 32.90, assignedFleet: 31.62 },
      { id: '5', unionName: "San Cristóbal", lineName: "Línea 3", cycleDistanceKm: 28.30, assignedFleet: 32.75 },
      { id: '6', unionName: "San Cristóbal", lineName: "Línea 4", cycleDistanceKm: 29.76, assignedFleet: 31.62 },
      { id: '7', unionName: "San Cristóbal", lineName: "Línea 5", cycleDistanceKm: 25.92, assignedFleet: 32.75 },
      { id: '8', unionName: "San Cristóbal", lineName: "Línea 6", cycleDistanceKm: 26.38, assignedFleet: 31.62 },
      { id: '9', unionName: "San Cristóbal", lineName: "Línea 7", cycleDistanceKm: 24.50, assignedFleet: 31.62 },
      { id: '10', unionName: "San Cristóbal", lineName: "Línea 8", cycleDistanceKm: 25.83, assignedFleet: 32.75 },
      { id: '11', unionName: "San Cristóbal", lineName: "Línea 10", cycleDistanceKm: 35.53, assignedFleet: 30.49 },
      { id: '12', unionName: "San Cristóbal", lineName: "Línea 11", cycleDistanceKm: 22.96, assignedFleet: 29.36 },
      { id: '13', unionName: "San Cristóbal", lineName: "Línea 14 (Tramo A)", cycleDistanceKm: 24.21, assignedFleet: 30.49 },
      { id: '14', unionName: "San Cristóbal", lineName: "Línea 25", cycleDistanceKm: 34.57, assignedFleet: 30.49 },
      { id: '15', unionName: "San Cristóbal", lineName: "Línea 33", cycleDistanceKm: 30.10, assignedFleet: 30.49 },
      { id: '16', unionName: "San Cristóbal", lineName: "Línea 77", cycleDistanceKm: 21.02, assignedFleet: 30.49 },
      { id: '17', unionName: "San Cristóbal", lineName: "Línea 125", cycleDistanceKm: 34.86, assignedFleet: 30.49 },
      { id: '18', unionName: "San Cristóbal", lineName: "Línea 01", cycleDistanceKm: 31.44, assignedFleet: 30.49 },
      { id: '19', unionName: "San Cristóbal", lineName: "Línea 14 (Tramo B)", cycleDistanceKm: 24.38, assignedFleet: 30.49 },
      { id: '20', unionName: "Sindicato Sucre", lineName: "Línea K 50", cycleDistanceKm: 28.00, assignedFleet: 31.62 },
      { id: '21', unionName: "Sindicato Sucre", lineName: "Línea 20", cycleDistanceKm: 36.00, assignedFleet: 30.49 },
      { id: '22', unionName: "Sindicato Sucre", lineName: "Línea B (Amarillo) 21", cycleDistanceKm: 31.00, assignedFleet: 30.49 },
      { id: '23', unionName: "Sindicato Sucre", lineName: "Línea FX 80", cycleDistanceKm: 34.00, assignedFleet: 30.49 },
      { id: '24', unionName: "Sindicato Sucre", lineName: "Línea FX 15", cycleDistanceKm: 30.00, assignedFleet: 31.62 },
      { id: '25', unionName: "Sindicato Sucre", lineName: "Línea Q Rosada", cycleDistanceKm: 28.00, assignedFleet: 30.49 },
      { id: '26', unionName: "Sindicato Sucre", lineName: "Línea Q Amarillo 55", cycleDistanceKm: 32.00, assignedFleet: 30.49 },
      { id: '27', unionName: "Sindicato Sucre", lineName: "Línea A 30", cycleDistanceKm: 22.00, assignedFleet: 30.49 },
      { id: '28', unionName: "Sindicato Sucre", lineName: "Línea G 60", cycleDistanceKm: 29.00, assignedFleet: 31.62 },
      { id: '29', unionName: "Sindicato Sucre", lineName: "Línea C 70", cycleDistanceKm: 20.00, assignedFleet: 30.49 },
      { id: '30', unionName: "Sindicato Sucre", lineName: "Línea L 18", cycleDistanceKm: 20.00, assignedFleet: 30.49 },
      { id: '31', unionName: "Sindicato Sucre", lineName: "Línea B Verde 101", cycleDistanceKm: 23.00, assignedFleet: 31.62 },
      { id: '32', unionName: "Sindicato Sucre", lineName: "Línea D 87", cycleDistanceKm: 26.00, assignedFleet: 30.49 }
    ];

    const isTechnicalScenario = activeScenarioId === 'technical';
    const _engineFareCategories = fares.map(f => {
      let activeCategoryFare = f.fare_social_2_bs;
      if (isTechnicalScenario) activeCategoryFare = f.fare_technical_bs;
      else if (activeScenario.socialFares) {
        if (f.name.includes('Adultos mayores')) activeCategoryFare = activeScenario.socialFares.adultosMayores;
        else if (f.name.includes('Universitarios')) activeCategoryFare = activeScenario.socialFares.universitarios;
        else if (f.name.includes('Colegiales')) activeCategoryFare = activeScenario.socialFares.colegiales;
        else if (f.name.includes('Escolares')) activeCategoryFare = activeScenario.socialFares.escolares;
        else if (f.name.includes('Discapacidad')) activeCategoryFare = 0;
        else activeCategoryFare = activeScenario.adultFare;
      } else if (activeScenarioId === 'social1') activeCategoryFare = f.fare_social_1_bs;
      else if (activeScenarioId === 'social2') activeCategoryFare = f.fare_social_2_bs;
      else if (activeScenarioId === 'current' || activeScenarioId === 'stress') activeCategoryFare = f.fare_current_bs;

      return {
        name: f.name,
        demandShare: f.demand_share,
        dailyTrips: f.daily_trips || 0,
        fareCurrentBs: f.fare_current_bs,
        fareSocialBs: activeCategoryFare,
      };
    });

    const _engineOutput = calculateTariffSystem({
      fleetActive: params.fleet_active,
      kmNetworkDay: params.km_network_day,
      demandNetworkDay: params.demand_network_day,
      operatingDaysMonth: params.operating_days_month,
      turnsDay: params.turns_day,
      fuelType: activeFuelType,
      fuelPricePerUnit: params.fuel_price_bs_l,
      fuelEfficiency: params.fuel_efficiency_km_l,
      idleCongestionFactor: params.idle_congestion_factor,
      driverSalary: params.driver_salary_bs,
      laborChargesFactor: params.labor_charges_factor,
      driversPerVehicle: 1,
      maintenanceMonthly: params.maintenance_monthly_bs,
      maintenanceVarShare: params.maintenance_var_share,
      maintenanceFixedShare: params.maintenance_fixed_share,
      otherFixedMonthly: params.other_fixed_monthly_bs,
      vehicleReplacementValue: params.vehicle_replacement_value_bs,
      vehicleResidualValue: params.vehicle_residual_value_bs,
      vehicleUsefulLifeMonths: params.vehicle_useful_life_months,
      capitalReturnRateAnnual: params.capital_return_rate_annual,
      fareCategories: _engineFareCategories,
      demandFactor: activeScenario.demandFactor,
      fuelPriceFactor: activeScenario.fuelPriceFactor,
      routes: _routesList,
      routeConciliationFactor: 1.004978,
    });

    return {
      engineFareCategories: _engineFareCategories,
      engineOutput: _engineOutput,
      days: params.operating_days_month,
      turns: params.turns_day,
      fleet: params.fleet_active,
      kmDay: params.km_network_day,
      demandDay: params.demand_network_day * activeScenario.demandFactor,
      dieselPrice: params.fuel_price_bs_l * activeScenario.fuelPriceFactor,
      unitKm: _engineOutput.kmPerUnitMonth,
      unitPax: _engineOutput.paxPerUnitMonth,
      ipk: _engineOutput.ipkSystem,
      fuelCost: _engineOutput.costs.fuel,
      maintVar: _engineOutput.costs.maintenanceVariable,
      maintFixed: _engineOutput.costs.maintenanceFixed,
      laborCost: _engineOutput.costs.laborTotal,
      otherFixed: _engineOutput.costs.otherFixed,
      opex: _engineOutput.costs.opexCash,
      depreciation: _engineOutput.costs.depreciation,
      allowedReturn: _engineOutput.costs.capitalReturn,
      regulatoryCost: _engineOutput.costs.totalRegulatory,
      technicalWeighted: _engineOutput.weightedTechnicalFare,
      currentWeighted: _engineOutput.currentWeightedFare,
      technicalAdultFare: _engineOutput.technicalAdultFare,
      activeWeightedFare: activeScenarioId === 'technical' ? _engineOutput.weightedTechnicalFare : _engineOutput.activeWeightedFare,
      activeAdultFare: activeScenarioId === 'technical' ? _engineOutput.technicalAdultFare : activeScenario.adultFare,
      monthlyRevenue: activeScenarioId === 'technical' ? _engineOutput.costs.totalRegulatory : _engineOutput.monthlyRevenuePerUnit,
      freeCash: activeScenarioId === 'technical' ? _engineOutput.costs.capitalReturn : _engineOutput.freeCashPerUnit,
      economicProfit: activeScenarioId === 'technical' ? 0 : _engineOutput.economicProfitPerUnit,
      householdIncome: activeScenarioId === 'technical'
        ? _engineOutput.costs.capitalReturn + _engineOutput.costs.laborTotal
        : _engineOutput.householdIncomePerUnit,
      calculatedRoutes: _engineOutput.routeResults?.map(r => ({
        id: Number(r.id),
        union: r.unionName,
        line: r.lineName,
        distance: r.cycleDistanceKm,
        fleet: r.assignedFleet,
        kmMes: r.kmMonth,
        paxMes: r.paxMonth,
        routeOpex: r.routeOpex,
        routeReg: r.routeRegulatoryCost,
        routeRev: r.routeRevenue,
        routeProfit: r.routeProfit,
        isDeficit: r.isDeficit
      })) || [],
      deficitRoutesCount: _engineOutput.deficitRoutesCount || 0
    };
  }, [params, fares, activeScenario, activeScenarioId]);

  const activePriceReport = React.useMemo<PriceChangeExecutiveReport>(() => {
    if (customPriceReport) return customPriceReport;
    return buildExecutivePriceReport({
      params,
      fares,
      scenarios,
      activeFuelType,
      oldPrice: 17.95,
      newPrice: params.fuel_price_bs_l,
      justification:
        'Ajuste dispuesto por la Agencia Nacional de Hidrocarburos (ANH) bajo el mecanismo dinámico de paridad de importación del Decreto Supremo 5716 (vigente desde el 24 de noviembre de 2026).',
      userEmail,
      userRole: activeRole,
      userOrg,
    });
  }, [customPriceReport, params, fares, scenarios, activeFuelType, userEmail, activeRole, userOrg]);

  const adultGapPct = technicalAdultFare > 0 ? ((activeAdultFare - technicalAdultFare) / technicalAdultFare) * 100 : 0;
  const coveragePct = regulatoryCost > 0 ? (monthlyRevenue / regulatoryCost) * 100 : 0;

  // =========================================================================
  // EXPORTACIÓN DINÁMICA A EXCEL CON VALORES MODIFICADOS EN VIVO
  // =========================================================================
  // =========================================================================
  // EXPORTACIÓN DINÁMICA A EXCEL CON VALORES MODIFICADOS EN VIVO (7-8 HOJAS)
  // =========================================================================
  const handleExportDynamicExcel = () => {
    try {
      exportDynamicExcelWorkbook({
        activeScenario,
        activeScenarioId,
        userEmail,
        isSuperAdmin,
        params,
        fares,
        logs,
        activeFuelType,
        technicalAdultFare,
        activeAdultFare,
        technicalWeighted,
        activeWeightedFare,
        householdIncome,
        economicProfit,
        regulatoryCost,
        opex,
        depreciation,
        allowedReturn,
        ipk,
        fleet,
        kmDay,
        demandDay,
        days,
        turns,
        unitKm,
        unitPax,
        dieselPrice,
        fuelCost,
        maintVar,
        maintFixed,
        laborCost,
        otherFixed,
        monthlyRevenue,
        currentWeighted,
        calculatedRoutes
      });
      setStatusMessage({ text: 'Libro maestro Excel exportado exitosamente con todas las hojas y datos actualizados.', type: 'success' });
    } catch (err: unknown) {
      console.error('Error generando Excel:', err);
      // Fallback a descarga del archivo maestro estático
      window.open('/Modelo_Profesional_Tarifario_Sucre_v3.2.1_Ecotraffic.xlsx', '_blank');
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

    // 4. Generar Informe Ejecutivo automático ante cambio de precio legal de combustible
    if (editField === 'fuel_price_bs_l' && Number(prevVal) !== nVal) {
      const updatedParams = { ...params, fuel_price_bs_l: nVal };
      const generatedReport = buildExecutivePriceReport({
        params: updatedParams,
        fares,
        scenarios,
        activeFuelType,
        oldPrice: Number(prevVal),
        newPrice: nVal,
        justification,
        userEmail,
        userRole: activeRole,
        userOrg,
      });
      setCustomPriceReport(generatedReport);
      setIsPriceReportOpen(true);
    }
  };

  const handleSaveScenario = (sc: ScenarioConfig) => {
    setScenarios(prev => {
      const exists = prev.some(item => item.id === sc.id);
      const updated = exists ? prev.map(item => item.id === sc.id ? sc : item) : [...prev, sc];
      try { localStorage.setItem('simpro_scenarios', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setActiveScenarioId(sc.id);

    // Sincronizar en el servidor para que se replique en todos los equipos y lo vea el SuperAdmin
    saveSharedScenario(sc, userEmail);

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
    deleteSharedScenario(scId);
    setStatusMessage({ text: 'Escenario eliminado del simulador.', type: 'success' });
  };

  const handleLogout = () => {
    try { localStorage.removeItem('tarfy_session'); } catch {}
    setViewMode('landing');
    setStatusMessage({ text: 'Sesión finalizada correctamente.', type: 'success' });
  };

  const handleAuthSuccess = (email: string, role: UserRole, org: string, tenantId?: string) => {
    setUserEmail(email);
    setActiveRole(role);
    setUserOrg(org);
    if (tenantId) setActiveTenantId(tenantId);
    try {
      localStorage.setItem('tarfy_session', JSON.stringify({ email, role, org, tenantId: tenantId || 'tenant-gams-sucre' }));
    } catch {}
    setViewMode('dashboard');
    setStatusMessage({ text: `Sesión institucional iniciada: ${role} (${email})`, type: 'success' });
  };

  // Si está en modo Landing Page
  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onOpenLogin={() => {
            setAuthModalTab('login');
            setIsAuthModalOpen(true);
          }}
          onOpenDemo={() => {
            setAuthModalTab('register');
            setIsAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialTab={authModalTab}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-900 font-sans">
      

      {/* ========================================================================= */}
      {/* INTERFAZ DEL DASHBOARD (OCULTA AUTOMÁTICAMENTE AL IMPRIMIR PDF)            */}
      {/* ========================================================================= */}
      <div className="print:hidden pb-16">
        
        {/* Top Enterprise SaaS Bar */}
        <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            
            {/* Branding & Logo */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setViewMode('landing')}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center font-black text-white text-base shadow-md hover:scale-105 transition-all cursor-pointer"
                title="Volver a la Portada Institucional"
              >
                T
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-white">
                    Tarify OS
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    SaaS v3.3
                  </span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded font-semibold hidden md:inline">
                    {userOrg || 'GAM Sucre'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Plataforma de Gobernanza Tarifaria & COV en Tiempo Real
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
                className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Descargar Dossier PDF Oficial Formateado"
              >
                <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                <span className="hidden xl:inline">Reporte PDF</span>
                <span className="xl:hidden">PDF</span>
              </button>

              {/* Botón Descargar Excel Dinámico */}
              <button
                onClick={handleExportDynamicExcel}
                className="bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Descargar Excel con todas las modificaciones actuales del simulador"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span className="hidden xl:inline">Excel .xlsx</span>
                <span className="xl:hidden">Excel</span>
              </button>

              {/* Botones de Gestión SuperAdmin */}
              {isSuperAdmin && (
                <div className="flex items-center gap-1.5 bg-slate-900/80 p-0.5 rounded-xl border border-slate-700/60">
                  <button
                    onClick={() => setIsAdminPanelOpen(true)}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    title="Abrir Panel SuperAdmin (Usuarios, Roles y Gobernanza)"
                  >
                    <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                    <span>Panel SuperAdmin</span>
                  </button>
                  <button
                    onClick={() => window.location.href = '/admin/flota'}
                    className="hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    title="Catálogo de Flota Multimodal"
                  >
                    <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span>Flota</span>
                  </button>
                  <button
                    onClick={() => window.location.href = '/admin/mantenimiento'}
                    className="hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    title="Editor de Plantillas de Mantenimiento"
                  >
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    </svg>
                    <span>Mantenimiento</span>
                  </button>
                </div>
              )}

              {/* Badge de Identidad Autenticada Institucional (Acceso Controlado) */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-900/90 border-slate-700 text-xs shadow-xs">
                <span className="font-bold flex items-center gap-1.5 text-slate-200">
                  {activeRole === 'superadmin' && (
                    <span className="text-amber-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      SuperAdmin
                    </span>
                  )}
                  {activeRole === 'admin_municipal' && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                      Admin GAMS
                    </span>
                  )}
                  {activeRole === 'consultor_ecotraffic' && (
                    <span className="text-cyan-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                      Consultor Técnico
                    </span>
                  )}
                  {activeRole === 'delegado_sindical' && (
                    <span className="text-indigo-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-8 4h8m-8 4h4m-7 5h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                      Delegado Sindical
                    </span>
                  )}
                  {activeRole === 'observador_publico' && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      Observador Público
                    </span>
                  )}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-blue-300 font-mono text-[11px] max-w-[170px] truncate" title={userEmail}>
                  {userEmail}
                </span>
              </div>

              {/* Botón Cerrar Sesión */}
              <button
                onClick={handleLogout}
                className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                title="Cerrar sesión y volver a la portada"
              >
                Cerrar Sesión
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none cursor-pointer"
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
                  {activeRole.toUpperCase()}
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
                className="w-full py-2.5 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 font-bold text-xs rounded-xl border border-indigo-500/40 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Gestionar y Crear Escenarios</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => { setIsAdminPanelOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span>Panel SuperAdmin</span>
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

          {/* Header de Escenarios Dinámicos & Tecnología Multimodal */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mesa de Concertación:</span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sesión Activa Oficial
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Escenarios de Negociación & Regulación COV
                </h2>
              </div>

              {/* Selector de Tecnología Vehicular Integrado */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex items-center bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-xs transition-all w-full md:w-auto">
                  <div className="flex items-center gap-2 shrink-0 mr-2 text-cyan-400">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="text-[11px] font-bold text-slate-300 hidden sm:inline uppercase tracking-wider">Modo:</span>
                  </div>
                  
                  <select 
                    className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer pr-7 appearance-none w-full md:w-auto z-10"
                    value={activeVehicleId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      setActiveVehicleId(vId);
                      if (!vId) return;
                      const v = initialVehicleTypes?.find(vt => vt.id === vId);
                      if (v) {
                        const maint = initialMaintenanceTemplates?.find(m => m.vehicle_type_id === vId);
                        const maintCost = maint ? maint.total_monthly_cost : params.maintenance_monthly_bs;
                        
                        setParams(prev => ({
                          ...prev,
                          fuel_efficiency_km_l: v.fuel_efficiency || prev.fuel_efficiency_km_l,
                          idle_congestion_factor: v.idle_congestion_factor || prev.idle_congestion_factor,
                          vehicle_replacement_value_bs: v.replacement_value || prev.vehicle_replacement_value_bs,
                          vehicle_residual_value_bs: v.residual_value || prev.vehicle_residual_value_bs,
                          vehicle_useful_life_months: v.useful_life_months || prev.vehicle_useful_life_months,
                          maintenance_monthly_bs: maintCost
                        }));
                        if (v.fuel_types) {
                          setActiveFuelType({ code: v.fuel_types?.code || 'diesel', name: v.fuel_types?.name || 'Diésel', unit: v.fuel_types?.unit || 'litro' });
                        }
                      }
                    }}
                  >
                    <option value="" className="bg-slate-900 text-white">Nissan Civilian Diésel (Oficial Sucre)</option>
                    {initialVehicleTypes?.map(v => (
                      <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                        {v.transport_modes?.name || 'Vehículo'} — {v.brand} {v.model} ({v.fuel_types?.name || 'Combustible'})
                      </option>
                    ))}
                  </select>

                  <div className="absolute right-3 pointer-events-none flex items-center gap-1.5 text-slate-400">
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono font-extrabold rounded-md uppercase hidden lg:inline">
                      {activeFuelType?.name || 'Diésel'}
                    </span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles de Escenarios */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="bg-slate-100 p-1 rounded-2xl flex flex-wrap gap-1 flex-1 md:flex-initial border border-slate-200/80">
                {scenarios.map(sc => {
                  const displayLabel = sc.id === 'technical' ? `Técnica (Bs. ${fmt(technicalAdultFare, 2)})` : sc.label;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setActiveScenarioId(sc.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeScenarioId === sc.id
                          ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80 font-bold'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                      }`}
                    >
                      <span className={sc.color || 'text-slate-700'}>{displayLabel}</span>
                      {sc.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                          sc.badge === 'DÉFICIT'
                            ? 'bg-rose-100 text-rose-800'
                            : sc.badge === 'EQUILIBRIO'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sc.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsPriceReportOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Ver Informe Ejecutivo de Variación de Precio Legal"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Informe Ejecutivo ({activeFuelType.name}: Bs. {fmt(params.fuel_price_bs_l, 2)})</span>
                </button>

                {/* Botón Abrir Gestor de Escenarios */}
                <button
                  onClick={() => setIsScenarioModalOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Crear, editar o eliminar escenarios"
                >
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Gestionar Escenarios</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6 SaaS Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Card 1: Tarifa Adulto */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tarifa Adulto</div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                Bs. {fmt(activeAdultFare, 2)}
              </div>
              <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${adultGapPct >= -0.2 ? 'text-emerald-700' : 'text-rose-700'}`}>
                <span>{adultGapPct >= 0 ? '+' : ''}{adultGapPct.toFixed(1)}% s/ técnica</span>
              </div>
              <div className={`absolute top-0 right-0 w-2 h-full ${adultGapPct >= -0.2 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            </div>

            {/* Card 2: Tarifa Técnica Eq. */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tarifa Técnica Eq.</div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                Bs. {fmt(technicalAdultFare, 2)}
              </div>
              <div className="text-[11px] text-blue-700 font-semibold mt-1">
                Equilibrio financiero
              </div>
              <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
            </div>

            {/* Card 3: Tarifa Ponderada */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tarifa Ponderada</div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                Bs. {fmt(activeWeightedFare, 4)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Téc: Bs. {fmt(technicalWeighted, 4)}
              </div>
              <div className="absolute top-0 right-0 w-2 h-full bg-teal-500"></div>
            </div>

            {/* Card 4: Ingreso Hogar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ingreso Hogar</div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
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
              <div className={`text-2xl font-black mt-1 font-mono ${economicProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
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
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
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
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs text-slate-800 leading-relaxed font-medium">
                <strong>Diagnóstico Técnico ({activeScenarioId === 'technical' ? `Técnica (Bs. ${fmt(technicalAdultFare, 2)})` : activeScenario.label}):</strong> Con la tarifa propuesta de <strong>Bs. {fmt(activeAdultFare, 2)}</strong> (diésel a <strong>Bs. {fmt(dieselPrice, 2)}/{activeFuelType.unit}</strong>), el microbús recauda <strong>Bs. {fmt(monthlyRevenue, 0)}/mes</strong>, cubriendo el <strong>{coveragePct.toFixed(1)}%</strong> del costo regulatorio (Bs. {fmt(regulatoryCost, 0)}/mes) y generando un ingreso hogar de <strong>Bs. {fmt(householdIncome, 0)}/mes</strong>.
                {coveragePct < 99.5 && (
                  <span className="ml-1.5 text-rose-700 font-bold">
                    Déficit mensual de Bs. {fmt(regulatoryCost - monthlyRevenue, 0)} por unidad.
                  </span>
                )}
              </div>
            </div>
            <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap hidden lg:block">
              IPK: {fmt(ipk, 2)} pax/km
            </span>
          </div>

          {/* SaaS Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-6 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: 'resumen' as TabType, label: 'Resumen Ejecutivo & COV' },
              { id: 'cov' as TabType, label: 'Estructura COV Detallada' },
              { id: 'propietario' as TabType, label: 'Economía del Propietario' },
              { id: 'mantenimiento' as TabType, label: 'Mantenimiento Nissan' },
              { id: 'parametros' as TabType, label: 'Supuestos & Productividad' },
              { id: 'tarifas' as TabType, label: 'Categoría Social' },
              { id: 'rutas' as TabType, label: `32 Rutas (${deficitRoutesCount} deficitarias)` },
              ...(isSuperAdmin ? [{ id: 'auditoria' as TabType, label: `Bitácora de Auditoría (${logs?.length || 0} logs)` }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs font-bold transition-all whitespace-nowrap relative cursor-pointer ${
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
            <div className="space-y-6">
              {/* Matriz Comparativa de Simulación de Escenarios en Vivo */}
              <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Simulación Comparativa de Escenarios (Nueva Realidad: {activeFuelType.name} Bs. {fmt(params.fuel_price_bs_l, 2)}/{activeFuelType.unit})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Haz clic en cualquier escenario para activarlo en el tablero. Evaluación automática frente al equilibrio técnico (Bs. {fmt(technicalAdultFare, 2)}).
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPriceReportOpen(true)}
                    className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Ver Informe Ejecutivo (Bs. {fmt(activePriceReport.oldPrice, 2)} &rarr; Bs. {fmt(activePriceReport.newPrice, 2)})
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 text-[11px] border-b border-slate-200">
                        <th className="py-2.5 px-4">Escenario</th>
                        <th className="py-2.5 px-3 text-right">Tarifa Adulto</th>
                        <th className="py-2.5 px-3 text-right">Recaudación/Mes</th>
                        <th className="py-2.5 px-3 text-right">Cobertura</th>
                        <th className="py-2.5 px-3 text-right">Brecha vs Técnica</th>
                        <th className="py-2.5 px-3 text-right">Ingreso Hogar</th>
                        <th className="py-2.5 px-4 text-center">Dictamen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {activePriceReport.scenarioImpacts.map(item => (
                        <tr
                          key={item.id}
                          onClick={() => setActiveScenarioId(item.id)}
                          className={`cursor-pointer transition-colors ${
                            activeScenarioId === item.id
                              ? 'bg-blue-50/70 font-bold'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{item.label}</td>
                          <td className="py-2.5 px-3 text-right font-bold">Bs. {fmt(item.adultFare, 2)}</td>
                          <td className="py-2.5 px-3 text-right">Bs. {fmt(item.revenueAfter, 2)}</td>
                          <td className={`py-2.5 px-3 text-right font-bold ${item.coveragePct >= 100 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {item.coveragePct.toFixed(1)}%
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold ${item.gapVsTechBs >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {item.gapVsTechBs >= 0 ? '+' : ''}Bs. {fmt(item.gapVsTechBs, 2)}
                          </td>
                          <td className="py-2.5 px-3 text-right">Bs. {fmt(item.householdIncomeAfter, 2)}</td>
                          <td className="py-2.5 px-4 text-center font-sans">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                item.status === 'VIABLE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'EQUILIBRIO'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

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
                    { key: 'fuel_price_bs_l' as const, label: `Precio ${activeFuelType.name}`, val: params.fuel_price_bs_l, unit: `Bs/${activeFuelType.unit}` },
                    { key: 'fuel_efficiency_km_l' as const, label: `Rendimiento ${activeFuelType.name}`, val: params.fuel_efficiency_km_l, unit: `km/${activeFuelType.unit} (+15% ralentí)` },
                    { key: 'maintenance_monthly_bs' as const, label: 'Mantenimiento Mensual v2', val: params.maintenance_monthly_bs, unit: 'Bs/mes' },
                    { key: 'driver_salary_bs' as const, label: 'Salario Chofer Profesional', val: params.driver_salary_bs, unit: 'Bs/mes (+8,33% aguinaldo)' },
                    { key: 'fleet_active' as const, label: 'Flota Activa en Servicio', val: params.fleet_active, unit: 'vehículos' },
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
                          <span className="flex items-center justify-end gap-1 text-[9px] text-blue-600 font-bold mt-0.5">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Editar
                          </span>
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
                    { name: `Combustible ${activeFuelType?.name || 'Diésel'} (+${Math.round(params.idle_congestion_factor * 100)}% congestión)`, val: fuelCost, share: (fuelCost / regulatoryCost) * 100, color: 'bg-blue-600' },
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
            </div>
          )}

          {/* TAB: ESTRUCTURA COV DETALLADA (Hoja COSTOS_OPERACION_COV) */}
          {activeTab === 'cov' && (
            <SheetCostosOperacionCov 
              params={params} 
              fuelPrice={dieselPrice} 
              maintenanceMonthly={params.maintenance_monthly_bs} 
            />
          )}

          {/* TAB: ECONOMÍA DEL PROPIETARIO (Hoja ECONOMIA_PROPIETARIO) */}
          {activeTab === 'propietario' && (
            <SheetEconomiaPropietario
              params={params}
              activeFuelType={activeFuelType}
            />
          )}

          {/* TAB: MANTENIMIENTO NISSAN 52 ÍTEMS (Hoja MANTENIMIENTO_NISSAN) */}
          {activeTab === 'mantenimiento' && (
            <SheetMantenimientoNissan 
              maintenanceMonthly={params.maintenance_monthly_bs} 
            />
          )}

          {/* TAB: SUPUESTOS & PARÁMETROS MAESTROS (Hoja SUPUESTOS_PARAMETROS) */}
          {activeTab === 'parametros' && (
            <SheetSupuestosParametros 
              params={params} 
            />
          )}

          {/* TAB: TARIFAS POR CATEGORÍA SOCIAL (Hoja TARIFAS_CATEGORIA) */}
          {activeTab === 'tarifas' && (
            <SheetTarifasCategoria
              fares={fares}
              activeScenario={activeScenario}
              activeScenarioId={activeScenarioId}
              technicalAdultFare={technicalAdultFare}
              technicalWeighted={technicalWeighted}
              activeWeightedFare={activeWeightedFare}
              currentWeighted={currentWeighted}
              demandDay={demandDay}
              fmt={fmt}
            />
          )}

          {/* TAB: 32 RUTAS URBANAS */}
          {activeTab === 'rutas' && (
            <SheetRentabilidadRutas
              calculatedRoutes={calculatedRoutes}
              deficitRoutesCount={deficitRoutesCount}
              activeScenarioLabel={activeScenario.label}
              fmt={fmt}
            />
          )}

          {/* TAB: BITÁCORA DE AUDITORÍA (SOLO VISIBLE PARA SUPERADMIN) */}
          {isSuperAdmin && activeTab === 'auditoria' && (
            <SheetBitacoraAuditoria logs={logs} />
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* DOSSIER TÉCNICO OFICIAL DE IMPRESIÓN / PDF (SOLO VISIBLE AL EXPORTAR)     */}
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
              <div className="text-base font-black text-slate-950">Bs. {fmt(technicalAdultFare, 2)}</div>
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
                  <td className="border border-slate-400 p-1.5 font-semibold">Combustible {activeFuelType?.name || 'Diésel'} (Rendimiento {params.fuel_efficiency_km_l} km/{activeFuelType?.unit || 'l'} + {Math.round(params.idle_congestion_factor * 100)}% congestión)</td>
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
      {/* MODALES INTERACTIVOS DE AUTENTICACIÓN, EDICIÓN Y GESTOR DE ESCENARIOS      */}
      {/* ========================================================================= */}
      
      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
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

      {/* Modal Informe Ejecutivo de Variación de Precio Legal */}
      <ExecutivePriceReportModal
        isOpen={isPriceReportOpen}
        onClose={() => setIsPriceReportOpen(false)}
        report={activePriceReport}
      />

      {/* Modal Gestor de Escenarios Dinámicos */}
      <ScenarioManagerModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        baseFuelPrice={params.fuel_price_bs_l}
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

      {/* Asistente IA Integrado Tarify OS v4.0 */}
      <AiAssistantWidget />

    </div>
  );
}
