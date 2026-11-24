'use client';

import React from 'react';

export interface CalculatedRouteRow {
  id: number;
  union: string;
  line: string;
  distance: number;
  fleet: number;
  kmMes: number;
  paxMes: number;
  routeRev: number;
  routeReg: number;
  routeProfit: number;
  isDeficit: boolean;
}

interface SheetRentabilidadRutasProps {
  calculatedRoutes: CalculatedRouteRow[];
  deficitRoutesCount: number;
  activeScenarioLabel: string;
  fmt: (num: number, decimals?: number) => string;
}

const SheetRentabilidadRutas: React.FC<SheetRentabilidadRutasProps> = ({
  calculatedRoutes,
  deficitRoutesCount,
  activeScenarioLabel,
  fmt
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Rentabilidad de las 32 Rutas Urbanas</h3>
          <p className="text-[11px] text-slate-500">
            Conciliación de red (Factor: 1,0050) bajo el escenario activo: <strong>{activeScenarioLabel}</strong>
          </p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
          {deficitRoutesCount} rutas deficitarias / {calculatedRoutes?.length || 0} totales
        </span>
      </div>

      <div className="overflow-x-auto max-h-[500px] rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-50 shadow-xs z-10">
            <tr className="border-b border-slate-200 text-slate-700 font-bold">
              <th className="p-2.5">ID</th>
              <th className="p-2.5">Sindicato</th>
              <th className="p-2.5">Línea de Transporte</th>
              <th className="p-2.5 text-right">Ciclo (km)</th>
              <th className="p-2.5 text-right">Flota</th>
              <th className="p-2.5 text-right">km / Mes</th>
              <th className="p-2.5 text-right">Pax / Mes</th>
              <th className="p-2.5 text-right">Recaudación</th>
              <th className="p-2.5 text-right">Costo Reg.</th>
              <th className="p-2.5 text-right">Utilidad Excedente</th>
              <th className="p-2.5 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {calculatedRoutes.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-2.5 text-slate-400 font-mono">{r.id}</td>
                <td className="p-2.5 font-semibold text-slate-700">{r.union}</td>
                <td className="p-2.5 font-bold text-slate-900">{r.line}</td>
                <td className="p-2.5 text-right font-mono">{fmt(r.distance, 1)}</td>
                <td className="p-2.5 text-right font-mono">{fmt(r.fleet, 1)}</td>
                <td className="p-2.5 text-right font-mono">{fmt(r.kmMes, 0)}</td>
                <td className="p-2.5 text-right font-mono">{fmt(r.paxMes, 0)}</td>
                <td className="p-2.5 text-right font-mono">Bs. {fmt(r.routeRev, 0)}</td>
                <td className="p-2.5 text-right font-mono">Bs. {fmt(r.routeReg, 0)}</td>
                <td className={`p-2.5 text-right font-mono font-bold ${
                  r.routeProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  Bs. {fmt(r.routeProfit, 0)}
                </td>
                <td className="p-2.5 text-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    r.isDeficit 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {r.isDeficit ? 'DÉFICIT' : 'CUBRE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(SheetRentabilidadRutas);
