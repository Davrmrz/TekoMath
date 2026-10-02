import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
p = root / 'database/curriculum.json'
d = json.loads(p.read_text(encoding='utf-8'))
book = json.loads((root/'database/sources/mec_matematica_1_2016.json').read_text(encoding='utf-8'))
d['source'] = 'Matemática 1. Texto para el estudiante. MEC, Paraguay, 2016.'
d['book'] = {k:v for k,v in book.items() if k != 'pages'}
for unit in d['units']:
    for lesson in unit['subtopics']:
        page = lesson.get('page')
        if page:
            lesson['source'] = {'printed_page':page,'pdf_page':page+2,'url':book['url']+'#page='+str(page+2)}
            lesson['source_excerpt'] = next(x['text'] for x in book['pages'] if x['printed_page']==page)[:10000]
        else:
            lesson['source_note'] = 'Ampliación didáctica; no corresponde a una sección propia del libro.'
trig = next(u for u in d['units'] if u['key']=='trigonometria')
for ident,title,concept,formula,example,visual in [
 ('arcseno','Seno inverso · arcsen (sen⁻¹)','Arcsen devuelve el ángulo principal cuyo seno es la entrada. Su dominio es [-1, 1] y su recorrido [-90°, 90°]. No es la cosecante ni el opuesto del seno.',r'y=\arcsin(x)', 'Si sen(30°)=1/2, entonces arcsen(1/2)=30°. Elegimos el ángulo dentro del recorrido principal.','asin'),
 ('arccoseno','Coseno inverso · arccos (cos⁻¹)','Arccos devuelve el ángulo principal cuyo coseno es la entrada. Su dominio es [-1, 1] y su recorrido [0°, 180°]. No es la secante.',r'y=\arccos(x)','Si cos(60°)=1/2, entonces arccos(1/2)=60°. La restricción del recorrido hace única la respuesta.','acos'),
 ('arctangente','Tangente inversa · arctan (tg⁻¹)','Arctan devuelve el ángulo principal cuya tangente es la entrada. Su dominio es R y su recorrido (-90°, 90°). Los extremos están excluidos. No es la cotangente.',r'y=\arctan(x)','Si tg(45°)=1, entonces arctan(1)=45°. La inversa no repite las ramas periódicas de la tangente.','atan')]:
    if not any(t['id']==ident for t in trig['subtopics']):
        trig['subtopics'].append({'id':ident,'title':title,'page':None,'source_note':'Ampliación didáctica sobre funciones inversas.', 'sections':[{'id':ident,'concept':concept,'alternative':concept+' Primero distinguí si conocés el ángulo o la razón.', 'formula':formula,'example':example,'example_alt':example,'visual':{'type':'function_graph','funcType':visual}}]})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
