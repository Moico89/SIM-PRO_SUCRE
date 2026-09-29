'use client';

import React, { useState } from 'react';
import type { ScenarioConfig } from '@/types/scenario';

interface ScenarioManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: ScenarioConfig[];
  onSaveScenario: (scenario: ScenarioConfig) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onSelectScenario: (scenarioId: string) => void;
}

export default function ScenarioManagerModal({
  isOpen,
  onClose,
  scenarios,
  onSaveScenario,
  onDeleteScenario,
  onSelectScenario
}: ScenarioManagerModalProps) {
  const [editingScenario, setEditingScenario] = useState<ScenarioConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states
  const [label, setLabel] = useState('');
  const [badge, setBadge] = useState('');
  const [adultFare, setAdultFare] = useState(3.50);
  const [adultosMayores, setAdultosMayores] = useState(2.50);
  const [universitarios, setUniversitarios] = useState(2.00);
  const [colegiales, setColegiales] = useState(1.50);
  const [escolares, setEscolares] = useState(1.50);
  const [demandFactor, setDemandFactor] = useState(1.0);
  const [fuelPriceFactor, setFuelPriceFactor] = useState(1.0);

  if (!isOpen) return null;

  const startCreate = () => {
    setIsCreatingNew(true);
    setEditingScenario(null);
    setLabel('Propuesta Municipal / Gremial');
    setBadge('NUEVO');
    setAdultFare(3.50);
    setAdultosMayores(2.50);
    setUniversitarios(2.00);
    setColegiales(1.50);
    setEscolares(1.50);
    setDemandFactor(1.0);
    setFuelPriceFactor(1.0);
  };

  const startEdit = (sc: ScenarioConfig) => {
    setIsCreatingNew(false);
    setEditingScenario(sc);
    setLabel(sc.label);
    setBadge(sc.badge || '');
    setAdultFare(sc.adultFare);
    setAdultosMayores(sc.socialFares.adultosMayores);
    setUniversitarios(sc.socialFares.universitarios);
    setColegiales(sc.socialFares.colegiales);
    setEscolares(sc.socialFares.escolares);
    setDemandFactor(sc.demandFactor);
    setFuelPriceFactor(sc.fuelPriceFactor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newScenario: ScenarioConfig = {
      id: editingScenario ? editingScenario.id : `custom-${Date.now()}`,
      label,
      badge: badge.trim() || undefined,
      adultFare: Number(adultFare),
      socialFares: {
        adultos: Number(adultFare),
        adultosMayores: Number(adultosMayores),
        universitarios: Number(universitarios),
        colegiales: Number(colegiales),
        escolares: Number(escolares),
        discapacidad: 0
      },
      demandFactor: Number(demandFactor),
      fuelPriceFactor: Number(fuelPriceFactor),
      isCustom: true,
      color: 'text-indigo-700 font-extrabold'
    };

    onSaveScenario(newScenario);
    setIsCreatingNew(false);
    setEditingScenario(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-950 text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-black">Gestor de Escenarios Tarifarios</h2>
              <p className="text-xs text-slate-400">Crear, calibrar y simular nuevas propuestas de concertación</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Action Bar */}
          {!isCreatingNew && !editingScenario && (
            <div className="flex justify-between items-center pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase">Escenarios Disponibles ({scenarios.length})</span>
              <button
                onClick={startCreate}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95"
              >
                + Crear Nuevo Escenario
              </button>
            </div>
          )}

          {/* List of Scenarios */}
          {!isCreatingNew && !editingScenario && (
            <div className="space-y-2.5">
              {scenarios.map(sc => (
                <div 
                  key={sc.id} 
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{sc.label}</span>
                      {sc.badge && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          {sc.badge}
                        </span>
                      )}
                      {sc.isCustom && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                          Personalizado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Tarifa Adulto: <strong>Bs. {sc.adultFare.toFixed(2)}</strong> | Demanda: <strong>{(sc.demandFactor * 100).toFixed(0)}%</strong> | Diésel: <strong>{(sc.fuelPriceFactor * 100).toFixed(0)}%</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => { onSelectScenario(sc.id); onClose(); }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Activar
                    </button>
                    {sc.isCustom && (
                      <>
                        <button
                          onClick={() => startEdit(sc)}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold transition-all"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDeleteScenario(sc.id)}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition-all"
                        >
                          Borrar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form Create / Edit */}
          {(isCreatingNew || editingScenario) && (
            <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isCreatingNew ? 'Crear Nuevo Escenario de Concertación' : `Editar ${editingScenario?.label}`}
                </h3>
                <button
                  type="button"
                  onClick={() => { setIsCreatingNew(false); setEditingScenario(null); }}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                >
                  Volver al listado
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre del Escenario:</label>
                  <input
                    type="text"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="Ej. Propuesta Sindicato Bs. 3,70"
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Etiqueta / Badge:</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    placeholder="Ej. PROPUESTA 2"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Matriz de Tarifas */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">Tarifas por Categoría (Bs/viaje):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Adulto:</label>
                    <input
                      type="number"
                      step="0.05"
                      value={adultFare}
                      onChange={e => setAdultFare(Number(e.target.value))}
                      required
                      className="w-full p-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Adulto Mayor:</label>
                    <input
                      type="number"
                      step="0.05"
                      value={adultosMayores}
                      onChange={e => setAdultosMayores(Number(e.target.value))}
                      required
                      className="w-full p-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Universitario:</label>
                    <input
                      type="number"
                      step="0.05"
                      value={universitarios}
                      onChange={e => setUniversitarios(Number(e.target.value))}
                      required
                      className="w-full p-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Colegial:</label>
                    <input
                      type="number"
                      step="0.05"
                      value={colegiales}
                      onChange={e => setColegiales(Number(e.target.value))}
                      required
                      className="w-full p-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Escolar:</label>
                    <input
                      type="number"
                      step="0.05"
                      value={escolares}
                      onChange={e => setEscolares(Number(e.target.value))}
                      required
                      className="w-full p-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Factores de Sensibilidad */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Factor de Demanda:</label>
                  <select
                    value={demandFactor}
                    onChange={e => setDemandFactor(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value={1.0}>100% (Demanda Normal)</option>
                    <option value={0.9}>90% (Estrés -10%)</option>
                    <option value={0.85}>85% (Crisis -15%)</option>
                    <option value={1.1}>110% (Pico +10%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Factor de Precio Diésel:</label>
                  <select
                    value={fuelPriceFactor}
                    onChange={e => setFuelPriceFactor(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value={1.0}>100% (Precio Base Bs. 17.95)</option>
                    <option value={1.15}>115% (+15% Incremento)</option>
                    <option value={1.25}>125% (+25% Estrés)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsCreatingNew(false); setEditingScenario(null); }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all active:scale-95"
                >
                  Guardar Escenario
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
