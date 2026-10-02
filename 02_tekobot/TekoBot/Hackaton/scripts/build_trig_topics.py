"""Enrich the canonical lessons and question cards using the supplied pp.24–31."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'database/curriculum.json'
d=json.loads(p.read_text(encoding='utf8'))
unit=next(u for u in d['units'] if u['key']=='trigonometria')
data=[
 ('seno','sin',27,'El seno es y/ρ: cateto opuesto dividido por hipotenusa en un triángulo rectángulo. En la circunferencia unitaria es la coordenada vertical.',
 'Con hipotenusa 30 y cateto opuesto 20, sen α=20/30=2/3. El adyacente mide √(30²−20²)=10√5. Si duplicamos los lados a 60 y 40, 40/60 sigue siendo 2/3.',
 'Dominio: todos los números reales.','Recorrido: [−1,1]. Los extremos se alcanzan.',
 'Positivo en I y II; negativo en III y IV. Se anula en kπ, con k entero.',
 'En una vuelta: crece de 0 a 1 en I; decrece de 1 a 0 en II y de 0 a −1 en III; crece de −1 a 0 en IV. Período 2π. Es impar: sen(−θ)=−sen θ.',r'\sin\theta=\frac{y}{\rho}',
 'sen(30°)=1/2; sen(150°)=1/2; sen(270°)=−1.'),
 ('coseno','cos',29,'El coseno es x/ρ: cateto adyacente dividido por hipotenusa. En la circunferencia unitaria es la coordenada horizontal.',
 'Si la hipotenusa mide 30 y el cateto opuesto 20, el adyacente es √500=10√5. Entonces cos α=(10√5)/30=√5/3≈0,745. No se usa 20/30: ese cociente es el seno.',
 'Dominio: todos los números reales.','Recorrido: [−1,1].',
 'Positivo en I y IV; negativo en II y III. Se anula en π/2+kπ.',
 'En I desciende de 1 a 0; en II de 0 a −1; en III asciende de −1 a 0 y en IV de 0 a 1. Período 2π. Es par: cos(−θ)=cos θ.',r'\cos\theta=\frac{x}{\rho}',
 'cos(0°)=1; cos(90°)=0; cos(180°)=−1; cos(360°)=1.'),
 ('tangente','tan',29,'La tangente es y/x=sen θ/cos θ cuando cos θ≠0. En un triángulo rectángulo compara cateto opuesto con adyacente.',
 'Para hipotenusa 30 y opuesto 20, el adyacente es 10√5. Por tanto tan α=20/(10√5)=2/√5≈0,894. En una rampa es altura dividida por avance horizontal.',
 'Dominio: R excepto π/2+kπ, con k entero; en grados se excluyen 90°+k·180°.','Recorrido: todos los reales.',
 'Positiva en I y III; negativa en II y IV. Vale cero en kπ.',
 'Cada rama es creciente. Las asíntotas verticales están en π/2+kπ: no se deben unir las ramas. Período π; no tiene amplitud. Es impar.',r'\tan\theta=\frac{\sin\theta}{\cos\theta}=\frac{y}{x}',
 'tan(45°)=1, tan(135°)=−1 y tan(225°)=1. tan(90°) no está definida; no es infinito.'),
 ('cotangente','cot',30,'La cotangente es x/y=cos θ/sen θ cuando sen θ≠0. En un triángulo rectángulo es adyacente dividido por opuesto.',
 'En el triángulo de hipotenusa 30 y opuesto 20, cot α=(10√5)/20=√5/2≈1,118. Es el cociente inverso al de la tangente donde ambas están definidas.',
 'Dominio: R excepto kπ, con k entero; se excluyen los múltiplos de 180°.','Recorrido: todos los reales.',
 'Positiva en I y III; negativa en II y IV. Vale cero en π/2+kπ.',
 'Cada rama es decreciente. Asíntotas en kπ; ceros a mitad de cada rama. Período π. En 90° vale cero aunque la tangente no esté definida allí.',r'\cot\theta=\frac{\cos\theta}{\sin\theta}=\frac{x}{y}',
 'cot(45°)=1, cot(90°)=0 y cot(135°)=−1. cot(180°) no está definida.'),
 ('secante','sec',30,'La secante es ρ/x=1/cos θ cuando cos θ≠0. En un triángulo rectángulo es hipotenusa dividida por adyacente.',
 'Como cos(60°)=1/2, sec(60°)=1/(1/2)=2. Como cos(120°)=−1/2, sec(120°)=−2. Conservar el signo es esencial.',
 'Dominio: R excepto π/2+kπ, con k entero.','Recorrido: (−∞,−1]∪[1,∞). Incluye −1 y 1, pero no los valores entre ellos.',
 'Mismo signo que el coseno: positiva en I y IV, negativa en II y III. Nunca vale cero.',
 'Tiene ramas separadas por asíntotas en π/2+kπ. En la rama positiva cercana a 0 alcanza mínimo 1; en la negativa centrada en π alcanza máximo −1. No son extremos globales: no está acotada. Período 2π; es par.',r'\sec\theta=\frac{1}{\cos\theta}=\frac{\rho}{x}',
 'sec(0°)=1, sec(180°)=−1, sec(360°)=1. sec(90°) no está definida.'),
 ('cosecante','csc',31,'La cosecante es ρ/y=1/sen θ cuando sen θ≠0. En un triángulo rectángulo es hipotenusa dividida por opuesto.',
 'Con hipotenusa 30 y opuesto 20, csc α=30/20=3/2. Si sen(30°)=1/2, entonces csc(30°)=2; si sen(210°)=−1/2, csc(210°)=−2.',
 'Dominio: R excepto kπ, con k entero.','Recorrido: (−∞,−1]∪[1,∞). Nunca toma valores estrictamente entre −1 y 1.',
 'Mismo signo que el seno: positiva en I y II, negativa en III y IV. Nunca vale cero.',
 'Asíntotas en kπ. En (0,π) baja hasta 1 en π/2 y vuelve a subir. En (π,2π) sube hasta −1 en 3π/2 y vuelve a bajar. Período 2π; es impar. No tiene máximo ni mínimo global.',r'\csc\theta=\frac{1}{\sin\theta}=\frac{\rho}{y}',
 'csc(90°)=1 y csc(270°)=−1. En 0°, 180° y 360° no está definida.')]
for name,kind,page,definition,example,domain,ran,signs,graph,formula,alt in data:
 if name in ['secante','cosecante']:definition+=' Es el recíproco del '+('coseno.' if name=='secante' else 'seno.')
 visual={'type':'function_graph','funcType':kind,'amplitude':1,'frequency':1}
 why='Los triángulos rectángulos que comparten un ángulo agudo son semejantes: sus lados correspondientes cambian por el mismo factor. Ese factor se cancela en el cociente. Con coordenadas x, y y radio ρ=√(x²+y²), la definición se extiende a los cuatro cuadrantes.'
 if name=='tangente':
  why+=' Al dividir seno por coseno, la hipotenusa se cancela: (opuesto/hipotenusa)/(adyacente/hipotenusa)=opuesto/adyacente.'
  domain+=' En 90° el coseno vale cero y el cociente no se puede calcular.'
  signs+=' En I y III seno y coseno tienen el mismo signo.'
  ran='El recorrido es todo R: puede tomar cualquier valor real.'
 if name in ['seno','coseno']:ran='El recorrido es [−1, 1], incluidos ambos extremos.'
 warning='Las razones no tienen unidad; el ángulo debe interpretarse en grados o radianes. Dividir por cero no da un valor infinito: la función queda sin definir. Las recíprocas no son las funciones arco.'
 sections=[{'id':name,'concept':definition,'alternative':why,'example':example,'example_alt':alt,'formula':formula,'visual':visual},
 {'id':name+'_dominio','concept':domain+' '+ran,'alternative':signs,'example':alt,'example_alt':example,'formula':formula,'visual':visual},
 {'id':name+'_grafica','concept':graph,'alternative':signs+' '+warning,'example':'Mové el ángulo entre 0° y 360° y compará los valores de la tabla con la curva. '+alt,'example_alt':'Cambiá la escala A a −1: cada salida cambia de signo y la curva se refleja respecto del eje horizontal. Las entradas no definidas siguen excluidas.','formula':formula,'visual':visual}]
 lesson=next((t for t in unit['subtopics'] if t['id']==name),None)
 if lesson is None:
  lesson={'id':name,'title':'Función '+name,'page':page,'group':'Funciones trigonométricas'};unit['subtopics'].append(lesson)
 lesson.update(sections=sections,source={'printed_page':page,'pdf_page':page+2,'url':f'assets/books/matematica-1-mec-2016.pdf#page={page+2}'})
 card=next((c for c in d['question_bank'] if c['key']=='trigonometria:'+name),None)
 if card is None:
  card={'key':'trigonometria:'+name,'topic':'trigonometria','subtopic':name,'title':'Función '+name,'aliases':[name]};d['question_bank'].append(card)
 card.update(definition=definition,detail=why+' '+graph,why=why,example=example,example_alt=alt,domain=domain,range=ran,signs=signs,graph=graph,warning=warning,usage='Para leer la gráfica, localizá el ángulo en el eje horizontal y su razón en el vertical. '+example,formula=formula,visual=visual,source_ids=['mec_book1'],scope='first_course',category='Trigonometría')
 # Existing glossary aliases must show the same graph and full explanations.
 for c in d['question_bank']:
  if c['key'].startswith('glossary:') and name in c['aliases']:
   for field in ['definition','detail','why','example','example_alt','domain','range','signs','graph','warning','usage','formula','visual','source_ids','scope']:c[field]=card[field]
 for t in unit['subtopics']:
  if t['id']=='grafica_'+name:t['sections']=sections

triangle=next(t for t in unit['subtopics'] if t['id']=='triangulo')
visual={'type':'function_graph','funcType':'triangle'}
concept='Dos triángulos rectángulos que comparten un ángulo agudo son semejantes por el criterio ángulo–ángulo. Los ángulos restantes son 90° y 90°−α; por eso los lados correspondientes son proporcionales.'
detail='Al multiplicar todos los lados por k>0, (k·opuesto)/(k·hipotenusa)=opuesto/hipotenusa. Así se explica por qué una razón trigonométrica depende del ángulo y no del tamaño. Si cambia el ángulo, las proporciones generalmente cambian.'
example='Hipotenusa 30 y opuesto 20: adyacente=√(900−400)=10√5. sen α=2/3, cos α=√5/3, tan α=2/√5. Al duplicar el triángulo, los lados son 60,40,20√5 y las tres razones permanecen iguales.'
triangle['sections']=[{'id':'triangulo','concept':concept,'alternative':detail,'example':example,'example_alt':'En un triángulo 3–4–5, con opuesto 3, sen α=3/5. El semejante 6–8–10 da 6/10=3/5. Si elegís el otro ángulo agudo, opuesto y adyacente intercambian sus papeles.','formula':r'\frac{ko}{kh}=\frac{o}{h},\quad k>0','visual':visual}]
card=next(c for c in d['question_bank'] if c['key']=='trigonometria:triangulo')
card.update(definition=concept,detail=detail,why=detail,example=example,visual=visual,graph='Los triángulos superpuestos comparten un ángulo. El control de tamaño cambia los lados proporcionalmente; el control angular cambia sus razones.')
card['aliases']=list(dict.fromkeys(card['aliases']+['triangulos semejantes','semejanza de triangulos','razones trigonometricas','funciones goniometricas','goniometria']))
# Teach the object before its similarity properties; keep retrieval concepts separate.
basic='Un triángulo rectángulo es un triángulo que tiene un ángulo recto, es decir, de 90°. Los dos lados que forman ese ángulo se llaman catetos. El lado opuesto al ángulo recto es la hipotenusa y es el más largo.'
basic_detail='Los otros dos ángulos son agudos y suman 90°. Para reconocer la hipotenusa, buscá primero el ángulo recto: la hipotenusa queda enfrente. Si elegís uno de los ángulos agudos, un cateto es opuesto a él y el otro es adyacente; esos nombres cambian al elegir el otro ángulo.'
basic_example='Un triángulo con catetos de 3 cm y 4 cm e hipotenusa de 5 cm es rectángulo: 3²+4²=9+16=25=5². El ángulo de 90° está entre los lados de 3 cm y 4 cm.'
basic_visual={'type':'function_graph','funcType':'triangle','triangle_mode':'single'}
similarity_section=triangle['sections'][0].copy();similarity_section['id']='triangulo_semejanza'
triangle['sections']=[{'id':'triangulo','concept':basic,'alternative':basic_detail,'example':basic_example,'example_alt':'Si un ángulo mide 90° y otro 30°, el tercero mide 60°: 180°−90°−30°=60°.','formula':r'a^2+b^2=h^2','visual':basic_visual},similarity_section]
card.update(definition=basic,simple=basic,detail=basic_detail,why='En todo triángulo los ángulos interiores suman 180°. Si uno mide 90°, los otros dos suman los 90° restantes.',example=basic_example,example_alt=triangle['sections'][0]['example_alt'],formula=r'a^2+b^2=h^2',visual=basic_visual,usage='Se usa para relacionar distancias perpendiculares, como la altura de una pared y la distancia desde su base hasta una escalera.',graph='El dibujo marca el ángulo recto entre los catetos y la hipotenusa frente a él.')
card['aliases']=['triangulo rectangulo','triangulos rectangulos']
ratios=next((c for c in d['question_bank'] if c['key']=='trigonometria:razones'),None)
if ratios is None:
 ratios={'key':'trigonometria:razones','topic':'trigonometria','subtopic':'triangulo','title':'Razones trigonométricas','scope':'first_course','category':'Trigonometría','source_ids':['mec_book1']};d['question_bank'].append(ratios)
ratios.update(aliases=['razones trigonometricas','funciones goniometricas','goniometria'],definition='Las razones trigonométricas comparan dos lados de un triángulo rectángulo respecto de un ángulo agudo: seno=opuesto/hipotenusa, coseno=adyacente/hipotenusa y tangente=opuesto/adyacente.',detail=detail,why=concept,example=example,example_alt=basic_example,formula=r'\sin\alpha=\frac{o}{h},\quad\cos\alpha=\frac{a}{h},\quad\tan\alpha=\frac{o}{a}',visual=visual)
for c in d['question_bank']:
 if c['key'].startswith('glossary:') and 'semejanza' in c['title'].lower():c.update(aliases=['semejanza','triangulos semejantes','semejanza de triangulos'],definition='Dos triángulos son semejantes cuando sus ángulos correspondientes son iguales y sus lados correspondientes son proporcionales. Pueden tener distinto tamaño.',detail=concept+' '+detail,example=example,visual=visual)
for t in unit['subtopics']:
 if t['id']=='reciprocas':
  t['sections']=[]
  for name in ['cotangente','secante','cosecante']:t['sections'].append(next(t for t in unit['subtopics'] if t['id']==name)['sections'][0].copy())
  c=next(c for c in d['question_bank'] if c['key']=='trigonometria:reciprocas');c['visual']={'type':'function_graph','funcType':'cot'}
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Updated six trigonometric functions, reciprocal lessons and similar triangles')
