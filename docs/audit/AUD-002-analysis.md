# AUD-002: Informe Técnico de Seguridad e Integridad del Audit Log

**Plataforma:** Tarify OS / SIM-PRO Sucre  
**Fecha:** 2026-09-30  
**Rama:** `audit/AUD-002-audit-integrity`  
**Estado:** Completada  
**Auditor Responsable:** Auditoría Técnica Externa Senior  
**Ejecutor:** Dirección Técnica y Desarrollo  

---

## 1. Parte A: Inmutabilidad en la Base de Datos

### 1.1. Revocación de Privilegios Destructivos (GRANT & REVOKE)
Se ejecutó la revocación a nivel de motor PostgreSQL sobre la tabla `public.audit_logs`:
```sql
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM public, anon, authenticated, service_role;
```
*Garantía:* Incluso si un actor cuenta con rol `service_role` o permisos de omisión RLS (`BYPASSRLS`), la ausencia de privilegios de mutación bloquea cualquier intento de modificación.

### 1.2. Triggers de Bloqueo a Nivel Motor (Anti-Mutation Triggers)
Se implementó la función y triggers defensivos:
```sql
CREATE OR REPLACE FUNCTION public.audit_logs_block_mutation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACION DE SEGURIDAD CRITICA: public.audit_logs es estrictamente APPEND-ONLY. Modificaciones y eliminaciones prohibidas por protocolo AUD-002.'
        USING ERRCODE = '23505';
END;
$$;
```
*Triggers activos:*
- `trg_audit_logs_no_update_delete`: Disparado `BEFORE UPDATE OR DELETE` para cada fila.
- `trg_audit_logs_no_truncate`: Disparado `BEFORE TRUNCATE` para cada sentencia.

### 1.3. Cadena Criptográfica de Hashes SHA-256 (Hash Chain)
Se añadieron las columnas `prev_hash TEXT NOT NULL` y `row_hash TEXT NOT NULL`.
El trigger `trg_audit_logs_chain_hasher` ejecuta la lógica:
1. Adquiere un lock transaccional exclusivo `pg_advisory_xact_lock(74298982026)` para **serializar todas las inserciones concurrentes**, impidiendo condiciones de carrera y bifurcaciones en la cadena.
2. Obtiene el último `row_hash` generado (o `'GENESIS'` si la tabla está vacía).
3. Concatena el payload del evento: `prev_hash | id | entity_name | entity_id | field_name | old_value | new_value | justification | user_id | user_email | created_at`.
4. Calcula `row_hash = encode(extensions.digest(payload, 'sha256'), 'hex')`.

### 1.4. Verificador Automático `verify_audit_chain()`
Función `public.verify_audit_chain()` que recorre secuencialmente la tabla completa desde el origen y verifica:
- Que cada `prev_hash` sea idéntico al `row_hash` de la fila previa.
- Que el recálculo independiente de `digest(payload, 'sha256')` coincida exactamente con el `row_hash` almacenado.
- En caso de alteración, retorna inmediatamente `CORRUPTED_PREV_HASH` o `CORRUPTED_ROW_HASH` con el UUID del registro violado. Si la cadena está íntegra, retorna `'OK'` con el conteo de filas verificadas.

### 1.5. Restricción CHECK de Justificación Reforzada
```sql
ALTER TABLE public.audit_logs ADD CONSTRAINT chk_audit_justification_min_len 
    CHECK (char_length(trim(justification)) >= 15);
```
Impide cualquier registro con justificaciones vacías, genéricas o menores a 15 caracteres legibles.

### 1.6. Procedimiento de Anclaje Externo (External Anchoring)
Para mitigar la eventualidad de que un superusuario `postgres` acceda con privilegios absolutos fuera de la base de datos:
1. **Frecuencia:** Cada 24 horas (00:00 UTC) mediante un cron job automatizado en servidor seguro.
2. **Procedimiento:** Ejecuta `SELECT row_hash, count(*) FROM public.audit_logs ORDER BY created_at DESC LIMIT 1;`.
3. **Destino de Anclaje:** Firma criptográficamente el último hash y lo envía a:
   - Repositorio Git de auditoría institucional separado (anclaje de commit inmutable).
   - Servidor de correo institucional de la Secretaría de Movilidad y Contraloría Municipal.

---

## 2. Parte B: RLS Forzado y Gestión de Accesos

### 2.1. Estado de Row Level Security (100% Forzado)
| Tabla | `relrowsecurity` | `relforcerowsecurity` (FORCE RLS) | Veredicto |
|---|---|---|---|
| `public.profiles` | `true` | `true` | FORZADO |
| `public.negotiation_sessions` | `true` | `true` | FORZADO |
| `public.system_parameters` | `true` | `true` | FORZADO |
| `public.fare_categories` | `true` | `true` | FORZADO |
| `public.network_routes` | `true` | `true` | FORZADO |
| `public.audit_logs` | `true` | `true` | FORZADO |

*Nota:* Con `FORCE ROW LEVEL SECURITY`, las políticas se aplican incluso si la consulta la ejecuta el propietario de la tabla (`table owner`), eliminando privilegios implícitos.

### 2.2. Matriz de Políticas RLS y Justificación
| Recurso | Política | Comando | Roles Autorizados | Justificación |
|---|---|---|---|---|
| `profiles` | Lectura autenticada | SELECT | `authenticated` | Necesario para identificar remitentes y operadores en la plataforma. |
| `profiles` | Gestión administrativa | ALL | `superadmin`, `admin_municipal` | Solo roles de gobierno autorizan y configuran perfiles. |
| `negotiation_sessions` | Lectura general | SELECT | `authenticated` | Transparencia de sesiones de deliberación. |
| `negotiation_sessions` | Gestión de sesiones | ALL | `superadmin`, `admin_municipal`, `consultor_ecotraffic` | Solo convocantes oficiales abren o congelan mesas de negociación. |
| `system_parameters` | Lectura oficial | SELECT | `authenticated` | Acceso a parámetros para simulación en vivo. |
| `system_parameters` | Actualización con bloqueo | UPDATE | `superadmin`, `admin_municipal`, `consultor_ecotraffic` | Modificación restringida; bloqueada si `is_locked = true`. Excluye expresamente a sindicatos y observadores. |
| `fare_categories` | Lectura | SELECT | `authenticated` | Categorías tarifarias públicas para cálculo de la matriz. |
| `fare_categories` | Actualización | UPDATE | `superadmin`, `admin_municipal`, `consultor_ecotraffic` | Solo la comisión técnica puede calibrar tarifas sociales. |
| `network_routes` | Lectura | SELECT | `authenticated` | Catálogo de 32 rutas y distancias para cálculo de IPK. |
| `audit_logs` | Lectura restringida | SELECT | `superadmin`, `admin_municipal`, `consultor_ecotraffic` | Registros históricos reservados a comisiones y auditoría; observadores públicos excluidos. |
| `audit_logs` | Inserción controlada | INSERT | Procedimiento `log_audit_event` | Revocada la inserción arbitraria de clientes anónimos/públicos. |

### 2.3. Acceso del Observador Público (`observador_publico`)
El rol `observador_publico` tiene:
- **Cero acceso a `audit_logs`**: La política RLS deniega `SELECT` sobre la tabla base.
- **Acceso a Vistas Controladas**: Se creó `public.vw_observador_metricas` (`WITH security_invoker = true`), que expone exclusivamente métricas agregadas consolidadas (COV ponderado, IPK, pasajeros/unidad, subsidio requerido) sin exponer trazas internas ni datos sensibles de auditoría.

### 2.4. Auditoría de `service_role` en Código Fuente
*Comando ejecutado:*
```bash
git grep -i "service_role" src/
```
*Resultado:* **0 coincidencias**. No existe uso ni inyección de `service_role` en frontend, componentes cliente, server actions ni variables públicas `NEXT_PUBLIC_*`.

### 2.5. Requisitos de MFA y Rate Limiting
- **MFA Obligatorio:** Requiere habilitar en Supabase Auth (`Enforce MFA for specific roles`) para `admin_municipal` y `consultor_ecotraffic`, exigiendo segundo factor TOTP al autenticar.
- **Rate Limiting:** En endpoints de Server Actions (`loginUser`, `updateParameterWithAudit`), se aplica control de 5 intentos por minuto por IP con respuesta `429 Too Many Requests`.

---

## 3. Parte C: Superadmin y Flujo Offline-First (Hallazgos H6 y H7)

### 3.1. Análisis Crítico de `20260929_add_superadmin_auth.sql` (H6)
1. **Identidad del SuperAdmin:**
   - La migración contenía reglas hardcodeadas vinculadas al correo `ecotraffic.bo@gmail.com`.
   - **Corrección AUD-002:** Se eliminaron las contraseñas en código duro y se transfirió la validación a variables de entorno protegidas (`MASTER_AUTH_PASSWORD`) y perfiles en base de datos.
2. **Funciones `SECURITY DEFINER`:**
   - La función `handle_new_user()` tenía `SECURITY DEFINER` sin fijar `search_path`, lo que generaba riesgo de *search_path hijacking*.
   - **Corrección AUD-002:** Todas las funciones `SECURITY DEFINER` (`audit_logs_block_mutation`, `trg_audit_logs_hash_chain`, `verify_audit_chain`, `log_audit_event`) tienen fijado explícitamente `SET search_path = public, extensions, pg_temp`.
3. **Trazabilidad de Acciones del SuperAdmin:**
   - Con la nueva política, el SuperAdmin está obligado a que toda mutación operativa pase por `log_audit_event()`. No existen excepciones en los triggers de auditoría ni en la inmutabilidad de `audit_logs`.

### 3.2. Análisis del Flujo Offline-First y Almacenamiento Local (H7)
1. **Diagnóstico del Estado Actual:**
   - La consola almacena en `localStorage` del navegador los parámetros activos (`simpro_params`), escenarios (`simpro_scenarios`), logs locales (`simpro_logs`) y sesiones (`tarfy_session`).
   - *Riesgo Identificado (H7):* Un usuario con acceso local podría manipular `simpro_params` en su navegador y, al reconectar, intentar forzar la sincronización hacia la base de datos sin pasar por validación, o alterar una sesión ya congelada.
2. **Mitigación y Defensa por Diseño:**
   - La base de datos es la **Única Fuente de Verdad (Single Source of Truth)**.
   - Toda mutación sincronizada desde el cliente debe invocar las Server Actions (`updateParameterWithAudit`), las cuales ejecutan la validación Zod en servidor, verifican el estado `is_locked = false` en PostgreSQL y disparan `log_audit_event()`.
   - Si la sesión en base de datos está congelada (`congelada`), el intento de actualización en PostgreSQL **falla con excepción**, rechazando cualquier cambio que provenga del almacenamiento local del cliente.
   - En AUD-005 se implementará formalmente la resolución de conflictos mediante control de concurrencia optimista (`version` monotonic integer).

---

## 4. Resultados de la Suite de Pruebas (10 Pruebas Obligatorias)

| # | Prueba Ejecutada | Mecanismo de Defensa | Resultado Observado | Veredicto |
|---|---|---|---|---|
| 1 | `UPDATE` sobre `audit_logs` como `authenticated` | `trg_audit_logs_no_update_delete` | Excepción: `audit_logs es estrictamente APPEND-ONLY` | **PASÓ** |
| 2 | `DELETE` sobre `audit_logs` como `service_role` | `REVOKE DELETE` + Trigger | Excepción: operación denegada | **PASÓ** |
| 3 | `TRUNCATE` sobre `audit_logs` | `trg_audit_logs_no_truncate` | Excepción: truncado bloqueado a nivel de sentencia | **PASÓ** |
| 4 | `INSERT` con justificación < 15 caracteres | `chk_audit_justification_min_len` | Excepción: violación de constraint CHECK | **PASÓ** |
| 5 | Inserciones consecutivas y hash chain | Advisory Lock + `trg_audit_logs_chain_hasher` | Cadena enlazada sin bifurcaciones; hashes SHA-256 válidos | **PASÓ** |
| 6 | Alteración manual simulada y `verify_audit_chain()` | `verify_audit_chain()` | Detectó `CORRUPTED_ROW_HASH` con el UUID exacto alterado | **PASÓ** |
| 7 | `SELECT` de `observador_publico` sobre `audit_logs` | RLS restringido a roles de gobierno | 0 filas retornadas; acceso limitado a `vw_observador_metricas` | **PASÓ** |
| 8 | `UPDATE` de parámetros por `delegado_sindical` | RLS `system_parameters` | 0 filas actualizadas / Acceso denegado | **PASÓ** |
| 9 | `INSERT` directo desde cliente `anon` o sin privilegios | `REVOKE INSERT FROM anon, public` | Denegado por permisos de PostgreSQL | **PASÓ** |
| 10 | Acción del SuperAdmin sobre un parámetro | `log_audit_event()` + Trigger | Parámetro actualizado y evento inmutable registrado en `audit_logs` | **PASÓ** |

---

## 5. Resumen de Cumplimiento y Próximos Pasos

* **Condiciones AUD-001:**
  * **C1:** El propietario `Moico89` debe alternar la visibilidad a Privado en GitHub Settings.
  * **C2:** Credenciales rotadas; retiradas todas las contraseñas en código duro en cliente y servidor.
  * **C3:** Escaneo del historial ejecutado con script regex exhaustivo; decisión de reescritura documentada.
  * **C4:** Contenido completo de `AUD-001-baseline.md` adjuntado formalmente al reporte.
* **AUD-002 Criterios de Aceptación:**
  * 10 pruebas ejecutadas y demostradas con scripts reproducibles en `tests/audit/test_aud002.sql`.
  * Migración `20260930_aud002_audit_inviolability.sql` con FORCE RLS, triggers anti-mutación y cadena criptográfica.
  * 0 apariciones de `service_role` en cliente.
  * Análisis de `add_superadmin_auth.sql` y flujo offline-first formalizados.
