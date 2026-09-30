'use client';

import React from 'react';
import type { SystemParameters } from '@/types/database';

interface SheetSupuestosParametrosProps {
  params: SystemParameters;
}

export default function SheetSupuestosParametros({ params }: SheetSupuestosParametrosProps) {
  const kmMes = (params.km_network_day / params.fleet_active) * params.operating_days_month;
  const paxMes = (params.demand_network_day / params.fleet_active) * params.operating_days_month;
  const kmDiaUnidad = params.km_network_day / params.fleet_active;
  const paxDiaUnidad = params.demand_network_day / params.fleet_active;
  const ipk = params.demand_network_day / params.km_network_day;

  return (
    <div className="space-y-6">
      {/* Encabezado Institucional */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Planilla Maestra Oficial — Hoja SUPUESTOS_PARAMETROS
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Parámetros Operativos, Productividad de Red y Supuestos Macroeconómicos
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Variables estructurales del sistema urbano de transporte masivo de Sucre. Base oficial para el cálculo de costos de operación vehicular (COV) y equilibrio financiero.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500">IPK de Red</div>
              <div className="text-xl font-black text-blue-700">{ipk.toFixed(2)} pax/km</div>
              <div className="text-[10px] text-slate-500">265.569 pax / 82.475 km</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 1: Escenarios Operativos de Red */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            1. Escenarios Operativos de Red (Referencia Técnica del Estudio)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">ID</th>
                <th className="py-2.5 px-3">Escenario Operativo</th>
                <th className="py-2.5 px-3 text-center">Flota Activa</th>
                <th className="py-2.5 px-3 text-right">km Red / Día</th>
                <th className="py-2.5 px-3 text-right">Pasajeros / Día</th>
                <th className="py-2.5 px-3 text-center">Días / Mes</th>
                <th className="py-2.5 px-3 text-center">Vueltas / Día</th>
                <th className="py-2.5 px-3">Uso Metodológico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="bg-emerald-50/40 font-semibold">
                <td className="py-2.5 px-3 text-center text-emerald-800 font-black">1</td>
                <td className="py-2.5 px-3 text-emerald-950 font-bold">
                  Base observada del estudio (Oficial)
                  <span className="ml-2 inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">ACTIVO</span>
                </td>
                <td className="py-2.5 px-3 text-center font-black text-slate-900">987 micros</td>
                <td className="py-2.5 px-3 text-right font-bold">82.475 km</td>
                <td className="py-2.5 px-3 text-right font-bold">265.569 pax</td>
                <td className="py-2.5 px-3 text-center">26</td>
                <td className="py-2.5 px-3 text-center">3,0</td>
                <td className="py-2.5 px-3 text-emerald-900 text-[11px]">Referencia primaria auditada para concertación GAM Sucre</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 text-center text-slate-400">2</td>
                <td className="py-2.5 px-3">Calibración 32 rutas previa</td>
                <td className="py-2.5 px-3 text-center text-slate-600">874 micros</td>
                <td className="py-2.5 px-3 text-right text-slate-600">84.783 km</td>
                <td className="py-2.5 px-3 text-right text-slate-600">273.000 pax</td>
                <td className="py-2.5 px-3 text-center text-slate-600">26</td>
                <td className="py-2.5 px-3 text-center text-slate-600">3,5</td>
                <td className="py-2.5 px-3 text-slate-500 text-[11px]">Comparabilidad histórica con versión previa de consultoría</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 text-center text-slate-400">3</td>
                <td className="py-2.5 px-3">Eficiencia operacional optimizada</td>
                <td className="py-2.5 px-3 text-center text-slate-600">800 micros</td>
                <td className="py-2.5 px-3 text-right text-slate-600">85.317 km</td>
                <td className="py-2.5 px-3 text-right text-slate-600">265.569 pax</td>
                <td className="py-2.5 px-3 text-center text-slate-600">26</td>
                <td className="py-2.5 px-3 text-center text-slate-600">3,85</td>
                <td className="py-2.5 px-3 text-slate-500 text-[11px]">Escenario de optimización y reorganización de frecuencias</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 2: Productividad de Red y Sección 3: Parámetros Económicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloque 2: Productividad de Red */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Parámetros Activos y Productividad de Red
            </h3>
          </div>
          <div className="p-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Flota activa en operación comercial:</span>
              <span className="font-bold text-slate-900">{params.fleet_active} microbuses</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Producción de red auditada (GPS satelital):</span>
              <span className="font-bold text-slate-900">{params.km_network_day.toLocaleString('es-BO')} km/día</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Demanda diaria total de pasajeros:</span>
              <span className="font-bold text-slate-900">{params.demand_network_day.toLocaleString('es-BO')} pax/día</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Días de operación comercial al mes:</span>
              <span className="font-bold text-slate-900">{params.operating_days_month} días / mes</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Vueltas medias por día por unidad:</span>
              <span className="font-bold text-slate-900">{params.turns_day.toFixed(1)} vueltas / día</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Kilometraje medio por microbús / día:</span>
              <span className="font-bold text-blue-700">{kmDiaUnidad.toFixed(2)} km / día</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Kilometraje mensual por microbús:</span>
              <span className="font-bold text-blue-800">{kmMes.toFixed(2)} km / mes</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Pasajeros medios transportados por unidad / día:</span>
              <span className="font-bold text-slate-900">{paxDiaUnidad.toFixed(1)} pax / día</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Pasajeros mensuales transportados por unidad:</span>
              <span className="font-bold text-slate-900">{paxMes.toFixed(1)} pax / mes</span>
            </div>
            <div className="flex justify-between items-center py-1.5 bg-blue-50/50 px-2 rounded-lg">
              <span className="font-bold text-blue-900">Índice de Pasajeros por Kilómetro (IPK):</span>
              <span className="font-black text-blue-950 text-sm">{ipk.toFixed(4)} pax / km</span>
            </div>
          </div>
        </div>

        {/* Bloque 3: Parámetros Económicos de la Unidad */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Parámetros Económicos del Microbús (Nissan Civilian)
            </h3>
          </div>
          <div className="p-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Salario mensual conductor profesional:</span>
              <span className="font-bold text-slate-900">Bs. {params.driver_salary_bs.toFixed(2)} / mes</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Cargas sociales y aguinaldo (8,33%):</span>
              <span className="font-bold text-slate-900">Bs. {(params.driver_salary_bs * params.labor_charges_factor).toFixed(2)} / mes</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Precio regulado del Diésel:</span>
              <span className="font-bold text-amber-700">Bs. {params.fuel_price_bs_l.toFixed(2)} / litro</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Rendimiento Diésel base:</span>
              <span className="font-bold text-slate-900">{params.fuel_efficiency_km_l.toFixed(2)} km / litro</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Factor sobrecosto ralentí / congestión (+15%):</span>
              <span className="font-bold text-slate-900">{(params.idle_congestion_factor * 100).toFixed(0)}% adicional</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Mantenimiento mensual auditado v2:</span>
              <span className="font-bold text-emerald-700">Bs. {params.maintenance_monthly_bs.toFixed(2)} / mes</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Valor de reposición vehicular a nuevo:</span>
              <span className="font-bold text-slate-900">Bs. {params.vehicle_replacement_value_bs.toLocaleString('es-BO')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Vida útil regulatoria:</span>
              <span className="font-bold text-slate-900">{params.vehicle_useful_life_months} meses (10 años)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-600">Depreciación / Reserva reposición mensual:</span>
              <span className="font-bold text-slate-900">Bs. {(params.vehicle_replacement_value_bs / params.vehicle_useful_life_months).toFixed(2)} / mes</span>
            </div>
            <div className="flex justify-between items-center py-1.5 bg-purple-50/50 px-2 rounded-lg">
              <span className="font-bold text-purple-900">Retorno Justo al Capital (WACC 11% anual):</span>
              <span className="font-black text-purple-950 text-sm">
                Bs. {((params.vehicle_replacement_value_bs * params.capital_return_rate_annual) / 12).toFixed(2)} / mes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
