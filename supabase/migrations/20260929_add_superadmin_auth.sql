-- ============================================================================
-- MIGRACIÓN: SOPORTE SUPERADMIN, AUTENTICACIÓN Y GESTIÓN DE USUARIOS
-- ============================================================================

-- 1. Añadir valor 'superadmin' al enum user_role si no existe
DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin' BEFORE 'admin_municipal';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Habilitar políticas de SuperAdmin en perfiles
DROP POLICY IF EXISTS "SuperAdmin y Admin municipal pueden gestionar perfiles" ON public.profiles;
CREATE POLICY "SuperAdmin y Admin municipal pueden gestionar perfiles" ON public.profiles
    FOR ALL TO authenticated USING (
        public.get_current_user_role() IN ('superadmin', 'admin_municipal')
    );

-- 3. SuperAdmin tiene acceso completo en todas las tablas
DROP POLICY IF EXISTS "SuperAdmin acceso total sesiones" ON public.negotiation_sessions;
CREATE POLICY "SuperAdmin acceso total sesiones" ON public.negotiation_sessions
    FOR ALL TO authenticated USING (
        public.get_current_user_role() IN ('superadmin', 'admin_municipal', 'consultor_ecotraffic')
    );

DROP POLICY IF EXISTS "SuperAdmin acceso total parametros" ON public.system_parameters;
CREATE POLICY "SuperAdmin acceso total parametros" ON public.system_parameters
    FOR ALL TO authenticated USING (
        public.get_current_user_role() IN ('superadmin', 'admin_municipal', 'consultor_ecotraffic')
    );

DROP POLICY IF EXISTS "SuperAdmin acceso total tarifas" ON public.fare_categories;
CREATE POLICY "SuperAdmin acceso total tarifas" ON public.fare_categories
    FOR ALL TO authenticated USING (
        public.get_current_user_role() IN ('superadmin', 'admin_municipal', 'consultor_ecotraffic')
    );

-- 4. Trigger automático para sincronizar auth.users con public.profiles al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role user_role := 'observador_publico';
    default_org TEXT := 'Observador / Ciudadanía';
BEGIN
    -- Si es el SuperAdmin oficial
    IF NEW.email = 'ecotraffic.bo@gmail.com' THEN
        default_role := 'superadmin';
        default_org := 'Ecotraffic Consultoría';
    ELSIF NEW.email ILIKE '%@sucre.bo' THEN
        default_role := 'admin_municipal';
        default_org := 'GAM Sucre';
    ELSIF NEW.email ILIKE '%@ecotraffic.com.bo' THEN
        default_role := 'consultor_ecotraffic';
        default_org := 'Ecotraffic Consultoría';
    END IF;

    -- Si se enviaron metadatos en el registro
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        default_role := (NEW.raw_user_meta_data->>'role')::user_role;
    END IF;

    IF NEW.raw_user_meta_data->>'organization' IS NOT NULL THEN
        default_org := NEW.raw_user_meta_data->>'organization';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, organization, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        default_role,
        default_org,
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = CASE WHEN EXCLUDED.email = 'ecotraffic.bo@gmail.com' THEN 'superadmin' ELSE public.profiles.role END,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
