---
name: modern-animated-web-designer
description: >-
  Especialista en diseño web moderno, ultra-estético, animado y de alta fidelidad.
  Aplica sistemas de diseño corporativos, micro-interacciones, animaciones CSS/Canvas,
  gráficos vectoriales SVG puros (cero emojis), contrastes lumínicos (Glassmorphism, Dark/Light modes)
  y arquitecturas responsivas para SaaS de misión crítica.
---

# Modern Animated Web Designer Skill

Este skill define los estándares y patrones de ingeniería frontend para diseñar interfaces web modernas, fluidas y con impacto visual de nivel corporativo ("WOW Factor") sin sacrificar rendimiento, accesibilidad ni tipado estricto.

---

## 1. Principios Fundamentales de Diseño

1. **Cero Emojis en Interfaces Profesionales**:
   - Queda estrictamente prohibido el uso de emojis en landing pages, dashboards institucionales, badges, alertas y botones.
   - En su lugar, se utilizan exclusivamente **vectores SVG limpios**, precisos y optimizados con stroke-width armónico (1.8 a 2.2) y paletas monocromáticas o micro-gradientes.

2. **Tipografía de Alta Definición**:
   - Empleo de familias modernas con tracking refinado: `Plus Jakarta Sans`, `Inter`, `Outfit` o `Geist`.
   - Jerarquía visual clara: `text-xs uppercase tracking-widest` para sobretítulos, `font-extrabold tracking-tight` para H1/H2, y `leading-relaxed` para cuerpos de texto.

3. **Arquitectura de Contraste Bicolor / Híbrida**:
   - **Header & Secciones de Contenido**: Limpias, accesibles, en fondo claro (`bg-white`, `bg-slate-50`, `bg-slate-100/70`) con bordes sutiles `border-slate-200`.
   - **Hero & Footer**: Inmersivos, en fondo oscuro profundo (`#0b1329` brand navy, `#0f172a` slate-900) con glow radial (`radial-gradient`) y cuadrícula isométrica (`isometric-grid`).

4. **Tarjetas Flotantes con Solapamiento Negativo**:
   - Tarjetas clave que solapan la sección oscura del Hero y la sección clara de contenido mediante margen superior negativo (`-mt-16 sm:-mt-20`) y sombras profundas multicapa (`shadow-xl shadow-slate-200/80 hover:shadow-2xl`).

---

## 2. Patrones de Animación & Micro-Interacciones

### A. Isometric Grid & Glow Radial
```css
.hero-glow {
  background: radial-gradient(circle at 75% 30%, rgba(6, 182, 212, 0.18) 0%, rgba(2, 132, 199, 0.1) 40%, transparent 70%);
}

.isometric-grid {
  background-image: 
    linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
  background-size: 28px 28px;
}
```

### B. Simulación de Telemetría Dinámica en Tiempo Real
- Indicadores pulsantes: `animate-pulse`, `animate-ping` con halos translúcidos.
- Vehículos y flotas en movimiento rotacional simulando vías y corredores troncales:
```html
<div class="relative w-44 h-10 bg-cyan-950/70 border-y-2 border-cyan-400/50 rotate-[-25deg] flex items-center justify-around overflow-hidden">
  <div class="w-8 h-3 bg-amber-400 rounded-sm shadow-md animate-pulse">BUS-01</div>
  <div class="w-8 h-3 bg-cyan-400 rounded-sm shadow-md">BUS-02</div>
</div>
```

### C. Barras de Progreso & Curvas de Sensibilidad SVG
- Gráficos SVG interactivos con gradientes de relleno y líneas suaves con `preserveAspectRatio="none"`.
- Barras CSS con transiciones de ancho y alturas variables para representar telemetría de costos.

---

## 3. Estructura Estándar de una Landing Page SaaS

1. **Header Fijo / Sticky**:
   - Fondo `bg-white/95 backdrop-blur-md` con borde `border-slate-100`.
   - Isotipo corporativo con gradiente cian/azul.
   - Navegación clara con indicador activo de borde inferior (`border-b-2 border-cyan-600`).
   - Botón secundario contorneado + Botón primario de alta conversión.

2. **Hero Inmersivo**:
   - Badge superior de versión/estado (`Plataforma SaaS Institucional vX.X`).
   - Título impactante con gradiente textual en palabras clave.
   - Botón CTA primario en contraste alto (`bg-cyan-400 text-brand-navy`).
   - Mockup interactivo que simula una ventana de consola con telemetría en vivo.

3. **4 Tarjetas Flotantes de Características**:
   - Tarjetas blancas con iconos vectoriales en cajas coloreadas (cian, celeste, azul, verde azulado).
   - Solapamiento sobre el pliegue del hero para guiar el flujo visual hacia abajo.

4. **Showcase Interactivo (Consola de Fiscalización)**:
   - Panel izquierdo: ventana de software con métricas clave, gráficos de barras y tablas de datos reales.
   - Panel derecho: narrativa institucional con pasos numerados.

5. **Beneficios Institucionales**:
   - Cuadrícula de 4 columnas con iconos sólidos, títulos claros y descripciones de rigor técnico.

6. **Casos de Éxito & Alianzas**:
   - Logotipos y distintivos de entidades gubernamentales con carrusel o paginador sutil.

7. **Tabla de Precios / Planes**:
   - 3 Niveles (Básico, Estándar destacado con borde de marca y badge, Enterprise en fondo oscuro).

8. **Blog & Publicaciones Técnicas**:
   - Tarjetas de artículos con cabecera gráfica en fondo oscuro, etiqueta de categoría e iconos vectoriales.

9. **Footer Corporativo**:
   - Enlace a términos, metodología, boletín de suscripción y datos de copyright.

---

## 4. Checklist de Verificación de Calidad Visual
- [ ] ¿Hay cero emojis en la página? (Usar únicamente SVG).
- [ ] ¿La tipografía usa un espaciado y peso armónico?
- [ ] ¿Los botones tienen estados `:hover`, `:active` y `transition-all`?
- [ ] ¿La interfaz es 100% responsiva (móvil, tablet, escritorio)?
- [ ] ¿Los elementos animados están optimizados sin bloquear el hilo principal?
- [ ] ¿Los enlaces y modales están conectados con los flujos de autenticación y simulador?
