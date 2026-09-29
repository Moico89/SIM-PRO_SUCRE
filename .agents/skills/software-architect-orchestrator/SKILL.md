---
name: software-architect-orchestrator
description: >-
  Orchestrates end-to-end full-stack and mobile device system architecture.
  Use when planning complex software systems, decomposing requirements into
  modular microservices/domains, drafting Architecture Decision Records (ADRs),
  validating multi-tenant isolation, and coordinating specialized agents.
---

# Software Architect & Orchestration Engine

Este skill provee el procedimiento maestro para planificar, descomponer y coordinar sistemas complejos web y mobile.

## 📋 Flujo de Orquestación

### Paso 1: Análisis de Requerimientos y Modelado C4
1. **Contexto del Sistema**: Definir usuarios, dispositivos cliente (Web, Mobile iOS/Android, IoT/Hardware) y dependencias externas.
2. **Descomposición Modular**:
   - Identificar dominios y límites de contexto (Bounded Contexts).
   - Definir si se requiere monorrepo (Turborepo/Nx) o servicios distribuidos.

### Paso 2: Gobernanza de Multi-Tenancy y Seguridad
- Confirmar la estrategia de aislamiento:
  - Base de datos compartida con discriminador `tenant_id` + Row Level Security (RLS) *(Recomendado por defecto)*.
  - Esquema por tenant.
  - Base de datos por tenant para entornos corporativos/aislados.

### Paso 3: Generación del Grafo de Tareas
Desglosar el desarrollo en paquetes de trabajo asignables:
1. **Contratos e Interfaces** (`fullstack-contract-generator`).
2. **Persistencia y Backend** (`backend-cloud-architect`).
3. **Frontend Web & Dashboard** (`frontend-web-architect`).
4. **Mobile & Device Layer** (`mobile-device-architect`).
5. **Auditoría de Seguridad y Pruebas** (`qa-security-sentinel`).

### Paso 4: Criterio de Aceptación y DoD
Verificar que cada módulo cumpla:
- Cero uso de `any`.
- Log estructurado en cada mutación o job en background.
- Manejo defensivo de excepciones.
