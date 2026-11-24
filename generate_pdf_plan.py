# -*- coding: utf-8 -*-
"""
Generador de Documento Formal PDF:
PLAN ESTRATÉGICO DE IMPLEMENTACIÓN NACIONAL & PRD: TARIFY OS BOLIVIA v4.5
Plataforma SaaS de Gobernanza Tarifaria, Multimodalidad y Mitigación del Shock de Combustibles
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0f172a")) # Slate 900
        
        # Header (páginas > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "TARIFY OS BOLIVIA — PLAN ESTRATÉGICO DE IMPLEMENTACIÓN & PRD v4.5")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawRightString(558, 750, "CONFIDENCIAL & REGULATORIO | ECOTRAFFIC")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.75)
            self.line(54, 742, 558, 742)

        # Footer
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(54, 45, 558, 45)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 32, "Ecotraffic Consultoría Regulatoria | Plataforma SaaS de Concertación de Tarifas y Subsidios")
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()


def build_pdf(filename="PLAN_IMPLEMENTACION_SaaS_TARIFY_OS_BOLIVIA.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0f172a")    # Slate 900
    c_secondary = colors.HexColor("#0369a1")  # Sky 700
    c_accent = colors.HexColor("#0d9488")     # Teal 600
    c_dark = colors.HexColor("#1e293b")       # Slate 800
    c_muted = colors.HexColor("#475569")      # Slate 600
    c_light = colors.HexColor("#f8fafc")      # Slate 50
    c_border = colors.HexColor("#cbd5e1")     # Slate 300
    c_danger = colors.HexColor("#be123c")     # Rose 700

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_secondary,
        spaceAfter=14
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_muted
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_secondary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_dark,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_dark,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=c_dark
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.white
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=c_primary
    )

    story = []

    # =========================================================================
    # PORTADA / ENCABEZADO INSTITUCIONAL FORMAL
    # =========================================================================
    story.append(Paragraph("PLAN MAESTRO DE IMPLEMENTACIÓN NACIONAL & PRODUCT REQUIREMENTS DOCUMENT (PRD)", title_style))
    story.append(Paragraph("TARIFY OS v4.5 — PLATAFORMA SAAS DE GOBERNANZA TARIFARIA, MODELACIÓN MULTIMODAL Y GESTIÓN DE CRISIS DE COMBUSTIBLES EN LOS 9 DEPARTAMENTOS DE BOLIVIA", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=c_secondary, spaceBefore=2, spaceAfter=10))

    meta_text = (
        "<b>Entidad Emisora:</b> Ecotraffic Consultoría Regulatoria & Movilidad Sostenible<br/>"
        "<b>Destinatarios:</b> Autoridades de Transporte Municipal (GAMs), Gobiernos Departamentales (GADs), "
        "Autoridad de Telecomunicaciones y Transportes (ATT), Viceministerio de Transportes, ODECO, "
        "Confederación Sindical de Choferes de Bolivia, Cámaras de Transporte Interdepartamental.<br/>"
        "<b>Fecha de Emisión:</b> Octubre 2026 | <b>Versión:</b> 4.5 Enterprise GovTech | <b>Clasificación:</b> Documento Técnico Oficial"
    )
    story.append(Paragraph(meta_text, meta_style))
    story.append(Spacer(1, 12))

    # =========================================================================
    # RESUMEN EJECUTIVO & CONTEXTO HISTÓRICO
    # =========================================================================
    story.append(Paragraph("1. Resumen Ejecutivo y Coyuntura Crítica Nacional", h1_style))
    p1 = (
        "El sector transporte de Bolivia atraviesa el punto de inflexión más severo de las últimas dos décadas. "
        "La crisis estructural de divisas y combustibles ha detonado el fin fáctico del subsidio al diésel y gasolina. "
        "Los operadores y sindicatos enfrentan una brecha crítica: un diésel subvencionado oficial a <b>Bs. 3,72/litro</b> "
        "prácticamente inaccesible sin extensas filas de varios días, contra un precio en surtidores diferenciados de "
        "<b>Bs. 9,80 - 12,00/litro</b> y un mercado no regulado que supera los <b>Bs. 17,95/litro</b>. "
        "Bajo este escenario, las fórmulas tarifarias estáticas vigentes (aprobadas hace más de 10 años) han quebrado "
        "la economía del operador, amenazando con paros indefinidos, convulsión social y la paralización de las 9 capitales."
    )
    story.append(Paragraph(p1, body_style))

    p2 = (
        "<b>Tarify OS v4.5</b> nace para sustituir las negociaciones políticas a ciegas por una <b>plataforma tecnológica "
        "de auditoría econométrica en tiempo real</b>. La herramienta proporciona una única fuente de la verdad técnica, "
        "permitiendo a Alcaldías, Gobernaciones, ATT, Sindicatos y organizaciones vecinales (ODECO/FEJUVE) simular "
        "acuerdos de equilibrio financiero transparente en cuestión de segundos."
    )
    story.append(Paragraph(p2, body_style))

    # Box de Alerta Regulatoria
    alert_content = [
        [Paragraph("<b>DICTAMEN TÉCNICO REGULATORIO:</b> La tarifa de transporte no puede ser fijada por decreto político ni por presión sindical. Si la tarifa no cubre el Costo de Operación Vehicular (COV) real auditado, el parque automotor colapsa por falta de repuestos. Si excede la capacidad de pago del usuario sin compensación social, se destruye la demanda. Tarify OS automatiza el punto de equilibrio matemático exacto.", callout_style)]
    ]
    t_alert = Table(alert_content, colWidths=[504])
    t_alert.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")), # Blue 50
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#93c5fd")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_alert)
    story.append(Spacer(1, 10))

    # =========================================================================
    # CAPACIDAD DE NEGOCIACIÓN INSTITUCIONAL POR ACTOR
    # =========================================================================
    story.append(Paragraph("2. Capacidad de Negociación y Solución por Actor Competente", h1_style))
    
    actores_data = [
        [Paragraph("Actor Institucional", table_header), Paragraph("Fricción / Conflicto Principal", table_header), Paragraph("Solución Proporcionada por Tarify OS", table_header)],
        [
            Paragraph("<b>Alcaldías (GAMs)</b><br/><i>(La Paz, Santa Cruz, Cbba, Sucre, etc.)</i>", table_cell),
            Paragraph("Costo político de autorizar subas de pasajes; presiones de juntas vecinales y acusaciones de negligencia.", table_cell),
            Paragraph("Dictamen matemático objetivo, auditoría de 52 ítems de mantenimiento y cálculo de compensación municipal por tarifa escolar/universitaria.", table_cell)
        ],
        [
            Paragraph("<b>Sindicatos y Federaciones</b><br/><i>(Choferes 1ro de Mayo, San Cristóbal, etc.)</i>", table_cell),
            Paragraph("Pérdida de ingresos por encarecimiento de repuestos y combustible; desconfianza en planillas municipales.", table_cell),
            Paragraph("Cálculo del <b>Ingreso Digno Familiar (Bs/mes)</b>, reconocimiento de cargas sociales (aguinaldo) y simulación del impacto real del diésel en su caja.", table_cell)
        ],
        [
            Paragraph("<b>ATT & Viceministerio</b><br/><i>(Regulación Interdepartamental)</i>", table_cell),
            Paragraph("Falta de estándar homologado entre rutas interprovinciales y terminales terrestres ante variaciones de combustibles.", table_cell),
            Paragraph("Módulo de buses interdepartamentales (Scania/Volvo/Marcopolo), tarifas por pasajero-kilómetro (pax-km) y bandas tarifarias máximas/mínimas.", table_cell)
        ],
        [
            Paragraph("<b>ODECO / Vecinos / FEJUVE</b><br/><i>(Sociedad Civil)</i>", table_cell),
            Paragraph("Rechazo a incrementos por falta de calidad del servicio y falta de transparencia contable.", table_cell),
            Paragraph("Modo Observador Público, garantía de tarifas sociales congeladas para colegiales/adultos mayores y compromisos de renovación de flota.", table_cell)
        ],
        [
            Paragraph("<b>Empresas de Buses y Flotas</b><br/><i>(Transporte Carretero)</i>", table_cell),
            Paragraph("Costos de peaje, WACC de unidades de alto valor ($us 250k+) y variación de factores de ocupación estacionales.", table_cell),
            Paragraph("Modelación WACC financiera al 11%, depreciación acelerada, amortización de leasing bancario y optimización de frecuencias.", table_cell)
        ]
    ]

    t_actores = Table(actores_data, colWidths=[110, 194, 200])
    t_actores.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
    ]))
    story.append(t_actores)
    story.append(Spacer(1, 12))

    # =========================================================================
    # EL MOTOR DE CRISIS: SHOCK DE DIÉSEL Y SUBVENCIÓN
    # =========================================================================
    story.append(Paragraph("3. Módulo Especializado de Crisis de Combustibles y Quita de Subvención", h1_style))
    p3 = (
        "El corazón de la versión 4.5 es el <b>Simulador Dinámico de Absorción de Combustibles</b>. "
        "En una unidad de transporte urbano, el combustible representa entre el 35% y el 65% del costo operativo total. "
        "Tarify OS establece 4 regímenes analíticos inmediatos:"
    )
    story.append(Paragraph(p3, body_style))

    fuel_data = [
        [Paragraph("Régimen de Combustible", table_header), Paragraph("Precio Referencial", table_header), Paragraph("Impacto en COV Mensual", table_header), Paragraph("Tarifa Técnica Resultante", table_header)],
        [
            Paragraph("<b>1. Subvención Estatal Plena</b>", table_cell),
            Paragraph("Bs. 3,72 / litro", table_cell),
            Paragraph("Costo diésel: Bs. 1.848 / mes<br/>Representa el 12,8% del OPEX", table_cell),
            Paragraph("<b>Bs. 2,10 - 2,30</b> (Tarifa de equilibrio histórico con déficit de repuestos)", table_cell)
        ],
        [
            Paragraph("<b>2. Subvención Focalizada / Mixta</b>", table_cell),
            Paragraph("Bs. 6,80 / litro", table_cell),
            Paragraph("Costo diésel: Bs. 3.379 / mes<br/>Representa el 21,5% del OPEX", table_cell),
            Paragraph("<b>Bs. 2,80 - 3,10</b> (Escenario de concertación gradual con apoyo municipal)", table_cell)
        ],
        [
            Paragraph("<b>3. Surtidor Diferenciado / Paridad</b>", table_cell),
            Paragraph("Bs. 9,80 / litro", table_cell),
            Paragraph("Costo diésel: Bs. 4.870 / mes<br/>Representa el 28,6% del OPEX", table_cell),
            Paragraph("<b>Bs. 3,44 - 3,50</b> (Equilibrio auditado actual Sucre/Nissan Civilian)", table_cell)
        ],
        [
            Paragraph("<b>4. Mercado Abierto / Crisis Severa</b>", table_cell),
            Paragraph("Bs. 17,95 / litro", table_cell),
            Paragraph("Costo diésel: Bs. 8.921 / mes<br/>Representa el 47,5% del OPEX", table_cell),
            Paragraph("<b>Bs. 4,80 - 5,20</b> (Alerta de quiebra: requiere subsidio directo cruzado)", table_cell)
        ]
    ]

    t_fuel = Table(fuel_data, colWidths=[120, 84, 150, 150])
    t_fuel.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_secondary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
    ]))
    story.append(t_fuel)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Métrica Exclusiva SaaS: Índice de Vulnerabilidad de Combustible (IVC)</b>", h2_style))
    p_ivc = (
        "El sistema calcula de manera continua el <i>Índice de Vulnerabilidad de Combustible</i>: "
        "<b>IVC = (Gasto Mensual en Combustible / Ingreso Bruto por Tarifa) * 100</b>. "
        "Cuando el IVC es menor al 30%, el sistema emite estatus VERDE (Sostenible). "
        "Entre 30% y 45%, estatus ÁMBAR (Estrés Financiero; desgaste de capital). "
        "Superior al 45%, estatus ROJO (Parálisis Inminente: el chofer trabaja únicamente para cargar combustible). "
        "Este indicador objetivo neutraliza discusiones subjetivas en la mesa de concertación."
    )
    story.append(Paragraph(p_ivc, body_style))
    story.append(Spacer(1, 10))

    # =========================================================================
    # CARACTERIZACIÓN DE LOS 9 DEPARTAMENTOS
    # =========================================================================
    story.append(PageBreak()) # Salto de página limpio para matriz departamental
    story.append(Paragraph("4. Matriz Paramétrica de los 9 Departamentos de Bolivia", h1_style))
    p4 = (
        "Bolivia no tiene una realidad de transporte única. Las pendientes del 18% en La Paz demandan consumos de "
        "combustible radicalmente distintos a la topografía plana de Santa Cruz o las rutas conurbadas de Cochabamba. "
        "Tarify OS v4.5 integra los perfiles de los 9 departamentos de fábrica:"
    )
    story.append(Paragraph(p4, body_style))

    dep_data = [
        [Paragraph("Departamento", table_header), Paragraph("Modo Predominante", table_header), Paragraph("Topografía / Reto", table_header), Paragraph("IPK Ref.", table_header), Paragraph("Flota Activa", table_header), Paragraph("Km/Día/Unidad", table_header)],
        [
            Paragraph("<b>La Paz / El Alto</b>", table_cell),
            Paragraph("Minibús (14pax), Carry, Micro", table_cell),
            Paragraph("Ladera 3.600 - 4.100 msnm; alto desgaste en frenos y embrague.", table_cell),
            Paragraph("3,85", table_cell),
            Paragraph("18.500", table_cell),
            Paragraph("110 km", table_cell)
        ],
        [
            Paragraph("<b>Santa Cruz</b>", table_cell),
            Paragraph("Micro Urbano (25pax), Trufi", table_cell),
            Paragraph("Plano, clima cálido; alto uso de A/C, distancias extensas (anillos).", table_cell),
            Paragraph("2,95", table_cell),
            Paragraph("9.800", table_cell),
            Paragraph("160 km", table_cell)
        ],
        [
            Paragraph("<b>Cochabamba</b>", table_cell),
            Paragraph("Trufi, Taxitrufi, Colectivo", table_cell),
            Paragraph("Valle metropolitano intermunicipal (Sacaba-Quillacollo).", table_cell),
            Paragraph("3,40", table_cell),
            Paragraph("7.200", table_cell),
            Paragraph("130 km", table_cell)
        ],
        [
            Paragraph("<b>Chuquisaca (Sucre)</b>", table_cell),
            Paragraph("Nissan Civilian Micro (25pax)", table_cell),
            Paragraph("Ondulado histórico; 32 rutas, 52 ítems mantenimiento auditados.", table_cell),
            Paragraph("3,22", table_cell),
            Paragraph("987", table_cell),
            Paragraph("83,5 km", table_cell)
        ],
        [
            Paragraph("<b>Oruro</b>", table_cell),
            Paragraph("Minibús, Micro tradicional", table_cell),
            Paragraph("Altiplano frío 3.700 msnm; arranque en frío, arrastre minero.", table_cell),
            Paragraph("3,10", table_cell),
            Paragraph("1.400", table_cell),
            Paragraph("95 km", table_cell)
        ],
        [
            Paragraph("<b>Potosí</b>", table_cell),
            Paragraph("Minibús, Micro adaptado", table_cell),
            Paragraph("Extrema pendiente urbana 4.060 msnm; consumo crítico diésel.", table_cell),
            Paragraph("3,60", table_cell),
            Paragraph("1.100", table_cell),
            Paragraph("78 km", table_cell)
        ],
        [
            Paragraph("<b>Tarija</b>", table_cell),
            Paragraph("Micro urbano, Trufi", table_cell),
            Paragraph("Valle templado; alta penetración histórica de GNV.", table_cell),
            Paragraph("2,80", table_cell),
            Paragraph("850", table_cell),
            Paragraph("105 km", table_cell)
        ],
        [
            Paragraph("<b>Beni (Trinidad)</b>", table_cell),
            Paragraph("Mototaxi, Torito, Minibús", table_cell),
            Paragraph("Plano amazónico; lluvias estacionales, anegamientos.", table_cell),
            Paragraph("2,10", table_cell),
            Paragraph("4.500", table_cell),
            Paragraph("65 km", table_cell)
        ],
        [
            Paragraph("<b>Pando (Cobija)</b>", table_cell),
            Paragraph("Mototaxi, Vagoneta trufi", table_cell),
            Paragraph("Frontera Brasil; combustible con paridad cambiaria en reales.", table_cell),
            Paragraph("1,90", table_cell),
            Paragraph("1.200", table_cell),
            Paragraph("55 km", table_cell)
        ]
    ]

    t_dep = Table(dep_data, colWidths=[80, 95, 145, 44, 60, 80])
    t_dep.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
    ]))
    story.append(t_dep)
    story.append(Spacer(1, 14))

    # =========================================================================
    # ACÁPITE PRODUCT REQUIREMENTS DOCUMENT (PRD)
    # =========================================================================
    story.append(Paragraph("5. Acápite Técnico: Product Requirements Document (PRD)", h1_style))
    story.append(Paragraph("<b>5.1 Visión del Producto</b>", h2_style))
    story.append(Paragraph(
        "Convertir a Tarify OS en el sistema operativo estándar de la regulación del transporte público en Bolivia "
        "y la región andina, eliminando la conflictividad social mediante gobernanza de datos y matemáticas transparentes.",
        body_style
    ))

    story.append(Paragraph("<b>5.2 Requerimientos Funcionales Clave (FR)</b>", h2_style))
    story.append(Paragraph("• <b>FR-01: Motor Multimodal Desacoplado:</b> Cálculo independiente para 5 modos de transporte: Minibús urbano (14 pax), Microbús (25 pax), Colectivo histórico (35 pax), Vagoneta/Trufi (5 pax) y Bus Interdepartamental de larga distancia (45-55 pax).", bullet_style))
    story.append(Paragraph("• <b>FR-02: Simulador de Shock de Combustibles:</b> Slider paramétrico interactivo con actualización en tiempo real (<50ms) entre Bs. 3,72/l y Bs. 25,00/l con cálculo del Índice de Vulnerabilidad de Combustible.", bullet_style))
    story.append(Paragraph("• <b>FR-03: Switcher de 9 Departamentos:</b> Conmutador geográfico en la cabecera que precarga topografía, flota, kilometraje de red y tarifas vigentes locales.", bullet_style))
    story.append(Paragraph("• <b>FR-04: Mesa de Concertación Multi-Actor:</b> 4 perfiles con control de acceso RBAC estricto: SuperAdmin (Ecotraffic), Administrador Municipal (GAMs), Consultor Técnico, y Delegado Sindical con modo de proyección.", bullet_style))
    story.append(Paragraph("• <b>FR-05: Bitácora de Inmutabilidad AUD-002:</b> Registro inmutable de cada cambio de parámetro con justificación legal de >=15 caracteres y encadenamiento criptográfico SHA-256.", bullet_style))
    story.append(Paragraph("• <b>FR-06: Exportación de Expediente Oficial:</b> Generador en caliente de libros Excel multi-hoja (.xlsx) y Dossiers Institucionales en PDF para suscripción de actas de concertación legal.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>5.3 Requerimientos No Funcionales (NFR)</b>", h2_style))
    story.append(Paragraph("• <b>NFR-01 (Rendimiento 60fps):</b> Interfaz reactiva con memoización de componentes; cero retardos en transiciones entre pestañas y recálculo instantáneo.", bullet_style))
    story.append(Paragraph("• <b>NFR-02 (Zero-Emoji Policy):</b> Iconografía e interfaces basadas estrictamente en vectores SVG corporativos de alta definición.", bullet_style))
    story.append(Paragraph("• <b>NFR-03 (Type Safety Estricto):</b> Cero uso de tipos 'any' en TypeScript. Validación de esquemas con Zod y compatibilidad total con Next.js 14 SSR.", bullet_style))
    story.append(Paragraph("• <b>NFR-04 (Multi-Tenant Zero-Leak):</b> Aislamiento de datos con Row Level Security (RLS) en Supabase PostgreSQL por organization_id.", bullet_style))
    story.append(Paragraph("• <b>NFR-05 (Resiliencia Offline-First):</b> Tolerancia a desconexión mediante persistencia local de escenarios y fallback de IA offline en menos de 8 segundos.", bullet_style))

    # =========================================================================
    # ROADMAP DE IMPLEMENTACIÓN Y ENTREGABLES
    # =========================================================================
    story.append(PageBreak()) # Salto de página para el roadmap y firmas
    story.append(Paragraph("6. Cronograma de Implementación y Fases de Despliegue", h1_style))
    
    roadmap_data = [
        [Paragraph("Fase / Hito", table_header), Paragraph("Alcance Técnico y Entregables", table_header), Paragraph("Plazo", table_header), Paragraph("Criterio de Éxito", table_header)],
        [
            Paragraph("<b>Fase I: Motor de Shock de Combustibles</b>", table_cell),
            Paragraph("• Slider dinámico de precio de combustible (Bs. 3,72 a 20,00).<br/>• Tarjeta del Índice de Vulnerabilidad de Combustible (IVC).<br/>• Modos de combustible: Diésel, GNV, Gasolina y Eléctrico.", table_cell),
            Paragraph("Semana 1", table_cell),
            Paragraph("Recálculo a 60fps sin latencia; validación de fórmulas econométricas.", table_cell)
        ],
        [
            Paragraph("<b>Fase II: Expansión Nacional 9 Departamentos</b>", table_cell),
            Paragraph("• Switcher departamental en cabecera.<br/>• Seeds y parámetros oficiales para La Paz, Santa Cruz, Cbba, etc.<br/>• Catálogo vehicular regional (Minibús, Trufi, Colectivo).", table_cell),
            Paragraph("Semana 2", table_cell),
            Paragraph("9 ciudades operativas con sus propios kilometrajes e IPKs.", table_cell)
        ],
        [
            Paragraph("<b>Fase III: Módulo ATT & Flotas Carreteras</b>", table_cell),
            Paragraph("• Módulo de buses interdepartamentales (Scania/Volvo).<br/>• Tarifas por tramo y bandas de cobro ATT.<br/>• Costos de peaje, WACC de unidades y depreciación de flota pesada.", table_cell),
            Paragraph("Semana 3", table_cell),
            Paragraph("Aprobación técnica de modelos de transporte de larga distancia.", table_cell)
        ],
        [
            Paragraph("<b>Fase IV: Despliegue Cloud & Talleres</b>", table_cell),
            Paragraph("• Despliegue de producción en Vercel con dominio institucional.<br/>• Capacitación a técnicos de GAMs y dirigentes sindicales.<br/>• Kit de actas de concertación legal descargables.", table_cell),
            Paragraph("Semana 4", table_cell),
            Paragraph("Uso en vivo en al menos 2 mesas técnicas de concertación.", table_cell)
        ]
    ]

    t_roadmap = Table(roadmap_data, colWidths=[105, 205, 54, 140])
    t_roadmap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
    ]))
    story.append(t_roadmap)
    story.append(Spacer(1, 14))

    # =========================================================================
    # BLOQUE DE FIRMA Y AVAL INSTITUCIONAL
    # =========================================================================
    story.append(Paragraph("7. Aval Técnico y Declaración de Conformidad Institucional", h1_style))
    p_cert = (
        "El presente documento técnico constituye el marco de referencia formal para la implementación "
        "de <b>Tarify OS v4.5</b>. Se certifica que los modelos econométricos, algoritmos de cálculo de COV "
        "y estructuras de bases de datos han sido diseñados bajo los más rigurosos estándares de auditoría "
        "regulatoria de transporte vigentes en el Estado Plurinacional de Bolivia."
    )
    story.append(Paragraph(p_cert, body_style))
    story.append(Spacer(1, 20))

    # Firmas
    sign_data = [
        [
            Paragraph("<b>Ing. Consultor Principal</b><br/>Ecotraffic Regulación y Movilidad<br/><i>Especialista en Economía del Transporte</i>", table_cell),
            Paragraph("<b>Director de Transporte y Vialidad</b><br/>Gobierno Autónomo Municipal<br/><i>Delegación Técnica Oficial</i>", table_cell),
            Paragraph("<b>Secretario Ejecutivo de Transporte</b><br/>Federación Departamental de Choferes<br/><i>Mesa de Concertación Técnica</i>", table_cell)
        ],
        [
            Paragraph("___________________________________<br/>Firma y Sello", table_cell),
            Paragraph("___________________________________<br/>Firma y Sello", table_cell),
            Paragraph("___________________________________<br/>Firma y Sello", table_cell)
        ]
    ]
    t_sign = Table(sign_data, colWidths=[168, 168, 168])
    t_sign.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_sign)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[OK] Archivo generado exitosamente: {filename}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "PLAN_IMPLEMENTACION_SaaS_TARIFY_OS_BOLIVIA.pdf"
    build_pdf(out_file)
