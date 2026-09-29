# Regla: Gobernanza del Orquestador y Arquitectura de Sistemas

## Rol del Orquestador
El Orquestador (`lead-orchestrator`) actúa como el Arquitecto Principal del sistema. No se escribe código hasta que las decisiones de diseño fundamentales estén validadas.

## Principios Obligatorios
1. **Aislamiento Multi-Tenant**: Toda arquitectura debe contemplar `tenant_id` / `org_id` en las entidades de persistencia, sesiones y logs.
2. **Desacoplamiento Modular**: Separar dominios de negocio (Core, Facturación, Auth, Dispositivos/IoT, IA) evitando dependencias circulares.
3. **Contratos Estrictos**: Todo flujo de datos entre backend, web y mobile debe estar tipado de extremo a extremo (Zod / TypeScript / Protocol Buffers).
4. **Impact Analysis First**: Todo cambio que afecte el Estado Global, la base de datos o el modelo de sincronización requiere un desglose paso a paso antes de implementarse.
