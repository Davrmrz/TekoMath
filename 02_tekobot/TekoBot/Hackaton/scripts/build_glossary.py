"""Build glossary and scope catalog. Definitions are editorial, not official MEC quotations."""
from pathlib import Path
import json,unicodedata
root=Path(__file__).resolve().parents[1]
p=root/'database/curriculum.json';d=json.loads(p.read_text(encoding='utf8'))
url='https://informacionpublica.paraguay.gov.py/public/2300836-1-PRIO20213yEMDGDEfinalverif3pdf-1-PRIO2021.3yEM.DGDE.final.verif.3.pdf'
d['glossary_sources']={
 'mec_book1':{'title':'MEC · Matemática 1, texto para el estudiante (2016)','url':'assets/books/matematica-1-mec-2016.pdf','type':'official_textbook','note':'Fuente del temario de primer curso. Las definiciones del glosario son redacción propia.'},
 'mec_eeb2':{'title':'MEC · Guía del elaborador, segundo ciclo (2021)','url':'https://informacionpublica.paraguay.gov.py/public/3226537-3-GUADELELAB-2CICLODGDEFINALverifpdf-3-GUADELELAB-2CICLO.DGDE.FINAL.verif.pdf','type':'official_curricular_reference','note':'Referencia de áreas y conocimientos previos; no acredita un grado exacto para cada término.'},
 'mec_eeb3':{'title':'MEC · Priorización curricular 2021, EEB y Educación Media','url':url,'type':'official_curricular_reference','note':'Páginas impresas 23–24 y 70–71 (PDF 31–32 y 78–79). Priorización histórica, no certificación de exhaustividad del currículo vigente.'},
 'mec_snepe':{'title':'MEC · SNEPE 2015, ítems liberados','url':'https://informacionpublica.paraguay.gov.py/public/1369801-SNEPE2015-TEMSLIBERADOSComunicacin-Matemticapdf-SNEPE2015-TEMSLIBERADOSComunicacin-Matemtica.pdf','type':'official_assessment','note':'Evidencia de operaciones, gráficos y ecuaciones cuadráticas en EEB.'},
}
def norm(t):return ''.join(c for c in unicodedata.normalize('NFD',t.lower()) if not unicodedata.combining(c))
# Rebuild without accumulating generated entries.
cards=[c for c in d['question_bank'] if not c['key'].startswith('glossary:')]
for c in cards:
 c['scope']='extension' if c['key'] in ['trigonometria:arcseno','trigonometria:arccoseno','trigonometria:arctangente'] else 'first_course'
 c['source_ids']=['mec_book1'];c['category']={'funciones':'Funciones','trigonometria':'Trigonometría','geometria':'Geometría analítica','combinatoria':'Combinatoria'}[c['topic']]
 if c['scope']=='extension':c['scope_note']='Ampliación didáctica solicitada: ángulos principales; no se atribuye inclusión explícita en primer curso al documento MEC.'
 # Fine-grained glossary entries supersede broad aliases without duplicating matches.
 if c['key']=='trigonometria:triangulo':c['aliases']=[a for a in c['aliases'] if a not in ['hipotenusa','catetos']]
 if c['key']=='trigonometria:reciprocas':c['aliases']=['razones reciprocas','funciones reciprocas','reciprocas']
 if c['key']=='funciones:clasificacion':c['aliases']=['clasificacion de funciones']
for file,category,source,scope in [
 ('numbers','Números y operaciones','mec_eeb2','prerequisite'),('algebra','Álgebra','mec_eeb3','prerequisite'),
 ('geometry','Geometría y medida','mec_eeb3','prerequisite'),('functions','Conjuntos y funciones','mec_book1','first_course'),
 ('statistics','Estadística y probabilidad básica','mec_eeb2','prerequisite')]:
 for i,line in enumerate((root/f'database/glossary_{file}.txt').read_text(encoding='utf-8-sig').strip().splitlines()):
  title,alias,definition,example=line.split('|')
  aliases=list(dict.fromkeys([norm(title)]+[norm(a) for a in alias.split(';') if a]))
  card={'key':f'glossary:{file}_{i+1}','title':title,'aliases':aliases,'topic':'glossary','subtopic':file,'category':category,'scope':scope,'source_ids':[source],
   'definition':definition,'detail':definition,'simple':definition,'example':example,'example_alt':example,'formula':'','visual':{'type':'none'}}
  # Prefer existing detailed lessons for exact concepts already represented.
  existing=next((c for c in cards if norm(c['title'])==norm(title)),None)
  if existing:existing['aliases']=list(dict.fromkeys(existing['aliases']+aliases));continue
  cards.append(card)
# Domain/reciprocal distinctions are essential for inverse trigonometric functions.
for key,names,concept,example,alt,detail,formula,kind in [
 ('arcseno',['arcoseno','arco seno','arcseno','arcsen','arcsin'],
 'El arcoseno recibe una razón entre −1 y 1 y devuelve el ángulo principal cuyo seno es esa razón. Su resultado está entre −90° y 90°, incluidos los extremos.',
 'Como sen(30°)=1/2, arcsen(1/2)=30°=π/6 rad. La entrada es una razón sin unidad; la salida es un ángulo.',
 'Como sen(−90°)=−1, arcsen(−1)=−90°=−π/2 rad. arcsen(2) no existe en los reales.',
 'El seno repite valores: sen(30°)=sen(150°)=1/2. Para obtener una sola salida, el arcoseno elige el intervalo principal [−π/2,π/2]. Por eso arcsen(1/2) devuelve 30°, no todos los ángulos posibles. No es 1/sen(x), que corresponde a la cosecante.',r'\theta=\arcsin(r),\quad -1\le r\le1','asin'),
 ('arctangente',['arcotangente','arco tangente','arctan','arctangente'],
 'La arcotangente recibe una razón real y devuelve el ángulo principal cuya tangente es esa razón. Su resultado está entre −90° y 90°, sin incluir los extremos.',
 'Como tan(45°)=1, arctan(1)=45°=π/4 rad. La entrada es una razón; la salida es un ángulo.',
 'Como tan(−45°)=−1, arctan(−1)=−45°=−π/4 rad. arctan(0)=0°.',
 'La tangente se repite cada 180°. La arcotangente selecciona el ángulo en (−π/2,π/2) para tener una salida única. En una rampa, se aplica a altura/avance horizontal para hallar el ángulo agudo. No es 1/tan(x), que es la cotangente donde ambas expresiones están definidas.',r'\theta=\arctan(r),\quad r\in\mathbb{R}','atan'),
 ('arccoseno',['arcocoseno','arco coseno','arccos','arccoseno'],
 'El arcocoseno recibe una razón entre −1 y 1 y devuelve el ángulo principal cuyo coseno es esa razón, entre 0° y 180° inclusive.',
 'Como cos(60°)=1/2, arccos(1/2)=60°=π/3 rad.',
 'arccos(−1)=180°=π rad; arccos(1)=0°.',
 'Se restringe el coseno a [0,π] para que la inversa tenga una sola salida. No es la secante, que es el recíproco del coseno. El intervalo principal de arcocoseno es distinto del de arcoseno y arcotangente.',r'\theta=\arccos(r),\quad -1\le r\le1','acos')]:
 c=next(c for c in cards if c['key']=='trigonometria:'+key)
 c.update(definition=concept,detail=detail,simple=concept,example=example,example_alt=alt,why=detail,usage='Se usa para encontrar un ángulo a partir de una razón conocida. Antes de interpretar la calculadora, comprobá si trabaja en grados o radianes.',formula=formula,visual={'type':'function_graph','funcType':kind})
 c['aliases']=list(dict.fromkeys(c['aliases']+names))
 lesson=next(t for u in d['units'] for t in u['subtopics'] if u['key']=='trigonometria' and t['id']==key)
 section=lesson['sections'][0];section.update(concept=concept,alternative=detail,example=example,example_alt=alt,formula=formula,visual=c['visual'])
 lesson['scope']='extension';lesson['scope_note']=c['scope_note']
# Explicitly recognized later-course subjects. Broad words like 'límite' alone are deliberately absent.
advanced=[
 ('Derivadas','derivada;derivadas;derivar;deriva;derivame;derivacion;calculo diferencial;regla de la cadena;regla del cociente','third_course',79),
 ('Límites de funciones','que es un limite;que son los limites;limite de una funcion;limite de funciones;limites de funciones;limites laterales;calcular un limite;limite cuando;limite de x;limite de sen;limite de cos','third_course',78),
 ('Matrices','matriz;matrices;matriz inversa;producto de matrices','second_course',78),
 ('Regla de Cramer','regla de cramer;determinante;determinantes','second_course',79),
 ('Progresiones','progresion aritmetica;progresiones aritmeticas;progresion geometrica;progresiones geometricas','third_course',78),
 ('Cónicas analíticas','elipse;hiperbola;secciones conicas;ecuacion de la circunferencia;directriz de una parabola;foco de una parabola','second_course',79),
 ('Fórmulas de ángulo doble y mitad','angulo doble;angulo mitad;seno de la suma;coseno de la suma;tangente de la suma','second_course',78),
 ('Ecuaciones trigonométricas','ecuacion trigonometrica;ecuaciones trigonometricas','second_course',78),
 ('Ecuaciones exponenciales y logarítmicas','ecuacion exponencial;ecuaciones exponenciales;ecuacion logaritmica;ecuaciones logaritmicas','second_course',78)]
d['advanced_topics']=[{'id':str(i),'title':title,'aliases':alias.split(';'),'scope':scope,'source_id':'mec_eeb3','pdf_page':page} for i,(title,alias,scope,page) in enumerate(advanced)]
d['glossary_sources']['una_calculus']={'title':'UNA · Programa de Ingeniería Mecatrónica','url':'https://www.ing.una.py/FIUNA3/?page_id=1535','type':'official_university_reference','note':'Fuente universitaria paraguaya para contenidos fuera del nivel escolar; no se presenta como aprobación MEC del glosario.'}
d['advanced_topics'] += [
 {'id':'integrals','title':'Integrales','aliases':['integral','integrales','integrar','antiderivada','antiderivadas','calculo integral','integracion por partes'],'scope':'higher_education','source_id':'una_calculus'},
 {'id':'differential_equations','title':'Ecuaciones diferenciales','aliases':['ecuacion diferencial','ecuaciones diferenciales','transformada de laplace','series de fourier'],'scope':'higher_education','source_id':'una_calculus'}]
d['glossary_policy']={'notice':'esa pregunta abarca a temas de un curso mayor','coverage':'Glosario amplio de conocimientos previos y primer curso; no garantiza ausencia de errores ni exhaustividad del currículo vigente.','checked_on':'2026-09-26','unknown_policy':'Pedir aclaración; desconocido no significa curso mayor.','inverse_policy':'Arcoseno, arcocoseno y arcotangente permitidos como ampliación didáctica solicitada.'}
d['question_bank']=cards
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'Glossary ready: {len(cards)} concepts; {len(d["advanced_topics"])} later-course groups')
import runpy
runpy.run_path(str(root/'scripts/build_trig_topics.py'))

