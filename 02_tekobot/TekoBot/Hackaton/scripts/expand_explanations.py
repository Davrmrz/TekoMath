import json
from pathlib import Path
p=Path('database/curriculum.json');d=json.loads(p.read_text(encoding='utf-8'))
guides={
'funciones':[
('Cómo interpretar la relación','La entrada es el valor que elegimos y la salida es lo que la regla le asigna. Antes de calcular, identificá qué representa cada variable y en qué unidades se mide. El dominio reúne las entradas permitidas: una expresión puede imponer restricciones, por ejemplo por un denominador, una raíz o un logaritmo. No todas las reglas admiten cualquier número real.'),
('Cómo trabajar paso a paso','Primero reconocé la clase de función y leé su expresión respetando los paréntesis. Después, si te piden una imagen, reemplazá cada aparición de la variable por la misma entrada y seguí el orden de las operaciones. Si te piden encontrar una entrada, estás resolviendo una ecuación: no es la misma tarea que evaluar la función.'),
('Cómo comprobar e interpretar','En una gráfica, una pareja entrada-salida corresponde a un punto: su coordenada horizontal es la entrada y la vertical es la imagen. Compará la tendencia de la curva con la regla y revisá si el valor obtenido tiene sentido en el contexto. Evitá confundir el valor de la función con la variable, o suponer que todo dibujo representa una función.')],
 'trigonometria':[
('Qué representa cada dato','Primero distinguí un ángulo de una razón trigonométrica. El ángulo describe una abertura o un giro; una razón relaciona longitudes y no lleva unidades de longitud. En un triángulo rectángulo, los nombres opuesto y adyacente dependen del ángulo elegido, mientras que la hipotenusa siempre está frente al ángulo recto.'),
('Cómo elegir y aplicar el método','Leé qué conocés y qué querés averiguar antes de escoger una relación. Las razones directas toman un ángulo como entrada; sus inversas principales toman una razón y devuelven un ángulo dentro de un intervalo específico. Revisá si se trabaja en grados o radianes y mantené esa unidad durante todo el procedimiento. Las razones recíprocas no son funciones inversas.'),
('Cómo comprobar e interpretar','En la circunferencia unitaria, el coseno corresponde a la coordenada horizontal y el seno a la vertical; por eso sus signos cambian según el cuadrante. La tangente solo está definida cuando el coseno no es cero. En el gráfico de una función trigonométrica, leé las etiquetas de los ejes: la entrada y la salida tienen papeles distintos en las inversas. No confundas un valor aproximado de calculadora con uno exacto.')],
 'geometria':[
('Qué representan los datos','Cada punto del plano se describe mediante una coordenada horizontal y otra vertical, en ese orden. Un dibujo ayuda a interpretar el problema, pero no reemplaza los datos del enunciado. Antes de usar una fórmula, anotá a qué punto pertenece cada coordenada y qué magnitud buscás: una distancia, una pendiente o una ecuación expresan cosas diferentes.'),
('Cómo elegir y aplicar el método','Elegí la relación que conecta los datos conocidos con la incógnita. Cuando compares dos puntos, conservá el mismo orden al restar sus coordenadas. Antes de dividir, comprobá si el denominador puede ser nulo: una recta vertical requiere un tratamiento distinto y no tiene una pendiente real definida. Mantené los paréntesis al trabajar con coordenadas negativas.'),
('Cómo comprobar e interpretar','Una distancia no puede ser negativa. Si obtenés una ecuación de recta, los puntos usados para construirla deben satisfacerla al sustituir sus coordenadas. La pendiente describe cuánto cambia la altura por cada cambio horizontal; la ordenada al origen indica dónde se corta el eje vertical cuando la forma de la recta lo permite. Usá el gráfico para contrastar estas propiedades, no para adivinar valores exactos.')],
 'combinatoria':[
('Qué se está contando','El objetivo es contar configuraciones sin enumerarlas una por una. Definí con claridad qué hace que dos resultados sean distintos. Cambiar el orden puede producir un resultado nuevo o representar la misma selección; esa decisión depende del enunciado y debe tomarse antes de elegir una fórmula.'),
('Cómo elegir y aplicar el método','Identificá cuántos elementos hay disponibles, cuántos se eligen y si pueden repetirse. Si todos se ordenan, pensá en permutaciones; si se selecciona una parte y el orden importa, considerá variaciones; si el orden no importa, considerá combinaciones. Estas reglas necesitan la versión adecuada cuando hay repetición. Un proceso dividido en etapas también puede analizarse mediante el principio multiplicativo.'),
('Cómo comprobar e interpretar','Probá primero con un caso pequeño que puedas listar: así podés detectar si contaste el mismo resultado más de una vez o si falta alguno. Las cantidades de configuraciones deben ser enteros no negativos. Antes de desarrollar factoriales grandes, revisá qué factores se pueden simplificar y por qué. No elijas una fórmula solo porque aparecen dos números en el enunciado.')]
}
for u in d['units']:u['explanation_guide']=[{'title':a,'text':b} for a,b in guides[u['key']]]
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
p=Path('assets/js/lesson_engine.js');s=p.read_text(encoding='utf-8');needle="        if((s.language||'jopara')==='jopara')"
block="""        if(['TEACHING_MODE','EXAMPLE_MODE','QUESTION_MODE'].includes(s.mode) && !s.question_pending) {
            const guide=this.unit(s.topic).explanation_guide||[];
            text+='\\n\\n'+guide.map(part=>`**${part.title}**\\n${part.text}`).join('\\n\\n');
            if(s.mode==='TEACHING_MODE') text+=`\\n\\n**Ejemplo docente para conectar la idea**\\n${section.example}\\n\\nLeé el ejemplo en este orden: identificá los datos, localizá la regla que los relaciona y justificá cada transformación. Después compará lo que obtuviste con la definición del tema.`;
            text+='\\n\\n**Para comprobar tu comprensión**\\nExplicá con tus palabras qué representa cada dato y por qué usarías esta relación. Si un paso no está claro, señalalo y lo desarrollamos con más detalle.';
        }
"""
s=s if block in s else s.replace(needle,block+needle);p.write_text(s,encoding='utf-8')
p=Path('services/pedagogy_service.php');s=p.read_text(encoding='utf-8');needle="        if (($state['language'] ?? 'jopara') === 'jopara')"
block="""        if (in_array($state['mode'], ['TEACHING_MODE','EXAMPLE_MODE','QUESTION_MODE'], true) && !($state['question_pending'] ?? false)) {
            foreach ((CurriculumService::unit($state['topic'])['explanation_guide'] ?? []) as $part) {
                $text.="\\n\\n**{$part['title']}**\\n{$part['text']}";
            }
            if ($state['mode'] === 'TEACHING_MODE') $text.="\\n\\n**Ejemplo docente para conectar la idea**\\n{$section['example']}\\n\\nLeé el ejemplo en este orden: identificá los datos, localizá la regla que los relaciona y justificá cada transformación. Después compará lo que obtuviste con la definición del tema.";
            $text.="\\n\\n**Para comprobar tu comprensión**\\nExplicá con tus palabras qué representa cada dato y por qué usarías esta relación. Si un paso no está claro, señalalo y lo desarrollamos con más detalle.";
        }
"""
s=s if block in s else s.replace(needle,block+needle);p.write_text(s,encoding='utf-8')
