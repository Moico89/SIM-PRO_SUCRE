# Regla: Estándares Mobile & Device Hardware

## Especialista: Mobile & Device Architect

## Estándares de Implementación
1. **Offline-First Resilience**:
   - Todo flujo crítico debe funcionar sin conexión a internet.
   - Persistencia local con SQLite / WatermelonDB / MMKV.
   - Cola de sincronización bidireccional (Sync Queue) con estrategias claras de resolución de conflictos (Last-Write-Wins con timestamps confiables o CRDTs).
2. **Device Hardware & Native Bridges**:
   - Abstracción limpia para sensores y periféricos (Bluetooth Low Energy / BLE, GPS/Geolocalización en background, NFC, Cámara/OCR, Biometría).
   - Manejo estricto de permisos en tiempo de ejecución con pantallas informativas de contexto (Rationale UX).
3. **Gestión de Recursos y Batería**:
   - Optimización de polling y listeners de hardware; liberar recursos en `unmount` o backgrounding.
   - Manejo controlado de memoria en listas infinitas y renderizado de imágenes.
