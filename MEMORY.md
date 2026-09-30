# MEMORY: Arquitectura & Decisiones de Gobernanza SIM-PRO / Tarify OS

## 1. Módulo de Autenticación & Control de Acceso (RBAC)
- **Eliminación del Selector de Roles**: Queda terminantemente prohibido el cambio de rol manual o no autenticado en la interfaz. El rol se hereda estrictamente del perfil (`Profile`) verificado en Supabase Auth / Google OAuth o directorio de credenciales autorizadas.
- **Jerarquía de Cuentas**:
  - `SuperAdmin` (`ecotraffic.bo@gmail.com`): Creación de administradores Nivel 1, asignación de roles, auditoría de accesos.
  - `Admin Municipal` (`admin.transporte@sucre.bo` / `@sucre.bo`): Ajuste de escenarios y parámetros oficiales con justificación legal obligatoria ($\ge 10$ caracteres).
  - `Consultor Técnico` (`Ecotraffic`): Modelación econométrica de mantenimiento, combustible y WACC.
  - `Delegado Sindical` & `Observador`: Consulta y simulación en tiempo real (modo lectura/proyección).

## 2. Inmutabilidad y Auditoría Estricta
- Cada modificación en `system_parameters`, `fare_categories` o `scenarios` genera un registro inmutable en `audit_logs` con `user_email`, `user_role`, `user_organization`, `action`, `old_value`, `new_value`, `justification` y timestamp exacto.
- Soporte para las acciones: `'CAMBIO_PARAMETRO'`, `'CAMBIO_TARIFA'`, `'CREACION_ESCENARIO'`, `'EDICION_ESCENARIO'`, `'BLOQUEO_SESION'`, `'DESBLOQUEO_SESION'`.

## 3. Gestor Dinámico de Escenarios
- Todos los escenarios (oficiales y personalizados) disponen de botones de control directo:
  - **Activar / Desactivar**: Alterna el escenario activo en la modelación económica.
  - **Editar**: Modifica tarifas sociales (adulto, adultos mayores, universitarios, etc.) y factores de demanda/combustible.
  - **Eliminar**: Remueve propuestas descartadas.
  - **Crear Nuevo**: Añade variantes de concertación.

## 4. Resiliencia & Persistencia
- Persistencia local y en servidor de parámetros y escenarios modificados (`simpro_params`, `simpro_scenarios`, `simpro_logs`).
- Eliminación de errores 500 y 404 mediante buffers de iconos (`favicon.ico`, `icon-192.png`, `icon-512.png`) y server actions con tolerancia a fallos de red.

## 5. Sincronización de Costos Maestros (Nissan Civilian)
- **Mantenimiento Auditado v2**: Fijado en **Bs. 2.840,17 / mes** por unidad (Costo Total Anual: Bs. 34.082,00 / 12 meses), coincidiendo exactamente con la celda `J55` de la planilla maestra `MANTENIMIENTO_NISSAN`.
- **Costo Económico Regulatorio Total**: Calibrado a **Bs. 18.760,75 / mes** (OPEX Efectivo en Caja: Bs. 15.289,45 + Depreciación: Bs. 1.653,00 + WACC 11%: Bs. 1.818,30).

## 6. Exportación Excel Maestro Dinámico (5 Hojas Sincronizadas)
- Generación de libro `.xlsx` con todas las modificaciones guardadas en tiempo real:
  1. `Resumen_Economico`: Indicadores clave, estructura OPEX/CAPEX y tarifas técnica vs social.
  2. `Matriz_Tarifaria`: Categorías de usuario, recaudación proyectada y compensación municipal.
  3. `32_Rutas_Rentabilidad`: Modelación ruta por ruta (IPK, flota asignada, ingresos y balance operativo).
  4. `52_Items_Mantenimiento`: Desglose detallado de los 52 ítems Nissan Civilian con costos unitarios, frecuencias y costo mensual calibrado en Bs. 2.840,17.
  5. `Bitacora_Auditoria_Legal`: Historial inmutable con firma digital del operador, justificación y estampas de tiempo ISO.

## 7. Tarify OS: Arquitectura SaaS Multi-Tenant & Motor de Autenticación Pro
- **Catálogo de Tenants**:
  - `tenant-gams-sucre`: Gobierno Autónomo Municipal de Sucre (Tenant #1 Oficial).
  - `tenant-ecotraffic`: Ecotraffic Consultoría Regulatoria & Movilidad.
  - `tenant-sindicato-san-cristobal`: Sindicato de Choferes San Cristóbal.
  - `tenant-sindicato-sucre`: Sindicato de Micros y Colectivos Sucre.
- **Motor de Autenticación Zero-Trust & Creación de Usuarios**:
  - SuperAdmin exclusivo para `ecotraffic.bo@gmail.com` con validación estricta de credencial registrada.
  - Cualquier usuario público o correo no registrado que inicie sesión obtiene estrictamente el rol `observador_publico` (Solo Lectura, sin permisos de edición ni panel SuperAdmin).
  - Administradores Nivel 1 (`admin_municipal`, `consultor_ecotraffic`, etc.) deben ser creados y autorizados explícitamente desde el Panel de Gestión por el SuperAdmin.
  - Persistencia de sesión bidireccional (`tarfy_session`, `simpro_custom_credentials`, `simpro_directory_users`) con auditoría de cada inicio de sesión.

## 8. Estándar de Diseño Visual & UI/UX Corporativo
- **Cero Emojis en Producción**: Toda la interfaz (Landing Page, Modales, Dashboard, Alertas, Badges y Tablas) utiliza exclusivamente vectores SVG profesionales y paletas cromáticas sobrias (Slate, Cyan, Emerald, Rose, Amber).
- **Hero & Portada Animada**: Grid en perspectiva 3D, generador de partículas flotantes, nodos de interconexión viva y micro-animaciones interactivas.
