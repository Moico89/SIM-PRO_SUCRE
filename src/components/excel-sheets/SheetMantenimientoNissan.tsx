'use client';

import React, { useState, useMemo } from 'react';
import maintenanceData from '@/data/maintenanceItems.json';

interface SheetMantenimientoNissanProps {
  maintenanceMonthly: number;
}

export default function SheetMantenimientoNissan({ maintenanceMonthly }: SheetMantenimientoNissanProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');

  const items = useMemo(() => {
    return maintenanceData.map(item => {
      let system = 'Otros / Carrocería';
      const nameLower = item.name.toLowerCase();
      if (nameLower.includes('motor') || nameLower.includes('aceite de motor') || nameLower.includes('filtro') || nameLower.includes('anticongelante') || nameLower.includes('termostato') || nameLower.includes('ventilador')) {
        system = 'Motor y Refrigeración';
      } else if (nameLower.includes('embrague') || nameLower.includes('corona') || nameLower.includes('cardan') || nameLower.includes('diferencial') || nameLower.includes('transmisión')) {
        system = 'Transmisión y Tren Motriz';
      } else if (nameLower.includes('suspensión') || nameLower.includes('amortiguador') || nameLower.includes('muelle') || nameLower.includes('elástico') || nameLower.includes('estabilizadora')) {
        system = 'Suspensión y Ejes';
      } else if (nameLower.includes('dirección') || nameLower.includes('bomba hidráulica')) {
        system = 'Sistema de Dirección';
      } else if (nameLower.includes('freno') || nameLower.includes('balata') || nameLower.includes('tambor') || nameLower.includes('cilindro')) {
        system = 'Frenos y Seguridad';
      } else if (nameLower.includes('neumático') || nameLower.includes('cámara')) {
        system = 'Rodado y Neumáticos';
      } else if (nameLower.includes('batería') || nameLower.includes('alternador') || nameLower.includes('foco') || nameLower.includes('arranque')) {
        system = 'Sistema Eléctrico';
      }
      return { ...item, system };
    });
  }, []);

  const systemsList = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => set.add(i.system));
    return ['all', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.observations && item.observations.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchSystem = selectedSystem === 'all' || item.system === selectedSystem;
      return matchSearch && matchSystem;
    });
  }, [items, searchTerm, selectedSystem]);

  const totalAnnualAudit = 34082.00;
  const totalMonthlyAudit = 2840.17;
  const varPart = totalMonthlyAudit * 0.25137367; // 713.94
  const fixedPart = totalMonthlyAudit * 0.74862633; // 2126.22

  return (
    <div className="space-y-6">
      {/* Encabezado Institucional de la Hoja */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Planilla Maestra Oficial — Hoja MANTENIMIENTO_NISSAN
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Estructura Técnica de Mantenimiento Nissan Civilian (52 Ítems)
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Versión Rebajada Oficial v2 acordada entre el GAM Sucre y Ecotraffic Consultoría. 
              Sustituye la sobredimensión de la propuesta sindical reduciendo el costo mensual auditado en un 32,7%.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-right">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Costo Mensual Unitario</div>
              <div className="text-2xl font-black text-emerald-700">Bs. 2.840,17</div>
              <div className="text-[10px] text-slate-500">Bs. 34.082,00 / año por unidad</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards de Mantenimiento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Costo Total Anual</div>
          <div className="text-2xl font-black text-slate-900 mt-1">Bs. 34.082,00</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">49 componentes homologados</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Costo Total Mensual (v2)</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">Bs. 2.840,17</div>
          <div className="text-[11px] text-slate-500 mt-1">-32,7% rebaja sobre reclamo inicial</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Componente Variable (Km)</div>
          <div className="text-2xl font-black text-blue-700 mt-1">Bs. 713,94</div>
          <div className="text-[11px] text-slate-500 mt-1">25,14% | Bs. 0,3286 / km recorrido</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Componente Fijo (Tiempo)</div>
          <div className="text-2xl font-black text-purple-700 mt-1">Bs. 2.126,22</div>
          <div className="text-[11px] text-slate-500 mt-1">74,86% | Preventivo y correctivo periódico</div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="Buscar repuesto o sistema..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {systemsList.map(sys => (
            <button
              key={sys}
              onClick={() => setSelectedSystem(sys)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSystem === sys
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sys === 'all' ? 'Todos los Sistemas' : sys}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Oficial de los 52 Ítems */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Detalle Técnico de Repuestos e Insumos ({filteredItems.length} ítems listados)
          </div>
          <div className="text-xs text-slate-500">
            Unidad de referencia: Microbús Nissan Civilian 1990–1998
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">N°</th>
                <th className="py-2.5 px-3">Componente / Repuesto</th>
                <th className="py-2.5 px-3">Sistema</th>
                <th className="py-2.5 px-3 text-right">Insumos (Bs)</th>
                <th className="py-2.5 px-3 text-center">Cant.</th>
                <th className="py-2.5 px-3 text-right">M.O. (Bs)</th>
                <th className="py-2.5 px-3 text-right">Total Unit. (Bs)</th>
                <th className="py-2.5 px-3 text-center">Frecuencia</th>
                <th className="py-2.5 px-3 text-right">Costo Anual (Bs)</th>
                <th className="py-2.5 px-3">Observaciones Técnicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 text-center font-bold text-slate-400">{item.id}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="py-2 px-3 text-slate-500">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 font-medium">
                      {item.system}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">Bs. {item.suppliesCost.toFixed(2)}</td>
                  <td className="py-2 px-3 text-center font-medium">{item.quantity} {item.unit}</td>
                  <td className="py-2 px-3 text-right text-slate-500">
                    {item.laborCost > 0 ? `Bs. ${item.laborCost.toFixed(2)}` : 'Incluida'}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    Bs. {item.totalUnitCost.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-center text-slate-600">
                    {item.frequencyYears === 1 ? '1 año' : item.frequencyYears < 1 ? `${Math.round(item.frequencyYears * 12)} meses` : `${item.frequencyYears} años`}
                  </td>
                  <td className="py-2 px-3 text-right font-black text-emerald-800 bg-emerald-50/30">
                    Bs. {item.annualCost.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-[11px] max-w-xs truncate" title={item.observations}>
                    {item.observations || 'Estándar fabricante'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-900">
                <td colSpan={8} className="py-3 px-4 text-right uppercase text-xs tracking-wider">
                  TOTAL ANUAL AUDITADO (J54):
                </td>
                <td className="py-3 px-3 text-right text-sm text-emerald-300 font-black">
                  Bs. {totalAnnualAudit.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-xs text-slate-300 font-normal">
                  = Bs. 2.840,17 / mes
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
