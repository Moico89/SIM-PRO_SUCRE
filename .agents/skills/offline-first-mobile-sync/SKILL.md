---
name: offline-first-mobile-sync
description: >-
  Designs resilient offline-first data architectures and synchronization pipelines
  for mobile and device applications (React Native, Expo, Flutter, native Android/iOS).
  Use when building mobile apps that require local persistence, hardware interaction,
  and background cloud synchronization.
---

# Offline-First Mobile & Device Synchronization Skill

Guía para diseñar e implementar aplicaciones móviles con funcionamiento 100% offline y sincronización determinista en segundo plano.

## 📱 Arquitectura de Capas Mobile

```
[UI Views / Screens]
        │
[ViewModels / State Hooks]
        │
[Domain Repository Interface]
   ┌────┴───────────────────────────┐
   ▼                                ▼
[Local Store: SQLite / MMKV]   [Sync Engine & Queue]
                                    │ (Network available)
                                    ▼
                             [Remote REST / GraphQL API]
```

## 🔄 Protocolo de Sincronización y Cola Local (Sync Queue)

1. **Escrituras Optimistas (Local-First)**:
   - Toda acción del usuario se guarda inmediatamente en la base de datos local con estado `sync_status = 'pending'`.
   - La UI se actualiza de forma instantánea.

2. **Sync Worker (Background Task)**:
   - Monitorea el estado de la red (`NetInfo`).
   - Procesa la cola de mutaciones en orden cronológico (`idempotency_key`, `timestamp`).
   - Envía payload al servidor y actualiza `sync_status = 'synced'` tras recibir `200 OK`.

3. **Resolución de Conflictos**:
   - **Estrategia LWW (Last-Write-Wins)**: Comparación de `updated_at` en servidor vs cliente con tolerancia a clock skew.
   - **Estrategia de 3 Vías (Merge)**: Para documentos complejos o campos editables simultáneamente.

4. **Integración de Sensores y Hardware**:
   - Encapsular listeners de hardware (GPS, Bluetooth, Cámara) en controladores con ciclo de vida seguro (`subscribe` / `unsubscribe`).
