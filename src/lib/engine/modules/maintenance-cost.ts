/**
 * Módulo de Costo de Mantenimiento — Motor Tarifario Universal
 * 
 * Calcula el costo de mantenimiento mensual desglosado en componente variable
 * (proporcional al kilometraje recorrido) y componente fijo (por disponibilidad).
 * 
 * Soporta dos modalidades:
 * 1. Parámetros consolidados (mantenimiento mensual + distribución variable/fijo).
 * 2. Plantilla dinámica de ítems con frecuencias y costos unitarios.
 * 
 * Calibración oficial Sucre (Nissan Civilian):
 *   - Total anual: Bs. 34.082,00
 *   - Total mensual: Bs. 2.840,17
 *   - Proporción variable: 50%
 *   - Proporción fija: 50%
 */

import type { MaintenanceItem, MaintenanceTemplate } from '../types';

export interface MaintenanceCostInput {
  /** Costo mensual consolidado de mantenimiento (en moneda local) */
  maintenanceMonthly: number;
  /** Proporción del costo asignada a variable (0..1, ej: 0.50) */
  maintenanceVarShare: number;
  /** Proporción del costo asignada a fijo (0..1, ej: 0.50) */
  maintenanceFixedShare: number;
  /** (Opcional) Kilometraje mensual de la unidad para prorrateos específicos */
  unitKmMonth?: number;
}

export interface MaintenanceCostOutput {
  /** Componente variable mensual */
  maintenanceVariable: number;
  /** Componente fijo mensual */
  maintenanceFixed: number;
  /** Costo mensual total de mantenimiento */
  maintenanceTotalMonthly: number;
}

/**
 * Calcula los componentes variable y fijo del costo de mantenimiento mensual.
 */
export function calculateMaintenanceCost(input: MaintenanceCostInput): MaintenanceCostOutput {
  const {
    maintenanceMonthly,
    maintenanceVarShare,
    maintenanceFixedShare,
  } = input;

  if (maintenanceMonthly < 0) {
    throw new Error(`[engine/maintenance-cost] maintenanceMonthly no puede ser negativo: ${maintenanceMonthly}`);
  }

  const maintenanceVariable = maintenanceMonthly * maintenanceVarShare;
  const maintenanceFixed = maintenanceMonthly * maintenanceFixedShare;

  return {
    maintenanceVariable,
    maintenanceFixed,
    maintenanceTotalMonthly: maintenanceMonthly,
  };
}

/**
 * Consolida una lista de ítems de mantenimiento en una plantilla con totales
 * anuales y mensuales exactos.
 */
export function consolidateMaintenanceTemplate(
  name: string,
  items: MaintenanceItem[],
  variableShare: number = 0.50,
  fixedShare: number = 0.50
): MaintenanceTemplate {
  const totalAnnualCost = items.reduce((acc, item) => {
    const itemAnnual = item.annualCost ?? (item.totalUnitCost * item.frequencyPerYear);
    return acc + itemAnnual;
  }, 0);

  const totalMonthlyCost = totalAnnualCost / 12;

  return {
    name,
    items,
    totalAnnualCost,
    totalMonthlyCost,
    variableShare,
    fixedShare,
  };
}
