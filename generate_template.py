"""
Genera dashboard-template.xlsx con estilos EY (amarillo/negro) usando openpyxl.
Correr: python generate_template.py
"""
from openpyxl import Workbook
from openpyxl.styles import (
    PatternFill, Font, Alignment, Border, Side, GradientFill
)
from openpyxl.utils import get_column_letter

# ─── Paleta EY ────────────────────────────────────────────
EY_YELLOW  = "FFE600"
EY_DARK    = "1A1A24"
EY_GRAY    = "2E2E38"
EY_LGRAY   = "F5F5F2"
EY_WHITE   = "FFFFFF"
EY_BORDER  = "CCCCCC"
EY_ALT     = "FAFAF7"

# ─── Estilos reutilizables ────────────────────────────────
HDR_FILL   = PatternFill("solid", fgColor=EY_YELLOW)
HDR_FONT   = Font(name="Calibri", bold=True, color=EY_DARK, size=10)
HDR_ALIGN  = Alignment(horizontal="center", vertical="center", wrap_text=True)

DATA_FONT  = Font(name="Calibri", color=EY_GRAY, size=10)
DATA_ALIGN = Alignment(horizontal="left", vertical="center")
NUM_ALIGN  = Alignment(horizontal="right", vertical="center")

ALT_FILL   = PatternFill("solid", fgColor=EY_ALT)
WH_FILL    = PatternFill("solid", fgColor=EY_WHITE)

THIN  = Side(style="thin", color=EY_BORDER)
THICK = Side(style="medium", color=EY_DARK)
THIN_BORDER  = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
THICK_BOTTOM = Border(left=THIN, right=THIN, top=THIN, bottom=THICK)

BOLD_FONT = Font(name="Calibri", bold=True, color=EY_GRAY, size=10)


def style_header(ws, row, cols):
    for col in range(1, cols + 1):
        cell = ws.cell(row=row, column=col)
        cell.fill   = HDR_FILL
        cell.font   = HDR_FONT
        cell.alignment = HDR_ALIGN
        cell.border = THICK_BOTTOM


def style_data_row(ws, row, cols, alt=False, num_cols=None):
    fill = ALT_FILL if alt else WH_FILL
    num_cols = num_cols or []
    for col in range(1, cols + 1):
        cell = ws.cell(row=row, column=col)
        cell.fill      = fill
        cell.font      = DATA_FONT
        cell.alignment = NUM_ALIGN if col in num_cols else DATA_ALIGN
        cell.border    = THIN_BORDER


def autofit(ws, min_w=10, max_w=40):
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            try:
                if cell.value:
                    max_len = max(max_len, len(str(cell.value)))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, min_w), max_w)


def freeze(ws, cell="A2"):
    ws.freeze_panes = cell


def add_sheet_title(ws, title):
    ws.row_dimensions[1].height = 30
    title_font = Font(name="Calibri", bold=True, color=EY_DARK, size=13)
    for col in range(1, 20):
        ws.cell(row=1, column=col).fill = PatternFill("solid", fgColor=EY_YELLOW)
    ws.cell(row=1, column=1).value     = title
    ws.cell(row=1, column=1).font      = title_font
    ws.cell(row=1, column=1).alignment = Alignment(horizontal="left", vertical="center")


# ════════════════════════════════════════════════════════
wb = Workbook()
wb.remove(wb.active)  # quitar hoja por defecto

# ────────────────────────────────────────────────────────
# SHEET: CONFIG
# ────────────────────────────────────────────────────────
ws = wb.create_sheet("CONFIG")
add_sheet_title(ws, "EY — Configuración del Proyecto")
ws.append([])  # fila 2 vacía

headers = ["Clave", "Valor", "Descripción"]
ws.append(headers)
style_header(ws, 3, len(headers))

rows = [
    ("PROYECTO", "Nombre del Proyecto",          "Nombre completo del proyecto"),
    ("CLIENTE",  "Cliente S.A.",                 "Razón social del cliente"),
    ("PM",       "Nombre Project Manager",       "Project Manager responsable"),
    ("FECHA",    "18 Junio 2026",                "Fecha del reporte (texto libre)"),
    ("RAG",      "Amber",                        "Estado: Green / Amber / Red"),
]
for i, r in enumerate(rows, start=4):
    ws.append(list(r))
    style_data_row(ws, i, 3, alt=(i % 2 == 0))
    ws.cell(row=i, column=1).font = BOLD_FONT  # clave en negrita

ws.row_dimensions[3].height = 22
freeze(ws, "A4")
autofit(ws)

# ────────────────────────────────────────────────────────
# SHEET: KPIs
# ────────────────────────────────────────────────────────
ws = wb.create_sheet("KPIs")
add_sheet_title(ws, "EY — Indicadores Clave (KPIs)")
ws.append([])

headers = ["KPI", "Unidad", "Meta", "Real", "Tendencia", "Estado"]
ws.append(headers)
style_header(ws, 3, len(headers))

rows = [
    ("Disponibilidad Sistema",  "%",  99.5, 98.2, "Baja",  "Rojo"),
    ("Tiempo de Respuesta",     "ms", 200,  185,  "Sube",  "Verde"),
    ("Satisfacción Usuario",    "%",  85,   78,   "Sube",  "Amarillo"),
    ("Cobertura de Pruebas",    "%",  80,   72,   "Sube",  "Amarillo"),
    ("Incidentes Críticos",     "#",  0,    2,    "Baja",  "Rojo"),
    ("Entregables a Tiempo",    "%",  90,   85,   "Sube",  "Verde"),
]
for i, r in enumerate(rows, start=4):
    ws.append(list(r))
    style_data_row(ws, i, len(headers), alt=(i % 2 == 0), num_cols=[3, 4])

ws.row_dimensions[3].height = 22
freeze(ws, "A4")
autofit(ws)

# ────────────────────────────────────────────────────────
# SHEET: PRESUPUESTO
# ────────────────────────────────────────────────────────
ws = wb.create_sheet("PRESUPUESTO")
add_sheet_title(ws, "EY — Presupuesto (CAPEX / OPEX)")
ws.append([])

headers = ["Categoria", "Item", "Presupuesto", "Ejecutado"]
ws.append(headers)
style_header(ws, 3, len(headers))

rows = [
    ("CAPEX", "Infraestructura Cloud",   80000,  72000),
    ("CAPEX", "Licencias Software",      45000,  44800),
    ("CAPEX", "Equipamiento",            20000,  18500),
    ("OPEX",  "Consultores EY",         120000,  95000),
    ("OPEX",  "Personal Interno",        60000,  48000),
    ("OPEX",  "Capacitaciones",          15000,  12500),
    ("OPEX",  "Gastos Operativos",       10000,  11200),
]
for i, r in enumerate(rows, start=4):
    ws.append(list(r))
    style_data_row(ws, i, len(headers), alt=(i % 2 == 0), num_cols=[3, 4])
    ws.cell(row=i, column=1).font = BOLD_FONT

ws.row_dimensions[3].height = 22
freeze(ws, "A4")
autofit(ws)

# ────────────────────────────────────────────────────────
# SHEET: RIESGOS
# ────────────────────────────────────────────────────────
ws = wb.create_sheet("RIESGOS")
add_sheet_title(ws, "EY — Registro de Riesgos")
ws.append([])

headers = ["ID", "Descripcion", "Probabilidad", "Impacto", "Severidad", "Propietario", "Estado", "Plan_Mitigacion"]
ws.append(headers)
style_header(ws, 3, len(headers))

rows = [
    ("R-01", "Retraso en migración de datos",    "Alta",  "Alto",  "Alto",  "TI Lead",    "Activo",        "Plan de contingencia con rollback"),
    ("R-02", "Resistencia al cambio usuarios",   "Alta",  "Medio", "Alto",  "Change Mgr", "En mitigación", "Programa de comunicación y capacitación"),
    ("R-03", "Falta de recursos TI cliente",     "Media", "Alto",  "Alto",  "PM",         "Activo",        "Escalamiento con patrocinador"),
    ("R-04", "Integración API terceros",          "Media", "Medio", "Medio", "Arquitecto", "Activo",        "Pruebas de integración tempranas"),
    ("R-05", "Seguridad de datos sensibles",      "Baja",  "Alto",  "Medio", "CISO",       "En mitigación", "Auditoría de seguridad mensual"),
    ("R-06", "Cambio de requerimientos",          "Media", "Bajo",  "Bajo",  "PM",         "Activo",        "Change control process establecido"),
]
for i, r in enumerate(rows, start=4):
    ws.append(list(r))
    style_data_row(ws, i, len(headers), alt=(i % 2 == 0))
    ws.cell(row=i, column=1).font = BOLD_FONT

ws.row_dimensions[3].height = 22
freeze(ws, "A4")
autofit(ws)

# ────────────────────────────────────────────────────────
# SHEET: CRONOGRAMA
# ────────────────────────────────────────────────────────
ws = wb.create_sheet("CRONOGRAMA")
add_sheet_title(ws, "EY — Cronograma (Actividades Ponderadas)")
ws.append([])

headers = ["Fase", "Actividad", "Peso", "Avance_Real", "Avance_Base", "Estado", "Responsable", "Fecha_Inicio", "Fecha_Fin"]
ws.append(headers)
style_header(ws, 3, len(headers))

rows = [
    ("Análisis",   "Levantamiento de requerimientos",    3, 100, 100, "Completado", "PM",         "2026-01-15", "2026-01-30"),
    ("Análisis",   "Validación con stakeholders",         2, 100, 100, "Completado", "PM",         "2026-01-31", "2026-02-14"),
    ("Análisis",   "Aprobación de requerimientos",        1, 100, 100, "Completado", "Sponsor",    "2026-02-15", "2026-02-28"),
    ("Diseño",     "Arquitectura técnica",                4, 100, 100, "Completado", "Arquitecto", "2026-03-01", "2026-03-20"),
    ("Diseño",     "Diseño de base de datos",             3, 100, 100, "Completado", "DBA Lead",   "2026-03-10", "2026-03-31"),
    ("Diseño",     "Prototipo de interfaces",             2, 100, 100, "Completado", "UX Lead",    "2026-03-15", "2026-04-05"),
    ("Desarrollo", "Sprint 1 — Core backend",             5, 100, 100, "Completado", "Dev Lead",   "2026-04-01", "2026-04-30"),
    ("Desarrollo", "Sprint 2 — Frontend",                 4,  75,  90, "En curso",   "Dev Lead",   "2026-05-01", "2026-05-31"),
    ("Desarrollo", "Sprint 3 — Integraciones",            4,  30,  60, "Retrasado",  "Arquitecto", "2026-05-15", "2026-06-15"),
    ("Desarrollo", "Pruebas unitarias",                   3,  60,  80, "En curso",   "QA Lead",    "2026-04-15", "2026-06-15"),
    ("UAT",        "Preparación ambiente UAT",            2,  20,  50, "Retrasado",  "TI Lead",    "2026-06-01", "2026-06-15"),
    ("UAT",        "Pruebas funcionales con usuarios",    4,   0,   0, "Pendiente",  "PM",         "2026-06-16", "2026-06-30"),
    ("UAT",        "Corrección de defectos",              3,   0,   0, "Pendiente",  "Dev Lead",   "2026-07-01", "2026-07-15"),
    ("Go-Live",    "Capacitación usuarios finales",       3,   0,   0, "Pendiente",  "Change Mgr", "2026-07-15", "2026-07-25"),
    ("Go-Live",    "Migración de datos producción",       4,   0,   0, "Pendiente",  "DBA Lead",   "2026-07-26", "2026-07-31"),
    ("Go-Live",    "Cutover y puesta en marcha",          5,   0,   0, "Pendiente",  "PM",         "2026-07-31", "2026-07-31"),
]
for i, r in enumerate(rows, start=4):
    ws.append(list(r))
    style_data_row(ws, i, len(headers), alt=(i % 2 == 0), num_cols=[3, 4, 5])
    ws.cell(row=i, column=1).font = BOLD_FONT  # Fase en negrita

ws.row_dimensions[3].height = 22
freeze(ws, "A4")
autofit(ws)

# ────────────────────────────────────────────────────────
# SHEET: GOBIERNO
# ────────────────────────────────────────────────────────
ws = wb.create_sheet("GOBIERNO")
add_sheet_title(ws, "EY — Gobierno (Decisiones / Issues / Acciones)")
ws.append([])

headers = ["Tipo", "ID", "Descripcion", "Propietario", "Fecha_Limite", "Estado"]
ws.append(headers)
style_header(ws, 3, len(headers))

rows = [
    ("Decision", "D-01", "Selección de proveedor cloud: AWS",        "CTO",        "2026-02-01", "Cerrado"),
    ("Decision", "D-02", "Arquitectura de microservicios aprobada",  "Arquitecto", "2026-03-15", "Cerrado"),
    ("Decision", "D-03", "Definición de SLAs de producción",         "PM",         "2026-06-30", "Abierto"),
    ("Issue",    "I-01", "Acceso a datos de producción para pruebas","DBA Lead",   "2026-06-20", "Abierto"),
    ("Issue",    "I-02", "Disponibilidad del equipo cliente reducida","PM",         "2026-06-10", "Vencido"),
    ("Issue",    "I-03", "Licencias adicionales requeridas",         "Procurement","2026-07-01", "En progreso"),
    ("Accion",   "A-01", "Revisar y firmar SLAs con TI cliente",     "PM",         "2026-06-25", "Pendiente"),
    ("Accion",   "A-02", "Actualizar plan de capacitación",          "Change Mgr", "2026-06-30", "En progreso"),
    ("Accion",   "A-03", "Completar pruebas de regresión Sprint 2",  "QA Lead",    "2026-06-18", "Vencido"),
    ("Accion",   "A-04", "Preparar ambiente UAT",                    "TI Lead",    "2026-07-05", "Pendiente"),
]
for i, r in enumerate(rows, start=4):
    ws.append(list(r))
    style_data_row(ws, i, len(headers), alt=(i % 2 == 0))
    ws.cell(row=i, column=1).font = BOLD_FONT
    ws.cell(row=i, column=2).font = BOLD_FONT

ws.row_dimensions[3].height = 22
freeze(ws, "A4")
autofit(ws)

# ────────────────────────────────────────────────────────
# SHEET: INSTRUCCIONES
# ────────────────────────────────────────────────────────
ws = wb.create_sheet("INSTRUCCIONES")
add_sheet_title(ws, "EY — Instrucciones de uso")
ws.append([])

instrucciones = [
    ("HOJA",          "CAMPO CLAVE",   "INSTRUCCIÓN"),
    ("CONFIG",        "RAG",           "Valores válidos: Green / Amber / Red"),
    ("KPIs",          "Tendencia",     "Valores válidos: Sube / Baja / Estable"),
    ("KPIs",          "Estado",        "Valores válidos: Verde / Amarillo / Rojo"),
    ("PRESUPUESTO",   "Categoria",     "Valores válidos: CAPEX / OPEX"),
    ("RIESGOS",       "Probabilidad",  "Valores válidos: Alta / Media / Baja"),
    ("RIESGOS",       "Impacto",       "Valores válidos: Alto / Medio / Bajo"),
    ("RIESGOS",       "Severidad",     "Valores válidos: Alto / Medio / Bajo"),
    ("RIESGOS",       "Estado",        "Valores válidos: Activo / En mitigación / Cerrado"),
    ("CRONOGRAMA",    "Peso",          "Número entero: importancia relativa (ej. 1–5)"),
    ("CRONOGRAMA",    "Avance_Real",   "Número 0–100 (% completado real)"),
    ("CRONOGRAMA",    "Avance_Base",   "Número 0–100 (% que debería estar hoy según el plan)"),
    ("CRONOGRAMA",    "Estado",        "Valores válidos: Completado / En curso / Retrasado / Pendiente"),
    ("GOBIERNO",      "Tipo",          "Valores válidos: Decision / Issue / Accion"),
    ("GOBIERNO",      "Estado",        "Valores válidos: Abierto / Cerrado / En progreso / Vencido / Pendiente"),
]
ws.append(list(instrucciones[0]))
style_header(ws, 3, 3)

for i, r in enumerate(instrucciones[1:], start=4):
    ws.append(list(r))
    style_data_row(ws, i, 3, alt=(i % 2 == 0))
    ws.cell(row=i, column=1).font = BOLD_FONT

ws.row_dimensions[3].height = 22
autofit(ws)

# ────────────────────────────────────────────────────────
# Guardar
# ────────────────────────────────────────────────────────
out = "dashboard-template.xlsx"
wb.save(out)
print(f"✅  Generado: {out}")
