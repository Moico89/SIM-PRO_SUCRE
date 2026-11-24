'use client';

import React from 'react';
import { calculateTariffSystem } from '@/lib/engine/calculator';
import type { FareCategory, FuelCode, SystemParameters } from '@/types/database';
import type { ScenarioConfig } from '@/types/scenario';

export interface PriceReportSnapshot {
  fuelCost: number;
  opex: number;
  regulatoryCost: number;
  weightedTech: number;
  adultTech: number;
}

export interface ScenarioImpactRow {
  id: string;
  label: string;
  adultFare: number;
  revenueBefore: number;
  revenueAfter: number;
  regulatoryAfter: number;
  coveragePct: number;
  gapVsTechBs: number;
  freeCashAfter: number;
  householdIncomeAfter: number;
  status: 'VIABLE' | 'EQUILIBRIO' | 'DEFICITARIO';
}

export interface PriceChangeExecutiveReport {
  id: string;
  timestamp: string;
  userEmail: string;
  userRole: string;
  userOrg: string;
  fuelName: string;
  fuelUnit: string;
  oldPrice: number;
  newPrice: number;
  deltaAbs: number;
  deltaPct: number;
  justification: string;
  before: PriceReportSnapshot;
  after: PriceReportSnapshot;
  scenarioImpacts: ScenarioImpactRow[];
}

export function buildExecutivePriceReport(args: {
  params: SystemParameters;
  fares: FareCategory[];
  scenarios: ScenarioConfig[];
  activeFuelType: { code: FuelCode; name: string; unit: string };
  oldPrice: number;
  newPrice: number;
  justification: string;
  userEmail: string;
  userRole: string;
  userOrg: string;
}): PriceChangeExecutiveReport {
  const { params, fares, scenarios, activeFuelType, oldPrice, newPrice, justification, userEmail, userRole, userOrg } = args;

  const baseCategories = fares.map(f => ({
    name: f.name,
    demandShare: f.demand_share,
    dailyTrips: f.daily_trips || 0,
    fareCurrentBs: f.fare_current_bs,
    fareSocialBs: f.fare_social_2_bs,
  }));

  const runBase = (fuelPricePerUnit: number) =>
    calculateTariffSystem({
      fleetActive: params.fleet_active,
      kmNetworkDay: params.km_network_day,
      demandNetworkDay: params.demand_network_day,
      operatingDaysMonth: params.operating_days_month,
      turnsDay: params.turns_day,
      fuelType: activeFuelType,
      fuelPricePerUnit,
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
      fareCategories: baseCategories,
      demandFactor: 1.0,
      fuelPriceFactor: 1.0,
    });

  const beforeOut = runBase(oldPrice);
  const afterOut = runBase(newPrice);

  const scenarioImpacts: ScenarioImpactRow[] = scenarios.map(sc => {
    const scCategories = fares.map(f => {
      let fareSocialBs = f.fare_social_2_bs;
      if (sc.id === 'technical') {
        const ratio = afterOut.technicalAdultFare / 4.50;
        fareSocialBs = f.fare_current_bs * ratio;
      } else if (sc.socialFares) {
        if (f.name.includes('Adultos mayores')) fareSocialBs = sc.socialFares.adultosMayores;
        else if (f.name.includes('Universitarios')) fareSocialBs = sc.socialFares.universitarios;
        else if (f.name.includes('Colegiales')) fareSocialBs = sc.socialFares.colegiales;
        else if (f.name.includes('Escolares')) fareSocialBs = sc.socialFares.escolares;
        else if (f.name.includes('Discapacidad')) fareSocialBs = 0;
        else fareSocialBs = sc.adultFare;
      }
      return {
        name: f.name,
        demandShare: f.demand_share,
        dailyTrips: f.daily_trips || 0,
        fareCurrentBs: f.fare_current_bs,
        fareSocialBs,
      };
    });

    const runScenario = (fuelPricePerUnit: number) =>
      calculateTariffSystem({
        fleetActive: params.fleet_active,
        kmNetworkDay: params.km_network_day,
        demandNetworkDay: params.demand_network_day,
        operatingDaysMonth: params.operating_days_month,
        turnsDay: params.turns_day,
        fuelType: activeFuelType,
        fuelPricePerUnit,
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
        fareCategories: scCategories,
        demandFactor: sc.demandFactor,
        fuelPriceFactor: sc.fuelPriceFactor,
      });

    const scBefore = runScenario(oldPrice);
    const scAfter = runScenario(newPrice);
    const adultFare = sc.id === 'technical' ? afterOut.technicalAdultFare : sc.adultFare;
    const coveragePct = (scAfter.monthlyRevenuePerUnit / scAfter.costs.totalRegulatory) * 100;
    const gapVsTechBs = adultFare - afterOut.technicalAdultFare;

    let status: 'VIABLE' | 'EQUILIBRIO' | 'DEFICITARIO' = 'VIABLE';
    if (Math.abs(gapVsTechBs) < 0.02 && coveragePct >= 99.5) status = 'EQUILIBRIO';
    else if (coveragePct < 100 || gapVsTechBs < -0.01) status = 'DEFICITARIO';

    return {
      id: sc.id,
      label: sc.id === 'technical' ? `Técnica (Bs. ${afterOut.technicalAdultFare.toFixed(2).replace('.', ',')})` : sc.label,
      adultFare,
      revenueBefore: scBefore.monthlyRevenuePerUnit,
      revenueAfter: scAfter.monthlyRevenuePerUnit,
      regulatoryAfter: scAfter.costs.totalRegulatory,
      coveragePct,
      gapVsTechBs,
      freeCashAfter: scAfter.freeCashPerUnit,
      householdIncomeAfter: scAfter.householdIncomePerUnit,
      status,
    };
  });

  const deltaAbs = newPrice - oldPrice;
  const deltaPct = oldPrice > 0 ? (deltaAbs / oldPrice) * 100 : 0;

  return {
    id: `rep-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userEmail,
    userRole,
    userOrg,
    fuelName: activeFuelType.name,
    fuelUnit: activeFuelType.unit,
    oldPrice,
    newPrice,
    deltaAbs,
    deltaPct,
    justification,
    before: {
      fuelCost: beforeOut.costs.fuel,
      opex: beforeOut.costs.opexCash,
      regulatoryCost: beforeOut.costs.totalRegulatory,
      weightedTech: beforeOut.weightedTechnicalFare,
      adultTech: beforeOut.technicalAdultFare,
    },
    after: {
      fuelCost: afterOut.costs.fuel,
      opex: afterOut.costs.opexCash,
      regulatoryCost: afterOut.costs.totalRegulatory,
      weightedTech: afterOut.weightedTechnicalFare,
      adultTech: afterOut.technicalAdultFare,
    },
    scenarioImpacts,
  };
}

interface ExecutivePriceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PriceChangeExecutiveReport | null;
}

const fmtBs = (n: number, dec = 2) =>
  `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;

export default function ExecutivePriceReportModal({ isOpen, onClose, report }: ExecutivePriceReportModalProps) {
  if (!isOpen || !report) return null;

  const isIncrease = report.deltaAbs >= 0;
  const deltaFuel = report.after.fuelCost - report.before.fuelCost;
  const deltaOpex = report.after.opex - report.before.opex;
  const deltaReg = report.after.regulatoryCost - report.before.regulatoryCost;
  const deltaAdult = report.after.adultTech - report.before.adultTech;
  const viableCount = report.scenarioImpacts.filter(s => s.status !== 'DEFICITARIO').length;

  const handleExportPdfWindow = () => {
    const win = window.open('', '_blank', 'width=960,height=800');
    if (!win) return;

    const scenarioRowsHtml = report.scenarioImpacts
      .map(
        s => `
        <tr>
          <td><strong>${s.label}</strong></td>
          <td class="num">${fmtBs(s.adultFare)}</td>
          <td class="num">${fmtBs(s.revenueAfter)}</td>
          <td class="num">${fmtBs(s.regulatoryAfter)}</td>
          <td class="num">${s.coveragePct.toFixed(1)}%</td>
          <td class="num">${s.gapVsTechBs >= 0 ? '+' : ''}${fmtBs(s.gapVsTechBs)}</td>
          <td class="num">${fmtBs(s.householdIncomeAfter)}</td>
          <td><span class="badge ${s.status.toLowerCase()}">${s.status}</span></td>
        </tr>`
      )
      .join('');

    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Informe Ejecutivo Variación de Precio — Tarify OS</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 28px; font-size: 12px; }
  .header { border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
  .title { font-size: 18px; font-weight: 900; margin: 0; }
  .sub { font-size: 11px; color: #475569; margin-top: 4px; }
  .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #fff; }
  .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
  .kpi-val { font-size: 16px; font-weight: 900; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
  th { background: #0f172a; color: #fff; font-size: 10px; text-transform: uppercase; }
  .num { text-align: right; font-family: Consolas, monospace; }
  .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; }
  .viable { background: #dcfce7; color: #166534; }
  .equilibrio { background: #dbeafe; color: #1e40af; }
  .deficitario { background: #fee2e2; color: #991b1b; }
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; }
  .sig-line { border-top: 1px solid #334155; padding-top: 6px; text-align: center; font-size: 11px; }
  @media print { body { margin: 14mm; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">INFORME EJECUTIVO DE VARIACIÓN DE PRECIO LEGAL</h1>
      <div class="sub">Sistema Tarify OS — ${report.userOrg} | Generado por: ${report.userEmail} (${report.userRole})</div>
    </div>
    <div class="sub">${new Date(report.timestamp).toLocaleString('es-BO')}</div>
  </div>

  <div class="box">
    <strong>Respaldo / Justificación Legal:</strong> ${report.justification}
  </div>

  <div class="grid">
    <div class="kpi"><div class="kpi-label">Precio Anterior (${report.fuelName})</div><div class="kpi-val">${fmtBs(report.oldPrice)} / ${report.fuelUnit}</div></div>
    <div class="kpi"><div class="kpi-label">Precio Modificado</div><div class="kpi-val">${fmtBs(report.newPrice)} / ${report.fuelUnit}</div></div>
    <div class="kpi"><div class="kpi-label">Variación</div><div class="kpi-val">${isIncrease ? '+' : ''}${fmtBs(report.deltaAbs)} (${isIncrease ? '+' : ''}${report.deltaPct.toFixed(1)}%)</div></div>
    <div class="kpi"><div class="kpi-label">Nueva Tarifa Técnica Adulto</div><div class="kpi-val">${fmtBs(report.after.adultTech)}</div></div>
  </div>

  <h3>1. Impacto en Estructura de Costos y Equilibrio Técnico (Unidad / Mes)</h3>
  <table>
    <thead>
      <tr><th>Indicador</th><th class="num">Antes (${fmtBs(report.oldPrice)})</th><th class="num">Después (${fmtBs(report.newPrice)})</th><th class="num">Variación</th></tr>
    </thead>
    <tbody>
      <tr><td>Combustible mensual / unidad</td><td class="num">${fmtBs(report.before.fuelCost)}</td><td class="num">${fmtBs(report.after.fuelCost)}</td><td class="num">${deltaFuel >= 0 ? '+' : ''}${fmtBs(deltaFuel)}</td></tr>
      <tr><td>OPEX efectivo en caja</td><td class="num">${fmtBs(report.before.opex)}</td><td class="num">${fmtBs(report.after.opex)}</td><td class="num">${deltaOpex >= 0 ? '+' : ''}${fmtBs(deltaOpex)}</td></tr>
      <tr><td><strong>Costo Regulatorio Total</strong></td><td class="num"><strong>${fmtBs(report.before.regulatoryCost)}</strong></td><td class="num"><strong>${fmtBs(report.after.regulatoryCost)}</strong></td><td class="num"><strong>${deltaReg >= 0 ? '+' : ''}${fmtBs(deltaReg)}</strong></td></tr>
      <tr><td>Tarifa Ponderada Técnica</td><td class="num">${fmtBs(report.before.weightedTech, 4)}</td><td class="num">${fmtBs(report.after.weightedTech, 4)}</td><td class="num">${(report.after.weightedTech - report.before.weightedTech) >= 0 ? '+' : ''}${fmtBs(report.after.weightedTech - report.before.weightedTech, 4)}</td></tr>
      <tr><td><strong>Tarifa Técnica Adulto</strong></td><td class="num"><strong>${fmtBs(report.before.adultTech)}</strong></td><td class="num"><strong>${fmtBs(report.after.adultTech)}</strong></td><td class="num"><strong>${deltaAdult >= 0 ? '+' : ''}${fmtBs(deltaAdult)}</strong></td></tr>
    </tbody>
  </table>

  <h3>2. Impacto Comparativo por Escenario de Concertación</h3>
  <table>
    <thead>
      <tr><th>Escenario</th><th class="num">Tarifa Adulto</th><th class="num">Recaudación/Mes</th><th class="num">Costo Reg.</th><th class="num">Cobertura</th><th class="num">Brecha vs Técnica</th><th class="num">Ingreso Hogar</th><th>Dictamen</th></tr>
    </thead>
    <tbody>${scenarioRowsHtml}</tbody>
  </table>

  <div class="sigs">
    <div class="sig-line">Dirección de Transporte / Regulación</div>
    <div class="sig-line">Consultoría Técnica Ecotraffic</div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Informe Ejecutivo de Variación de Precio Legal</h3>
              <p className="text-[11px] text-slate-400">
                {report.userOrg} · {new Date(report.timestamp).toLocaleString('es-BO')} · {report.userEmail}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdfWindow}
              className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir / Exportar PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold text-xl px-2 cursor-pointer"
              aria-label="Cerrar informe"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Legal Justification */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Respaldo Normativo / Justificación</span>
              <p className="text-slate-800 font-semibold mt-0.5">{report.justification}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-black shrink-0 ${isIncrease ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {isIncrease ? 'INCREMENTO' : 'REDUCCIÓN'} {isIncrease ? '+' : ''}{report.deltaPct.toFixed(1)}%
            </span>
          </div>

          {/* 4 KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <div className="text-[10px] font-bold uppercase text-slate-500">Precio Anterior ({report.fuelName})</div>
              <div className="text-lg font-black text-slate-700 font-mono mt-1">{fmtBs(report.oldPrice)} / {report.fuelUnit}</div>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <div className="text-[10px] font-bold uppercase text-slate-500">Precio Legal Vigente</div>
              <div className="text-lg font-black text-slate-950 font-mono mt-1">{fmtBs(report.newPrice)} / {report.fuelUnit}</div>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <div className="text-[10px] font-bold uppercase text-slate-500">Impacto Costo Regulatorio</div>
              <div className={`text-lg font-black font-mono mt-1 ${deltaReg >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {deltaReg >= 0 ? '+' : ''}{fmtBs(deltaReg)} / mes
              </div>
            </div>
            <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50">
              <div className="text-[10px] font-bold uppercase text-blue-700">Nueva Tarifa Técnica Adulto</div>
              <div className="text-lg font-black text-blue-900 font-mono mt-1">
                {fmtBs(report.after.adultTech)} <span className="text-[11px] font-semibold">({deltaAdult >= 0 ? '+' : ''}{fmtBs(deltaAdult)})</span>
              </div>
            </div>
          </div>

          {/* Cost & Tariff Comparison Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              1. Comparativa de Equilibrio Técnico (Antes vs. Después)
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[11px]">
                  <th className="py-2 px-4">Indicador Económico</th>
                  <th className="py-2 px-3 text-right">Antes ({fmtBs(report.oldPrice)})</th>
                  <th className="py-2 px-3 text-right">Después ({fmtBs(report.newPrice)})</th>
                  <th className="py-2 px-4 text-right">Variación Neta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2 px-4 font-sans font-medium text-slate-700">Combustible mensual / unidad</td>
                  <td className="py-2 px-3 text-right">{fmtBs(report.before.fuelCost)}</td>
                  <td className="py-2 px-3 text-right font-bold">{fmtBs(report.after.fuelCost)}</td>
                  <td className={`py-2 px-4 text-right font-bold ${deltaFuel >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {deltaFuel >= 0 ? '+' : ''}{fmtBs(deltaFuel)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-sans font-medium text-slate-700">OPEX efectivo en caja</td>
                  <td className="py-2 px-3 text-right">{fmtBs(report.before.opex)}</td>
                  <td className="py-2 px-3 text-right font-bold">{fmtBs(report.after.opex)}</td>
                  <td className={`py-2 px-4 text-right font-bold ${deltaOpex >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {deltaOpex >= 0 ? '+' : ''}{fmtBs(deltaOpex)}
                  </td>
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="py-2 px-4 font-sans font-black text-slate-900">Costo Regulatorio Total</td>
                  <td className="py-2 px-3 text-right font-bold">{fmtBs(report.before.regulatoryCost)}</td>
                  <td className="py-2 px-3 text-right font-black text-slate-950">{fmtBs(report.after.regulatoryCost)}</td>
                  <td className={`py-2 px-4 text-right font-black ${deltaReg >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {deltaReg >= 0 ? '+' : ''}{fmtBs(deltaReg)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-sans font-medium text-slate-700">Tarifa Ponderada Técnica</td>
                  <td className="py-2 px-3 text-right">{fmtBs(report.before.weightedTech, 4)}</td>
                  <td className="py-2 px-3 text-right font-bold">{fmtBs(report.after.weightedTech, 4)}</td>
                  <td className="py-2 px-4 text-right font-bold text-blue-700">
                    {(report.after.weightedTech - report.before.weightedTech) >= 0 ? '+' : ''}
                    {fmtBs(report.after.weightedTech - report.before.weightedTech, 4)}
                  </td>
                </tr>
                <tr className="bg-blue-50/40">
                  <td className="py-2 px-4 font-sans font-black text-blue-950">Tarifa Técnica Adulto</td>
                  <td className="py-2 px-3 text-right font-bold">{fmtBs(report.before.adultTech)}</td>
                  <td className="py-2 px-3 text-right font-black text-blue-900">{fmtBs(report.after.adultTech)}</td>
                  <td className="py-2 px-4 text-right font-black text-blue-800">
                    {deltaAdult >= 0 ? '+' : ''}{fmtBs(deltaAdult)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Scenario Impact Matrix */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                2. Evaluación de Viabilidad por Escenario ({viableCount}/{report.scenarioImpacts.length} cubren equilibrio)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[11px]">
                    <th className="py-2 px-3">Escenario</th>
                    <th className="py-2 px-3 text-right">Tarifa Adulto</th>
                    <th className="py-2 px-3 text-right">Recaudación/Mes</th>
                    <th className="py-2 px-3 text-right">Cobertura</th>
                    <th className="py-2 px-3 text-right">Brecha vs Técnica</th>
                    <th className="py-2 px-3 text-right">Ingreso Hogar</th>
                    <th className="py-2 px-3 text-center">Dictamen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {report.scenarioImpacts.map(s => (
                    <tr key={s.id} className={s.status === 'DEFICITARIO' ? 'bg-rose-50/40' : ''}>
                      <td className="py-2 px-3 font-sans font-bold text-slate-900">{s.label}</td>
                      <td className="py-2 px-3 text-right font-bold">{fmtBs(s.adultFare)}</td>
                      <td className="py-2 px-3 text-right">{fmtBs(s.revenueAfter)}</td>
                      <td className={`py-2 px-3 text-right font-bold ${s.coveragePct >= 100 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {s.coveragePct.toFixed(1)}%
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${s.gapVsTechBs >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {s.gapVsTechBs >= 0 ? '+' : ''}{fmtBs(s.gapVsTechBs)}
                      </td>
                      <td className="py-2 px-3 text-right">{fmtBs(s.householdIncomeAfter)}</td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            s.status === 'VIABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'EQUILIBRIO'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
