/**
 * Módulo de Costo de Combustible — Motor Tarifario Universal
 * 
 * Calcula el costo mensual de combustible por unidad vehicular,
 * soportando múltiples tipos de energía (diésel, gasolina, GNV,
 * eléctrico, hidrógeno).
 * 
 * Decisión técnica: Vehículos eléctricos e hidrógeno no tienen
 * penalización por ralentí/congestión (no consumen combustible fósil
 * estando detenidos en la misma proporción que un motor de combustión).
 */

import type { FuelTypeCode } from '../types';

export interface FuelCostInput {
  /** Kilómetros mensuales recorridos por la unidad */
  kmPerUnitMonth: number;
  /** Rendimiento del vehículo (km por unidad de combustible) */
  fuelEfficiency: number;
  /** Precio por unidad de combustible (litro, m³, kWh, kg) */
  fuelPricePerUnit: number;
  /** Factor de sobreconsumo por ralentí/congestión (ej: 0.15 = 15%) */
  idleCongestionFactor: number;
  /** Tipo de combustible */
  fuelType: FuelTypeCode;
  /** Factor de ajuste de precio del escenario (default 1.0) */
  priceFactor?: number;
}

/** Tipos de combustible que NO tienen penalización por ralentí de combustión */
const ZERO_IDLE_FUEL_TYPES: ReadonlySet<FuelTypeCode> = new Set<FuelTypeCode>([
  'electric',
  'hydrogen',
]);

/**
 * Calcula el costo mensual de combustible para una unidad vehicular.
 * 
 * Fórmula base (combustión):
 *   costoMes = (kmMes / rendimiento) × precioUnitario × (1 + factorRalentí) × factorPrecio
 * 
 * Fórmula eléctricos/hidrógeno:
 *   costoMes = (kmMes / rendimiento) × precioUnitario × factorPrecio
 *   (sin penalización por ralentí)
 */
export function calculateFuelCost(input: FuelCostInput): number {
  const {
    kmPerUnitMonth,
    fuelEfficiency,
    fuelPricePerUnit,
    idleCongestionFactor,
    fuelType,
    priceFactor = 1.0,
  } = input;

  if (fuelEfficiency <= 0) {
    throw new Error(`[engine/fuel-cost] fuelEfficiency debe ser > 0, recibido: ${fuelEfficiency}`);
  }

  const baseConsumption = kmPerUnitMonth / fuelEfficiency;
  const effectivePrice = fuelPricePerUnit * priceFactor;

  const congestionMultiplier = ZERO_IDLE_FUEL_TYPES.has(fuelType)
    ? 1.0
    : (1 + idleCongestionFactor);

  return baseConsumption * effectivePrice * congestionMultiplier;
}

/**
 * Calcula las unidades de combustible consumidas mensualmente.
 * Útil para reportes de consumo y huella ambiental.
 */
export function calculateFuelConsumption(input: Omit<FuelCostInput, 'fuelPricePerUnit' | 'priceFactor'>): number {
  const { kmPerUnitMonth, fuelEfficiency, idleCongestionFactor, fuelType } = input;

  if (fuelEfficiency <= 0) {
    throw new Error(`[engine/fuel-cost] fuelEfficiency debe ser > 0, recibido: ${fuelEfficiency}`);
  }

  const baseConsumption = kmPerUnitMonth / fuelEfficiency;
  const congestionMultiplier = ZERO_IDLE_FUEL_TYPES.has(fuelType)
    ? 1.0
    : (1 + idleCongestionFactor);

  return baseConsumption * congestionMultiplier;
}
