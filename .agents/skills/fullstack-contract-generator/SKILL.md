---
name: fullstack-contract-generator
description: >-
  Generates end-to-end type-safe contracts, Zod validation schemas, API interfaces,
  and AI Tool Calling definitions for Web, Mobile, and Backend communication.
  Use when defining API payloads, shared entity models, or LLM function schemas.
---

# Full-Stack Type-Safe Contract Generator Skill

Este skill define el estándar para compartir tipos e interfaces sin duplicación entre Backend, Web y Dispositivos Móviles.

## 📐 Estándar de Contratos con Zod & TypeScript

```typescript
import { z } from 'zod';

// 1. Esquema Base con Aislamiento Tenant
export const BaseTenantEntitySchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// 2. Esquema de Entidad de Negocio (Ejemplo)
export const DeviceTelemetrySchema = BaseTenantEntitySchema.extend({
  device_id: z.string().min(1),
  battery_level: z.number().min(0).max(100),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }),
  status: z.enum(['active', 'idle', 'offline', 'error']),
});

export type DeviceTelemetry = z.infer<typeof DeviceTelemetrySchema>;

// 3. Esquema para IA Tool Calling
export const QueryDeviceTelemetryToolSchema = {
  name: 'query_device_telemetry',
  description: 'Consulta el estado y telemetría de un dispositivo dentro de una organización.',
  parameters: {
    type: 'object',
    properties: {
      organization_id: { type: 'string', format: 'uuid', description: 'ID de la organización' },
      device_id: { type: 'string', description: 'Identificador del dispositivo' },
      limit: { type: 'number', default: 50, description: 'Límite de registros' }
    },
    required: ['organization_id', 'device_id']
  }
};
```
