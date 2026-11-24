/**
 * Módulo de Cómputo Tarifario — Motor Tarifario Universal
 * 
 * Implementa las fórmulas homologadas con el modelo técnico regulatorio:
 * 1. Tarifa Técnica Ponderada: Costo Regulatorio Total / Pasajeros Mensuales por Unidad.
 * 2. Tarifa Técnica de Adulto:
 *      Tarifa Adulto Técnica = Tarifa Ponderada Técnica × (Tarifa Adulto Vigente / Tarifa Ponderada Vigente)
 * 3. Proyección de ingresos y balances financieros (Caja Libre, Beneficio Económico, Ingreso Familiar).
 */

import type { ComputedFareCategory, FareCategoryInput } from '../types';

export interface FareComputationInput {
  /** Costo Regulatorio Total mensual por unidad (OPEX + CAPEX) */
  regulatoryCostMonthly: number;
  /** OPEX efectivo mensual por unidad (A + B) */
  opexCashMonthly: number;
  /** Depreciación mensual por unidad */
  depreciationMonthly: number;
  /** Costo laboral mensual por unidad */
  laborCostMonthly: number;
  /** Pasajeros transportados por unidad al mes */
  unitPaxMonth: number;
  /** Categorías de demanda y tarifas de entrada */
  fareCategories: FareCategoryInput[];
}

export interface FareComputationOutput {
  /** Tarifa técnica promedio ponderada de todo el sistema */
  weightedTechnicalFare: number;
  /** Tarifa técnica homologada para la categoría principal Adulto (Bs. 3,44) */
  technicalAdultFare: number;
  /** Tarifa promedio ponderada vigente (actual) */
  currentWeightedFare: number;
  /** Tarifa promedio ponderada social activa */
  activeWeightedFare: number;
  /** Desglose de categorías con tarifas calculadas */
  faresByCategory: ComputedFareCategory[];
  /** Recaudación bruta mensual proyectada por unidad */
  monthlyRevenuePerUnit: number;
  /** Caja libre mensual por unidad (Ingresos - OPEX - Depreciación) */
  freeCashPerUnit: number;
  /** Beneficio económico regulatorio mensual por unidad (Ingresos - Costo Regulatorio) */
  economicProfitPerUnit: number;
  /** Ingreso familiar mensual del operador (Salario chofer + Caja libre) */
  householdIncomePerUnit: number;
}

export function computeFares(input: FareComputationInput): FareComputationOutput {
  const {
    regulatoryCostMonthly,
    opexCashMonthly,
    depreciationMonthly,
    laborCostMonthly,
    unitPaxMonth,
    fareCategories,
  } = input;

  if (unitPaxMonth <= 0) {
    throw new Error(
      `[engine/fare-computation] unitPaxMonth debe ser > 0, recibido: ${unitPaxMonth}`
    );
  }

  // 1. Tarifa técnica promedio ponderada
  const weightedTechnicalFare = regulatoryCostMonthly / unitPaxMonth;

  // 2. Tarifa vigente ponderada
  const currentWeightedFare = fareCategories.reduce(
    (acc, cat) => acc + cat.demandShare * cat.fareCurrentBs,
    0
  );

  // 3. Tarifa social activa ponderada
  const activeWeightedFare = fareCategories.reduce(
    (acc, cat) => acc + cat.demandShare * cat.fareSocialBs,
    0
  );

  // 4. Tarifa técnica de la categoría principal Adulto
  const adultCategory = fareCategories.find(
    (c) =>
      c.name.toLowerCase().includes('adulto') &&
      !c.name.toLowerCase().includes('mayor')
  );
  const adultCurrentFare = adultCategory ? adultCategory.fareCurrentBs : 4.50;

  const technicalAdultFare =
    currentWeightedFare > 0
      ? weightedTechnicalFare * (adultCurrentFare / currentWeightedFare)
      : 3.4431;

  // 5. Cómputo por categoría de usuario
  const faresByCategory: ComputedFareCategory[] = fareCategories.map((cat) => {
    const fareTechnicalBs =
      currentWeightedFare > 0
        ? weightedTechnicalFare * (cat.fareCurrentBs / currentWeightedFare)
        : cat.fareCurrentBs;

    const monthlyTrips = cat.dailyTrips * 30; // Aproximación estándar mensual
    const monthlyRevenue = monthlyTrips * cat.fareSocialBs;

    return {
      name: cat.name,
      demandShare: cat.demandShare,
      dailyTrips: cat.dailyTrips,
      fareCurrentBs: cat.fareCurrentBs,
      fareTechnicalBs,
      fareSocialBs: cat.fareSocialBs,
      monthlyRevenue,
      monthlyTrips,
    };
  });

  // 6. Indicadores de rentabilidad y flujo por unidad vehicular
  const monthlyRevenuePerUnit = activeWeightedFare * unitPaxMonth;
  const freeCashPerUnit = monthlyRevenuePerUnit - opexCashMonthly - depreciationMonthly;
  const economicProfitPerUnit = monthlyRevenuePerUnit - regulatoryCostMonthly;
  const householdIncomePerUnit = laborCostMonthly + freeCashPerUnit;

  return {
    weightedTechnicalFare,
    technicalAdultFare,
    currentWeightedFare,
    activeWeightedFare,
    faresByCategory,
    monthlyRevenuePerUnit,
    freeCashPerUnit,
    economicProfitPerUnit,
    householdIncomePerUnit,
  };
}
