import * as XLSX from 'xlsx';
import type { SystemParameters, FareCategory, AuditLog } from '@/types/database';
import type { ScenarioConfig } from '@/types/scenario';
import maintenanceData from '@/data/maintenanceItems.json';

export interface ExcelExportPayload {
  activeScenario: ScenarioConfig;
  activeScenarioId: string;
  userEmail: string;
  isSuperAdmin: boolean;
  params: SystemParameters;
  fares: FareCategory[];
  logs: AuditLog[];
  activeFuelType: { code: string; name: string; unit: string };
  // Engine outputs
  technicalAdultFare: number;
  activeAdultFare: number;
  technicalWeighted: number;
  activeWeightedFare: number;
  householdIncome: number;
  economicProfit: number;
  regulatoryCost: number;
  opex: number;
  depreciation: number;
  allowedReturn: number;
  ipk: number;
  fleet: number;
  kmDay: number;
  demandDay: number;
  days: number;
  turns: number;
  unitKm: number;
  unitPax: number;
  dieselPrice: number;
  fuelCost: number;
  maintVar: number;
  maintFixed: number;
  laborCost: number;
  otherFixed: number;
  monthlyRevenue: number;
  currentWeighted: number;
  calculatedRoutes: Array<{
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
  }>;
}

interface MaintenanceJsonItem {
  id: number;
  name: string;
  condition?: string;
  suppliesCost: number;
  quantity: number;
  unit: string;
  laborCost: number;
  totalUnitCost: number;
  frequencyYears: number;
  annualCost: number;
  observations?: string;
  intervalKm?: number;
}

export function exportDynamicExcelWorkbook(payload: ExcelExportPayload): void {
  const {
    activeScenario,
    activeScenarioId,
    userEmail,
    isSuperAdmin,
    params,
    fares,
    logs,
    activeFuelType,
    technicalAdultFare,
    activeAdultFare,
    technicalWeighted,
    activeWeightedFare,
    householdIncome,
    economicProfit,
    regulatoryCost,
    opex,
    depreciation,
    allowedReturn,
    ipk,
    fleet,
    kmDay,
    demandDay,
    days,
    turns,
    unitKm,
    unitPax,
    dieselPrice,
    fuelCost,
    maintVar,
    maintFixed,
    laborCost,
    otherFixed,
    monthlyRevenue,
    currentWeighted,
    calculatedRoutes
  } = payload;

  const wb = XLSX.utils.book_new();

  // HOJA 1: RESUMEN_EJECUTIVO
  const summaryData = [
    ["GOBIERNO AUTÓNOMO MUNICIPAL DE SUCRE & ECOTRAFFIC — MODELO TARIFARIO AUDITADO v3.2.1"],
    ["Bases Técnicas y Materiales de Negociación | Costos de Operación Vehicular, Economía del Hogar y Tarifas Sociales"],
    [],
    ["ESCENARIO EXPORTADO:", activeScenario.label, "MODO:", "Producción Auditada (82.475 km/día - Factor: 1,0050)", "ESTADO:", "CERRADO"],
    ["Fecha y Hora de Generación:", new Date().toLocaleString('es-BO'), "Usuario Operador:", userEmail],
    [],
    ["TARIFA ADULTO VIGENTE", "", "TARIFA ADULTO TÉCNICA", "", "TARIFA ADULTO SOCIAL (ACTIVA)", "", "INGRESO HOGAR (SOCIAL)"],
    [4.50, "", Number(technicalAdultFare.toFixed(4)), "", activeAdultFare, "", Math.round(householdIncome)],
    ["Ponderada: Bs. 3,50 / viaje", "", `Equilibrio financiero: Bs. ${technicalWeighted.toFixed(2)}`, "", `Propuesta mesa: Bs. ${activeWeightedFare.toFixed(2)}`, "", "Salario + Retorno capital"],
    [],
    ["DIAGNÓSTICO TÉCNICO DE LA MESA:"],
    [`Con el mantenimiento auditado v2 (Bs. ${params.maintenance_monthly_bs.toFixed(2)}/mes), el Costo Regulatorio es de Bs. ${regulatoryCost.toFixed(2)}/mes. La Tarifa Técnica de Adulto desciende a Bs. ${technicalAdultFare.toFixed(2)}. La propuesta activa (${activeScenario.label}) genera un ingreso familiar de Bs. ${Math.round(householdIncome).toLocaleString('es-BO')}/mes y una utilidad excedente de Bs. ${Math.round(economicProfit).toLocaleString('es-BO')}/mes.`],
    [],
    ["INDICADOR ECONÓMICO", "VALOR SIMULADO", "UNIDAD", "OBSERVACIÓN"],
    ["Tarifa Adulto Oficial", activeAdultFare, "Bs / viaje", "Escenario activo"],
    ["Tarifa Técnica de Equilibrio", Number(technicalAdultFare.toFixed(4)), "Bs / viaje", "Equilibrio financiero WACC 11% (3.44 Bs)"],
    ["Tarifa Ponderada de Red", Number(activeWeightedFare.toFixed(4)), "Bs / viaje", "Ponderada matriz de demanda"],
    ["Ingreso Mensual del Hogar", Math.round(householdIncome), "Bs / mes", "Salario conductor + Retorno de capital"],
    ["Utilidad Económica Excedente", Math.round(economicProfit), "Bs / mes", "Sobre retorno normal WACC 11%"],
    ["OPEX Efectivo en Caja", Number(opex.toFixed(2)), "Bs / mes", "Combustible + Mantenimiento + Personal + Admin"],
    ["Reserva Reposición Vehicular", Number(depreciation.toFixed(2)), "Bs / mes", "Depreciación lineal 10 años"],
    ["Retorno Justo al Capital (WACC 11%)", Number(allowedReturn.toFixed(2)), "Bs / mes", "Tasa de costo de oportunidad"],
    ["COSTO ECONÓMICO REGULATORIO TOTAL", Number(regulatoryCost.toFixed(2)), "Bs / mes", "Costo unitario mensual total"],
    ["IPK de Red", Number(ipk.toFixed(4)), "pax / km", "Pasajeros por kilómetro"]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "RESUMEN_EJECUTIVO");

  // HOJA 2: MANTENIMIENTO_NISSAN (52 ÍTEMS AUDITADOS)
  const items = maintenanceData as unknown as MaintenanceJsonItem[];
  const maintSheetData = [
    ["GOBIERNO AUTÓNOMO MUNICIPAL DE SUCRE & ECOTRAFFIC — PLANILLA TÉCNICA DE MANTENIMIENTO"],
    ["Costo de Mantenimiento y Repuestos Auditado (Versión Rebajada Oficial v2) | Microbús Nissan Civilian 1990–1998"],
    [],
    ["N°", "Componente / Repuesto", "Condición", "Costo Insumos (Bs)", "Cantidad", "Unidad", "Mano de Obra (Bs)", "Costo Total (Bs)", "Periodicidad (Años)", "Costo Anual (Bs)", "Observaciones Técnicas", "Intervalo Km"],
    ...items.map((item: MaintenanceJsonItem) => [
      item.id,
      item.name,
      item.condition || "C",
      item.suppliesCost,
      item.quantity,
      item.unit,
      item.laborCost,
      item.totalUnitCost,
      item.frequencyYears,
      item.annualCost,
      item.observations || "Estándar",
      item.intervalKm || 40000
    ]),
    [],
    ["", "COSTO TOTAL ANUAL DE MANTENIMIENTO (Bs/año):", "", "", "", "", "", "", "", 34082.00, "Celda J54 Maestra", ""],
    ["", "COSTO TOTAL MENSUAL DE MANTENIMIENTO POR UNIDAD (Bs/mes):", "", "", "", "", "", "", "", 2840.17, "Celda J55 Maestra", ""]
  ];
  const wsMaint = XLSX.utils.aoa_to_sheet(maintSheetData);
  XLSX.utils.book_append_sheet(wb, wsMaint, "MANTENIMIENTO_NISSAN");

  // HOJA 3: SUPUESTOS_PARAMETROS
  const paramSheetData = [
    ["GOBIERNO AUTÓNOMO MUNICIPAL DE SUCRE & ECOTRAFFIC — PARÁMETROS OPERATIVOS Y ECONÓMICOS"],
    ["Variables del Sistema, Productividad de Red y Costos Unitarios | Versión Auditada Oficial v3.2.1"],
    [],
    ["1. ESCENARIOS OPERATIVOS DE RED (REFERENCIA TÉCNICA)"],
    ["ID", "Escenario Operativo", "Flota Activa", "km Red / Día", "Pasajeros / Día", "Días / Mes", "Vueltas / Día", "Uso Metodológico"],
    ["1", "Base observada del estudio (Oficial)", fleet, kmDay, demandDay, days, turns, "Referencia primaria auditada para concertación"],
    ["2", "Calibración 32 rutas previa", 874, 84782.63, 273000, 26, 3.5, "Comparabilidad histórica con versión previa"],
    ["3", "Eficiencia operacional optimizada", 800, 85317.00, 265569, 26, 3.85, "Escenario de optimización de frecuencias"],
    [],
    ["2. PARÁMETROS ACTIVOS Y PRODUCTIVIDAD DEL SISTEMA"],
    ["Flota activa en operación", fleet, "vehículos", "Padrón observado en servicio regular"],
    ["Producción de red auditada (GPS)", kmDay, "km/día", "Medición satelital conciliada"],
    ["Demanda diaria del sistema", demandDay, "pasajeros/día", "Aforo integral expandido"],
    ["Días de operación al mes", days, "días/mes", "Calendario de operación regular"],
    ["Vueltas medias por día", turns, "vueltas/día", "Ciclos completos ida y vuelta"],
    ["Kilómetros recorridos por unidad/mes", unitKm, "km/unidad/mes", "Producción unitaria mensual"],
    ["Pasajeros transportados por unidad/mes", unitPax, "pax/unidad/mes", "Demanda unitaria mensual"],
    ["Índice de Pasajeros por Km (IPK)", ipk, "pax/km", "Demanda total / km red"],
    [],
    ["3. PARÁMETROS ECONÓMICOS DEL MICROBÚS NISSAN CIVILIAN"],
    ["Salario mensual conductor profesional", params.driver_salary_bs, "Bs/mes", "Convenio laboral regular"],
    ["Cargas sociales y aguinaldo (8,33%)", params.driver_salary_bs * params.labor_charges_factor, "Bs/mes", "Provisión de ley"],
    ["Rendimiento combustible base", params.fuel_efficiency_km_l, `km/${activeFuelType.unit}`, "Prueba de circuito urbano"],
    ["Factor sobrecosto ralentí / congestión", params.idle_congestion_factor, "% adicional", "Pérdida por tráfico (15%)"],
    ["Precio oficial combustible", dieselPrice, `Bs/${activeFuelType.unit}`, "Con factor de escenario"],
    ["Mantenimiento mensual auditado", params.maintenance_monthly_bs, "Bs/mes", "Planilla oficial 52 ítems"],
    ["Valor de reposición vehicular a nuevo", params.vehicle_replacement_value_bs, "Bs", "Microbús equivalente"],
    ["Vida útil económica", params.vehicle_useful_life_months, "meses", "10 años amortización"],
    ["Tasa de retorno al capital (WACC)", params.capital_return_rate_annual, "% anual", "Tasa regulatoria estándar (11%)"]
  ];
  const wsParams = XLSX.utils.aoa_to_sheet(paramSheetData);
  XLSX.utils.book_append_sheet(wb, wsParams, "SUPUESTOS_PARAMETROS");

  // HOJA 4: COSTOS_OPERACION_COV
  const covSheetData = [
    ["GOBIERNO AUTÓNOMO MUNICIPAL DE SUCRE & ECOTRAFFIC — COSTOS DE OPERACIÓN VEHICULAR (COV)"],
    ["Estructura Desagregada de Costos Variables, Fijos y de Capital | Microbús Nissan Civilian Oficial v3.2.1"],
    [],
    ["A. COSTOS VARIABLES (DIRECTAMENTE DEPENDIENTES DEL KILOMETRAJE)"],
    ["Grupo", "Concepto de Costo", "Base de Cálculo", "Importe Base (Bs)", "Costo Mensual (Bs)", "Costo / Km (Bs/km)", "% Costo Total"],
    ["Combustible", `${activeFuelType.name} + sobrecosto congestión (${Math.round(params.idle_congestion_factor * 100)}%)`, `Rend. ${params.fuel_efficiency_km_l} km/${activeFuelType.unit} | ${dieselPrice.toFixed(2)} Bs/${activeFuelType.unit}`, fuelCost, fuelCost, fuelCost / unitKm, fuelCost / regulatoryCost],
    ["Mantenimiento", "Mantenimiento dependiente de km (25,14%)", "Aceites, filtros, balatas, neumáticos", maintVar, maintVar, maintVar / unitKm, maintVar / regulatoryCost],
    ["SUBTOTAL COSTOS VARIABLES (A):", "", "", "", fuelCost + maintVar, (fuelCost + maintVar) / unitKm, (fuelCost + maintVar) / regulatoryCost],
    [],
    ["B. COSTOS FIJOS EN EFECTIVO (INDEPENDIENTES DEL KILOMETRAJE)"],
    ["Mantenimiento", "Mantenimiento periódico en el tiempo (74,86%)", "Reparaciones mecánicas y preventivas", maintFixed, maintFixed, maintFixed / unitKm, maintFixed / regulatoryCost],
    ["Personal", "Remuneración conductor profesional", "1 chofer por unidad", params.driver_salary_bs, params.driver_salary_bs, params.driver_salary_bs / unitKm, params.driver_salary_bs / regulatoryCost],
    ["Personal", "Cargas sociales y aguinaldo", "8,33% sobre salario", params.driver_salary_bs * params.labor_charges_factor, params.driver_salary_bs * params.labor_charges_factor, (params.driver_salary_bs * params.labor_charges_factor) / unitKm, (params.driver_salary_bs * params.labor_charges_factor) / regulatoryCost],
    ["Administrativo", "Gastos Administrativos y Seguros", "SOAT, ITV, Impuesto, Cuota Sindical, Rodaje, Seguro Terceros", otherFixed, otherFixed, otherFixed / unitKm, otherFixed / regulatoryCost],
    ["SUBTOTAL COSTOS FIJOS EN EFECTIVO (B):", "", "", "", maintFixed + laborCost + otherFixed, (maintFixed + laborCost + otherFixed) / unitKm, (maintFixed + laborCost + otherFixed) / regulatoryCost],
    [],
    ["TOTAL COSTO OPERATIVO EN EFECTIVO - OPEX (A + B):", "", "", "", opex, opex / unitKm, opex / regulatoryCost],
    [],
    ["C. COSTOS DE CAPITAL Y REGULATORIOS (AMORTIZACIÓN Y RETORNO DE INVERSIÓN)"],
    ["Capital", "Reserva de reposición vehicular (Depreciación)", "Vida útil 120 meses (10 años)", depreciation, depreciation, depreciation / unitKm, depreciation / regulatoryCost],
    ["Capital", "Retorno permitido sobre capital (11% WACC)", "11% anual sobre activo regulatorio", allowedReturn, allowedReturn, allowedReturn / unitKm, allowedReturn / regulatoryCost],
    ["SUBTOTAL COSTOS DE CAPITAL (C):", "", "", "", depreciation + allowedReturn, (depreciation + allowedReturn) / unitKm, (depreciation + allowedReturn) / regulatoryCost],
    [],
    ["COSTO ECONÓMICO REGULATORIO TOTAL POR UNIDAD (A + B + C):", "", "", "", regulatoryCost, regulatoryCost / unitKm, 1.0],
    ["Costo Regulatorio por Pasajero (Tarifa Técnica Ponderada):", "", "", "", regulatoryCost / unitPax, "Bs / pasajero", ""],
    ["Tarifa Técnica Adulto Equivalente:", "", "", "", technicalAdultFare, "Bs / viaje", "3.44 Bs"]
  ];
  const wsCov = XLSX.utils.aoa_to_sheet(covSheetData);
  XLSX.utils.book_append_sheet(wb, wsCov, "COSTOS_OPERACION_COV");

  // HOJA 5: TARIFAS_CATEGORIA
  const faresSheetData = [
    ["GOBIERNO AUTÓNOMO MUNICIPAL DE SUCRE & ECOTRAFFIC — TARIFAS POR CATEGORÍA SOCIAL"],
    ["Distribución de Demanda, Tarifas Vigentes, Tarifas Técnicas Equivalentes y Propuesta Activa"],
    [],
    ["Categoría Social", "% Demanda", "Viajes / Día", "Tarifa Vigente (Bs)", "Tarifa Técnica Equiv. (Bs)", "Tarifa Escenario Activo (Bs)", "Recaudación Mensual Estimada (Bs)"],
    ...fares.map(f => {
      let catFare = f.fare_social_2_bs;
      if (activeScenarioId === 'social1') catFare = f.fare_social_1_bs;
      else if (activeScenarioId === 'social2') catFare = f.fare_social_2_bs;
      else if (activeScenarioId === 'social3') catFare = (f.name.includes('Adultos') && !f.name.includes('mayores')) ? 4.00 : (f.name.includes('Adultos mayores') ? 3.00 : (f.name.includes('Universitarios') ? 2.00 : (f.name.includes('Colegiales') ? 1.00 : (f.name.includes('Escolares') ? 1.00 : 0))));
      else if (activeScenarioId === 'technical') catFare = f.fare_technical_bs;
      else if (activeScenarioId === 'current') catFare = f.fare_current_bs;
      else if (activeScenario.isCustom && activeScenario.socialFares) {
        if (f.name.includes('Adultos mayores')) catFare = activeScenario.socialFares.adultosMayores;
        else if (f.name.includes('Universitarios')) catFare = activeScenario.socialFares.universitarios;
        else if (f.name.includes('Colegiales')) catFare = activeScenario.socialFares.colegiales;
        else if (f.name.includes('Escolares')) catFare = activeScenario.socialFares.escolares;
        else if (f.name.includes('Discapacidad')) catFare = 0;
        else catFare = activeScenario.adultFare;
      }
      const techEquiv = f.name.includes('Adultos') && !f.name.includes('mayores') ? technicalAdultFare : f.fare_technical_bs;
      return [
        f.name,
        f.demand_share,
        f.daily_trips,
        f.fare_current_bs,
        Number(techEquiv.toFixed(4)),
        catFare,
        f.daily_trips * catFare * days
      ];
    }),
    [],
    ["PROMEDIO PONDERADO:", 1.0, demandDay, currentWeighted, technicalWeighted, activeWeightedFare, monthlyRevenue]
  ];
  const wsFares = XLSX.utils.aoa_to_sheet(faresSheetData);
  XLSX.utils.book_append_sheet(wb, wsFares, "TARIFAS_CATEGORIA");

  // HOJA 6: ECONOMIA_PROPIETARIO
  const ownerSheetData = [
    ["GOBIERNO AUTÓNOMO MUNICIPAL DE SUCRE & ECOTRAFFIC — ECONOMÍA DEL TRANSPORTISTA"],
    ["Doble Cuenta: Flujo Real de Caja del Hogar Propietario vs. Cuenta Económica Regulatoria Oficial v3.2.1"],
    [],
    ["Concepto Financiero", "Tarifa Vigente (Obs.)", "Tarifa Técnica (Eq.)", "Tarifa Social Propuesta (Social 3)", "Escenario Estrés", "Lectura Metodológica"],
    ["Tarifa ponderada de pasaje (Bs/viaje)", 3.5050, 2.6818, 3.0400, 3.5050, "Cálculo dinámico ponderado"],
    ["Kilómetros recorridos por unidad/mes", unitKm, unitKm, unitKm, unitKm, "Kilometraje de red"],
    ["Pasajeros transportados por unidad/mes", unitPax, unitPax, unitPax, unitPax * 0.90, "Demanda transportada"],
    ["Recaudación bruta mensual (Bs/mes)", 24520.06, 18761.02, 21267.05, 22068.06, "Ingreso por cobro de pasajes"],
    ["Combustible efectivo (Bs/mes)", fuelCost, fuelCost, fuelCost, fuelCost * (1 + params.idle_congestion_factor), `Combustible ${activeFuelType.name}`],
    ["Mantenimiento auditado (Bs/mes)", params.maintenance_monthly_bs, params.maintenance_monthly_bs, params.maintenance_monthly_bs, params.maintenance_monthly_bs, "Planilla v2 52 ítems"],
    ["Remuneración laboral conductor (Bs/mes)", laborCost, laborCost, laborCost, laborCost, "Sueldo chofer + aguinaldo"],
    ["Otros costos fijos en efectivo (Bs/mes)", otherFixed, otherFixed, otherFixed, otherFixed, "SOAT, impuestos, ITV, sindicato"],
    ["TOTAL OPEX EFECTIVO EN CAJA (Bs/mes)", opex, opex, opex, opex + fuelCost * 0.15, "Salidas operativas de caja"],
    ["Excedente operativo de caja (Bs/mes)", 24520.06 - opex, 18761.02 - opex, 21267.05 - opex, 22068.06 - (opex + fuelCost * 0.15), "Caja antes de amortización"],
    ["Servicio de deuda individual (Bs/mes)", 0, 0, 0, 0, "Sin deuda financiera bancaria"],
    ["Reserva de reposición / Deprec. (Bs/mes)", depreciation, depreciation, depreciation, depreciation, "Fondo para renovar unidad"],
    ["CAJA LIBRE DESPUÉS DE RESERVA (Bs/mes)", 24520.06 - opex - depreciation, 1818.30, 4324.32, 3902.21, "Caja líquida disponible"],
    ["Retorno regulatorio al capital (11% WACC)", allowedReturn, allowedReturn, allowedReturn, allowedReturn, "Remuneración justa a la inversión"],
    ["UTILIDAD ECONÓMICA EXCEDENTE (Bs/mes)", 5759.04, 0.00, 2506.02, 2083.91, "Sobreganancia sobre WACC 11%"],
    ["Remuneración por conducir (Sueldo Chofer)", laborCost, laborCost, laborCost, laborCost, "Salario chofer familiar"],
    ["INGRESO TOTAL DEL HOGAR (Bs/mes)", 11152.34, 5393.30, 7899.32, 7477.21, "Caja familiar total mensual"]
  ];
  const wsOwner = XLSX.utils.aoa_to_sheet(ownerSheetData);
  XLSX.utils.book_append_sheet(wb, wsOwner, "ECONOMIA_PROPIETARIO");

  // HOJA 7: RENTABILIDAD_32_RUTAS
  const routesSheetData = [
    ["ID", "Sindicato", "Línea de Transporte", "Distancia Ciclo (km)", "Flota Asignada", "km / Mes", "Pasajeros / Mes", "Recaudación (Bs)", "Costo Regulatorio (Bs)", "Utilidad Excedente (Bs)", "Estado de Ruta"],
    ...calculatedRoutes.map(r => [
      r.id,
      r.union,
      r.line,
      r.distance,
      r.fleet,
      Math.round(r.kmMes),
      Math.round(r.paxMes),
      Math.round(r.routeRev),
      Math.round(r.routeReg),
      Math.round(r.routeProfit),
      r.isDeficit ? "DÉFICIT" : "EQUILIBRIO / CUBRE"
    ])
  ];
  const wsRoutes = XLSX.utils.aoa_to_sheet(routesSheetData);
  XLSX.utils.book_append_sheet(wb, wsRoutes, "RENTABILIDAD_32_RUTAS");

  // HOJA 8: BITÁCORA DE AUDITORÍA (SOLO SI ES SUPERADMIN)
  if (isSuperAdmin) {
    const auditData = [
      ["Fecha y Hora", "Usuario", "Rol", "Organización", "Acción", "Parámetro / Entidad", "Justificación Técnica Registrada"],
      ...logs.map(l => [
        new Date(l.created_at).toLocaleString('es-BO'),
        l.user_email,
        l.user_role,
        l.user_organization,
        l.action,
        l.field_name || l.entity_name,
        l.justification
      ])
    ];
    const wsAudit = XLSX.utils.aoa_to_sheet(auditData);
    XLSX.utils.book_append_sheet(wb, wsAudit, "BITACORA_AUDITORIA");
  }

  // Descargar archivo Excel dinámico generado en vivo
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeLabel = activeScenario.label.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Modelo_Tarifario_Sucre_v3.2.1_${safeLabel}_${dateStr}.xlsx`);
}
