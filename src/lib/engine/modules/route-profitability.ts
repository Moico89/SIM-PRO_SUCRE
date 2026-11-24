/**
 * Módulo de Rentabilidad por Ruta — Motor Tarifario Universal
 * 
 * Modela la economía operativa y regulatoria de cada ruta de la red:
 * - Kilometraje y pasajeros mensuales proyectados según IPK y vueltas.
 * - Costos operativos específicos de la ruta (combustible, mantenimiento variable prorrateado por km, etc.).
 * - Balance financiero y detección de rutas deficitarias vs superavitarias.
 */

import type { ComputedRoute, RouteInput, FuelTypeCode } from '../types';
import { calculateFuelCost } from './fuel-cost';

export interface RouteProfitabilityInput {
  routes: RouteInput[];
  turnsDay: number;
  operatingDaysMonth: number;
  ipkSystem: number;
  unitKmMonth: number;
  activeWeightedFare: number;
  // Parámetros de costo
  fuelEfficiency: number;
  fuelPricePerUnit: number;
  idleCongestionFactor: number;
  fuelType: FuelTypeCode;
  fuelPriceFactor?: number;
  // Costos fijos y variables por unidad
  maintVarPerUnit: number;
  maintFixedPerUnit: number;
  laborCostPerUnit: number;
  otherFixedPerUnit: number;
  depreciationPerUnit: number;
  capitalReturnPerUnit: number;
  // Factor de ajuste de conciliación
  conciliationFactor?: number;
}

export interface RouteProfitabilityOutput {
  routes: ComputedRoute[];
  deficitRoutesCount: number;
  totalNetworkRevenue: number;
  totalNetworkRegulatoryCost: number;
  totalNetworkProfit: number;
}

export function computeRouteProfitability(input: RouteProfitabilityInput): RouteProfitabilityOutput {
  const {
    routes,
    turnsDay,
    operatingDaysMonth,
    ipkSystem,
    unitKmMonth,
    activeWeightedFare,
    fuelEfficiency,
    fuelPricePerUnit,
    idleCongestionFactor,
    fuelType,
    fuelPriceFactor = 1.0,
    maintVarPerUnit,
    maintFixedPerUnit,
    laborCostPerUnit,
    otherFixedPerUnit,
    depreciationPerUnit,
    capitalReturnPerUnit,
    conciliationFactor = 1.004978,
  } = input;

  let totalNetworkRevenue = 0;
  let totalNetworkRegulatoryCost = 0;

  const calculatedRoutes: ComputedRoute[] = routes.map((r) => {
    const kmMes = r.cycleDistanceKm * turnsDay * conciliationFactor * operatingDaysMonth;
    const paxMes = kmMes * ipkSystem;

    // Costo de combustible para el kilometraje de esta ruta
    const fuel = calculateFuelCost({
      kmPerUnitMonth: kmMes,
      fuelEfficiency,
      fuelPricePerUnit,
      idleCongestionFactor,
      fuelType,
      priceFactor: fuelPriceFactor,
    });

    // Mantenimiento variable prorrateado por km (con respecto a unidad media)
    const mk = unitKmMonth > 0 ? maintVarPerUnit * (kmMes / unitKmMonth) : maintVarPerUnit;

    const routeOpex = fuel + mk + maintFixedPerUnit + laborCostPerUnit + otherFixedPerUnit;
    const routeRegulatoryCost = routeOpex + depreciationPerUnit + capitalReturnPerUnit;
    const routeRevenue = paxMes * activeWeightedFare;
    const routeProfit = routeRevenue - routeRegulatoryCost;

    totalNetworkRevenue += routeRevenue;
    totalNetworkRegulatoryCost += routeRegulatoryCost;

    return {
      id: r.id,
      unionName: r.unionName,
      lineName: r.lineName,
      cycleDistanceKm: r.cycleDistanceKm,
      assignedFleet: r.assignedFleet,
      kmMonth: kmMes,
      paxMonth: paxMes,
      routeOpex,
      routeRegulatoryCost,
      routeRevenue,
      routeProfit,
      isDeficit: routeProfit < 0,
    };
  });

  const deficitRoutesCount = calculatedRoutes.filter((r) => r.isDeficit).length;
  const totalNetworkProfit = totalNetworkRevenue - totalNetworkRegulatoryCost;

  return {
    routes: calculatedRoutes,
    deficitRoutesCount,
    totalNetworkRevenue,
    totalNetworkRegulatoryCost,
    totalNetworkProfit,
  };
}
