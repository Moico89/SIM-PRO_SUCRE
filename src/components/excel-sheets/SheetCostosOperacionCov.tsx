'use client';

import React from 'react';
import type { SystemParameters } from '@/types/database';

interface SheetCostosOperacionCovProps {
  params: SystemParameters;
  fuelPrice: number;
  maintenanceMonthly: number;
}

export default function SheetCostosOperacionCov({ params, fuelPrice, maintenanceMonthly }: SheetCostosOperacionCovProps) {
  const kmMes = (params.km_network_day / params.fleet_active) * params.operating_days_month;
  const paxMes = (params.demand_network_day / params.fleet_active) * params.operating_days_month;

  // A. Costos Variables
  const fuelMonthly = (kmMes / params.fuel_efficiency_km_l) * fuelPrice * (1 + params.idle_congestion_factor);
  const maintVarMonthly = maintenanceMonthly * params.maintenance_var_share;
  const subtotalA = fuelMonthly + maintVarMonthly;

  // B. Costos Fijos
  const maintFixedMonthly = maintenanceMonthly * params.maintenance_fixed_share;
  const driverSalary = params.driver_salary_bs;
  const laborCharges = driverSalary * params.labor_charges_factor;
  const soat = 445 / 12; // 37.08
  const imp = 700 / 12; // 58.33
  const itv = 30 / 12; // 2.50
  const sindicato = 200.00;
  const rodaje = 10 * params.operating_days_month; // 260.00
  const tarjetaOp = 150 / 12; // 12.50
  const seguroTerceros = 150.00;
  const adminTotal = soat + imp + itv + sindicato + rodaje + tarjetaOp + seguroTerceros; // 720.42

  const subtotalB = maintFixedMonthly + driverSalary + laborCharges + adminTotal;
  const opexTotal = subtotalA + subtotalB;

  // C. Costos de Capital
  const depreciation = (params.vehicle_replacement_value_bs - params.vehicle_residual_value_bs) / params.vehicle_useful_life_months;
  const wacc = (params.vehicle_replacement_value_bs - params.vehicle_residual_value_bs) * (params.capital_return_rate_annual / 12);
  const subtotalC = depreciation + wacc;

  // Costo Regulatorio Total
  const regulatoryTotal = opexTotal + subtotalC;
  const costPerKm = regulatoryTotal / kmMes;
  const techFareWeighted = regulatoryTotal / paxMes;
  const currentWeighted = 3.5050;
  const techAdultFare = techFareWeighted * (4.50 / currentWeighted); // 3.4431 -> 3.44

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Planilla Maestra Oficial — Hoja COSTOS_OPERACION_COV
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Estructura Integral de Costos de Operación Vehicular (COV)
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Desglose metodológico de Costos Variables, Fijos en Efectivo y Costos de Capital para el microbús patrón Nissan Civilian.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl text-right">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Costo Regulatorio Total</div>
              <div className="text-2xl font-black text-indigo-700">Bs. {regulatoryTotal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-slate-500">Bs. {costPerKm.toFixed(2)} / km | Tarifa Adulto Eq: <strong className="text-slate-900">Bs. {techAdultFare.toFixed(2)}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards de Resumen COV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subtotal Variables (A)</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            Bs. {subtotalA.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{((subtotalA / regulatoryTotal) * 100).toFixed(1)}% del costo regulatorio total</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subtotal Fijos Efectivo (B)</div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            Bs. {subtotalB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{((subtotalB / regulatoryTotal) * 100).toFixed(1)}% del costo regulatorio total</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">OPEX Efectivo en Caja (A+B)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            Bs. {opexTotal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">{((opexTotal / regulatoryTotal) * 100).toFixed(1)}% desembolsos operativos</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Costos de Capital (C)</div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            Bs. {subtotalC.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Reposición (Bs. 1.653) + WACC (Bs. 1.818)</div>
        </div>
      </div>

      {/* Tabla Oficial de Estructura COV */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Planilla Oficial de Costos por Unidad / Mes (COV Auditado)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Grupo</th>
                <th className="py-2.5 px-3">Componente del Costo</th>
                <th className="py-2.5 px-3">Base de Cálculo Auditada</th>
                <th className="py-2.5 px-3 text-right">Bs / Mes</th>
                <th className="py-2.5 px-3 text-right">Bs / Km</th>
                <th className="py-2.5 px-3 text-right">% OPEX</th>
                <th className="py-2.5 px-3 text-right">% Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* SECCIÓN A */}
              <tr className="bg-blue-50/60 font-bold text-blue-950">
                <td colSpan={3} className="py-2 px-3 uppercase text-[11px]">
                  A. Costos Variables (Directamente dependientes del kilometraje)
                </td>
                <td className="py-2 px-3 text-right">Bs. {subtotalA.toFixed(2)}</td>
                <td className="py-2 px-3 text-right">Bs. {(subtotalA / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right">{((subtotalA / opexTotal) * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right">{((subtotalA / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-500">Combustible</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Diésel Oíl (+15% factor congestión)</td>
                <td className="py-2 px-3 text-slate-500">Rendimiento 5,50 km/l | Bs. {fuelPrice.toFixed(2)}/l</td>
                <td className="py-2 px-3 text-right font-medium">Bs. {fuelMonthly.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-500">Bs. {(fuelMonthly / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right text-slate-600">{((fuelMonthly / opexTotal) * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right text-slate-600">{((fuelMonthly / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-500">Mantenimiento</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Mantenimiento variable por km (25,14%)</td>
                <td className="py-2 px-3 text-slate-500">Aceites, filtros, balatas, neumáticos</td>
                <td className="py-2 px-3 text-right font-medium">Bs. {maintVarMonthly.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-500">Bs. {(maintVarMonthly / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right text-slate-600">{((maintVarMonthly / opexTotal) * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right text-slate-600">{((maintVarMonthly / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>

              {/* SECCIÓN B */}
              <tr className="bg-amber-50/60 font-bold text-amber-950">
                <td colSpan={3} className="py-2 px-3 uppercase text-[11px]">
                  B. Costos Fijos en Efectivo (Independientes del kilometraje)
                </td>
                <td className="py-2 px-3 text-right">Bs. {subtotalB.toFixed(2)}</td>
                <td className="py-2 px-3 text-right">Bs. {(subtotalB / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right">{((subtotalB / opexTotal) * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right">{((subtotalB / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-500">Mantenimiento</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Mantenimiento fijo en el tiempo (74,86%)</td>
                <td className="py-2 px-3 text-slate-500">Preventivo y correctivo periódico</td>
                <td className="py-2 px-3 text-right font-medium">Bs. {maintFixedMonthly.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-500">Bs. {(maintFixedMonthly / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right text-slate-600">{((maintFixedMonthly / opexTotal) * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right text-slate-600">{((maintFixedMonthly / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-500">Personal</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Remuneración Conductor Profesional</td>
                <td className="py-2 px-3 text-slate-500">1 chofer profesional por microbús</td>
                <td className="py-2 px-3 text-right font-medium">Bs. {driverSalary.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-500">Bs. {(driverSalary / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right text-slate-600">{((driverSalary / opexTotal) * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right text-slate-600">{((driverSalary / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-500">Personal</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Cargas Sociales y Provisión Aguinaldo</td>
                <td className="py-2 px-3 text-slate-500">8,33% sobre salario mensual</td>
                <td className="py-2 px-3 text-right font-medium">Bs. {laborCharges.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-500">Bs. {(laborCharges / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right text-slate-600">{((laborCharges / opexTotal) * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right text-slate-600">{((laborCharges / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-500">Administrativo</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Gastos Administrativos, Seguros y Tasas</td>
                <td className="py-2 px-3 text-slate-500">SOAT, Impuesto, ITV, Sindicato, Rodaje, Seguro Terceros</td>
                <td className="py-2 px-3 text-right font-medium">Bs. {adminTotal.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-500">Bs. {(adminTotal / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right text-slate-600">{((adminTotal / opexTotal) * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right text-slate-600">{((adminTotal / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>

              {/* OPEX EFECTIVO TOTAL */}
              <tr className="bg-slate-100 font-black text-slate-950 border-t border-b border-slate-300">
                <td colSpan={3} className="py-2.5 px-3 uppercase text-xs">
                  TOTAL OPEX EFECTIVO EN CAJA (A + B)
                </td>
                <td className="py-2.5 px-3 text-right text-sm">Bs. {opexTotal.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right">Bs. {(opexTotal / kmMes).toFixed(4)}</td>
                <td className="py-2.5 px-3 text-right">100.0%</td>
                <td className="py-2.5 px-3 text-right">{((opexTotal / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>

              {/* SECCIÓN C */}
              <tr className="bg-purple-50/60 font-bold text-purple-950">
                <td colSpan={3} className="py-2 px-3 uppercase text-[11px]">
                  C. Costos de Capital y Regulatorios (Amortización y Retorno de Inversión)
                </td>
                <td className="py-2 px-3 text-right">Bs. {subtotalC.toFixed(2)}</td>
                <td className="py-2 px-3 text-right">Bs. {(subtotalC / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right">—</td>
                <td className="py-2 px-3 text-right">{((subtotalC / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-500">Capital</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Reserva de Reposición Vehicular (Depreciación)</td>
                <td className="py-2 px-3 text-slate-500">Bs. 198.360 en 120 meses (10 años vida útil)</td>
                <td className="py-2 px-3 text-right font-medium">Bs. {depreciation.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-500">Bs. {(depreciation / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right text-slate-600">—</td>
                <td className="py-2 px-3 text-right text-slate-600">{((depreciation / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-500">Capital</td>
                <td className="py-2 px-3 font-semibold text-slate-900">Retorno Justo al Capital Invertido</td>
                <td className="py-2 px-3 text-slate-500">Tasa regulatoria estándar 11% anual (WACC)</td>
                <td className="py-2 px-3 text-right font-medium">Bs. {wacc.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-500">Bs. {(wacc / kmMes).toFixed(4)}</td>
                <td className="py-2 px-3 text-right text-slate-600">—</td>
                <td className="py-2 px-3 text-right text-slate-600">{((wacc / regulatoryTotal) * 100).toFixed(1)}%</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-black border-t-2 border-slate-900">
                <td colSpan={3} className="py-3 px-3 uppercase text-xs tracking-wider">
                  COSTO ECONÓMICO REGULATORIO TOTAL (A + B + C):
                </td>
                <td className="py-3 px-3 text-right text-sm text-emerald-300">
                  Bs. {regulatoryTotal.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right text-xs text-slate-300">
                  Bs. {costPerKm.toFixed(4)} / km
                </td>
                <td className="py-3 px-3 text-right text-xs text-slate-300">—</td>
                <td className="py-3 px-3 text-right text-xs text-emerald-300">100.0%</td>
              </tr>
              <tr className="bg-indigo-950 text-indigo-100 font-bold text-xs border-t border-indigo-900">
                <td colSpan={3} className="py-2 px-3">
                  TARIFA TÉCNICA EQUIVALENTE DE EQUILIBRIO:
                </td>
                <td colSpan={2} className="py-2 px-3 text-emerald-300">
                  Ponderada: Bs. {techFareWeighted.toFixed(4)} / pax
                </td>
                <td colSpan={2} className="py-2 px-3 text-right text-amber-300 font-black text-sm">
                  Tarifa Adulto Técnica: Bs. {techAdultFare.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
