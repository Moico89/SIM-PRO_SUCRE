-- Habilitar UPDATE y DELETE para vehículos
CREATE POLICY "Permitir actualizaciones anónimas en vehículos" 
    ON public.vehicle_types FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir borrado anónimo en vehículos" 
    ON public.vehicle_types FOR DELETE 
    USING (true);
