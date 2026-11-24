/**
 * Validadores de Esquema Zod — Motor Tarifario Universal
 * 
 * Garantiza type safety en runtime para entradas de API, Server Actions
 * y AI Tool Calling.
 */

import { z } from 'zod';

export const FuelTypeCodeSchema = z.enum([
  'diesel',
  'gasoline',
  'gnv',
  'electric',
  'hybrid_diesel',
  'hybrid_gasoline',
  'hydrogen',
]);

export const FuelTypeConfigSchema = z.object({
  code: FuelTypeCodeSchema,
  name: z.string().min(1, 'El nombre de combustible es requerido'),
  unit: z.string().min(1, 'La unidad de medida es requerida'),
  energyDensityMjPerUnit: z.number().positive().optional(),
  co2EmissionFactor: z.number().nonnegative().optional(),
});

export const FareCategoryInputSchema = z.object({
  name: z.string().min(1),
  demandShare: z.number().min(0).max(1),
  dailyTrips: z.number().nonnegative(),
  fareCurrentBs: z.number().nonnegative(),
  fareSocialBs: z.number().nonnegative(),
});

export const RouteInputSchema = z.object({
  id: z.union([z.number(), z.string()]),
  unionName: z.string().min(1),
  lineName: z.string().min(1),
  cycleDistanceKm: z.number().positive(),
  assignedFleet: z.number().positive(),
});

export const TariffCalculationInputSchema = z.object({
  organizationId: z.string().optional(),
  vehicleTypeId: z.string().optional(),
  sessionId: z.string().optional(),

  fleetActive: z.number().int().positive('La flota activa debe ser mayor a 0'),
  kmNetworkDay: z.number().positive('El kilometraje diario debe ser positivo'),
  demandNetworkDay: z.number().positive('La demanda diaria debe ser positiva'),
  operatingDaysMonth: z.number().int().min(1).max(31),
  turnsDay: z.number().positive(),

  fuelType: FuelTypeConfigSchema,
  fuelPricePerUnit: z.number().positive('El precio de combustible debe ser positivo'),
  fuelEfficiency: z.number().positive('El rendimiento debe ser positivo'),
  idleCongestionFactor: z.number().min(0).max(1),

  driverSalary: z.number().nonnegative('El salario no puede ser negativo'),
  laborChargesFactor: z.number().min(0).max(1),
  driversPerVehicle: z.number().int().min(1).default(1),

  maintenanceMonthly: z.number().nonnegative(),
  maintenanceVarShare: z.number().min(0).max(1),
  maintenanceFixedShare: z.number().min(0).max(1),
  otherFixedMonthly: z.number().nonnegative(),

  vehicleReplacementValue: z.number().positive(),
  vehicleResidualValue: z.number().nonnegative(),
  vehicleUsefulLifeMonths: z.number().int().positive(),
  capitalReturnRateAnnual: z.number().min(0).max(1),

  fareCategories: z.array(FareCategoryInputSchema).min(1, 'Debe haber al menos 1 categoría tarifaria'),

  demandFactor: z.number().positive().default(1.0).optional(),
  fuelPriceFactor: z.number().positive().default(1.0).optional(),

  routes: z.array(RouteInputSchema).optional(),
  routeConciliationFactor: z.number().positive().optional(),
});

export type ValidatedTariffCalculationInput = z.infer<typeof TariffCalculationInputSchema>;
