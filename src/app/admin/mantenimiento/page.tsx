import React from 'react';
import MaintenanceEditor from '@/components/MaintenanceEditor';
import { getTemplatesByOrg } from '@/actions/maintenance';
import { getVehicleTypes } from '@/actions/fleet';

export const dynamic = 'force-dynamic';

export default async function MantenimientoAdminPage({
  searchParams
}: {
  searchParams: { vehicle?: string }
}) {
  const organizationId = '0140e25f-10f6-4099-a778-b42d9d191c06'; // Sucre
  
  // 1. Cargar vehículos usando la acción de servidor ya existente
  const vehicles = await getVehicleTypes(organizationId);

  // 2. Cargar plantillas de mantenimiento
  const templates = await getTemplatesByOrg(organizationId);

  // Determinar qué plantilla mostrar
  const selectedVehicleId = searchParams.vehicle || (vehicles && vehicles.length > 0 ? vehicles[0].id : null);
  
  // Buscar si el vehículo seleccionado ya tiene plantilla
  let activeTemplate = templates.find(t => t.vehicle_type_id === selectedVehicleId);
  
  // Si no tiene plantilla, pasamos un objeto "fantasma" que se guardará al hacer submit?
  // O mejor creamos una si no existe al vuelo en la UI. Para MVP, pasaremos un objeto vacío con el vehicle_id
  if (!activeTemplate && selectedVehicleId) {
    const v = vehicles?.find(v => v.id === selectedVehicleId);
    activeTemplate = {
      id: `new_${selectedVehicleId}`, // bandera para saber que es nueva
      vehicle_type_id: selectedVehicleId,
      name: `Plantilla Base - ${v?.brand} ${v?.model}`,
      total_annual_cost: 0,
      total_monthly_cost: 0,
      is_new: true
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <a href="/" className="text-sm font-medium text-slate-400 hover:text-emerald-600 transition-colors">
                ← Volver al Dashboard
              </a>
              <span className="text-slate-300">|</span>
              <a href="/admin/flota" className="text-sm font-medium text-slate-400 hover:text-emerald-600 transition-colors">
                Catálogo de Flota
              </a>
            </div>
            <h1 className="text-3xl font-extrabold text-[#070f26]">Plantillas de Mantenimiento</h1>
            <p className="text-slate-500 mt-2">Configura los costos y frecuencias de mantenimiento para cada tipo de vehículo.</p>
          </div>
        </div>

        {/* Selector de Vehículo */}
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-2">Selecciona el Vehículo a Configurar</label>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {vehicles?.map(v => {
              const hasTemplate = templates.some(t => t.vehicle_type_id === v.id);
              return (
                <a 
                  key={v.id} 
                  href={`/admin/mantenimiento?vehicle=${v.id}`}
                  className={`min-w-[200px] p-4 rounded-xl border-2 transition-all ${selectedVehicleId === v.id ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <div className="text-xs font-bold text-slate-400 uppercase">{v.transport_modes?.name}</div>
                  <div className="font-bold text-[#070f26] text-lg">{v.brand}</div>
                  <div className="text-slate-600 text-sm">{v.model}</div>
                  <div className={`mt-2 text-xs font-bold flex items-center gap-1.5 ${hasTemplate ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {hasTemplate ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Plantilla Configurada</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Sin Plantilla</span>
                      </>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {activeTemplate ? (
          <MaintenanceEditor template={activeTemplate} />
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-8 rounded-xl text-center">
            <h3 className="text-lg font-bold mb-2">No hay vehículos registrados</h3>
            <p>Debes registrar al menos un vehículo en el Catálogo de Flota antes de configurar su mantenimiento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
