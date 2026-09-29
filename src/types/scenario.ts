export interface ScenarioConfig {
  id: string;
  label: string;
  badge?: string;
  adultFare: number;
  socialFares: {
    adultos: number;
    adultosMayores: number;
    universitarios: number;
    colegiales: number;
    escolares: number;
    discapacidad: number;
  };
  demandFactor: number;
  fuelPriceFactor: number;
  color?: string;
  isCustom?: boolean;
}
