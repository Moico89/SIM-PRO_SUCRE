'use client';

import React from 'react';
import type { AuditLog } from '@/types/database';

interface SheetBitacoraAuditoriaProps {
  logs: AuditLog[];
}

const SheetBitacoraAuditoria: React.FC<SheetBitacoraAuditoriaProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Bitácora Inmutable de Auditoría (Audit Logs)</h3>
          <p className="text-[11px] text-slate-500">
            Trazabilidad jurídica: cada ajuste exige usuario, rol, fecha, valores y justificación obligatoria
          </p>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-bold border border-slate-200">
          Append-Only (SuperAdmin)
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <th className="p-2.5">Fecha y Hora</th>
              <th className="p-2.5">Usuario / Rol</th>
              <th className="p-2.5">Organización</th>
              <th className="p-2.5">Acción</th>
              <th className="p-2.5">Parámetro</th>
              <th className="p-2.5">Justificación Registrada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-2.5 text-slate-500 font-mono whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('es-BO')}
                </td>
                <td className="p-2.5 font-medium text-slate-900 whitespace-nowrap">
                  {log.user_email}
                  <span className="block text-[10px] text-blue-600 font-mono">{log.user_role}</span>
                </td>
                <td className="p-2.5 text-slate-600 whitespace-nowrap">
                  {log.user_organization}
                </td>
                <td className="p-2.5 whitespace-nowrap">
                  <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                    {log.action}
                  </span>
                </td>
                <td className="p-2.5 font-mono text-slate-800 whitespace-nowrap">
                  {log.field_name || log.entity_name}
                </td>
                <td className="p-2.5 text-slate-700 italic">
                  "{log.justification}"
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No hay registros de auditoría disponibles en esta sesión.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(SheetBitacoraAuditoria);
