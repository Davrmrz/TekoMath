from pathlib import Path
p=Path('scripts/build_question_bank.py');s=p.read_text(encoding='utf8');needle="d['question_bank']=cards"
insert="""for c in cards:
 if c['key']=='trigonometria:tangente':
  c.update(domain='La tangente está definida para todos los ángulos excepto 90° + k·180°, con k entero. En radianes se excluyen π/2 + kπ. Allí el coseno vale cero y el cociente seno/coseno no se puede calcular.', signs='La tangente es positiva en I y III porque seno y coseno tienen el mismo signo; es negativa en II y IV porque sus signos son distintos. Sobre el eje horizontal vale cero; sobre el eje vertical no está definida.', graph='Su gráfica tiene ramas crecientes separadas por asíntotas verticales donde el coseno se anula. Cada rama cruza el eje horizontal y el patrón se repite cada π radianes. No unas los extremos de ramas diferentes ni interpretes las asíntotas como puntos de la función.')
 if c['key'] in ['trigonometria:seno','trigonometria:coseno']:
  sine=c['subtopic']=='seno'
  c.update(domain='Su dominio es todo R y su recorrido es [−1, 1]. Cualquier ángulo real puede entrar, pero la coordenada de un punto sobre la circunferencia unitaria no puede superar el radio en valor absoluto.',signs='El seno es positivo en I y II, negativo en III y IV; vale cero sobre el eje horizontal.' if sine else 'El coseno es positivo en I y IV, negativo en II y III; vale cero sobre el eje vertical.',graph='La gráfica es una onda de período 2π radianes, con valores entre −1 y 1. '+('Pasa por el origen y comienza subiendo.' if sine else 'En el origen alcanza su máximo.'))
d['question_comparisons']={
 'trigonometria:seno|trigonometria:coseno':'Ambas razones usan la hipotenusa como denominador. El seno usa el cateto opuesto y la coordenada vertical; el coseno usa el adyacente y la horizontal. El ángulo de referencia debe ser el mismo al compararlas.',
 'trigonometria:tangente|trigonometria:arctangente':'La tangente recibe un ángulo y devuelve una razón. Arctan recibe una razón y devuelve un ángulo principal entre −90° y 90°, sin incluir los extremos. Arctan no es el recíproco de la tangente.',
 'combinatoria:permutacion|combinatoria:combinacion':'En una permutación importa el orden; cambiar posiciones puede crear otra disposición. En una combinación se elige un grupo sin importar el orden: reordenar el mismo grupo no crea una selección nueva.',
 'funciones:dominio|funciones:recorrido':'El dominio describe las entradas admitidas; el recorrido describe las salidas alcanzadas. Para encontrarlos se revisan condiciones diferentes: restricciones de entrada y valores posibles de salida.'}
"""
s=s.replace(needle,insert+needle);p.write_text(s,encoding='utf8')
p=Path('assets/js/question_resolver.js');s=p.read_text(encoding='utf8').replace("const text=this.normalize(message), matched=this.match(message);", "const text=this.normalize(message); let matched=this.match(message);\n        if(!/diferencia|compar|versus| vs /.test(text) && matched.some(k=>k.startsWith('trigonometria:')&&!['trigonometria:signos'].includes(k))) matched=matched.filter(k=>!['funciones:dominio','funciones:recorrido','trigonometria:signos'].includes(k));")
s=s.replace("        if(state.mode!=='QUESTION_MODE')state.return_stack", "        if(/dominio|recorrido|definida|definido|existe/.test(text)&&intent!=='compare')intent='domain';\n        if(/signo|positiv|negativ|cuadrante/.test(text)&&intent!=='compare')intent='signs';\n        if(state.mode!=='QUESTION_MODE')state.return_stack")
s=s.replace("            if(q.intent==='example')", "            if(['domain','signs','graph'].includes(q.intent) && card[q.intent]) parts.push(card[q.intent]);\n            else if(q.intent==='example')")
s=s.replace("        if(cards.length===2)parts.push('**Diferencia clave**\\nCompará qué datos relaciona cada definición y qué se obtiene al aplicarla. Las fórmulas de abajo corresponden a cada concepto en el mismo orden.');", """        if(cards.length===2) {
            const comparisons=window.TUTOR_CURRICULUM.question_comparisons||{};
            const contrast=comparisons[cards.map(c=>c.key).join('|')]||comparisons[[...cards].reverse().map(c=>c.key).join('|')]||'Cada definición relaciona datos diferentes. Compará sus condiciones de uso y sus fórmulas, que aparecen abajo en el mismo orden.';
            parts.push('**Diferencia clave**\\n'+contrast);
        }""")
p.write_text(s,encoding='utf8')
p=Path('services/question_resolver.php');s=p.read_text(encoding='utf8').replace("$text=self::normalize($message);$matched=self::match($message);", """$text=self::normalize($message);$matched=self::match($message);
        if(!preg_match('/diferencia|compar|versus| vs /u',$text)&&array_filter($matched,fn($k)=>str_starts_with($k,'trigonometria:')&&$k!=='trigonometria:signos'))$matched=array_values(array_filter($matched,fn($k)=>!in_array($k,['funciones:dominio','funciones:recorrido','trigonometria:signos'],true)));""")
s=s.replace("        if($state['mode']!=='QUESTION_MODE')$state['return_stack']", "        if(preg_match('/dominio|recorrido|definida|definido|existe/u',$text)&&$intent!=='compare')$intent='domain';\n        if(preg_match('/signo|positiv|negativ|cuadrante/u',$text)&&$intent!=='compare')$intent='signs';\n        if($state['mode']!=='QUESTION_MODE')$state['return_stack']")
s=s.replace("            if($q['intent']==='example')", "            if(in_array($q['intent'],['domain','signs','graph'],true)&&isset($card[$q['intent']]))$parts[]=$card[$q['intent']];\n            elseif($q['intent']==='example')")
a=s.index('        if(count($cards)===2)$parts[]=');b=s.index("        $output['tutor_message_jopara']",a)
s=s[:a]+'''        if(count($cards)===2){
            $comparisons=CurriculumService::all()['question_comparisons']??[];
            $contrast=$comparisons[implode('|',array_column($cards,'key'))]??$comparisons[implode('|',array_reverse(array_column($cards,'key')))]??'Cada definición relaciona datos diferentes. Compará sus condiciones de uso y sus fórmulas, que aparecen abajo en el mismo orden.';
            $parts[]="**Diferencia clave**\\n".$contrast;
        }
'''+s[b:];p.write_text(s,encoding='utf8')
