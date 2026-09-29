# MEMORY: Arquitectura & Decisiones de Gobernanza SIM-PRO

## 1. Módulo de Autenticación & Control de Acceso (RBAC)
- **Eliminación del Selector de Roles**: Queda terminantemente prohibido el cambio de rol manual o no autenticado en la interfaz. El rol se hereda estrictamente del perfil (`Profile`) verificado en Supabase Auth / Google OAuth.
- **Jerarquía de Cuentas**:
  - `SuperAdmin` (`ecotraffic.bo@gmail.com`): Creación de administradores Nivel 1, asignación de roles, auditoría de accesos.
  - `Admin Municipal` (`admin.transporte@sucre.bo` / `@sucre.bo`): Ajuste de escenarios y parámetros oficiales con justificación legal obligatoria ($\ge 10$ caracteres).
  - `Consultor Técnico` (`Ecotraffic`): Modelación econométrica de mantenimiento, combustible y WACC.
  - `Delegado Sindical` & `Observador`: Consulta y simulación en tiempo real (modo lectura/proyección).

## 2. Inmutabilidad y Auditoría Estricta
- Cada modificación en `system_parameters` o `fare_categories` genera un registro inmutable en `audit_logs` con `user_email`, `user_role`, `user_organization`, `action`, `old_value`, `new_value`, `justification` y timestamp exacto.

## 3. Experiencia de Usuario & Responsive Mobile
- Modo inicial restringido en `LandingPage`. Ningún usuario accede al simulador sin autenticación previa mediante correo o Google/Gmail.
- Dossier PDF adaptado para impresión oficial (`@media print`), exportación de `.xlsx` dinámico con SheetJS.
