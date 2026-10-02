from pathlib import Path
words='y por que como para sirve se usa funciona es son eso esto ese esa lo la el los las un una de del en al con sin su sus me mas detalle detalles explica explicame explicalo explicar entendi entiendo no otro otra ejemplo ejemplos mostrame dame grafico grafica dibuja dibujalo representa representar visualmente concepto relacion paso pasos aplica utiliza positiva positivo negativas negativo negativa positivos cuadrante primero segundo tercer tercero cuarto mismo misma cuando donde cual signo dominio recorrido definida definido existe puede podes ampliar sencillo sencilla simple si'
p=Path('assets/js/question_resolver.js');s=p.read_text(encoding='utf8').replace("    static cards(){", "    static isFollowup(text) {const words=new Set('"+words+"'.split(' '));return text.split(' ').every(word=>words.has(word)||/^\\d+$/.test(word));}\n    static cards(){")
s=s.replace("const followup=previous && (", "const followup=previous && (['example','more','confused','partial'].includes(action) || (this.isFollowup(text) && (")
s=s.replace("||['example','more','confused','partial'].includes(action));", "||['example','more','confused','partial'].includes(action))));")
p.write_text(s,encoding='utf8')
p=Path('services/question_resolver.php');s=p.read_text(encoding='utf8').replace('    public static function cards():', "    public static function isFollowup(string $text): bool {\n        $words=explode(' ','"+words+"');foreach(explode(' ',$text) as $word)if(!in_array($word,$words,true)&&!preg_match('/^\\d+$/',$word))return false;return true;\n    }\n    public static function cards():")
s=s.replace("$followup=$previous&&(", "$followup=$previous&&(in_array($action,['example','more','confused','partial'],true)||(self::isFollowup($text)&&(")
s=s.replace("||in_array($action,['example','more','confused','partial'],true));", "||in_array($action,['example','more','confused','partial'],true))));")
p.write_text(s,encoding='utf8')
