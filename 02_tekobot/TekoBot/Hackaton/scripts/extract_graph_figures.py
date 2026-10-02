from pathlib import Path
import pypdfium2 as pdf
root=Path(__file__).resolve().parents[1]
d=pdf.PdfDocument(str(root/'assets/books/matematica-1-mec-2016.pdf'))
out=root/'assets/books/figures';out.mkdir(exist_ok=True)
# Coordinates measured on the rendered source pages at scale 1.3.
for name,page,box in [('logaritmica',24,(190,537,607,835)),('exponencial',17,(158,480,587,739))]:
    im=d[page-1].render(scale=2.6).to_pil()
    im.crop(tuple(v*2 for v in box)).save(out/(name+'.png'))
