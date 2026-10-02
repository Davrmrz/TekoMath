from pathlib import Path
p=Path('services/question_resolver.php');s=p.read_text(encoding='utf8')
a=s.index('    public static function normalize');b=s.index('    public static function cards',a)
js=Path('assets/js/question_resolver.js').read_text(encoding='utf8');words=js.split("const words=new Set('")[1].split("'.split")[0]
s=s[:a]+'''    public static function normalize(string $text): string {
        $text=strtr(mb_strtolower($text,'UTF-8'),['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ü'=>'u','ñ'=>'n']);
        $text=preg_replace('/[¿?¡!.,;:()"“”]/u',' ',$text);
        $text=preg_replace('/\\b(?:pq|xq)\\b/u','por que',$text);
        $text=preg_replace('/\\bq\\b/u','que',$text);
        return trim(preg_replace('/\\s+/u',' ',$text));
    }
    public static function isFollowup(string $text): bool {
        $words=explode(' ','WORDS');
        foreach(explode(' ',$text) as $word)if(!in_array($word,$words,true)&&!preg_match('/^\\d+$/',$word))return false;
        return true;
    }
    public static function intent(string $text,string $action): string {
        if(preg_match('/diferencia|compar|versus|\\bvs\\b/u',$text))return 'compare';
        if(preg_match('/recorrido|rango|valores.*salida/u',$text))return 'range';
        if(preg_match('/dominio|definida|definido|existe/u',$text))return 'domain';
        if(preg_match('/signo|positiv|negativ|cuadrante/u',$text))return 'signs';
        if(preg_match('/ejemplo/u',$text)||$action==='example')return 'example';
        if(preg_match('/por que(?: |$)/u',$text))return 'why';
        if(preg_match('/para que|sirve|aplica|utiliza/u',$text))return 'usage';
        if(preg_match('/graf|dibuj|represent.*visual/u',$text))return 'graph';
        if(preg_match('/no ent|no me quedo claro|facil|sencill|simple|resum|breve|corto|pocas palabras|otra manera|otra forma/u',$text)||in_array($action,['confused','partial'],true))return 'simple';
        if(preg_match('/mas |detalle|explica/u',$text)||$action==='more')return 'detail';
        return 'definition';
    }
'''.replace('WORDS',words)+s[b:]
a=s.index('    public static function transition(');b=s.index('    public static function response(',a)
s=s[:a]+'''    public static function transition(array $state,string $message,string $action): ?array {
        if($action==='resume')return null;
        if($action!==''&&!in_array($action,['example','more','confused','partial'],true))return null;
        $text=self::normalize($message);$intent=self::intent($text,$action);
        $previous=$state['mode']==='QUESTION_MODE'?($state['question_context']??null):null;
        $matched=self::match($message);
        $facets=['funciones:dominio','funciones:recorrido','trigonometria:signos'];
        $focused=in_array($intent,['domain','range','signs','graph'],true);
        $concrete=array_values(array_diff($matched,$facets));
        if($intent!=='compare'&&$concrete)$matched=$concrete;
        $explicitQuestion=preg_match('/[¿?]/u',$message)||preg_match('/^(que|como|por que|cual|para que|explica|hablame|contame|decime|dime|mostrame|muestrame|dame|me |puedes|podes|podrias|no ent|no me quedo)/u',$text);
        if($state['mode']==='PRACTICE_MODE'&&!$explicitQuestion)return null;
        $referential=self::isFollowup($text)&&preg_match('/^(y |por que|como|para que|no |mas |otra |otro |un ejemplo|dame|mostrame|muestrame|explica|si |eso|en que|ver |graf|me |puedes|podes|podrias|cual|resum)/u',$text);
        $followup=$previous&&(in_array($action,['example','more','confused','partial'],true)||$referential);
        if(!$matched&&!$previous&&$action!=='')return null;
        if(!$matched&&$state['mode']==='TOPIC_SELECTED'&&in_array($text,['explicame','explica','ensename'],true))return null;
        if(!$matched&&!$followup&&!$explicitQuestion&&$state['mode']!=='QUESTION_MODE')return null;
        if(!empty($previous['keys'])&&$focused&&!$concrete&&$referential)$matched=[];
        $keys=$matched?:($followup?($previous['keys']??[]):[]);$chosenIntent=$intent;
        if(($previous['intent']??'')==='compare'&&count($previous['keys'])===1&&count($matched)===1&&$previous['keys'][0]!==$matched[0]){$keys=[$previous['keys'][0],$matched[0]];$chosenIntent='compare';}
        if($state['mode']!=='QUESTION_MODE')$state['return_stack'][]=['mode'=>$state['mode'],'lesson'=>$state['lesson'],'active_exercise_id'=>$state['active_exercise_id']];
        $state['mode']='QUESTION_MODE';$state['question_pending']=false;$state['feedback']=null;
        $same=$previous&&$previous['keys']===$keys;
        $state['question_context']=['keys'=>$keys,'intent'=>$chosenIntent,'message'=>$message,'example_index'=>$chosenIntent==='example'&&$same&&$previous['intent']==='example'?$previous['example_index']+1:0];
        return $state;
    }
''' +s[b:]
s=s.replace("$q=$state['question_context'];", "$q=$state['question_context']??['keys'=>[],'intent'=>'definition'];")
s=s.replace("[['id'=>'example','label'=>'Dame un ejemplo'],['id'=>'more','label'=>'Explicá con más detalle'],['id'=>'resume','label'=>'Retomar donde estábamos']]", "[['id'=>$q['intent']==='example'?'more':'example','label'=>$q['intent']==='example'?'Explicá con más detalle':'Dame un ejemplo'],['id'=>'confused','label'=>'Explicámelo más fácil'],['id'=>'resume','label'=>'Retomar donde estábamos']]")
s=s.replace("        $parts=[];", """        $focused=in_array($q['intent'],['domain','range','signs','graph'],true);
        if($focused&&array_filter($cards,fn($card)=>empty($card[$q['intent']]))){
            $labels=['domain'=>'el dominio','range'=>'el recorrido','signs'=>'los signos','graph'=>'la gráfica'];
            $output['tutor_message_jopara']='Identifiqué **'.implode(' y ',array_column($cards,'title')).'**, pero no tengo una explicación específica de '.$labels[$q['intent']].' para esa consulta. Escribí la función o indicá qué parte querés revisar.';
            return $output;
        }
        $parts=[];""")
s=s.replace("if(in_array($q['intent'],['domain','signs','graph'],true)&&isset($card[$q['intent']]))", "if($focused&&isset($card[$q['intent']]))")
s=s.replace("elseif($q['intent']==='example')", "elseif($q['intent']==='simple')$parts[]=$card['simple']??$card['definition'];\n            elseif($q['intent']==='example')",1)
s=s.replace('else array_push($parts,$card[\'definition\'],"**Cómo entenderlo**\\n{$card[\'detail\']}");',"else $parts[]=$card['definition'];")
s=s.replace("if(isset($card['warning']))", "if(isset($card['warning'])&&in_array($q['intent'],['detail','example'],true))")
p.write_text(s,encoding='utf8')
p=Path('assets/js/question_resolver.js');s=p.read_text(encoding='utf8').replace('Explicá por qué funciona','Explicá con más detalle');p.write_text(s,encoding='utf8')
# Never resurrect the legacy generic explanation for a question without retrieval context.
p=Path('assets/js/lesson_engine.js');s=p.read_text(encoding='utf8').replace("state.mode==='QUESTION_MODE' && !state.question_pending && state.question_context", "state.mode==='QUESTION_MODE' && !state.question_pending");p.write_text(s,encoding='utf8')
p=Path('services/pedagogy_service.php');s=p.read_text(encoding='utf8').replace("$state['mode']==='QUESTION_MODE' && !($state['question_pending']??false) && isset($state['question_context'])", "$state['mode']==='QUESTION_MODE' && !($state['question_pending']??false)");p.write_text(s,encoding='utf8')
