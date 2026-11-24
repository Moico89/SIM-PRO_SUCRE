/**
 * Motor de Cálculo Tarifario Universal — Tipos e Interfaces
 * 
 * Este módulo define los contratos de entrada/salida del motor de cálculo.
 * Independiente de React, testeable unitariamente, reutilizable en
 * server actions, edge functions y asistente IA (function calling).
 * 
 * Decisión técnica: Se usan interfaces estrictas (no `any`) para garantizar
 * type safety en la capa de cálculo económico que alimenta decisiones regulatorias.
 */

// ─── Fuel Types ───────────────────────────────────────────────────────────────

/** Tipos de combustible soportados por el motor */
export type FuelTypeCode =
  | 'diesel'
  | 'gasoline'
  | 'gnv'        // Gas Natural Vehicular
  | 'electric'
  | 'hybrid_diesel'
  | 'hybrid_gasoline'
  | 'hydrogen';

/** Configuración de un tipo de combustible */
export interface FuelTypeConfig {
  code: FuelTypeCode;
  name: string;
  unit: string;                      // 'litros', 'm³', 'kWh', 'kg'
  energyDensityMjPerUnit?: number;   // Para comparaciones cruzadas
  co2EmissionFactor?: number;        // kg CO₂ / unidad de combustible
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

/** Ítem individual de mantenimiento */
export interface MaintenanceItem {
  id: string | number;
  category: string;       // 'Motor', 'Frenos', 'Transmisión', etc.
  itemName: string;
  unitCost: number;
  quantity: number;
  laborCost: number;
  totalUnitCost: number;
  frequencyPerYear: number;
  annualCost: number;
  intervalKm?: number;
  notes?: string;
}

/** Template de mantenimiento consolidado */
export interface MaintenanceTemplate {
  name: string;
  items: MaintenanceItem[];
  totalAnnualCost: number;
  totalMonthlyCost: number;
  variableShare: number;   // Proporción de costos variables (0..1)
  fixedShare: number;       // Proporción de costos fijos (0..1)
}

// ─── Fare Categories ──────────────────────────────────────────────────────────

/** Categoría de demanda y tarifa de entrada */
export interface FareCategoryInput {
  name: string;
  demandShare: number;    // Proporción de la demanda (0..1, deben sumar 1.0)
  dailyTrips: number;
  fareCurrentBs: number;  // Tarifa vigente (en moneda local)
  fareSocialBs: number;   // Tarifa del escenario activo
}

/** Categoría de tarifa calculada por el motor */
export interface ComputedFareCategory {
  name: string;
  demandShare: number;
  dailyTrips: number;
  fareCurrentBs: number;
  fareTechnicalBs: number;  // Calculada por el motor
  fareSocialBs: number;
  monthlyRevenue: number;
  monthlyTrips: number;
}

// ─── Route Profitability ──────────────────────────────────────────────────────

/** Ruta de red para cálculo de rentabilidad */
export interface RouteInput {
  id: number | string;
  unionName: string;
  lineName: string;
  cycleDistanceKm: number;
  assignedFleet: number;
}

/** Resultado de rentabilidad por ruta */
export interface ComputedRoute {
  id: number | string;
  unionName: string;
  lineName: string;
  cycleDistanceKm: number;
  assignedFleet: number;
  kmMonth: number;
  paxMonth: number;
  routeOpex: number;
  routeRegulatoryCost: number;
  routeRevenue: number;
  routeProfit: number;
  isDeficit: boolean;
}

// ─── Engine Input ─────────────────────────────────────────────────────────────

/**
 * Entrada universal del motor de cálculo.
 * 
 * Soporta cualquier combinación de ciudad, modo de transporte, tipo de
 * vehículo y combustible. Todos los campos hardcodeados del DashboardView
 * v3.3 se parametrizan aquí.
 */
export interface TariffCalculationInput {
  // ── Contexto (metadata, no afecta cálculo) ──
  organizationId?: string;
  vehicleTypeId?: string;
  sessionId?: string;

  // ── Parámetros de Red y Demanda ──
  fleetActive: number;
  kmNetworkDay: number;
  demandNetworkDay: number;
  operatingDaysMonth: number;
  turnsDay: number;

  // ── Combustible (dinámico según tipo) ──
  fuelType: FuelTypeConfig;
  fuelPricePerUnit: number;          // Precio por unidad (litro, m³, kWh, kg)
  fuelEfficiency: number;            // km por unidad de combustible
  idleCongestionFactor: number;      // Factor de ralentí/congestión

  // ── Laboral ──
  driverSalary: number;
  laborChargesFactor: number;        // Ej: aguinaldo 1/12 = 0.0833
  driversPerVehicle: number;         // 1 para bus estándar, 2 para BRT

  // ── Mantenimiento ──
  maintenanceMonthly: number;
  maintenanceVarShare: number;       // Proporción variable (0..1)
  maintenanceFixedShare: number;     // Proporción fija (0..1)
  otherFixedMonthly: number;

  // ── Capital y Regulación ──
  vehicleReplacementValue: number;
  vehicleResidualValue: number;
  vehicleUsefulLifeMonths: number;
  capitalReturnRateAnnual: number;   // WACC (ej: 0.11 = 11%)

  // ── Categorías de Demanda ──
  fareCategories: FareCategoryInput[];

  // ── Factores de Escenario (sensibilidad) ──
  demandFactor?: number;             // default 1.0
  fuelPriceFactor?: number;          // default 1.0

  // ── Rutas (opcional, para análisis de rentabilidad) ──
  routes?: RouteInput[];
  routeConciliationFactor?: number;  // Factor de ajuste (ej: 1.004978)
}

// ─── Engine Output ────────────────────────────────────────────────────────────

/** Desglose de costos mensuales por unidad */
export interface CostBreakdown {
  fuel: number;
  laborTotal: number;
  maintenanceVariable: number;
  maintenanceFixed: number;
  otherFixed: number;
  /** OPEX efectivo en caja (A + B) */
  opexCash: number;
  depreciation: number;
  capitalReturn: number;
  /** Costo Regulatorio Total = OPEX + Depreciación + WACC */
  totalRegulatory: number;
}

/** Resultado completo del motor de cálculo */
export interface TariffCalculationOutput {
  // ── Indicadores de Productividad ──
  kmPerUnitMonth: number;
  paxPerUnitMonth: number;
  ipkSystem: number;

  // ── Costos ──
  costs: CostBreakdown;

  // ── Tarifas Calculadas ──
  weightedTechnicalFare: number;
  technicalAdultFare: number;
  currentWeightedFare: number;
  activeWeightedFare: number;
  faresByCategory: ComputedFareCategory[];

  // ── Indicadores Financieros ──
  monthlyRevenuePerUnit: number;
  freeCashPerUnit: number;
  economicProfitPerUnit: number;
  householdIncomePerUnit: number;

  // ── Rentabilidad por Ruta (si se proveyeron rutas) ──
  routeResults?: ComputedRoute[];
  deficitRoutesCount?: number;

  // ── Huella Ambiental (si el fuel tiene factor CO₂) ──
  co2MonthlyPerUnit?: number;

  // ── Metadata ──
  calculatedAt: string;
  engineVersion: string;
}
