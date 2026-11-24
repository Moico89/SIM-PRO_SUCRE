/**
 * Orquestador Principal — Motor Tarifario Universal
 * 
 * Centraliza la ejecución de todos los módulos económicos:
 * - Productividad de red y unidad (km, pax, IPK).
 * - Costos operativos (Combustible, Mantenimiento, Laboral, Fijos).
 * - Costos de capital (Depreciación lineal, WACC regulatorio).
 * - Matriz de tarifas y distribución social por categoría.
 * - Análisis de rentabilidad por ruta (si se suministra la red).
 * - Estimación de emisiones de CO₂ (si se suministra factor ambiental).
 */

import type {
  TariffCalculationInput,
  TariffCalculationOutput,
} from './types';
import { calculateFuelCost, calculateFuelConsumption } from './modules/fuel-cost';
import { calculateLaborCost } from './modules/labor-cost';
import { calculateMaintenanceCost } from './modules/maintenance-cost';
import { calculateCapitalCost } from './modules/capital-cost';
import { computeFares } from './modules/fare-computation';
import { computeRouteProfitability } from './modules/route-profitability';

export const ENGINE_VERSION = '4.0.0-universal';

/**
 * Ejecuta el cálculo tarifario completo para cualquier combinación de
 * ciudad, modo de transporte, tipo de vehículo y combustible.
 */
export function calculateTariffSystem(input: TariffCalculationInput): TariffCalculationOutput {
  const {
    fleetActive,
    kmNetworkDay,
    demandNetworkDay,
    operatingDaysMonth,
    turnsDay,
    fuelType,
    fuelPricePerUnit,
    fuelEfficiency,
    idleCongestionFactor,
    driverSalary,
    laborChargesFactor,
    driversPerVehicle = 1,
    maintenanceMonthly,
    maintenanceVarShare,
    maintenanceFixedShare,
    otherFixedMonthly,
    vehicleReplacementValue,
    vehicleResidualValue,
    vehicleUsefulLifeMonths,
    capitalReturnRateAnnual,
    fareCategories,
    demandFactor = 1.0,
    fuelPriceFactor = 1.0,
    routes,
    routeConciliationFactor = 1.004978,
  } = input;

  // ── Validaciones Preventivas ──
  if (fleetActive <= 0) {
    throw new Error(`[engine/calculator] fleetActive debe ser > 0, recibido: ${fleetActive}`);
  }
  if (operatingDaysMonth <= 0) {
    throw new Error(`[engine/calculator] operatingDaysMonth debe ser > 0, recibido: ${operatingDaysMonth}`);
  }
  if (kmNetworkDay <= 0) {
    throw new Error(`[engine/calculator] kmNetworkDay debe ser > 0, recibido: ${kmNetworkDay}`);
  }
  if (demandNetworkDay <= 0) {
    throw new Error(`[engine/calculator] demandNetworkDay debe ser > 0, recibido: ${demandNetworkDay}`);
  }

  // ── 1. Indicadores de Productividad ──
  const effectiveDemandDay = demandNetworkDay * demandFactor;
  const unitKmMonth = (kmNetworkDay / fleetActive) * operatingDaysMonth;
  const unitPaxMonth = (effectiveDemandDay / fleetActive) * operatingDaysMonth;
  const ipkSystem = effectiveDemandDay / kmNetworkDay;

  // ── 2. Desglose de Costos Operativos (OPEX) ──
  const fuelCost = calculateFuelCost({
    kmPerUnitMonth: unitKmMonth,
    fuelEfficiency,
    fuelPricePerUnit,
    idleCongestionFactor,
    fuelType: fuelType.code,
    priceFactor: fuelPriceFactor,
  });

  const laborTotal = calculateLaborCost({
    driverSalary,
    laborChargesFactor,
    driversPerVehicle,
  });

  const { maintenanceVariable, maintenanceFixed } = calculateMaintenanceCost({
    maintenanceMonthly,
    maintenanceVarShare,
    maintenanceFixedShare,
    unitKmMonth,
  });

  const opexCash = fuelCost + maintenanceVariable + maintenanceFixed + laborTotal + otherFixedMonthly;

  // ── 3. Costos de Capital (CAPEX & Retorno) ──
  const { depreciationMonthly, capitalReturnMonthly, capitalTotalMonthly } = calculateCapitalCost({
    vehicleReplacementValue,
    vehicleResidualValue,
    vehicleUsefulLifeMonths,
    capitalReturnRateAnnual,
  });

  const totalRegulatory = opexCash + capitalTotalMonthly;

  // ── 4. Cómputo de Tarifas y Flujos Financieros ──
  const fareResults = computeFares({
    regulatoryCostMonthly: totalRegulatory,
    opexCashMonthly: opexCash,
    depreciationMonthly,
    laborCostMonthly: laborTotal,
    unitPaxMonth,
    fareCategories,
  });

  // ── 5. Análisis de Rentabilidad por Ruta (Opcional) ──
  let routeResults;
  let deficitRoutesCount;
  if (routes && routes.length > 0) {
    const routeAnalysis = computeRouteProfitability({
      routes,
      turnsDay,
      operatingDaysMonth,
      ipkSystem,
      unitKmMonth,
      activeWeightedFare: fareResults.activeWeightedFare,
      fuelEfficiency,
      fuelPricePerUnit,
      idleCongestionFactor,
      fuelType: fuelType.code,
      fuelPriceFactor,
      maintVarPerUnit: maintenanceVariable,
      maintFixedPerUnit: maintenanceFixed,
      laborCostPerUnit: laborTotal,
      otherFixedPerUnit: otherFixedMonthly,
      depreciationPerUnit: depreciationMonthly,
      capitalReturnPerUnit: capitalReturnMonthly,
      conciliationFactor: routeConciliationFactor,
    });
    routeResults = routeAnalysis.routes;
    deficitRoutesCount = routeAnalysis.deficitRoutesCount;
  }

  // ── 6. Estimación de Emisiones CO₂ ──
  let co2MonthlyPerUnit: number | undefined;
  if (fuelType.co2EmissionFactor !== undefined && fuelType.co2EmissionFactor > 0) {
    const consumption = calculateFuelConsumption({
      kmPerUnitMonth: unitKmMonth,
      fuelEfficiency,
      idleCongestionFactor,
      fuelType: fuelType.code,
    });
    co2MonthlyPerUnit = consumption * fuelType.co2EmissionFactor;
  }

  return {
    kmPerUnitMonth: unitKmMonth,
    paxPerUnitMonth: unitPaxMonth,
    ipkSystem,
    costs: {
      fuel: fuelCost,
      laborTotal,
      maintenanceVariable,
      maintenanceFixed,
      otherFixed: otherFixedMonthly,
      opexCash,
      depreciation: depreciationMonthly,
      capitalReturn: capitalReturnMonthly,
      totalRegulatory,
    },
    weightedTechnicalFare: fareResults.weightedTechnicalFare,
    technicalAdultFare: fareResults.technicalAdultFare,
    currentWeightedFare: fareResults.currentWeightedFare,
    activeWeightedFare: fareResults.activeWeightedFare,
    faresByCategory: fareResults.faresByCategory,
    monthlyRevenuePerUnit: fareResults.monthlyRevenuePerUnit,
    freeCashPerUnit: fareResults.freeCashPerUnit,
    economicProfitPerUnit: fareResults.economicProfitPerUnit,
    householdIncomePerUnit: fareResults.householdIncomePerUnit,
    routeResults,
    deficitRoutesCount,
    co2MonthlyPerUnit,
    calculatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
  };
}
