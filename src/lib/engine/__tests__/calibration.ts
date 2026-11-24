/**
 * Test de Verificación y Calibración — Motor Tarifario Universal
 * 
 * Valida que los cálculos del motor coincidan exactamente con:
 * 1. Planilla Maestra Nissan Civilian (Bs. 2.840,17 / mes)
 * 2. Costo Regulatorio Total (Bs. 18.761,02 / mes)
 * 3. Tarifa Técnica Ponderada (Bs. 2,6818)
 * 4. Tarifa Técnica de Adulto (Bs. 3,44)
 */

import { calculateTariffSystem } from '../calculator';
import type { TariffCalculationInput } from '../types';

const sucreNissanBaseline: TariffCalculationInput = {
  fleetActive: 987.0,
  kmNetworkDay: 82475.0,
  demandNetworkDay: 265569.0,
  operatingDaysMonth: 26,
  turnsDay: 3.0,

  fuelType: {
    code: 'diesel',
    name: 'Diésel Oil',
    unit: 'litros',
    co2EmissionFactor: 2.68,
  },
  fuelPricePerUnit: 20.57,
  fuelEfficiency: 5.50,
  idleCongestionFactor: 0.1500,

  driverSalary: 3300.0,
  laborChargesFactor: 0.0833333333,
  driversPerVehicle: 1,

  maintenanceMonthly: 2840.17,
  maintenanceVarShare: 0.2513736712,
  maintenanceFixedShare: 0.7486263288,
  otherFixedMonthly: 720.42,

  vehicleReplacementValue: 198360.0,
  vehicleResidualValue: 0.0,
  vehicleUsefulLifeMonths: 120,
  capitalReturnRateAnnual: 0.1100,

  fareCategories: [
    { name: 'Adultos', demandShare: 0.58, dailyTrips: 154030, fareCurrentBs: 4.50, fareSocialBs: 3.50 },
    { name: 'Adultos mayores', demandShare: 0.07, dailyTrips: 18590, fareCurrentBs: 3.50, fareSocialBs: 2.50 },
    { name: 'Universitarios', demandShare: 0.18, dailyTrips: 47802, fareCurrentBs: 2.50, fareSocialBs: 2.00 },
    { name: 'Colegiales', demandShare: 0.10, dailyTrips: 26557, fareCurrentBs: 1.50, fareSocialBs: 1.50 },
    { name: 'Escolares', demandShare: 0.05, dailyTrips: 13278, fareCurrentBs: 1.00, fareSocialBs: 1.50 },
    { name: 'Discapacidad / menores de 5', demandShare: 0.02, dailyTrips: 5311, fareCurrentBs: 0.00, fareSocialBs: 0.00 },
  ],
};

export function runCalibrationTest() {
  console.log('--- INICIANDO TEST DE CALIBRACIÓN MOTOR TARIFARIO UNIVERSAL ---');
  const result = calculateTariffSystem(sucreNissanBaseline);

  console.log(`Km/unidad/mes: ${result.kmPerUnitMonth.toFixed(2)}`);
  console.log(`Pax/unidad/mes: ${result.paxPerUnitMonth.toFixed(2)}`);
  console.log(`IPK Sistema: ${result.ipkSystem.toFixed(4)}`);
  console.log(`Combustible mensual: Bs. ${result.costs.fuel.toFixed(2)}`);
  console.log(`Laboral mensual: Bs. ${result.costs.laborTotal.toFixed(2)}`);
  console.log(`Mantenimiento Var: Bs. ${result.costs.maintenanceVariable.toFixed(2)}`);
  console.log(`Mantenimiento Fijo: Bs. ${result.costs.maintenanceFixed.toFixed(2)}`);
  console.log(`OPEX Efectivo Caja: Bs. ${result.costs.opexCash.toFixed(2)}`);
  console.log(`Depreciación mensual: Bs. ${result.costs.depreciation.toFixed(2)}`);
  console.log(`Retorno Capital (WACC): Bs. ${result.costs.capitalReturn.toFixed(2)}`);
  console.log(`Costo Regulatorio Total: Bs. ${result.costs.totalRegulatory.toFixed(2)}`);
  console.log(`Tarifa Ponderada Técnica: Bs. ${result.weightedTechnicalFare.toFixed(4)}`);
  console.log(`Tarifa Adulto Técnica: Bs. ${result.technicalAdultFare.toFixed(4)}`);

  // Aserciones de calibración estricta
  const adultFareRounded = result.technicalAdultFare.toFixed(2);
  const maintRounded = (result.costs.maintenanceVariable + result.costs.maintenanceFixed).toFixed(2);
  const regRounded = result.costs.totalRegulatory.toFixed(2);

  const regNum = Number(regRounded);
  const passed =
    adultFareRounded === '3.66' &&
    maintRounded === '2840.17' &&
    Math.abs(regNum - 19951.22) <= 0.05;

  if (passed) {
    console.log('\n✅ CALIBRACIÓN EXITOSA: Los valores coinciden exactamente con el ajuste diésel Bs. 20,57 (D.S. 5716)!');
  } else {
    console.error(`\n❌ ERROR DE CALIBRACIÓN: Adulto: ${adultFareRounded} (esperado 3.66), Mantenimiento: ${maintRounded} (esperado 2840.17), Reg: ${regRounded} (esperado 19951.22)`);
    process.exit(1);
  }
}
runCalibrationTest();
