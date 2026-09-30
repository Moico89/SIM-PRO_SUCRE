'use client';

import React from 'react';

interface SheetEconomiaPropietarioProps {
  currentScenarioRevenue?: number;
  currentScenarioHouseholdIncome?: number;
}

export default function SheetEconomiaPropietario() {
  const columns = [
    {
      key: 'vigente',
      label: 'Tarifa Vigente (Obs.)',
      sublabel: 'Adulto Bs. 4,50',
      badge: 'HISTÓRICO',
      badgeColor: 'bg-slate-100 text-slate-700',
      fareWeighted: 3.5050,
      kmMes: 2172.59,
      paxMes: 6995.74,
      grossRev: 24520.06,
      fuel: 8154.14,
      maint: 2840.17,
      labor: 3575.00,
      admin: 720.42,
      opex: 15289.72,
      cashSurplus: 9230.34,
      debt: 0.00,
      cashAfterDebt: 9230.34,
      deprec: 1653.00,
      freeCash: 7577.34,
      wacc: 1818.30,
      economicProfit: 5759.04,
      driverSalary: 3575.00,
      householdIncome: 11152.34,
      isRecommend: false
    },
    {
      key: 'tecnica',
      label: 'Tarifa Técnica (Eq.)',
      sublabel: 'Adulto Bs. 3,44',
      badge: 'EQUILIBRIO',
      badgeColor: 'bg-blue-100 text-blue-800',
      fareWeighted: 2.6818,
      kmMes: 2172.59,
      paxMes: 6995.74,
      grossRev: 18761.02,
      fuel: 8154.14,
      maint: 2840.17,
      labor: 3575.00,
      admin: 720.42,
      opex: 15289.72,
      cashSurplus: 3471.30,
      debt: 0.00,
      cashAfterDebt: 3471.30,
      deprec: 1653.00,
      freeCash: 1818.30,
      wacc: 1818.30,
      economicProfit: 0.00,
      driverSalary: 3575.00,
      householdIncome: 5393.30,
      isRecommend: false
    },
    {
      key: 'social',
      label: 'Tarifa Social Propuesta',
      sublabel: 'Adulto Bs. 4,00 (Social 3)',
      badge: 'CONCERTACIÓN',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      fareWeighted: 3.0400,
      kmMes: 2172.59,
      paxMes: 6995.74,
      grossRev: 21267.05,
      fuel: 8154.14,
      maint: 2840.17,
      labor: 3575.00,
      admin: 720.42,
      opex: 15289.72,
      cashSurplus: 5977.32,
      debt: 0.00,
      cashAfterDebt: 5977.32,
      deprec: 1653.00,
      freeCash: 4324.32,
      wacc: 1818.30,
      economicProfit: 2506.02,
      driverSalary: 3575.00,
      householdIncome: 7899.32,
      isRecommend: true
    },
    {
      key: 'estres',
      label: 'Escenario de Estrés',
      sublabel: '-10% pax / +15% diésel',
      badge: 'SENSIBILIDAD',
      badgeColor: 'bg-amber-100 text-amber-800',
      fareWeighted: 3.5050,
      kmMes: 2172.59,
      paxMes: 6296.16,
      grossRev: 22068.06,
      fuel: 9377.26,
      maint: 2840.17,
      labor: 3575.00,
      admin: 720.42,
      opex: 16512.84,
      cashSurplus: 5555.21,
      debt: 0.00,
      cashAfterDebt: 5555.21,
      deprec: 1653.00,
      freeCash: 3902.21,
      wacc: 1818.30,
      economicProfit: 2083.91,
      driverSalary: 3575.00,
      householdIncome: 7477.21,
      isRecommend: false
    }
  ];

  const rows = [
    { title: 'Tarifa ponderada de pasaje (Bs/viaje)', field: 'fareWeighted', format: (v: number) => `Bs. ${v.toFixed(4)}` },
    { title: 'Kilómetros recorridos por unidad/mes', field: 'kmMes', format: (v: number) => `${v.toFixed(2)} km` },
    { title: 'Pasajeros transportados por unidad/mes', field: 'paxMes', format: (v: number) => `${Math.round(v).toLocaleString('es-BO')} pax` },
    { title: 'RECAUDACIÓN BRUTA MENSUAL', field: 'grossRev', isBold: true, format: (v: number) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` },
    { title: 'Combustible efectivo (Bs/mes)', field: 'fuel', format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'Mantenimiento auditado v2 (Bs/mes)', field: 'maint', format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'Remuneración laboral chofer + aguinaldo (Bs/mes)', field: 'labor', format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'Otros costos fijos en efectivo (Bs/mes)', field: 'admin', format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'TOTAL OPEX EFECTIVO EN CAJA (Bs/mes)', field: 'opex', isBold: true, isOpex: true, format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'Excedente operativo de caja (Bs/mes)', field: 'cashSurplus', format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'Servicio de deuda individual (Bs/mes)', field: 'debt', format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'Caja después de deuda (Bs/mes)', field: 'cashAfterDebt', format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'Reserva para reposición / Deprec. (Bs/mes)', field: 'deprec', format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'CAJA LIBRE DESPUÉS DE RESERVA (Bs/mes)', field: 'freeCash', isBold: true, format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'Retorno regulatorio al capital (11% WACC)', field: 'wacc', format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'UTILIDAD ECONÓMICA EXCEDENTE (Bs/mes)', field: 'economicProfit', isBold: true, isHighlight: true, format: (v: number) => `Bs. ${v.toFixed(2)}` },
    { title: 'Remuneración por conducir (Sueldo Chofer)', field: 'driverSalary', format: (v: number) => `Bs. ${v.toFixed(2)}` }
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Planilla Maestra Oficial — Hoja ECONOMIA_PROPIETARIO
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Economía del Transportista: Doble Cuenta Financiera
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Flujo Real de Caja del Hogar Propietario vs. Cuenta Económica Regulatoria Oficial. Compara cómo impacta cada tarifa en el bolsillo del operador y en la sostenibilidad de la unidad.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-right">
            <div>
              <div className="text-[10px] font-bold uppercase text-emerald-800">Ingreso Hogar Propuesta Social (Bs. 4,00)</div>
              <div className="text-2xl font-black text-emerald-700">Bs. 7.899,32 / mes</div>
              <div className="text-[10px] text-emerald-800 font-medium">Sueldo chofer + Retorno capital + Caja libre</div>
            </div>
          </div>
        </div>
      </div>

      {/* Matriz Comparativa Oficial */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Cuadro de Doble Cuenta: Caja Familiar vs. Cuenta Regulatoria (Unidad / Mes)
          </h3>
          <span className="text-[11px] text-slate-500">Valores auditados v3.2.1</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-72">Concepto Financiero</th>
                {columns.map(col => (
                  <th key={col.key} className={`py-3 px-3 text-right ${col.isRecommend ? 'bg-emerald-50/80 text-emerald-950 font-black' : ''}`}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${col.badgeColor}`}>
                        {col.badge}
                      </span>
                    </div>
                    <div className="text-xs font-black mt-1 text-slate-900">{col.label}</div>
                    <div className="text-[10px] font-medium text-slate-500">{col.sublabel}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`hover:bg-slate-50/80 transition-colors ${
                    row.isOpex ? 'bg-amber-50/30' : row.isHighlight ? 'bg-emerald-50/20' : ''
                  }`}
                >
                  <td className={`py-2 px-4 ${row.isBold ? 'font-black text-slate-950 text-xs' : 'text-slate-600'}`}>
                    {row.title}
                  </td>
                  {columns.map(col => {
                    const val = (col as any)[row.field];
                    return (
                      <td 
                        key={col.key} 
                        className={`py-2 px-3 text-right ${
                          row.isBold ? 'font-black text-slate-900' : 'font-medium'
                        } ${col.isRecommend ? 'bg-emerald-50/30 text-emerald-950' : ''}`}
                      >
                        {row.format ? row.format(val) : val}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Fila Especial: INGRESO TOTAL DEL HOGAR */}
              <tr className="bg-slate-900 text-white font-black border-t-2 border-slate-900">
                <td className="py-3 px-4 uppercase text-xs tracking-wider">
                  INGRESO TOTAL DEL HOGAR (CAJA FAMILIAR):
                </td>
                {columns.map(col => (
                  <td 
                    key={col.key} 
                    className={`py-3 px-3 text-right text-sm ${
                      col.isRecommend ? 'text-emerald-300 font-black' : 'text-slate-200'
                    }`}
                  >
                    Bs. {col.householdIncome.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
