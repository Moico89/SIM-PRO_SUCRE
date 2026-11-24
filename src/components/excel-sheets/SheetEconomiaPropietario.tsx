'use client';

import React, { useMemo } from 'react';
import { calculateTariffSystem } from '@/lib/engine/calculator';
import type { FuelCode, SystemParameters } from '@/types/database';

interface SheetEconomiaPropietarioProps {
  params: SystemParameters;
  activeFuelType: { code: FuelCode; name: string; unit: string };
}

interface EconomiaColumn {
  key: string;
  label: string;
  sublabel: string;
  badge: string;
  badgeColor: string;
  fareWeighted: number;
  kmMes: number;
  paxMes: number;
  grossRev: number;
  fuel: number;
  maint: number;
  labor: number;
  admin: number;
  opex: number;
  cashSurplus: number;
  debt: number;
  cashAfterDebt: number;
  deprec: number;
  freeCash: number;
  wacc: number;
  economicProfit: number;
  driverSalary: number;
  householdIncome: number;
  isRecommend: boolean;
}

type NumericEconomiaField =
  | 'fareWeighted'
  | 'kmMes'
  | 'paxMes'
  | 'grossRev'
  | 'fuel'
  | 'maint'
  | 'labor'
  | 'admin'
  | 'opex'
  | 'cashSurplus'
  | 'debt'
  | 'cashAfterDebt'
  | 'deprec'
  | 'freeCash'
  | 'wacc'
  | 'economicProfit'
  | 'driverSalary';

export default function SheetEconomiaPropietario({ params, activeFuelType }: SheetEconomiaPropietarioProps) {
  const columns = useMemo<EconomiaColumn[]>(() => {
    const runScenario = (demandFactor: number, fuelPriceFactor: number) =>
      calculateTariffSystem({
        fleetActive: params.fleet_active,
        kmNetworkDay: params.km_network_day,
        demandNetworkDay: params.demand_network_day,
        operatingDaysMonth: params.operating_days_month,
        turnsDay: params.turns_day,
        fuelType: activeFuelType,
        fuelPricePerUnit: params.fuel_price_bs_l,
        fuelEfficiency: params.fuel_efficiency_km_l,
        idleCongestionFactor: params.idle_congestion_factor,
        driverSalary: params.driver_salary_bs,
        laborChargesFactor: params.labor_charges_factor,
        driversPerVehicle: 1,
        maintenanceMonthly: params.maintenance_monthly_bs,
        maintenanceVarShare: params.maintenance_var_share,
        maintenanceFixedShare: params.maintenance_fixed_share,
        otherFixedMonthly: params.other_fixed_monthly_bs,
        vehicleReplacementValue: params.vehicle_replacement_value_bs,
        vehicleResidualValue: params.vehicle_residual_value_bs,
        vehicleUsefulLifeMonths: params.vehicle_useful_life_months,
        capitalReturnRateAnnual: params.capital_return_rate_annual,
        fareCategories: [
          { name: 'Adultos', demandShare: 0.58, dailyTrips: 154030, fareCurrentBs: 4.50, fareSocialBs: 4.00 },
          { name: 'Adultos mayores', demandShare: 0.07, dailyTrips: 18590, fareCurrentBs: 3.50, fareSocialBs: 3.00 },
          { name: 'Universitarios', demandShare: 0.18, dailyTrips: 47802, fareCurrentBs: 2.50, fareSocialBs: 2.00 },
          { name: 'Colegiales', demandShare: 0.10, dailyTrips: 26557, fareCurrentBs: 1.50, fareSocialBs: 1.50 },
          { name: 'Escolares', demandShare: 0.05, dailyTrips: 13278, fareCurrentBs: 1.00, fareSocialBs: 1.00 },
          { name: 'Discapacidad / menores de 5', demandShare: 0.02, dailyTrips: 5311, fareCurrentBs: 0.00, fareSocialBs: 0.00 },
        ],
        demandFactor,
        fuelPriceFactor,
      });

    const baseOut = runScenario(1.0, 1.0);
    const stressOut = runScenario(0.9, 1.15);

    const buildColumn = (
      meta: { key: string; label: string; sublabel: string; badge: string; badgeColor: string; isRecommend: boolean },
      out: ReturnType<typeof runScenario>,
      fareWeighted: number
    ): EconomiaColumn => {
      const kmMes = out.kmPerUnitMonth;
      const paxMes = out.paxPerUnitMonth;
      const grossRev = paxMes * fareWeighted;
      const fuel = out.costs.fuel;
      const maint = out.costs.maintenanceVariable + out.costs.maintenanceFixed;
      const labor = out.costs.laborTotal;
      const admin = out.costs.otherFixed;
      const opex = out.costs.opexCash;
      const cashSurplus = grossRev - opex;
      const debt = 0;
      const cashAfterDebt = cashSurplus - debt;
      const deprec = out.costs.depreciation;
      const freeCash = cashAfterDebt - deprec;
      const wacc = out.costs.capitalReturn;
      const economicProfit = freeCash - wacc;
      const householdIncome = freeCash + labor;

      return {
        ...meta,
        fareWeighted,
        kmMes,
        paxMes,
        grossRev,
        fuel,
        maint,
        labor,
        admin,
        opex,
        cashSurplus,
        debt,
        cashAfterDebt,
        deprec,
        freeCash,
        wacc,
        economicProfit,
        driverSalary: labor,
        householdIncome,
      };
    };

    return [
      buildColumn(
        {
          key: 'vigente',
          label: 'Tarifa Vigente (Obs.)',
          sublabel: 'Adulto Bs. 4,50',
          badge: 'HISTÓRICO',
          badgeColor: 'bg-slate-100 text-slate-700',
          isRecommend: false,
        },
        baseOut,
        baseOut.currentWeightedFare
      ),
      buildColumn(
        {
          key: 'tecnica',
          label: 'Tarifa Técnica (Eq.)',
          sublabel: `Adulto Bs. ${baseOut.technicalAdultFare.toFixed(2).replace('.', ',')}`,
          badge: 'EQUILIBRIO',
          badgeColor: 'bg-blue-100 text-blue-800',
          isRecommend: false,
        },
        baseOut,
        baseOut.weightedTechnicalFare
      ),
      buildColumn(
        {
          key: 'social',
          label: 'Tarifa Social Propuesta',
          sublabel: 'Adulto Bs. 4,00 (Social 3)',
          badge: 'CONCERTACIÓN',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          isRecommend: true,
        },
        baseOut,
        3.0400
      ),
      buildColumn(
        {
          key: 'estres',
          label: 'Escenario de Estrés',
          sublabel: '-10% pax / +15% diésel',
          badge: 'SENSIBILIDAD',
          badgeColor: 'bg-amber-100 text-amber-800',
          isRecommend: false,
        },
        stressOut,
        stressOut.currentWeightedFare
      ),
    ];
  }, [params, activeFuelType]);

  const rows: Array<{
    title: string;
    field: NumericEconomiaField;
    isBold?: boolean;
    isOpex?: boolean;
    isHighlight?: boolean;
    format: (v: number) => string;
  }> = [
    { title: 'Tarifa ponderada de pasaje (Bs/viaje)', field: 'fareWeighted', format: (v: number) => `Bs. ${v.toFixed(4)}` },
    { title: 'Kilómetros recorridos por unidad/mes', field: 'kmMes', format: (v: number) => `${v.toFixed(2)} km` },
    { title: 'Pasajeros transportados por unidad/mes', field: 'paxMes', format: (v: number) => `${Math.round(v).toLocaleString('es-BO')} pax` },
    { title: 'RECAUDACIÓN BRUTA MENSUAL', field: 'grossRev', isBold: true, format: (v: number) => `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
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

  const socialHouseholdIncome = columns[2]?.householdIncome ?? 0;

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
              <div className="text-2xl font-black text-emerald-700">
                Bs. {socialHouseholdIncome.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mes
              </div>
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
          <span className="text-[11px] text-slate-500">
            Calculado en vivo ({activeFuelType.name}: Bs. {params.fuel_price_bs_l.toFixed(2)}/{activeFuelType.unit})
          </span>
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
                    const val = col[row.field];
                    return (
                      <td
                        key={col.key}
                        className={`py-2 px-3 text-right ${
                          row.isBold ? 'font-black text-slate-900' : 'font-medium'
                        } ${col.isRecommend ? 'bg-emerald-50/30 text-emerald-950' : ''}`}
                      >
                        {row.format(val)}
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
