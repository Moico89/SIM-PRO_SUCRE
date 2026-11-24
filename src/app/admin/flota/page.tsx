import { getFuelTypes, getTransportModes, getVehicleTypes } from '@/actions/fleet';
import FleetManager from '@/components/FleetManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tarify OS - Gestión de Flota y Multimodalidad',
};

export default async function FlotaAdminPage() {
  // En un entorno de producción real SaaS, esto se extrae del tenant_id del JWT o subdominio
  // Por ahora hardcodeamos el slug "sucre" que mapeamos a su UUID
  const organizationId = '0140e25f-10f6-4099-a778-b42d9d191c06';

  // Data fetching en el servidor
  const [fuelTypes, transportModes, vehicles] = await Promise.all([
    getFuelTypes(),
    getTransportModes(organizationId),
    getVehicleTypes(organizationId)
  ]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <FleetManager 
        organizationId={organizationId}
        initialVehicles={vehicles}
        transportModes={transportModes}
        fuelTypes={fuelTypes}
      />
    </div>
  );
}
