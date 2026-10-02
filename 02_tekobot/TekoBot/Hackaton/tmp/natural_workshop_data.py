import json
from pathlib import Path
p=Path('database/problem_workshop.json');d=json.loads(p.read_text(encoding='utf8'))
d['welcome']='Escribí el enunciado completo del problema, con sus datos y lo que te pide. Primero identificaremos qué conocemos y qué buscamos; después avanzaremos paso a paso. El cálculo final queda para vos y comprobaré tu resultado. También podés escribir ecuaciones y operaciones directamente.'
d['unknown']='Necesito aclarar el enunciado antes de calcular. Indicá qué cantidad buscás y a qué corresponde cada medida, con su unidad. Si es un problema de alturas, incluí la distancia horizontal o sombra y el ángulo en grados. Podés completar los datos en el siguiente mensaje. No voy a marcar una respuesta como correcta o incorrecta sin una interpretación verificable.'
d['natural']={'number_words':{'seis':6,'treinta':30,'cuarenta y cinco':45,'sesenta':60,'diez':10,'cinco':5,'doce':12,'veinte':20},'rules':[]}
items=[('shadow_height','Identifiqué una sombra de {length} m y un ángulo de elevación solar de {angle}°. Buscamos la altura. Suponemos que el árbol está vertical y el terreno es horizontal. Si no es así, corregí esos datos antes de continuar.',[
'Dibujá el árbol vertical, su sombra horizontal y el rayo solar que une la copa con el extremo de la sombra. Forman un triángulo rectángulo: la altura es el cateto opuesto al ángulo solar; la sombra de {length} m es el adyacente.',
'Usamos tangente porque relaciona esos dos catetos: tan({angle}°) = h / {length}. No usamos seno, porque no conocemos la hipotenusa.',
'Multiplicamos ambos lados por {length} para despejar la altura: h = {length} · tan({angle}°). Calculá vos el valor en modo DEG y expresalo en metros. Podés redondear a dos decimales.']),
('elevation_height','Identifiqué una distancia horizontal de {length} m y un ángulo de elevación de {angle}°. Buscamos la altura sobre el nivel de observación. Suponemos observación desde el suelo horizontal; si hay altura del observador, falta sumarla.',[
'La distancia horizontal es el cateto adyacente y la altura buscada es el opuesto. El ángulo de elevación se mide desde la horizontal hacia la línea de visión.',
'La relación adecuada es tan({angle}°) = h / {length}. La distancia de la línea de visión sería la hipotenusa; no debe confundirse con la distancia horizontal.',
'Despejamos h = {length} · tan({angle}°). Hacé el cálculo final en grados y enviá la altura en metros, redondeada a dos decimales.']),
('elevation_distance','Identifiqué una altura de {length} m y un ángulo de elevación de {angle}°. Buscamos la distancia horizontal a la base, suponiendo terreno horizontal y observación desde el suelo.',[
'La altura es el cateto opuesto; la distancia horizontal desconocida es el adyacente. No estamos buscando la línea inclinada de visión.',
'Usamos tan({angle}°) = {length} / d. Multiplicamos por d: d · tan({angle}°) = {length}.',
'Dividimos por la tangente: d = {length} / tan({angle}°). Calculá el resultado en grados y escribilo en metros, con dos decimales.']),
('ladder_height','Identifiqué una escalera de {length} m y un ángulo de {angle}° con el suelo. Buscamos la altura que alcanza sobre una pared vertical, con suelo horizontal.',[
'La escalera inclinada es la hipotenusa; la altura en la pared es el cateto opuesto al ángulo con el suelo.',
'Como conocemos la hipotenusa y buscamos el opuesto, usamos seno: sen({angle}°) = h / {length}. La tangente necesitaría la distancia horizontal.',
'Despejamos h = {length} · sen({angle}°). Calculá el valor en modo DEG. La altura debe ser menor que la longitud de la escalera. Enviá tu resultado en metros, con dos decimales.'])]
for id,summary,steps in items:d['natural']['rules'].append({'id':id,'summary':summary,'steps':steps,'hint':'Revisá qué lado es opuesto, adyacente o hipotenusa respecto del ángulo dado. La calculadora debe estar en grados (DEG); comprobá también las unidades.'})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
