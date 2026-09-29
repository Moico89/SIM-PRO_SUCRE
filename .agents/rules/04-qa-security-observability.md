# Regla: QA, Seguridad, Observabilidad y Definition of Done (DoD)

## Especialista: QA & Security Sentinel

## Criterios de Aprobación
1. **Auditoría de Seguridad**:
   - Validación de inputs con esquemas rigurosos.
   - Verificación de tokens de sesión, expiración y refresh rotation.
   - Confirmación de aislamiento de datos en cada query o endpoint.
2. **Definición de Terminado (Definition of Done - DoD)**:
   - Cero errores de compilación TypeScript (`tsc --noEmit`).
   - Cero variables `any` no justificadas.
   - Manejo de fallos en llamadas de red / integraciones con fallbacks visuales y logs estructurados.
   - Actualización de registros de decisiones técnicas o documentación de arquitectura.
