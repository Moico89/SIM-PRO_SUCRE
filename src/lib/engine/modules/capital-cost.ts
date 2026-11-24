/**
 * Módulo de Costo de Capital — Motor Tarifario Universal
 * 
 * Modela la componente CAPEX y retribución financiera regulatoria:
 * 1. Depreciación lineal mensual del vehículo (reposición menos valor residual entre vida útil en meses).
 * 2. Retorno al capital (WACC / Costo Promedio Ponderado de Capital) regulatorio mensual.
 * 
 * Extraído y parametrizado de DashboardView.tsx L236-237:
 *   depreciation = (replacementValue - residualValue) / usefulLifeMonths
 *   allowedReturn = (replacementValue - residualValue) * (waccAnnual / 12)
 */

export interface CapitalCostInput {
  /** Valor de reposición de la unidad nueva (en moneda local) */
  vehicleReplacementValue: number;
  /** Valor residual o de rescate al final de la vida útil */
  vehicleResidualValue: number;
  /** Vida útil regulatoria en meses (ej: 120 meses = 10 años) */
  vehicleUsefulLifeMonths: number;
  /** Tasa regulatoria de retorno al capital anual WACC (ej: 0.11 = 11%) */
  capitalReturnRateAnnual: number;
}

export interface CapitalCostOutput {
  /** Depreciación mensual */
  depreciationMonthly: number;
  /** Retorno al capital regulatorio mensual (WACC) */
  capitalReturnMonthly: number;
  /** Subtotal de costo de capital mensual */
  capitalTotalMonthly: number;
}

/**
 * Calcula la depreciación y el retorno al capital regulatorio mensual por unidad.
 */
export function calculateCapitalCost(input: CapitalCostInput): CapitalCostOutput {
  const {
    vehicleReplacementValue,
    vehicleResidualValue,
    vehicleUsefulLifeMonths,
    capitalReturnRateAnnual,
  } = input;

  if (vehicleUsefulLifeMonths <= 0) {
    throw new Error(
      `[engine/capital-cost] vehicleUsefulLifeMonths debe ser > 0, recibido: ${vehicleUsefulLifeMonths}`
    );
  }

  const depreciableBase = vehicleReplacementValue - vehicleResidualValue;
  if (depreciableBase < 0) {
    throw new Error(
      `[engine/capital-cost] El valor residual (${vehicleResidualValue}) no puede exceder el valor de reposición (${vehicleReplacementValue})`
    );
  }

  const depreciationMonthly = depreciableBase / vehicleUsefulLifeMonths;
  const capitalReturnMonthly = depreciableBase * (capitalReturnRateAnnual / 12);
  const capitalTotalMonthly = depreciationMonthly + capitalReturnMonthly;

  return {
    depreciationMonthly,
    capitalReturnMonthly,
    capitalTotalMonthly,
  };
}
