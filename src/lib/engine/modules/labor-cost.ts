/**
 * Módulo de Costo Laboral — Motor Tarifario Universal
 * 
 * Calcula el costo mensual de personal por unidad vehicular.
 * Soporta múltiples choferes por vehículo (ej: BRT con 2 turnos).
 * 
 * Extraído de DashboardView.tsx L232:
 *   laborCost = params.driver_salary_bs * (1 + params.labor_charges_factor)
 */

export interface LaborCostInput {
  /** Salario mensual base del conductor (en moneda local) */
  driverSalary: number;
  /** Factor de cargas laborales (ej: aguinaldo 1/12 = 0.0833) */
  laborChargesFactor: number;
  /** Cantidad de conductores por unidad vehicular (default: 1) */
  driversPerVehicle?: number;
}

/**
 * Calcula el costo laboral mensual total por unidad vehicular.
 * 
 * Fórmula:
 *   costoLaboral = salario × (1 + factorCargas) × conductoresPorVehiculo
 */
export function calculateLaborCost(input: LaborCostInput): number {
  const {
    driverSalary,
    laborChargesFactor,
    driversPerVehicle = 1,
  } = input;

  if (driverSalary < 0) {
    throw new Error(`[engine/labor-cost] driverSalary no puede ser negativo: ${driverSalary}`);
  }

  return driverSalary * (1 + laborChargesFactor) * driversPerVehicle;
}
