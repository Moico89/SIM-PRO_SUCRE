import { z } from 'zod';

export const UpdateParameterSchema = z.object({
  sessionId: z.string(),
  parameterId: z.string(),
  field: z.enum([
    'fuel_price_bs_l',
    'fuel_efficiency_km_l',
    'maintenance_monthly_bs',
    'driver_salary_bs',
    'fleet_active',
    'turns_day',
    'operating_days_month',
    'demand_network_day',
    'km_network_day'
  ]),
  newValue: z.number().positive('El valor debe ser estrictamente positivo'),
  justification: z.string().min(10, 'La justificación técnica debe contener al menos 10 caracteres para cumplir con la auditoría municipal'),
  userEmail: z.string().optional(),
  userRole: z.string().optional(),
  userOrg: z.string().optional()
});

export type UpdateParameterInput = z.infer<typeof UpdateParameterSchema>;
