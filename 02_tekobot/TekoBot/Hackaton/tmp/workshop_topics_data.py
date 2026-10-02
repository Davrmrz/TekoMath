import json
from pathlib import Path
p=Path('database/problem_workshop.json');d=json.loads(p.read_text(encoding='utf8'))
d['topics']=[{'id':k,'label':label,'aliases':aliases,'prompt':prompt} for k,label,aliases,prompt in [
('arithmetic','Números y operaciones',['aritmetica','numeros','operaciones','fracciones','porcentajes'],'Indicá las cantidades, sus unidades y qué operación o cantidad se busca.'),
('algebra','Álgebra y ecuaciones',['algebra','ecuaciones','ecuacion'],'Indicá la incógnita y las relaciones de igualdad o condiciones del problema.'),
('functions','Funciones',['funciones','funcion'],'Incluí la regla de la función, el valor de entrada o salida conocido y qué se pide.'),
('trigonometry','Trigonometría',['trigonometria','trigonometrico'],'Indicá ángulos con sus unidades, lados o distancias conocidos y qué altura, distancia o razón buscás.'),
('geometry','Geometría',['geometria','triangulo','pitagoras'],'Indicá la figura, medidas con sus unidades y si se busca un lado, área, perímetro o distancia.'),
('counting','Combinatoria y probabilidad',['combinatoria','probabilidad','conteo'],'Indicá cuántos elementos hay, cuántos se eligen, si importa el orden y si se permite repetir.'),
('statistics','Estadística',['estadistica','media','promedio'],'Incluí todos los datos y qué medida estadística se pide.'),
('unsure','No sé el tema',['no se','no estoy seguro','otro'],'Escribí el enunciado completo; identificaremos juntos el tema y lo que se busca.')]]
d['topic_question']='¿De qué tema es el enunciado? Elegí una opción o escribí el tema. Si no estás seguro, elegí «No sé el tema». Después te pediré el enunciado y revisaremos los datos antes de avanzar.'
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
