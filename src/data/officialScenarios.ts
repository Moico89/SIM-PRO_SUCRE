import type { ScenarioConfig } from '@/types/scenario';

// Escenarios oficiales del sistema calibrados a Diésel Bs. 20,57/l (D.S. 5716 / ANH)
export const OFFICIAL_SCENARIOS: ScenarioConfig[] = [
  {
    id: 'social1',
    label: 'Social 1 (Bs. 4,00)',
    badge: 'RECOMENDADO',
    adultFare: 4.00,
    socialFares: { adultos: 4.00, adultosMayores: 3.00, universitarios: 2.00, colegiales: 1.00, escolares: 1.00, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-emerald-700 font-extrabold',
    isCustom: false
  },
  {
    id: 'social2',
    label: 'Social 2 (Bs. 3,50)',
    badge: 'DÉFICIT',
    adultFare: 3.50,
    socialFares: { adultos: 3.50, adultosMayores: 2.50, universitarios: 2.00, colegiales: 1.50, escolares: 1.50, discapacidad: 0 },
    demandFactor: 1.0,
    fuelPriceFactor: 1.0,
    color: 'text-rose-700 font-extrabold',
    isCustom: false
  },
  {
    id: 'technical',
    label: 'Técnica (Bs. 3,66)',
    badge: 'EQUILIBRIO',
    adultFare: 3.6615,
    socialFares: { adultos: 3.6615, adultosMayores: 2.8479, universitarios: 2.0342, colegiales: 1.2205, escolares: 0.8137, discapacidad: 0 },
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
