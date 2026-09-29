"""Generate the response PDF. Requires reportlab and local Arial font files.

Usage: python scripts/generate-response-pdf.py
Set ARIAL_REGULAR and ARIAL_BOLD to valid TTF paths on non-macOS systems.
Source: docs/RESPUESTA.md. Review publication status before sending.
"""
from pathlib import Path
import os
import re
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf' / 'respuesta-snail-club.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Arial', os.environ.get('ARIAL_REGULAR', '/System/Library/Fonts/Supplemental/Arial.ttf')))
pdfmetrics.registerFont(TTFont('Arial-Bold', os.environ.get('ARIAL_BOLD', '/System/Library/Fonts/Supplemental/Arial Bold.ttf')))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold', italic='Arial', boldItalic='Arial-Bold')
body = ParagraphStyle('Body', fontName='Arial', fontSize=10, leading=12, textColor=HexColor('#26342b'), spaceAfter=10)
heading = ParagraphStyle('Heading', parent=body, fontName='Arial-Bold', spaceBefore=12, spaceAfter=8, keepWithNext=True)
title = ParagraphStyle('Title', parent=heading, spaceBefore=0, spaceAfter=14)

source = (ROOT / 'docs' / 'RESPUESTA.md').read_text()
delivery_note = source.split('## ', 1)[0].split('\n\n', 1)[1].strip()
sections = {}
for block in re.split(r'^## ', source, flags=re.M)[1:]:
    label, content = block.split('\n', 1)
    sections[label.strip()] = content.strip()
page_groups = [
    ('Proceso y decisiones', ['Proceso', 'Decisiones principales', 'Herramientas, diseño e IA']),
    ('Validación y alcance', ['Pruebas y razón de su elección', 'Funcionalidades terminadas', 'Pendientes y limitaciones']),
    ('Ejecución y entrega', ['Ejecución y entrega']),
    ('Adicional: propuesta de PostgreSQL', ['Adicional: propuesta de PostgreSQL']),
]
story = []
for index, (page_title, labels) in enumerate(page_groups):
    if index: story.append(PageBreak())
    story.append(Paragraph('SNAIL CLUB / ' + escape(page_title), title))
    if index == 0:
        story.append(Paragraph(re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', escape(delivery_note)), body))
    for label in labels:
        story.append(Paragraph(escape(label), heading))
        for paragraph in re.split(r'\n\s*\n', sections[label]):
            text = escape(paragraph.replace('\n', ' '))
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            story.append(Paragraph(text, body))
    if index == 2:
        story.append(Paragraph('Resultados de comprobación local', heading))
        story.append(Paragraph('Compilación de frontend y backend aprobada. 30 pruebas de lógica e integración aprobadas; 10 recorridos completos aprobados, repartidos entre escritorio y móvil. Se verificaron el servidor compilado y sus rutas, una instalación limpia y cinco escenarios por API. La revisión visual cubrió acceso, dashboard y recarga. Estos resultados no prueban despliegue, funcionamiento en Safari ni persistencia SQL.', body))
        story.append(Paragraph('Preparación antes de publicar', heading))
        story.append(Paragraph('Revisar personalmente el código y sus decisiones; confirmar la identidad del autor del commit; crear el repositorio público con el nombre preparado; publicar solo los archivos del proyecto; verificar su acceso público; sustituir el estado pendiente por la URL real y regenerar este documento. No se incluye el documento de requisitos en el repositorio.', body))

def footer(c, doc):
    c.setStrokeColor(HexColor('#dce2d6'))
    c.line(48, 45, A4[0]-48, 45)
    c.setFont('Arial', 10)
    c.setFillColor(HexColor('#58674e'))
    c.drawString(48, 30, 'Snail Club | Documento de respuesta')
    c.drawRightString(A4[0]-48, 30, str(doc.page))

SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=48, leftMargin=48, topMargin=44, bottomMargin=62,
                  title='Snail Club - Documento de respuesta', author='Snail Club').build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
