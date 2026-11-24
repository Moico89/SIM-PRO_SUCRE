'use client';

import React, { useState, useEffect } from 'react';
import { getItemsByTemplate, saveMaintenanceItems, updateTemplateTotals } from '@/actions/maintenance';

import { MaintenanceTemplate, MaintenanceItem } from '@/types/database';

const CATEGORIES = ['Motor', 'Frenos', 'Transmisión', 'Suspensión', 'Eléctrico', 'Neumáticos', 'Carrocería', 'Lubricantes y Fluidos', 'Otros'];

export interface MaintenanceEditorTemplateProps extends Partial<MaintenanceTemplate> {
  id: string;
  name: string;
  is_new?: boolean;
}

export interface EditableMaintenanceItem {
  id: string;
  template_id?: string;
  category: string;
  item_name: string;
  unit_cost: number;
  frequency_per_year: number;
  sort_order?: number;
  notes?: string;
}

export default function MaintenanceEditor({ template }: { template: MaintenanceEditorTemplateProps }) {
  const [items, setItems] = useState<EditableMaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (template.is_new) {
        // Pre-cargar los ítems dependiendo del tipo de vehículo
        const nameLower = template.name.toLowerCase();
        let dataSource = '@/data/maintenanceItems.json';
        if (nameLower.includes('eléctrico') || nameLower.includes('ev')) {
          dataSource = '@/data/maintenanceItemsEV.json';
        } else if (nameLower.includes('gnv')) {
          dataSource = '@/data/maintenanceItemsGNV.json';
        } else if (nameLower.includes('toyota') || nameLower.includes('caldina') || nameLower.includes('corolla') || nameLower.includes('taxi')) {
          dataSource = '@/data/maintenanceItemsTaxi.json';
        } else if (nameLower.includes('gasolina')) {
          dataSource = '@/data/maintenanceItemsGasolina.json';
        }

        // Cargar módulo dinámicamente según la variante
        const module = await (
          dataSource === '@/data/maintenanceItemsEV.json' ? import('@/data/maintenanceItemsEV.json') :
          dataSource === '@/data/maintenanceItemsGNV.json' ? import('@/data/maintenanceItemsGNV.json') :
          dataSource === '@/data/maintenanceItemsTaxi.json' ? import('@/data/maintenanceItemsTaxi.json') :
          dataSource === '@/data/maintenanceItemsGasolina.json' ? import('@/data/maintenanceItemsGasolina.json') :
          import('@/data/maintenanceItems.json')
        );

        interface RawJsonItem {
          id: number | string;
          name: string;
          totalUnitCost: number;
          frequencyYears: number;
        }

        const defaultItems = (module.default as RawJsonItem[]).map((item) => {
            // Asignación rápida de categoría
            let cat = 'Otros';
            const name = item.name.toLowerCase();
            if (name.includes('aceite') || name.includes('líquido') || name.includes('anticongelante') || name.includes('refrigerante')) cat = 'Lubricantes y Fluidos';
            else if (name.includes('motor') || name.includes('filtro') || name.includes('ventilador') || name.includes('termostato') || name.includes('bujía')) cat = 'Motor';
            else if (name.includes('freno') || name.includes('balata')) cat = 'Frenos';
            else if (name.includes('embrague') || name.includes('corona') || name.includes('cardan') || name.includes('transmisión')) cat = 'Transmisión';
            else if (name.includes('suspensión') || name.includes('amortiguador') || name.includes('muelles') || name.includes('dirección')) cat = 'Suspensión';
            else if (name.includes('batería') || name.includes('foco') || name.includes('alternador') || name.includes('eléctrico')) cat = 'Eléctrico';
            else if (name.includes('neumático')) cat = 'Neumáticos';
            else if (name.includes('carrocería') || name.includes('tapizado')) cat = 'Carrocería';
            else if (name.includes('gnv') || name.includes('hidrostática')) cat = 'Otros';

            return {
              id: `preload-${item.id}`,
              category: cat,
              item_name: item.name,
              unit_cost: item.totalUnitCost,
              frequency_per_year: Number((1 / item.frequencyYears).toFixed(2)) // <-- Invertir: si es cada 2 años = 0.5/año
            };
          });
          setItems(defaultItems);
          setLoading(false);
        return;
      }
      try {
        const data = await getItemsByTemplate(template.id);
        setItems(data);
      } catch (err) {
        alert('Error al cargar ítems: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [template.id, template.is_new]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), category: 'Motor', item_name: '', unit_cost: 0, frequency_per_year: 1 }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleChange = (id: string, field: keyof EditableMaintenanceItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const totalAnual = items.reduce((acc, curr) => acc + (curr.unit_cost * curr.frequency_per_year), 0);
  const totalMensual = totalAnual / 12;

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalTemplateId = template.id;

      // Si es nueva, primero crear la plantilla en BD
      if (template.is_new) {
        const { createTemplate } = await import('@/actions/maintenance');
        const newTemplate = await createTemplate({
          organization_id: '0140e25f-10f6-4099-a778-b42d9d191c06',
          vehicle_type_id: template.vehicle_type_id,
          name: template.name,
          total_annual_cost: totalAnual,
          total_monthly_cost: totalMensual,
          variable_share: 0.5,
          fixed_share: 0.5,
          is_locked: false
        });
        finalTemplateId = newTemplate.id;
        
        // Remove dummy id from items before saving
        await saveMaintenanceItems(finalTemplateId, items.map(({ id: _id, ...rest }) => ({
          ...rest,
          template_id: finalTemplateId,
          sort_order: rest.sort_order || 0
        })));
        
        // Reload page to reflect new state
        window.location.reload();
        return;
      }

      // Si ya existe
      await saveMaintenanceItems(finalTemplateId, items.map(({ id: _id, ...rest }, idx) => ({
        ...rest,
        template_id: finalTemplateId,
        sort_order: rest.sort_order ?? (idx + 1)
      })));
      
      await updateTemplateTotals(finalTemplateId, {
        total_annual_cost: totalAnual,
        total_monthly_cost: totalMensual,
        variable_share: 0.5,
        fixed_share: 0.5
      });
      alert('Plantilla guardada correctamente');
    } catch (err) {
      alert('Error al guardar: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando ítems...</div>;

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#070f26]">Matriz de Mantenimiento</h2>
          <p className="text-sm text-slate-500">{template.name}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-emerald-600">Bs. {totalAnual.toLocaleString('es-BO', {minimumFractionDigits: 2})} <span className="text-sm text-slate-500 font-normal">/año</span></div>
          <div className="text-sm text-slate-400">Mensual: Bs. {totalMensual.toLocaleString('es-BO', {minimumFractionDigits: 2})}</div>
        </div>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map(category => {
          const catItems = items.filter(i => i.category === category);
          if (catItems.length === 0 && !items.some(i => i.item_name === '')) return null; // Hide empty categories unless adding
          
          return (
            <div key={category} className="space-y-2">
              {catItems.length > 0 && <h3 className="font-bold text-slate-700 text-sm uppercase bg-slate-50 p-2 rounded">{category}</h3>}
              {catItems.map(item => (
                <div key={item.id} className="flex items-center space-x-3 bg-white border border-slate-100 p-2 rounded-lg hover:border-slate-300 transition">
                  <select 
                    value={item.category} 
                    onChange={e => handleChange(item.id, 'category', e.target.value)}
                    className="w-1/5 text-sm p-2 border rounded bg-slate-50"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  
                  <input 
                    type="text" 
                    placeholder="Nombre del Repuesto/Servicio" 
                    value={item.item_name}
                    onChange={e => handleChange(item.id, 'item_name', e.target.value)}
                    className="w-2/5 text-sm p-2 border rounded"
                  />
                  
                  <div className="w-1/5 flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-bold">Bs.</span>
                    <input 
                      type="number" 
                      step="0.1"
                      placeholder="Costo Unit." 
                      value={item.unit_cost === 0 ? '' : item.unit_cost}
                      onChange={e => handleChange(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm p-2 border rounded"
                    />
                  </div>
                  
                  <div className="w-1/5 flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-bold">Fre. Anual</span>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Ej. 2" 
                      value={item.frequency_per_year === 0 ? '' : item.frequency_per_year}
                      onChange={e => handleChange(item.id, 'frequency_per_year', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm p-2 border rounded"
                    />
                  </div>

                  <div className="w-auto font-mono text-sm text-slate-600 font-bold text-right px-2 min-w-[100px]">
                    Bs. {(item.unit_cost * item.frequency_per_year).toLocaleString('es-BO', {minimumFractionDigits: 2})}
                  </div>

                  <button 
                    onClick={() => handleRemoveItem(item.id)} 
                    className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    title="Eliminar ítem"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        {items.length === 0 && <div className="text-center p-8 text-slate-400">No hay ítems configurados. Haz clic en "Agregar Ítem" para comenzar.</div>}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <button 
          onClick={handleAddItem}
          className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center px-4 py-2 border border-emerald-200 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition"
        >
          + Agregar Ítem
        </button>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#070f26] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-slate-800 transition disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Plantilla'}
        </button>
      </div>
    </div>
  );
}
