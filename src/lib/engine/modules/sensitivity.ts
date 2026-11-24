/**
 * Módulo de Sensibilidad y Estrés — Motor Tarifario Universal
 * 
 * Evalúa matrices de sensibilidad multivariable:
 * - Variación de precio de combustible (-30% a +50%)
 * - Variación de demanda de pasajeros (-30% a +30%)
 * - Escenarios de estrés regulatorio y choque económico
 */

import type { TariffCalculationInput, TariffCalculationOutput } from '../types';

export interface SensitivityMatrixPoint {
  demandFactor: number;
  fuelPriceFactor: number;
  weightedTechnicalFare: number;
  technicalAdultFare: number;
  monthlyBalancePerUnit: number;
  opexCash: number;
}

export interface SensitivityMatrix {
  demandFactors: number[];
  fuelPriceFactors: number[];
  grid: SensitivityMatrixPoint[][];
}

/**
 * Genera una matriz de sensibilidad evaluando combinaciones de demanda y combustible.
 * 
 * @param calculateFn Función de cálculo del orquestador principal
 * @param baseInput Parámetros base del sistema
 * @param demandSteps Factores de demanda a probar (ej: [0.8, 0.9, 1.0, 1.1])
 * @param fuelSteps Factores de combustible a probar (ej: [0.8, 1.0, 1.2, 1.5])
 */
export function generateSensitivityMatrix(
  calculateFn: (input: TariffCalculationInput) => TariffCalculationOutput,
  baseInput: TariffCalculationInput,
  demandSteps: number[] = [0.8, 0.9, 1.0, 1.1, 1.2],
  fuelSteps: number[] = [0.8, 1.0, 1.2, 1.4, 1.6]
): SensitivityMatrix {
  const grid: SensitivityMatrixPoint[][] = [];

  for (const dFactor of demandSteps) {
    const row: SensitivityMatrixPoint[] = [];
    for (const fFactor of fuelSteps) {
      const scenarioInput: TariffCalculationInput = {
        ...baseInput,
        demandFactor: dFactor,
        fuelPriceFactor: fFactor,
      };

      const result = calculateFn(scenarioInput);

      row.push({
        demandFactor: dFactor,
        fuelPriceFactor: fFactor,
        weightedTechnicalFare: result.weightedTechnicalFare,
        technicalAdultFare: result.technicalAdultFare,
        monthlyBalancePerUnit: result.economicProfitPerUnit,
        opexCash: result.costs.opexCash,
      });
    }
    grid.push(row);
  }

  return {
    demandFactors: demandSteps,
    fuelPriceFactors: fuelSteps,
    grid,
  };
}
