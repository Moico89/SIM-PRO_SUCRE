# AUD-001: Línea Base Técnica y Saneamiento Inicial

**Plataforma:** Tarify OS / SIM-PRO Sucre  
**Fecha de Emisión:** 2026-09-29  
**Estado:** Completada  
**Auditor Responsable:** Auditoría Técnica Externa Senior  
**Ejecutor:** Equipo de Desarrollo / Dirección Técnica  

---

## 1. Árbol de Código de `src/` (3 Niveles) & Dependencias

### 1.1. Estructura de Directorios (`src/` a 3 niveles)
```
src/
├── actions/
│   ├── audit.ts                    # Server Actions para inserción y lectura de audit_logs
│   ├── auth.ts                     # Server Actions de autenticación, control de perfiles y usuarios
│   └── parameters.ts               # Server Actions para actualización de parámetros con auditoría
├── app/
│   ├── globals.css                 # Estilos globales y utilidades personalizadas (grid, glow)
│   ├── layout.tsx                  # Root layout, metadatos PWA y Service Worker register
│   └── page.tsx                    # Punto de entrada principal (DashboardView con seed inicial)
├── components/
│   ├── AdminUsersPanel.tsx         # Consola de administración RBAC, gestión de usuarios y escenarios
│   ├── AuthModal.tsx               # Modal de autenticación y formulario de registro/demo
│   ├── DashboardView.tsx           # Vista principal del simulador econométrico y exportador Excel
│   ├── LandingPage.tsx             # Portada institucional moderna de alta fidelidad
│   ├── ScenarioManagerModal.tsx    # Modal auxiliar de gestión de escenarios
│   └── ServiceWorkerRegister.tsx   # Registro de Service Worker PWA offline
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Cliente Supabase para el navegador (createBrowserClient)
│   │   └── server.ts               # Cliente Supabase para el servidor (createServerClient)
│   ├── validations/
│   │   └── parameters.ts           # Esquemas Zod de validación de parámetros y justificación
│   └── tenants.ts                  # Catálogo oficial de tenants SaaS (GAMS, Ecotraffic, Sindicatos)
└── types/
    ├── database.ts                 # Interfaces TypeScript de modelos de base de datos
    ├── global.d.ts                 # Declaraciones globales de tipos y librerías externas (SheetJS)
    └── scenario.ts                 # Definición de tipos para escenarios tarifarios y calibraciones
```

### 1.2. Inventario de Dependencias (`package.json`)
```json
{
  "name": "dashboard-tarifario-sucre",
  "version": "3.3.0",
  "private": true,
  "dependencies": {
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.439.0",
    "next": "^14.2.10",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.5.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4"
  }
}
```

---

## 2. Contenido Completo de Migraciones SQL y Seed

### 2.1. Migración Base: `supabase/migrations/20260929_init_schema.sql`
* **Extensiones:** `uuid-ossp`, `pgcrypto`.
* **Enums Declarados:** `user_role` (`admin_municipal`, `delegado_sindical`, `consultor_ecotraffic`, `observador_publico`), `session_status`, `audit_action_type`.
* **Tablas Creadas:**
  * `public.profiles`: Vinculada a `auth.users(id)` ON DELETE CASCADE.
  * `public.negotiation_sessions`: Sesiones de concertación con código único y estado.
  * `public.system_parameters`: 20 parámetros operativos y de costos del sistema.
  * `public.fare_categories`: 6 categorías de usuarios con demandas y tarifas diferenciales.
  * `public.network_routes`: Catálogo de 32 rutas urbanas (distancias, flotas asignadas).
  * `public.audit_logs`: Registro histórico de modificaciones con justificación obligatoria.
* **Vistas SQL:** `public.vw_resumen_economico_unidad` (cálculo matricial de COV y tarifa ponderada).
* **Triggers de Actualización:** `handle_updated_at()` en `profiles`, `negotiation_sessions`, `system_parameters`, `fare_categories`.

### 2.2. Migración Auth & SuperAdmin: `supabase/migrations/20260929_add_superadmin_auth.sql`
* **Enum Modificado:** Agrega valor `'superadmin'` al tipo `user_role`.
* **Políticas Actualizadas:** Permite a `superadmin` gestionar perfiles, sesiones, parámetros y tarifas.
* **Trigger de Registro:** `public.handle_new_user()` asociado a `auth.users` AFTER INSERT para sincronizar perfiles con autoasignación de roles institucionales y metadatos.

### 2.3. Datos Semilla: `supabase/seed.sql`
* **Sesión Oficial Inicial:** `a0000000-0000-0000-0000-000000000001` (`SUCRE-MESA-CONCERTACION-2026`).
* **Parámetros Calibrados:** Flota 987 unidades, 82.475 km/día, 265.569 pasajeros/día, diésel Bs. 17,95/litro, mantenimiento Nissan Civilian Bs. 2.840,17/mes (actualizado de 2.869,75), WACC 11%, Laspeyres 5%.
* **6 Categorías Sociales:** Adultos (58%), Adultos mayores (7%), Universitarios (18%), Colegiales (10%), Escolares (5%), Discapacidad (2%).
* **32 Rutas Urbanas:** Desglose completo de distancias y flotas de los Sindicatos San Cristóbal y Sucre.
* **Primer Log de Auditoría:** Registro de inicialización formal con justificación.

---

## 3. Listado de Políticas RLS y Estado de Activación

### 3.1. Estado de Activación de RLS por Tabla (`pg_class`)
| Tabla | `relrowsecurity` (RLS Activado) | `relforcerowsecurity` (RLS Forzado) | Estado |
|---|---|---|---|
| `public.profiles` | `true` | `false` | Activado |
| `public.negotiation_sessions` | `true` | `false` | Activado |
| `public.system_parameters` | `true` | `false` | Activado |
| `public.fare_categories` | `true` | `false` | Activado |
| `public.network_routes` | `true` | `false` | Activado |
| `public.audit_logs` | `true` | `false` | Activado |

*Nota de Auditoría:* `relforcerowsecurity` está actualmente en `false` para todas las tablas. Debe forzarse en AUD-002 (`ALTER TABLE ... FORCE ROW LEVEL SECURITY;`).

### 3.2. Políticas RLS Declaradas (`pg_policies`)
1. **`public.profiles`**:
   - `Lectura pública de perfiles autorizados`: `FOR SELECT TO authenticated USING (true)`
   - `SuperAdmin y Admin municipal pueden gestionar perfiles`: `FOR ALL TO authenticated USING (public.get_current_user_role() IN ('superadmin', 'admin_municipal'))`
2. **`public.negotiation_sessions`**:
   - `Lectura de sesiones de negociación`: `FOR SELECT TO authenticated USING (true)`
   - `SuperAdmin acceso total sesiones`: `FOR ALL TO authenticated USING (public.get_current_user_role() IN ('superadmin', 'admin_municipal', 'consultor_ecotraffic'))`
3. **`public.system_parameters`**:
   - `Lectura de parámetros del sistema`: `FOR SELECT TO authenticated USING (true)`
   - `Admin y Consultor pueden actualizar parámetros si la sesión no está congelada`: `FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('admin_municipal', 'consultor_ecotraffic') AND is_locked = false)`
   - `SuperAdmin acceso total parametros`: `FOR ALL TO authenticated USING (public.get_current_user_role() IN ('superadmin', 'admin_municipal', 'consultor_ecotraffic'))`
4. **`public.fare_categories`**:
   - `Lectura de tarifas por categoría`: `FOR SELECT TO authenticated USING (true)`
   - `SuperAdmin acceso total tarifas`: `FOR ALL TO authenticated USING (public.get_current_user_role() IN ('superadmin', 'admin_municipal', 'consultor_ecotraffic'))`
5. **`public.network_routes`**:
   - `Lectura de 32 rutas urbanas`: `FOR SELECT TO authenticated USING (true)`
6. **`public.audit_logs`**:
   - `Lectura de auditoría para todos los autorizados`: `FOR SELECT TO authenticated USING (public.get_current_user_role() IN ('admin_municipal', 'consultor_ecotraffic', 'delegado_sindical'))`
   - `Inserción permitida en auditoría`: `FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)`

---

## 4. Localización y Arquitectura del Motor de Cálculo

* **Ubicación:** `src/components/DashboardView.tsx` (Líneas 252 - 301).
* **Entorno de Ejecución:** **Cliente (Frontend / React State)**. Se recalcula en cada renderizado ante variaciones de estado de `params`, `fares` o `activeScenario`.
* **Tipo Numérico Utilizado:** `number` primitivo de JavaScript (IEEE 754 de doble precisión en punto flotante).
* **Formulación Implementada:**
  ```typescript
  const days = params.operating_days_month;
  const turns = params.turns_day;
  const fleet = params.fleet_active;
  const kmDay = params.km_network_day;
  const demandDay = params.demand_network_day * activeScenario.demandFactor;
  const dieselPrice = params.fuel_price_bs_l * activeScenario.fuelPriceFactor;

  const unitKm = (kmDay / fleet) * days;
  const unitPax = (demandDay / fleet) * days;
  const ipk = demandDay / kmDay;

  const fuelCost = (unitKm / params.fuel_efficiency_km_l) * dieselPrice * (1 + params.idle_congestion_factor);
  const maintVar = params.maintenance_monthly_bs * params.maintenance_var_share;
  const maintFixed = params.maintenance_monthly_bs * params.maintenance_fixed_share;
  const laborCost = params.driver_salary_bs * (1 + params.labor_charges_factor);
  const otherFixed = params.other_fixed_monthly_bs;

  const opex = fuelCost + maintVar + maintFixed + laborCost + otherFixed;
  const depreciation = (params.vehicle_replacement_value_bs - params.vehicle_residual_value_bs) / params.vehicle_useful_life_months;
  const allowedReturn = (params.vehicle_replacement_value_bs - params.vehicle_residual_value_bs) * (params.capital_return_rate_annual / 12);
  const regulatoryCost = opex + depreciation + allowedReturn;
  const technicalWeighted = regulatoryCost / unitPax;
  ```
* **Discrepancia Identificada:** La base de datos contiene una vista replicada `public.vw_resumen_economico_unidad` con cálculo en servidor (`NUMERIC`), pero la interfaz activa no consulta la vista en tiempo real; ejecuta la fórmula en el cliente con punto flotante estándar.

---

## 5. Implementación de `audit_logs`

* **Definición de Tabla:**
  ```sql
  CREATE TABLE public.audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES public.negotiation_sessions(id) ON DELETE SET NULL,
      user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      user_email TEXT NOT NULL,
      user_role user_role NOT NULL,
      user_organization TEXT NOT NULL,
      action audit_action_type NOT NULL,
      entity_name TEXT NOT NULL,
      entity_id UUID,
      field_name TEXT,
      old_value JSONB,
      new_value JSONB,
      justification TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
* **Estado de Triggers de Inmutabilidad:** **No existen actualmente.** No hay triggers BEFORE UPDATE, BEFORE DELETE o BEFORE TRUNCATE instalados en `audit_logs`.
* **Estado de Permisos (`\dp public.audit_logs`):** Los permisos de PostgreSQL son los predeterminados de Supabase (`anon`, `authenticated`, `service_role`). No se ha ejecutado `REVOKE UPDATE, DELETE, TRUNCATE`.
* **Bloqueo de Modificación:** Existe restricción por omisión de políticas RLS para UPDATE y DELETE en usuarios autenticados normales, pero usuarios con rol `service_role` o superusuarios de base de datos pueden modificar o truncar la tabla.

---

## 6. Variables de Entorno y Uso de `service_role`

### 6.1. Inventario de Nombres de Variables
| Variable | Ámbito | Archivo de Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Público / Cliente & Servidor | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público / Cliente & Servidor | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` |
| `NODE_ENV` | Entorno del Sistema | `src/components/ServiceWorkerRegister.tsx` |

### 6.2. Presencia de `service_role`
* **Verificación:** Ejecutada búsqueda estricta (`git grep -i "service_role"`) en todo el árbol de código y en la totalidad del historial de commits.
* **Resultado:** `0` apariciones. **`service_role` no se encuentra presente en ninguna variable ni archivo del cliente ni del servidor.**

---

## 7. Estado de Tests y Pipeline de CI/CD

* **Tests Unitarios / E2E:** **No existen.** No hay suites de pruebas configuradas (Jest, Vitest, Playwright no instalados; no existe carpeta `tests/` o `__tests__/`).
* **Pipeline de CI:** **No existe.** No hay flujo de GitHub Actions configurado (`.github/workflows/` inexistente).
* **Verificación Actual:**
  * Compilación estática de TypeScript: `npx tsc --noEmit` -> **0 errores** (código de salida 0).
  * Build de producción Next.js: `npm run build` -> Compilación estática y server functions operativas.

---

## 8. Clasificación de Datos: Estáticos (Demo) vs. Base de Datos

### 8.1. Landing Page (`src/components/LandingPage.tsx`)
* **100% Estático / Ilustrativo**:
  * Indicadores de la ventana de consola (Composición COV: Diésel 42.4%, Mano de Obra 28.1%, Neumáticos 15.2%, Capital 14.3%).
  * Simulación vial isométrica con buses BUS-01 y BUS-02.
  * Consola de Fiscalización: COV Bs. 20.58/km, Subsidio Bs. 3.347, Eficiencia 57.8%, Rutas 23.
  * Casos de Éxito: MT Colombia, ATU Perú, DGM México, STM (logos y datos ilustrativos).
  * Artículos del blog (3 posts con fecha de 2024).

### 8.2. Consola del Simulador (`src/components/DashboardView.tsx`)
* **Híbrido (Resiliente Offline-First con fallback seed)**:
  * **Datos Base / Contingencia:** Provienen del seed oficial `defaultParameters`, `defaultFares` y `defaultLogs` en `src/app/page.tsx`.
  * **Sincronización en Vivo:** Las Server Actions (`src/actions/parameters.ts`, `src/actions/audit.ts`) ejecutan `SELECT`, `INSERT` y `UPDATE` contra Supabase.
  * **Persistencia Local:** Los cambios de parámetros, escenarios y usuarios se almacenan en `localStorage` (`simpro_params`, `simpro_scenarios`, `simpro_logs`, `simpro_directory_users`, `simpro_custom_credentials`, `tarfy_session`) para garantizar funcionamiento continuo en caso de fallo de red o desconexión del backend.
