from pathlib import Path
p=Path('scripts/build_question_bank.py');s=p.read_text(encoding='utf8');marker="d['question_bank']=cards"
block='''# Focused answers are separate from definitions: do not answer a range query with a domain.
focused = {
 'trigonometria:tangente': {
  'simple':'Imaginá una rampa. Para un mismo ángulo, la tangente compara lo que subís con lo que avanzás horizontalmente: altura dividida por avance. En el triángulo rectángulo, eso es cateto opuesto dividido por cateto adyacente.',
  'range':'El recorrido de la tangente es todo R: puede tomar cualquier valor real. Cada rama pasa por todos esos valores; las asíntotas no pertenecen a la gráfica.',
 },
 'trigonometria:seno': {'simple':'El seno compara el cateto opuesto al ángulo con la hipotenusa. En la circunferencia unitaria, pensalo como la altura del punto.','range':'El recorrido del seno es [−1, 1], incluidos ambos extremos. En la circunferencia unitaria, la altura nunca supera el radio en valor absoluto.'},
 'trigonometria:coseno': {'simple':'El coseno compara el cateto adyacente al ángulo con la hipotenusa. En la circunferencia unitaria, indica la posición horizontal del punto.','range':'El recorrido del coseno es [−1, 1], incluidos ambos extremos. La coordenada horizontal de la circunferencia unitaria queda entre esos valores.'},
 'trigonometria:arcseno': {'domain':'El dominio de arcsen es [−1, 1]. Su entrada es una razón, no un ángulo.','range':'El recorrido principal de arcsen es [−π/2, π/2], o [−90°, 90°], incluidos los extremos.'},
 'trigonometria:arccoseno': {'domain':'El dominio de arccos es [−1, 1]. Su entrada es una razón, no un ángulo.','range':'El recorrido principal de arccos es [0, π], o [0°, 180°], incluidos los extremos.'},
 'trigonometria:arctangente': {'domain':'El dominio de arctan es todo R: admite cualquier razón real como entrada.','range':'El recorrido principal de arctan es (−π/2, π/2), o (−90°, 90°), sin incluir los extremos.'},
 'funciones:lineal': {'domain':'Una función lineal f(x)=mx+b está definida para todo x real, salvo restricciones adicionales del contexto.','range':'Si la pendiente m no es cero, el recorrido de f(x)=mx+b es todo R. Si m=0, es constante y su recorrido es solo {b}.'},
 'funciones:constante': {'domain':'La expresión f(x)=k admite todo x real; el enunciado puede restringir ese dominio.','range':'El recorrido de una función constante f(x)=k es {k}: todas las entradas admitidas producen la misma salida.'},
 'funciones:exponencial': {'domain':'La función exponencial básica f(x)=a^x, con a>0 y a≠1, tiene dominio R.','range':'La exponencial básica f(x)=a^x tiene recorrido (0, +∞): siempre es positiva y nunca alcanza cero. Los desplazamientos o factores de otra expresión pueden cambiar ese recorrido.'},
 'funciones:logaritmica': {'domain':'En la función básica f(x)=log_a(x), con a>0 y a≠1, el dominio es (0, +∞). Si el argumento es otra expresión, esa expresión debe ser positiva.','range':'La función logarítmica básica tiene recorrido R: sus salidas pueden ser positivas, negativas o cero.'},
 'funciones:modulo': {'domain':'La función básica f(x)=|x| tiene dominio R.','range':'El recorrido de f(x)=|x| es [0, +∞): un valor absoluto nunca es negativo.'},
 'funciones:parte_entera': {'domain':'La función parte entera f(x)=⌊x⌋ tiene dominio R.','range':'El recorrido de la parte entera es Z, el conjunto de números enteros. Aunque la entrada sea decimal, la salida siempre es un entero.'},
 'geometria:pendiente': {'simple':'La pendiente compara cuánto sube o baja una recta con cuánto avanzás hacia la derecha. Si sube es positiva; si baja es negativa. Una recta vertical no tiene pendiente real definida.'},
}
for card in cards:
 card.update(focused.get(card['key'], {}))
 # Explicit, bounded spelling variants; never fuzzy-match arbitrary user words.
 if card['key']=='trigonometria:tangente':card['aliases']+=['tanjente','tangete']
 if card['key']=='trigonometria:coseno':card['aliases']+=['coseno trigonometrico']

'''
s=s.replace(marker,block+marker);p.write_text(s,encoding='utf8')
# Broaden conceptual-question protection without treating calculation requests as definitions.
p=Path('assets/js/problem_guide.js');s=p.read_text(encoding='utf8');a=s.index('        if(!action &&');b=s.index('\n        return action',a)
s=s[:a]+"        if(!action && /(?:^| )(?:por que|que (?:es|significa)|cual es (?:el dominio|el signo|el recorrido|su dominio|su recorrido)|como (?:se define|funciona)|para que sirve)(?: |$)/u.test(QuestionResolver.normalize(message)))return false;"+s[b:];p.write_text(s,encoding='utf8')
p=Path('services/problem_guide.php');s=p.read_text(encoding='utf8');a=s.index('        $conceptQuestion=');b=s.index('\n        if ($action',a)
s=s[:a]+"        $conceptQuestion=preg_match('/(?:^| )(?:por que|que (?:es|significa)|cual es (?:el dominio|el signo|el recorrido|su dominio|su recorrido)|como (?:se define|funciona)|para que sirve)(?: |$)/u',QuestionResolver::normalize($message));"+s[b:];p.write_text(s,encoding='utf8')
