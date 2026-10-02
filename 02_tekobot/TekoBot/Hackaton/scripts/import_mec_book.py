"""Import the supplied textbook, preserving printed-page / PDF-page references.
Usage: python scripts/import_mec_book.py path/to/book.pdf
Requires pypdf. Only runs locally; does not call an external service.
"""
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
reader = PdfReader(source)
pages = []
for index, page in enumerate(reader.pages):
    raw = page.extract_text() or ''
    printed = index - 1 if 4 <= index < 150 else None
    # Control characters signal a broken embedded font map. Do not guess glyphs.
    suspicious = sum(ord(c) < 32 and c not in '\n\r\t' for c in raw)
    text = ''.join(c for c in raw if ord(c) >= 32 or c in '\n\t')
    text = re.sub(r'[ \t]+', ' ', text).strip()
    if printed is not None:
        label = re.match(r'^(\d+)\s', text)
        if not label or int(label.group(1)) != printed:
            raise ValueError(f'Unverified printed page at PDF page {index+1}')
    pages.append({'pdf_page':index+1, 'printed_page':printed, 'text':text,
                  'extraction_warning':suspicious > 0})
target = root / 'assets/books/matematica-1-mec-2016.pdf'
target.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(source, target)
data = {'id':'mec_matematica_1_2016', 'title':'Matemática 1 · Texto para el estudiante',
        'publisher':'Ministerio de Educación y Cultura, Paraguay', 'year':2016,
        'url':'assets/books/matematica-1-mec-2016.pdf',
        'sha256':hashlib.sha256(source.read_bytes()).hexdigest(), 'page_count':len(pages),
        'extraction_note':'Texto extraído del PDF; las fórmulas, fracciones y diagramas pueden perder su disposición. Contrastar con las páginas originales y las fórmulas didácticas revisadas.',
        'pages':pages}
out = root / 'database/sources/mec_matematica_1_2016.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Imported {len(pages)} pages. Printed-page offsets verified; {sum(p["extraction_warning"] for p in pages)} pages flagged for extraction quality.')
