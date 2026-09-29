# Regla: Estándares Frontend Web

## Especialista: Frontend Web Architect

## Estándares de Implementación
1. **Clean UI Architecture**:
   - Componentes exclusivamente para presentación y binding de interacción.
   - Prohibido embeber llamadas directas a APIs o lógica de negocio compleja en componentes JSX/TSX; extraer a Custom Hooks, Stores o Services.
2. **Type Safety & State**:
   - Tipado estricto sin `any`. Usar Zod para parsear datos externos (APIs, WebSockets).
   - Estado de servidor gestionado con TanStack Query / SWR con claves de cache jerárquicas e invalidación granular.
   - Estado de UI con Zustand o reducers puros.
3. **Performance & UX Premium**:
   - Optimización de Core Web Vitals (LCP, FID, CLS).
   - Microinteracciones, skeleton loaders para estados asíncronos y diseño responsivo robusto.
