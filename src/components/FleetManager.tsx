'use client';

import React, { useState } from 'react';
import { createVehicleType, updateVehicleType, deleteVehicleType, toggleVehicleActive } from '@/actions/fleet';
import { VehicleType, TransportMode, FuelType } from '@/types/database';

export interface FleetVehicleItem extends VehicleType {
  transport_modes?: { name: string };
  fuel_types?: { name: string; unit: string };
}

export default function FleetManager({
  organizationId,
  initialVehicles,
  transportModes,
  fuelTypes
}: {
  organizationId: string;
  initialVehicles: FleetVehicleItem[];
  transportModes: TransportMode[];
  fuelTypes: FuelType[];
}) {
  const [vehicles, setVehicles] = useState<FleetVehicleItem[]>(initialVehicles);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    transport_mode_id: transportModes[0]?.id || '',
    fuel_type_id: fuelTypes[0]?.id || '',
    brand: '',
    model: '',
    capacity_seated: 0,
    capacity_standing: 0,
    fuel_efficiency: 0,
    idle_congestion_factor: 0.15,
    replacement_value: 0,
    useful_life_months: 120
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        // Modo Edición
        const { id, ...updateData } = formData;
        const updatedVehicle = await updateVehicleType(id, { ...updateData, organization_id: organizationId });
        setVehicles(vehicles.map(v => v.id === id ? { ...v, ...updatedVehicle, transport_modes: transportModes.find(t => t.id === updateData.transport_mode_id), fuel_types: fuelTypes.find(f => f.id === updateData.fuel_type_id) } : v));
      } else {
        // Modo Creación
        const { id, ...insertData } = formData;
        const newVehicle = await createVehicleType({ ...insertData, organization_id: organizationId, residual_value: 0, is_active: true });
        setVehicles([...vehicles, { ...newVehicle, transport_modes: transportModes.find(t => t.id === insertData.transport_mode_id), fuel_types: fuelTypes.find(f => f.id === insertData.fuel_type_id) }]);
      }
      setIsAdding(false);
    } catch (err) {
      alert('Error al guardar vehículo: ' + (err as Error).message);
    }
  };

  const handleEdit = (v: FleetVehicleItem) => {
    setFormData({
      id: v.id,
      transport_mode_id: v.transport_mode_id,
      fuel_type_id: v.fuel_type_id,
      brand: v.brand,
      model: v.model,
      capacity_seated: v.capacity_seated,
      capacity_standing: v.capacity_standing,
      fuel_efficiency: v.fuel_efficiency,
      idle_congestion_factor: v.idle_congestion_factor,
      replacement_value: v.replacement_value,
      useful_life_months: v.useful_life_months
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el vehículo ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteVehicleType(id);
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (err) {
      alert('Error al eliminar vehículo: ' + (err as Error).message);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await toggleVehicleActive(id, !currentState);
      setVehicles(vehicles.map(v => v.id === id ? { ...v, is_active: !currentState } : v));
    } catch (err) {
      alert('Error al cambiar estado: ' + (err as Error).message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <a href="/" className="text-sm font-medium text-slate-400 hover:text-emerald-600 transition-colors">
              ← Volver al Dashboard
            </a>
          </div>
          <h1 className="text-3xl font-extrabold text-[#070f26]">Catálogo de Flota Multimodal</h1>
          <p className="text-slate-500 mt-2">Gestiona los tipos de vehículos y tecnologías limpias disponibles para simulación tarifaria.</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              id: '',
              transport_mode_id: transportModes[0]?.id || '',
              fuel_type_id: fuelTypes[0]?.id || '',
              brand: '',
              model: '',
              capacity_seated: 0,
              capacity_standing: 0,
              fuel_efficiency: 0,
              idle_congestion_factor: 0.15,
              replacement_value: 0,
              useful_life_months: 120
            });
            setIsAdding(!isAdding);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-colors"
        >
          {isAdding ? 'Cancelar' : '+ Registrar Nuevo Vehículo'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-[#070f26]">{formData.id ? 'Editar Vehículo' : 'Nuevo Vehículo Patrón'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Modo de Transporte</label>
              <select 
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                value={formData.transport_mode_id}
                onChange={e => setFormData({...formData, transport_mode_id: e.target.value})}
                required
              >
                {transportModes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Tecnología / Energía</label>
              <select 
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                value={formData.fuel_type_id}
                onChange={e => setFormData({...formData, fuel_type_id: e.target.value})}
                required
              >
                {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name} ({f.unit})</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Marca (Ej. Nissan, BYD)</label>
              <input type="text" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50"/>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Modelo (Ej. Civilian, K7)</label>
              <input type="text" required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50"/>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Capacidad Sentados (pax)</label>
              <input type="number" required min="1" value={formData.capacity_seated} onChange={e => setFormData({...formData, capacity_seated: parseInt(e.target.value)})} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50"/>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Capacidad Parados (pax)</label>
              <input type="number" required min="0" value={formData.capacity_standing} onChange={e => setFormData({...formData, capacity_standing: parseInt(e.target.value)})} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50"/>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Eficiencia (km / unidad)</label>
              <input type="number" step="0.01" required min="0.1" value={formData.fuel_efficiency} onChange={e => setFormData({...formData, fuel_efficiency: parseFloat(e.target.value)})} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50"/>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Valor Reposición Nuevo (Bs)</label>
              <input type="number" step="100" required value={formData.replacement_value} onChange={e => setFormData({...formData, replacement_value: parseFloat(e.target.value)})} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50"/>
              <p className="text-[10px] text-slate-400">Costo actual de mercado de un vehículo 0 km equivalente (Ej. Taxi ~120,000 Bs).</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Factor Congestión Ralentí</label>
              <input type="number" step="0.01" required value={formData.idle_congestion_factor} onChange={e => setFormData({...formData, idle_congestion_factor: parseFloat(e.target.value)})} className="w-full border p-2.5 rounded-lg text-sm bg-slate-50"/>
            </div>

            <div className="col-span-full flex justify-end mt-4">
              <button type="submit" className="bg-[#070f26] text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition">
                Guardar Vehículo en Base de Datos
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold">Modo</th>
              <th className="p-4 font-bold">Marca y Modelo</th>
              <th className="p-4 font-bold">Energía</th>
              <th className="p-4 font-bold">Capacidad</th>
              <th className="p-4 font-bold">Rendimiento</th>
              <th className="p-4 font-bold text-right">Valor Reposición</th>
              <th className="p-4 font-bold text-center">Estado</th>
              <th className="p-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-medium text-slate-800">{v.transport_modes?.name}</td>
                <td className="p-4">
                  <div className="font-bold text-[#070f26]">{v.brand}</div>
                  <div className="text-slate-500 text-xs">{v.model}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    v.fuel_types?.name.toLowerCase().includes('eléctrico') ? 'bg-green-100 text-green-800' :
                    v.fuel_types?.name.toLowerCase().includes('gnv') ? 'bg-sky-100 text-sky-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {v.fuel_types?.name}
                  </span>
                </td>
                <td className="p-4 text-slate-600">
                  {v.capacity_seated} sent. <br/> {v.capacity_standing} pie
                </td>
                <td className="p-4 font-medium text-slate-700">
                  {v.fuel_efficiency} <span className="text-slate-400 text-xs font-normal">km/{v.fuel_types?.unit}</span>
                </td>
                <td className="p-4 font-mono text-right text-slate-700">
                  Bs. {Number(v.replacement_value).toLocaleString('es-BO')}
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleToggleActive(v.id, v.is_active)}
                    className={`px-2 py-1 text-xs font-bold rounded-full transition-colors ${v.is_active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                  >
                    {v.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="p-4 text-right space-x-2">
                  <a 
                    href={`/admin/mantenimiento?vehicle=${v.id}`}
                    className="inline-flex p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                    title="Configurar Mantenimiento"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </a>
                  <button 
                    onClick={() => handleEdit(v)}
                    className="inline-flex p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(v.id, `${v.brand} ${v.model}`)}
                    className="inline-flex p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">No hay vehículos registrados para esta organización.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
