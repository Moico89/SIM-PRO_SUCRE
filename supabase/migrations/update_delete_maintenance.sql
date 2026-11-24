-- Habilitar permisos para Módulo de Mantenimiento
CREATE POLICY "Permitir inserciones anónimas en plantillas" 
    ON public.maintenance_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizaciones anónimas en plantillas" 
    ON public.maintenance_templates FOR UPDATE USING (true);
CREATE POLICY "Permitir borrado anónimo en plantillas" 
    ON public.maintenance_templates FOR DELETE USING (true);

CREATE POLICY "Permitir inserciones anónimas en items" 
    ON public.maintenance_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizaciones anónimas en items" 
    ON public.maintenance_items FOR UPDATE USING (true);
CREATE POLICY "Permitir borrado anónimo en items" 
    ON public.maintenance_items FOR DELETE USING (true);
