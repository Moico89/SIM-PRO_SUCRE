---
name: multi-tenant-db-designer
description: >-
  Designs secure, scalable multi-tenant database schemas with PostgreSQL / Supabase,
  Row Level Security (RLS), partition strategies, index optimizations, and audit logs.
  Use when creating database models, designing migrations, or enforcing multi-tenant isolation.
---

# Multi-Tenant Database Architecture & Security Skill

Este skill define la metodología para crear esquemas de base de datos relacionales multi-inquilino a prueba de fugas de información.

## 🛡️ Principios de Diseño

### 1. Clave Discriminadora Obligatoria
Toda tabla con datos de clientes/organizaciones debe contener:
- `organization_id UUID NOT NULL` (o `tenant_id`)
- Foreign Key hacia la tabla `organizations` o `tenants`.
- Índice compuesto en `(organization_id, created_at DESC)` para queries rápidas paginadas.

### 2. Plantilla Estándar de Políticas RLS (PostgreSQL / Supabase)

```sql
-- 1. Habilitar RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE items FORCE ROW LEVEL SECURITY;

-- 2. Política de Aislamiento SELECT
CREATE POLICY "Tenant isolation for select"
ON items FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
);

-- 3. Política de Inserción
CREATE POLICY "Tenant isolation for insert"
ON items FOR INSERT
WITH CHECK (
  organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
);

-- 4. Política de Actualización
CREATE POLICY "Tenant isolation for update"
ON items FOR UPDATE
USING (
  organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
)
WITH CHECK (
  organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
);

-- 5. Política de Eliminación
CREATE POLICY "Tenant isolation for delete"
ON items FOR DELETE
USING (
  organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
);
```

### 3. Registro de Auditoría (Audit Log Trigger)
Toda mutación crítica debe alimentar automáticamente una tabla inmutable `audit_logs` con `previous_state`, `new_state`, `actor_id` y `organization_id`.
