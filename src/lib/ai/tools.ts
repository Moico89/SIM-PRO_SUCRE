/**
 * Herramientas de IA (Tool Calling) para Tarify OS
 * 
 * Esquemas de herramientas expuestas al Asistente IA (Gemini).
 * Todas las funciones están tipadas estrictamente y conectadas
 * directamente al Motor de Cálculo Tarifario Universal.
 */

import { calculateTariffSystem } from '../engine/calculator';
import type { TariffCalculationInput, FuelTypeCode } from '../engine/types';
import { OFFICIAL_SCENARIOS } from '@/data/officialScenarios';
import type { ScenarioConfig } from '@/types/scenario';

export const AI_TOOLS_DECLARATIONS = [
  {
    name: 'calcular_tarifa',
    description:
      'Calcula la tarifa técnica regulatoria, la tarifa de adulto homologada, el OPEX efectivo y los flujos financieros para una configuración de flota, vehículo y combustible.',
    parameters: {
      type: 'object',
      properties: {
        fuel_type: {
          type: 'string',
          enum: ['diesel', 'gasoline', 'gnv', 'electric', 'hybrid_diesel', 'hydrogen'],
          description: 'Tipo de combustible o energía del vehículo',
        },
        fuel_price: {
          type: 'number',
          description: 'Precio por unidad de combustible (litro, m³, kWh, kg)',
        },
        fuel_efficiency: {
          type: 'number',
          description: 'Rendimiento vehicular en km por unidad de combustible',
        },
        fleet_active: {
          type: 'number',
          description: 'Número de unidades activas en la red',
        },
        driver_salary: {
          type: 'number',
          description: 'Salario mensual base del conductor',
        },
        vehicle_replacement_value: {
          type: 'number',
          description: 'Valor de adquisición o reposición del vehículo nuevo',
        },
        demand_factor: {
          type: 'number',
          description: 'Factor multiplicador de demanda (1.0 = normal, 0.8 = -20%)',
        },
        fuel_price_factor: {
          type: 'number',
          description: 'Factor multiplicador de precio de combustible (1.0 = normal)',
        },
      },
      required: ['fuel_type'],
    },
  },
  {
    name: 'comparar_tecnologias',
    description:
      'Compara dos o más tecnologías vehiculares o tipos de combustible (ej: Diésel vs Eléctrico vs GNV) para una misma red de transporte, mostrando ahorro mensual y emisiones de CO₂.',
    parameters: {
      type: 'object',
      properties: {
        technologies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Nombre de la tecnología (ej: "Bus Diésel", "Bus Eléctrico BYD")' },
              fuel_type: { type: 'string', enum: ['diesel', 'gasoline', 'gnv', 'electric', 'hybrid_diesel', 'hydrogen'] },
              fuel_price: { type: 'number', description: 'Precio unitario del combustible' },
              fuel_efficiency: { type: 'number', description: 'km por unidad' },
              vehicle_replacement_value: { type: 'number', description: 'Costo del vehículo' },
              maintenance_monthly: { type: 'number', description: 'Mantenimiento mensual estimado' },
            },
            required: ['label', 'fuel_type', 'fuel_price', 'fuel_efficiency'],
          },
          description: 'Lista de tecnologías vehiculares a contrastar',
        },
      },
      required: ['technologies'],
    },
  },
  {
    name: 'explicar_desglose_costos',
    description:
      'Proporciona la fórmula y la explicación pedagógica paso a paso de cómo se compone la tarifa técnica adulta y el costo regulatorio total.',
    parameters: {
      type: 'object',
      properties: {
        tarifa_adulto: { type: 'number', description: 'Tarifa adulto a explicar (ej: 3.44)' },
      },
    },
  },
  {
    name: 'listar_escenarios',
    description:
      'Lista todos los escenarios de concertación tarifaria disponibles (Social 1, Social 2, Técnica, Vigente, Estrés) con sus tarifas por categoría.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'evaluar_escenario',
    description:
      'Evalúa la viabilidad económica de un escenario de concertación: tarifa ponderada, recaudación por unidad, caja libre, beneficio económico, ingreso familiar del operador y brecha contra la tarifa técnica. Usar SIEMPRE que el usuario mencione un escenario (Social 1, Social 2, técnica, vigente, estrés) o una tarifa adulto propuesta.',
    parameters: {
      type: 'object',
      properties: {
        scenario_id: {
          type: 'string',
          enum: ['social1', 'social2', 'technical', 'current', 'stress'],
          description: 'ID del escenario oficial',
        },
        adult_fare_override: {
          type: 'number',
          description: 'Tarifa adulto personalizada (si el usuario propone un valor no oficial)',
        },
      },
    },
  },
];

/** Mapea las tarifas sociales de un escenario a las categorías de demanda del motor */
function applyScenarioFares(scenario: ScenarioConfig, adultOverride?: number) {
  const sf = scenario.socialFares;
  return DEFAULT_BASELINE.fareCategories.map((cat) => {
    const n = cat.name.toLowerCase();
    let fare = adultOverride ?? sf.adultos;
    if (n.includes('mayores')) fare = sf.adultosMayores;
    else if (n.includes('universitarios')) fare = sf.universitarios;
    else if (n.includes('colegiales')) fare = sf.colegiales;
    else if (n.includes('escolares')) fare = sf.escolares;
    else if (n.includes('discapacidad')) fare = sf.discapacidad;
    return { ...cat, fareSocialBs: fare };
  });
}

function evaluateScenario(scenarioId?: string, adultOverride?: number) {
  const scenario =
    OFFICIAL_SCENARIOS.find((s) => s.id === scenarioId) ??
    OFFICIAL_SCENARIOS.find((s) => s.id === 'social2');
  if (!scenario) throw new Error('[ai/tools] Catálogo de escenarios vacío');

  const result = calculateTariffSystem({
    ...DEFAULT_BASELINE,
    fareCategories: applyScenarioFares(scenario, adultOverride),
    demandFactor: scenario.demandFactor,
    fuelPriceFactor: scenario.fuelPriceFactor,
  });

  const adultFare = adultOverride ?? scenario.adultFare;
  const brecha = adultFare - result.technicalAdultFare;
  const coberturaCosto = (result.monthlyRevenuePerUnit / result.costs.totalRegulatory) * 100;

  return {
    escenario: adultOverride ? `Personalizado (Bs. ${adultOverride.toFixed(2)})` : scenario.label,
    tarifas_por_categoria: applyScenarioFares(scenario, adultOverride).map((c) => ({
      categoria: c.name,
      participacion_demanda: `${(c.demandShare * 100).toFixed(0)}%`,
      tarifa_bs: Number(c.fareSocialBs.toFixed(2)),
    })),
    tarifa_adulto: Number(adultFare.toFixed(2)),
    tarifa_adulto_tecnica: Number(result.technicalAdultFare.toFixed(2)),
    brecha_vs_tecnica_bs: Number(brecha.toFixed(2)),
    tarifa_ponderada_escenario: Number(result.activeWeightedFare.toFixed(4)),
    tarifa_ponderada_tecnica: Number(result.weightedTechnicalFare.toFixed(4)),
    recaudacion_mensual_unidad: Number(result.monthlyRevenuePerUnit.toFixed(2)),
    costo_regulatorio_mensual: Number(result.costs.totalRegulatory.toFixed(2)),
    cobertura_costo_regulatorio_pct: Number(coberturaCosto.toFixed(1)),
    beneficio_economico_mensual: Number(result.economicProfitPerUnit.toFixed(2)),
    caja_libre_mensual: Number(result.freeCashPerUnit.toFixed(2)),
    ingreso_familiar_operador: Number(result.householdIncomePerUnit.toFixed(2)),
    rutas_deficitarias: result.deficitRoutesCount ?? null,
    veredicto:
      result.economicProfitPerUnit >= 0
        ? 'SOSTENIBLE: cubre el costo regulatorio completo (OPEX + depreciación + WACC).'
        : result.freeCashPerUnit >= 0
          ? 'SOSTENIBLE EN CAJA: cubre OPEX y depreciación pero no la retribución completa al capital (WACC).'
          : 'DEFICITARIO: no cubre OPEX + depreciación; requiere compensación municipal.',
  };
}

/**
 * Plantilla base por defecto para Sucre (se utiliza para completar campos no especificados)
 */
const DEFAULT_BASELINE: TariffCalculationInput = {
  fleetActive: 987.0,
  kmNetworkDay: 82475.0,
  demandNetworkDay: 265569.0,
  operatingDaysMonth: 26,
  turnsDay: 3.0,
  fuelType: { code: 'diesel', name: 'Diésel Oil', unit: 'litros', co2EmissionFactor: 2.68 },
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

const FUEL_CONFIGS: Record<FuelTypeCode, { name: string; unit: string; co2: number; defaultPrice: number; defaultEff: number }> = {
  diesel: { name: 'Diésel Oil', unit: 'litros', co2: 2.68, defaultPrice: 20.57, defaultEff: 5.5 },
  gasoline: { name: 'Gasolina', unit: 'litros', co2: 2.31, defaultPrice: 3.74, defaultEff: 6.2 },
  gnv: { name: 'Gas Natural Vehicular', unit: 'm³', co2: 1.88, defaultPrice: 1.66, defaultEff: 4.8 },
  electric: { name: 'Electricidad', unit: 'kWh', co2: 0.45, defaultPrice: 0.85, defaultEff: 1.1 },
  hybrid_diesel: { name: 'Híbrido Diésel', unit: 'litros', co2: 2.14, defaultPrice: 20.57, defaultEff: 8.0 },
  hybrid_gasoline: { name: 'Híbrido Gasolina', unit: 'litros', co2: 1.85, defaultPrice: 3.74, defaultEff: 9.5 },
  hydrogen: { name: 'Hidrógeno Verde', unit: 'kg', co2: 0.0, defaultPrice: 35.0, defaultEff: 10.0 },
};

/**
 * Ejecutor de herramientas invocadas por el modelo de IA
 */
export async function executeAiTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name === 'calcular_tarifa') {
    const fuelCode = (args.fuel_type as FuelTypeCode) || 'diesel';
    const fuelMeta = FUEL_CONFIGS[fuelCode] || FUEL_CONFIGS.diesel;

    const input: TariffCalculationInput = {
      ...DEFAULT_BASELINE,
      fuelType: {
        code: fuelCode,
        name: fuelMeta.name,
        unit: fuelMeta.unit,
        co2EmissionFactor: fuelMeta.co2,
      },
      fuelPricePerUnit: typeof args.fuel_price === 'number' ? args.fuel_price : fuelMeta.defaultPrice,
      fuelEfficiency: typeof args.fuel_efficiency === 'number' ? args.fuel_efficiency : fuelMeta.defaultEff,
      fleetActive: typeof args.fleet_active === 'number' ? args.fleet_active : DEFAULT_BASELINE.fleetActive,
      driverSalary: typeof args.driver_salary === 'number' ? args.driver_salary : DEFAULT_BASELINE.driverSalary,
      vehicleReplacementValue:
        typeof args.vehicle_replacement_value === 'number'
          ? args.vehicle_replacement_value
          : DEFAULT_BASELINE.vehicleReplacementValue,
      demandFactor: typeof args.demand_factor === 'number' ? args.demand_factor : 1.0,
      fuelPriceFactor: typeof args.fuel_price_factor === 'number' ? args.fuel_price_factor : 1.0,
    };

    const result = calculateTariffSystem(input);

    return {
      combustible: fuelMeta.name,
      precio_unitario: input.fuelPricePerUnit,
      rendimiento_km_unidad: input.fuelEfficiency,
      tarifa_tecnica_ponderada: Number(result.weightedTechnicalFare.toFixed(4)),
      tarifa_adulto_tecnica: Number(result.technicalAdultFare.toFixed(2)),
      costo_regulatorio_total_mensual: Number(result.costs.totalRegulatory.toFixed(2)),
      opex_efectivo_mensual: Number(result.costs.opexCash.toFixed(2)),
      depreciacion_mensual: Number(result.costs.depreciation.toFixed(2)),
      retorno_capital_wacc_mensual: Number(result.costs.capitalReturn.toFixed(2)),
      emision_co2_kg_mes_unidad: result.co2MonthlyPerUnit ? Number(result.co2MonthlyPerUnit.toFixed(1)) : null,
    };
  }

  if (name === 'comparar_tecnologias') {
    const techs = (args.technologies as Array<{
      label: string;
      fuel_type: FuelTypeCode;
      fuel_price: number;
      fuel_efficiency: number;
      vehicle_replacement_value?: number;
      maintenance_monthly?: number;
    }>) || [];

    const comparativa = techs.map((t) => {
      const fuelMeta = FUEL_CONFIGS[t.fuel_type] || FUEL_CONFIGS.diesel;
      const input: TariffCalculationInput = {
        ...DEFAULT_BASELINE,
        fuelType: { code: t.fuel_type, name: fuelMeta.name, unit: fuelMeta.unit, co2EmissionFactor: fuelMeta.co2 },
        fuelPricePerUnit: t.fuel_price,
        fuelEfficiency: t.fuel_efficiency,
        vehicleReplacementValue: t.vehicle_replacement_value ?? (t.fuel_type === 'electric' ? 350000 : DEFAULT_BASELINE.vehicleReplacementValue),
        maintenanceMonthly: t.maintenance_monthly ?? (t.fuel_type === 'electric' ? 1400.0 : DEFAULT_BASELINE.maintenanceMonthly),
      };

      const res = calculateTariffSystem(input);
      return {
        tecnologia: t.label,
        combustible: fuelMeta.name,
        tarifa_adulto_tecnica: Number(res.technicalAdultFare.toFixed(2)),
        costo_combustible_mes: Number(res.costs.fuel.toFixed(2)),
        mantenimiento_mes: Number((res.costs.maintenanceVariable + res.costs.maintenanceFixed).toFixed(2)),
        opex_total_mes: Number(res.costs.opexCash.toFixed(2)),
        costo_regulatorio_mes: Number(res.costs.totalRegulatory.toFixed(2)),
        co2_kg_mes: res.co2MonthlyPerUnit ? Number(res.co2MonthlyPerUnit.toFixed(1)) : 0,
      };
    });

    return { comparativa };
  }

  if (name === 'explicar_desglose_costos') {
    return {
      formula_adulto: 'Tarifa Adulto Técnica = Tarifa Ponderada Técnica × (Tarifa Adulto Vigente / Tarifa Ponderada Vigente)',
      ejemplo_sucre: '2.6818 × (4.50 / 3.5050) = 3.4431 → Bs. 3,44',
      componentes_costo: [
        { componente: 'Combustible (Diésel)', proporcion_aprox: '43.5%', descripcion: 'Km recorridos / rendimiento × precio × congestión' },
        { componente: 'Mantenimiento (52 ítems)', proporcion_aprox: '15.1%', descripcion: 'Bs. 2.840,17/mes por unidad (mitad variable, mitad fija)' },
        { componente: 'Salario chofer + aguinaldo', proporcion_aprox: '19.1%', descripcion: 'Bs. 3.300 × 1.0833 = Bs. 3.575,00/mes' },
        { componente: 'Depreciación del vehículo', proporcion_aprox: '8.8%', descripcion: 'Reposición Bs. 198.360 en 120 meses = Bs. 1.653,00/mes' },
        { componente: 'Retorno al capital (WACC 11%)', proporcion_aprox: '9.7%', descripcion: 'Retribución regulatoria al capital invertido = Bs. 1.818,30/mes' },
        { componente: 'Otros fijos / garaje / seguros', proporcion_aprox: '3.8%', descripcion: 'Bs. 720,42/mes' },
      ],
    };
  }

  if (name === 'listar_escenarios') {
    return OFFICIAL_SCENARIOS.map((s) => ({
      id: s.id,
      nombre: s.label,
      etiqueta: s.badge ?? null,
      tarifa_adulto: s.adultFare,
      tarifas_sociales: s.socialFares,
      factor_demanda: s.demandFactor,
      factor_combustible: s.fuelPriceFactor,
    }));
  }

  if (name === 'evaluar_escenario') {
    const scenarioId = typeof args.scenario_id === 'string' ? args.scenario_id : undefined;
    const override = typeof args.adult_fare_override === 'number' ? args.adult_fare_override : undefined;
    return evaluateScenario(scenarioId, override);
  }

  throw new Error(`Herramienta no reconocida: ${name}`);
}
