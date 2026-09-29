# Regla: Estándares Backend, Cloud y Base de Datos

## Especialista: Backend & Cloud Architect

## Estándares de Implementación
1. **Seguridad y Aislamiento de Datos**:
   - En PostgreSQL/Supabase: Habilitar Row Level Security (RLS) en todas las tablas sin excepción.
   - Toda consulta debe filtrar explícitamente por `tenant_id` / `org_id` / `user_id`.
   - Prohibido SQL dinámico sin sanitización (prevenir SQLi).
2. **Arquitectura de Servicios**:
   - Separar capa de Transporte (Controllers/Handlers), Capa de Dominio/Servicio (Business Logic) y Capa de Datos (Repositories/ORM).
   - Operaciones pesadas (>200ms) deben delegarse a Background Workers / Colas (BullMQ, Celery o Cloud Tasks).
3. **Manejo de Errores y Observabilidad**:
   - Uso de respuestas uniformes con códigos de error canónicos (`RESOURCE_NOT_FOUND`, `UNAUTHORIZED_TENANT`, `VALIDATION_ERROR`).
   - Logging estructurado en formato JSON con contexto (`tenant_id`, `trace_id`, `duration_ms`).
