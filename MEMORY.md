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

## 9. Calibración Exacta de Tarifa Técnica de Adulto (Bs. 3,44)
- **Fórmula de Homologación con Excel Maestro**:
  $$\text{Tarifa Adulto Técnica} = \text{Tarifa Ponderada Técnica} \times \left(\frac{\text{Tarifa Adulto Vigente}}{\text{Tarifa Ponderada Vigente}}\right)$$
  $$= 2,681778 \times \left(\frac{4,50}{3,5050}\right) = 3,443082 \dots \rightarrow \mathbf{Bs.\ 3,44}$$
- Se eliminó todo redondeo preliminar estático a 3,45. El sistema ahora replica con exactitud matemática la celda `E5` de la hoja `TARIFAS_CATEGORIA` del modelo oficial.

## 10. Integración de Vistas Resumen de las 4 Hojas Maestras
- Cuatro componentes dedicados de alta fidelidad añadidos a la navegación del Dashboard:
  1. `SheetMantenimientoNissan`: Catálogo de 52 ítems Nissan Civilian, categorizados por sistemas (Motor, Frenos, Transmisión, Suspensión, Eléctrico, Neumáticos, Carrocería), costo anual Bs. 34.082 y costo mensual auditado de Bs. 2.840,17.
  2. `SheetSupuestosParametros`: Parámetros de demanda (265.569 pax/día), producción de red (82.475 km/día), flota en servicio (987 unidades) y parámetros macroeconómicos (Diésel Bs. 17,95/l, WACC 11%).
  3. `SheetCostosOperacionCov`: Estructura COV mensual (Variables A: Bs. 8.868,08; Fijos Efectivo B: Bs. 6.421,64; Capital C: Bs. 3.471,30) totalizando Bs. 18.761,02/mes.
  4. `SheetEconomiaPropietario`: Matriz comparativa de doble cuenta (flujo real familiar con salario/caja libre vs cuenta económica regulatoria) para los 4 escenarios de concertación.

## 11. Aislamiento RBAC de Bitácora de Auditoría
- La pestaña "Bitácora de Auditoría" fue retirada de la barra de navegación pública/observador.
- El acceso queda estrictamente confinado al rol `superadmin` (`ecotraffic.bo@gmail.com`) dentro del Panel de Administración, protegiendo la confidencialidad de los registros de trazabilidad institucional.

## 12. Sincronización Multi-Equipo de Escenarios de Concertación
- Los escenarios creados por usuarios (ej. `rolandoparraga@gmail.com`) se sincronizan a través de `src/actions/scenarios.ts` persistiendo en `data/scenarios.json` y replicándose en la tabla Supabase `negotiation_scenarios`.
- Se cargan del lado del servidor en `page.tsx` (`initialScenarios`) asegurando visibilidad inmediata para cualquier estación de trabajo o sesión concurrente (incluyendo el SuperAdmin `ecotraffic.bo@gmail.com`).
- Incorporado de forma oficial el escenario de concertación `Social 3 (Bs. 4,00)` con badge `ACCESIBLE`.

## 13. Motor de Exportación Excel Dinámico en Vivo (xlsx)
- El botón superior "Excel Dinámico .xlsx" genera en caliente un libro multi-hoja (`Modelo_Tarifario_Sucre_Auditoria_v3.2.1.xlsx`) conteniendo:
  `RESUMEN_EJECUTIVO`, `MANTENIMIENTO_NISSAN`, `SUPUESTOS_PARAMETROS`, `COSTOS_OPERACION_COV`, `TARIFAS_CATEGORIA`, `ECONOMIA_PROPIETARIO`, `RENTABILIDAD_32_RUTAS` y condicionalmente `BITACORA_AUDITORIA` (si el usuario es SuperAdmin).

## 14. Status Operativo de Tarify OS (v3.3.0)
- **Compilación & Estabilidad**: Build exitoso sin advertencias de tipos (`next build` código 0). Compatible con SSR y Static Pre-rendering.
- **Calibración Tarifaria**: Homologación exacta al 100% con `Modelo_Profesional_Tarifario_Sucre_v3.2.1_Ecotraffic.xlsx`. Tarifa Técnica de Adulto: **Bs. 3,44**; Tarifa Ponderada Técnica: **Bs. 2,6818**; Mantenimiento Auditado v2: **Bs. 2.840,17/mes**; Costo Regulatorio Total: **Bs. 18.761,02/mes**.
- **Cobertura de Datos Maestros**: 100% de las hojas del modelo oficial disponen de vistas interactivas con tablas de alta fidelidad en el visor principal.
- **Seguridad & RBAC**: Bitácora de auditoría restringida al SuperAdmin (`ecotraffic.bo@gmail.com`). Roles de observador aislados de controles críticos.
- **Persistencia Multi-Equipo**: Sincronización híbrida (servidor local + Supabase) de escenarios de negociación personalizada, incluyendo `Social 3 (Bs. 4,00) ACCESIBLE`.

## 15. Tareas Pendientes para la Próxima Sesión
1. **Reanudación del Proceso de Auditoría**:
   - Continuar con el cronograma formal de auditoría y revisión de actas de la mesa técnica de concertación.
2. **Evaluación de Pruebas de Usuario**:
   - Validación cruzada de la visualización y persistencia del escenario `Social 3 (Bs. 4,00)` desde múltiples equipos y navegadores.
   - Verificación de la descarga y lectura del archivo `Modelo_Tarifario_Sucre_Auditoria_v3.2.1.xlsx` en Microsoft Excel de escritorio.
   - Confirmación de lectura del valor calibrado `Bs. 3,44` en el dossier de impresión institucional y reportes PDF.
3. **Refinamiento de Exportación Excel**:
   - Incorporar formateo avanzado de celdas (anchos de columna optimizados, colores institucionales y formatos numéricos con moneda) en el motor `xlsx` si la mesa técnica lo requiere.
4. **Respaldo & Sincronización Cloud**:
   - Verificar integridad de las tablas `negotiation_scenarios` y `audit_logs` en Supabase previo a la reunión plenaria de concertación.

## 16. Corrección de Legibilidad y Refinamiento de la Portada (Hero & Tarjetas)
- **Causa Raíz Diagnosticada**: La clase `.hero-glow` en [globals.css](file:///c:/Files%20ECOTRAFFIC%20A8/SIM-PRO_TARIFA/src/app/globals.css) utilizaba la propiedad abreviada `background: radial-gradient(...)`, la cual reseteaba el `background-color` a transparente, exponiendo el fondo claro `bg-slate-50` del body y tornando invisibles los textos blancos (`text-white`) y celestes del Hero en el despliegue web.
- **Solución Técnica Implementada**:
  - Corrección de `.hero-glow` a `background-image: radial-gradient(...)` para no sobreescribir el color de fondo.
  - Asignación explícita e inmutable de `style={{ backgroundColor: '#070f26' }}` en la sección Hero de [LandingPage.tsx](file:///c:/Files%20ECOTRAFFIC%20A8/SIM-PRO_TARIFA/src/components/LandingPage.tsx#L119) para blindar el fondo corporativo profundo.
  - Incorporación de iluminación ambiental dual con halos desenfocados cian (`w-[600px] bg-cyan-500/15`) y azul profundo.
  - Tipografía H1 con contraste superior (`text-white font-extrabold`) y gradiente de alta definición sobre `"Tiempo Real"`. Párrafo descriptivo elevado a `text-slate-200 font-normal` (cumplimiento WCAG AAA).
  - Botón CTA principal modernizado a gradiente cian/cielo de alta conversión (`bg-gradient-to-r from-cyan-400 to-sky-400 text-[#070f26]`) y botón de sala de concertación en cristal oscuro pulido.
  - Tarjetas flotantes enriquecidas con tipografía `text-sm text-slate-600` de alta legibilidad, títulos interactivos con hover y bordes de alta definición.
  - Header alineado cromáticamente con gradientes Tarify OS.



