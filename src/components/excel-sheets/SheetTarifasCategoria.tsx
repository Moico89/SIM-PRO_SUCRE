'use client';

import React from 'react';
import type { FareCategory } from '@/types/database';
import type { ScenarioConfig } from '@/types/scenario';

interface SheetTarifasCategoriaProps {
  fares: FareCategory[];
  activeScenario: ScenarioConfig;
  activeScenarioId: string;
  technicalAdultFare: number;
  technicalWeighted: number;
  activeWeightedFare: number;
  currentWeighted: number;
  demandDay: number;
  fmt: (num: number, decimals?: number) => string;
}

const SheetTarifasCategoria: React.FC<SheetTarifasCategoriaProps> = ({
  fares,
  activeScenario,
  activeScenarioId,
  technicalAdultFare,
  technicalWeighted,
  activeWeightedFare,
  currentWeighted,
  demandDay,
  fmt
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Matriz de Tarifas por Categoría Social</h3>
        <p className="text-[11px] text-slate-500">
          Comparación de recaudación bajo el escenario activo: <strong>{activeScenario.label}</strong>
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <th className="p-3">Categoría Social</th>
              <th className="p-3 text-right">% Demanda</th>
              <th className="p-3 text-right">Viajes / Día</th>
              <th className="p-3 text-right">Vigente (Bs)</th>
              <th className="p-3 text-right">Técnica Eq. (Bs)</th>
              <th className="p-3 text-right bg-emerald-50 text-emerald-900">Escenario Activo (Bs)</th>
              <th className="p-3 text-right">Dif. s/ Técnica</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fares.map(f => {
              let activeCatFare = f.fare_social_2_bs;
              if (activeScenarioId === 'social1') activeCatFare = f.fare_social_1_bs;
              else if (activeScenarioId === 'social2') activeCatFare = f.fare_social_2_bs;
              else if (activeScenarioId === 'technical') activeCatFare = f.fare_technical_bs;
              else if (activeScenarioId === 'current') activeCatFare = f.fare_current_bs;
              else if (activeScenario.isCustom && activeScenario.socialFares) {
                if (f.name.includes('Adultos mayores')) activeCatFare = activeScenario.socialFares.adultosMayores;
                else if (f.name.includes('Universitarios')) activeCatFare = activeScenario.socialFares.universitarios;
                else if (f.name.includes('Colegiales')) activeCatFare = activeScenario.socialFares.colegiales;
                else if (f.name.includes('Escolares')) activeCatFare = activeScenario.socialFares.escolares;
                else if (f.name.includes('Discapacidad')) activeCatFare = 0;
                else activeCatFare = activeScenario.adultFare;
              }

              const techFareVal = (f.name.includes('Adultos') && !f.name.includes('mayores')) 
                ? technicalAdultFare 
                : f.fare_technical_bs;

              return (
                <tr key={f.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">{f.name}</td>
                  <td className="p-3 text-right font-mono">{fmt(f.demand_share * 100, 1)}%</td>
                  <td className="p-3 text-right font-mono">{fmt(f.daily_trips, 0)}</td>
                  <td className="p-3 text-right font-mono">Bs. {fmt(f.fare_current_bs, 2)}</td>
                  <td className="p-3 text-right font-mono">Bs. {fmt(techFareVal, 4)}</td>
                  <td className="p-3 text-right font-mono font-bold bg-emerald-50/50 text-emerald-900">
                    Bs. {fmt(activeCatFare, 2)}
                  </td>
                  <td className={`p-3 text-right font-mono font-semibold ${
                    activeCatFare - techFareVal >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {activeCatFare - techFareVal >= 0 ? '+' : ''}
                    {fmt(activeCatFare - techFareVal, 4)}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
              <td className="p-3">PROMEDIO PONDERADO</td>
              <td className="p-3 text-right">100.0%</td>
              <td className="p-3 text-right">{fmt(demandDay, 0)}</td>
              <td className="p-3 text-right">Bs. {fmt(currentWeighted, 4)}</td>
              <td className="p-3 text-right">Bs. {fmt(technicalWeighted, 4)}</td>
              <td className="p-3 text-right bg-emerald-100 text-emerald-950 font-black">
                Bs. {fmt(activeWeightedFare, 4)}
              </td>
              <td className="p-3 text-right text-emerald-700 font-black">
                +{fmt(activeWeightedFare - technicalWeighted, 4)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(SheetTarifasCategoria);
