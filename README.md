# Plataforma de Gobernanza Tarifaria Sucre v3.3 (Next.js + Supabase)

Sistema institucional en tiempo real para la concertación, modelación y auditoría de tarifas de transporte público urbano para el **Gobierno Autónomo Municipal de Sucre (GAMS)** y **Ecotraffic Consultoría**.

---

## 1. Arquitectura y Tecnologías
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS.
- **Backend & Base de Datos:** PostgreSQL 15+ en Supabase con Row Level Security (RLS) y WebSockets.
- **Autenticación & RBAC:** Control de acceso por roles:
  * `admin_municipal`: Modificación oficial, congelamiento de sesiones y emisión de resoluciones.
  * `consultor_ecotraffic`: Modelación econométrica, calibración de parámetros y supervisión.
  * `delegado_sindical`: Carga de contrapropuestas y registro gremial en borrador.
  * `observador_publico`: Proyección en sala del Concejo y consulta ciudadana.
- **Auditoría Inmutable (`audit_logs`):** Bitácora no modificable (append-only) que registra cada modificación de parámetros con justificación técnica obligatoria.

---

## 2. Puesta en Marcha Rápida (Local)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (.env.local)
cp .env.example .env.local
# Llenar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Ejecutar servidor de desarrollo
npm run dev
```

Visitar `http://localhost:3000` en su navegador.

---

## 3. Despliegue en Producción (Vercel + Supabase)
1. Ejecutar las migraciones SQL en Supabase SQL Editor:
   - `supabase/migrations/20260929_init_schema.sql`
   - `supabase/seed.sql`
2. Conectar el repositorio de GitHub con **Vercel**.
3. Inyectar las variables de entorno en Vercel Settings.
4. Despliegue automático con Zero-Downtime.
