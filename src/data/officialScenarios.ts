import type { ScenarioConfig } from '@/types/scenario';

// Escenarios oficiales del sistema predefinidos (incluyendo Social 3 creado en concertación)
export const OFFICIAL_SCENARIOS: ScenarioConfig[] = [
  {
    id: 'social2',
    label: 'Social 2 (Bs. 3,50)',
    badge: 'RECOMENDADO',
    adultFare: 3.50,
    socialFares: { adultos: 3.50, adultosMayores: 2.50, universitarios: 2.00, colegiales: 1.50, escolares: 1.50, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-emerald-700 font-extrabold',
    isCustom: false
  },
  {
    id: 'social3',
    label: 'Social 3 (Bs. 4,00)',
    badge: 'ACCESIBLE',
    adultFare: 4.00,
    socialFares: { adultos: 4.00, adultosMayores: 3.00, universitarios: 2.00, colegiales: 1.00, escolares: 1.00, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-emerald-800 font-bold',
    isCustom: false
  },
  {
    id: 'social1',
    label: 'Social 1 (Bs. 3,80)',
    adultFare: 3.80,
    socialFares: { adultos: 3.80, adultosMayores: 3.00, universitarios: 2.00, colegiales: 1.50, escolares: 1.00, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-slate-700',
    isCustom: false
  },
  {
    id: 'technical',
    label: 'Técnica (Bs. 3,44)',
    badge: 'EQUILIBRIO',
    adultFare: 3.4431,
    socialFares: { adultos: 3.4431, adultosMayores: 2.6780, universitarios: 1.9128, colegiales: 1.1477, escolares: 0.7651, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-blue-700',
    isCustom: false
  },
  {
    id: 'current',
    label: 'Vigente (Bs. 4,50)',
    adultFare: 4.50,
    socialFares: { adultos: 4.50, adultosMayores: 3.50, universitarios: 2.50, colegiales: 1.50, escolares: 1.00, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-slate-700',
    isCustom: false
  },
  {
    id: 'stress',
    label: 'Estrés (-10% / +15%)',
    adultFare: 4.50,
    socialFares: { adultos: 4.50, adultosMayores: 3.50, universitarios: 2.50, colegiales: 1.50, escolares: 1.00, discapacidad: 0 },
    demandFactor: 0.90,
    fuelPriceFactor: 1.15,
    color: 'text-amber-700',
    isCustom: false
  }
];
