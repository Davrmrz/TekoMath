<?php
require_once __DIR__.'/language_service.php';
require_once __DIR__.'/curriculum_service.php';
class QuestionResolver {
    public static function normalize(string $text): string {
        $text=strtr(mb_strtolower($text,'UTF-8'),['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ü'=>'u','ñ'=>'n']);
        $text=preg_replace('/[¿?¡!.,;:()"“”]/u',' ',$text);
        $text=preg_replace('/\b(?:pq|xq)\b/u','por que',$text);
        $text=preg_replace('/\bq\b/u','que',$text);
        return trim(preg_replace('/\s+/u',' ',$text));
    }
    public static function isFollowup(string $text): bool {
        $words=explode(' ','y por que como para sirve se usa funciona es son eso esto ese esa esta este lo la el los las un una de del en al con sin su sus me mas detalle detalles explica explicame explicalo explicamelo explicar explicas explicarme entendi entiendo entendiendo quedo claro otra manera forma nuevo mejor explicacion facil breve corto resumen pocas palabras sencillo sencilla simple otro otra ejemplo ejemplos mostrame muestrame dame das dar podes puedes podrias grafico grafica dibuja dibujalo representa representar visualmente concepto relacion paso pasos aplica utiliza positiva positivo negativas negativo negativa positivos cuadrante primero segundo tercer tercero cuarto mismo misma cuando donde cual signo dominio recorrido rango definida definido existe puede ampliar si no porfa favor nomas entonces');
        foreach(explode(' ',$text) as $word)if(!in_array($word,$words,true)&&!preg_match('/^\d+$/',$word))return false;
        return true;
    }
    public static function intent(string $text,string $action): string {
        if(preg_match('/diferencia|compar|versus|\bvs\b/u',$text))return 'compare';
        if(preg_match('/dominio/u',$text)&&preg_match('/recorrido|rango/u',$text))return 'domain_range';
        if(preg_match('/recorrido|rango|valores.*salida/u',$text))return 'range';
        if(preg_match('/dominio|definida|definido|existe/u',$text))return 'domain';
        if(preg_match('/signo|positiv|negativ|cuadrante/u',$text))return 'signs';
        if(preg_match('/ejemplo/u',$text)||$action==='example')return 'example';
        if(preg_match('/por que(?: |$)/u',$text))return 'why';
        if(preg_match('/para que|sirve|aplica|utiliza/u',$text))return 'usage';
        if(preg_match('/graf|dibuj|represent.*visual/u',$text))return 'graph';
        if(preg_match('/no ent|no me quedo claro|facil|sencill|simple|resum|breve|corto|pocas palabras|otra manera|otra forma|explica\w* mejor|mejor explicacion/u',$text)||in_array($action,['confused','partial'],true))return 'simple';
        if(preg_match('/mas |detalle|explica/u',$text)||$action==='more')return 'detail';
        return 'definition';
    }
    public static function higherTopic(string $message): ?array {
        $text=' '.preg_replace('/formulas trigonometricas (?:fundamentales y )?derivadas/u','identidades trigonometricas',self::normalize($message)).' ';
        foreach(CurriculumService::all()['advanced_topics']??[] as $topic)foreach($topic['aliases'] as $alias)if(str_contains($text,' '.self::normalize($alias).' '))return $topic;
        return null;
    }
    public static function scopeResponse(array $state): array {
        return ['tutor_message_jopara'=>CurriculumService::all()['glossary_policy']['notice'],
            'formula_display'=>['latex'=>'','note'=>'Fuera del alcance de primer curso · '.$state['scope_query']['title']],
            'visual_action'=>['type'=>'none'],'quick_options'=>[],'scope'=>'higher_course','source_ids'=>[$state['scope_query']['source_id']]];
    }
    public static function cards(): array {return CurriculumService::all()['question_bank'] ?? [];}
    public static function match(string $message): array {
        $text=' '.self::normalize($message).' ';$hits=[];
        foreach(self::cards() as $card)foreach($card['aliases'] as $raw){
            $alias=' '.self::normalize($raw).' ';$start=mb_strpos($text,$alias);
            if($start!==false)$hits[]=['key'=>$card['key'],'start'=>$start,'end'=>$start+mb_strlen($alias)-1,'length'=>mb_strlen($alias)];
        }
        usort($hits,fn($a,$b)=>($b['length']<=>$a['length'])?:((int)str_starts_with($b['key'],'glossary:')<=>(int)str_starts_with($a['key'],'glossary:')));$chosen=[];
        foreach($hits as $hit){$overlap=false;foreach($chosen as $x)if($x['key']===$hit['key']||($hit['start']<$x['end']&&$hit['end']>$x['start']))$overlap=true;if(!$overlap)$chosen[]=$hit;}
        usort($chosen,fn($a,$b)=>$a['start']<=>$b['start']);$result=array_column($chosen,'key');
        return count($result)>1?array_values(array_filter($result,fn($k)=>$k!=='funciones:concepto')):$result;
    }
    public static function transition(array $state,string $message,string $action): ?array {
        if($action==='resume')return null;
        if($action!==''&&!in_array($action,['example','more','confused','partial'],true))return null;
        $text=self::normalize($message);$intent=self::intent($text,$action);
        $previous=$state['mode']==='QUESTION_MODE'?($state['question_context']??null):null;
        $matched=self::match($message);
        $facets=['funciones:dominio','funciones:recorrido','trigonometria:signos'];
        $focused=in_array($intent,['domain','range','domain_range','signs','graph'],true);
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
        if(!$keys&&!$previous&&$referential&&in_array($state['mode'],['TEACHING_MODE','EXAMPLE_MODE','CHECK_UNDERSTANDING','READY_CHECK'],true)){
            $current=$state['topic'].':'.$state['subtopic'];
            if(array_filter(self::cards(),fn($card)=>$card['key']===$current))$keys=[$current];
        }
        if($keys&&!array_diff($keys,$facets)&&!$followup)$chosenIntent='definition';
        if(($previous['intent']??'')==='compare'&&count($previous['keys'])===1&&count($matched)===1&&$previous['keys'][0]!==$matched[0]){$keys=[$previous['keys'][0],$matched[0]];$chosenIntent='compare';}
        if($state['mode']!=='QUESTION_MODE')$state['return_stack'][]=['mode'=>$state['mode'],'lesson'=>$state['lesson'],'active_exercise_id'=>$state['active_exercise_id']];
        $state['mode']='QUESTION_MODE';$state['question_pending']=false;$state['feedback']=null;
        $same=$previous&&$previous['keys']===$keys;
        $state['question_context']=['keys'=>$keys,'intent'=>$chosenIntent,'message'=>$message,'example_index'=>$chosenIntent==='example'&&$same&&$previous['intent']==='example'?$previous['example_index']+1:0];
        return $state;
    }
    public static function response(array $state): array {
        return TutorLanguage::response(self::rawResponse($state),$state);
    }
    private static function rawResponse(array $state): array {
        $q=$state['question_context']??['keys'=>[],'intent'=>'definition'];$cards=[];
        foreach($q['keys'] as $key)foreach(self::cards() as $card)if($card['key']===$key)$cards[]=$card;
        $output=['formula_display'=>['latex'=>'','note'=>'Consulta puntual · La lección conserva su lugar'],'visual_action'=>['type'=>'none'],'quick_options'=>[['id'=>$q['intent']==='example'?'more':'example','label'=>$q['intent']==='example'?'Explicá con más detalle':'Dame un ejemplo'],['id'=>'confused','label'=>'Explicámelo más fácil'],['id'=>'resume','label'=>'Retomar donde estábamos']]];
        if(!$cards||count($cards)>2||($q['intent']==='compare'&&count($cards)<2)){
            $output['tutor_message_jopara']=count($cards)===1?"¿Con qué concepto querés comparar **{$cards[0]['title']}**? Escribí los dos nombres para que pueda explicar sus diferencias.":'No identifiqué con suficiente precisión el concepto de tu pregunta. ¿Podés nombrarlo o escribir la parte que querés entender? Por ejemplo: «qué es tangente», «diferencia entre seno y coseno» o «qué es dominio». Conservé el punto de tu lección.';
            $output['quick_options']=[['id'=>'resume','label'=>'Retomar donde estábamos']];return $output;
        }
        $focused=in_array($q['intent'],['domain','range','domain_range','signs','graph'],true);
        if($focused&&array_filter($cards,fn($card)=>$q['intent']==='domain_range'?(empty($card['domain'])||empty($card['range'])):empty($card[$q['intent']]))){
            $labels=['domain_range'=>'el dominio y el recorrido','domain'=>'el dominio','range'=>'el recorrido','signs'=>'los signos','graph'=>'la gráfica'];
            $output['tutor_message_jopara']='Identifiqué **'.implode(' y ',array_column($cards,'title')).'**, pero no tengo una explicación específica de '.$labels[$q['intent']].' para esa consulta. Escribí la función o indicá qué parte querés revisar.';
            return $output;
        }
        $parts=[];
        foreach($cards as $card){
            $parts[]="**{$card['title']}**";
            if($q['intent']==='domain_range')array_push($parts,"**Dominio**\n{$card['domain']}","**Recorrido**\n{$card['range']}");
            elseif($focused&&isset($card[$q['intent']]))$parts[]=$card[$q['intent']];
            elseif($q['intent']==='simple')$parts[]=$card['simple']??$card['definition'];
            elseif($q['intent']==='example')array_push($parts,'**Ejemplo docente, paso a paso**',$card['definition'],$q['example_index']%2?$card['example_alt']:$card['example'],"**Por qué se usa esta relación**\n".($card['why']??$card['detail']));
            elseif($q['intent']==='detail')array_push($parts,$card['definition'],$card['detail'],$card['why']??$card['example'],$card['usage']??'Volvé a leer la definición e identificá qué datos se relacionan. En el ejemplo, comprobá qué representa cada cantidad antes de operar.');
            elseif($q['intent']==='why')$parts[]=$card['why']??"La relación se entiende a partir de esta idea: {$card['definition']}\n\n{$card['detail']}";
            elseif($q['intent']==='usage')array_push($parts,$card['usage']??"{$card['definition']}\n\n{$card['detail']}","**Ejemplo de aplicación**\n{$card['example']}");
            elseif($q['intent']==='compare'||count($cards)===2)array_push($parts,$card['definition'],$card['detail']);
            else $parts[]=$card['definition'];
            if(isset($card['warning'])&&in_array($q['intent'],['detail','example'],true))$parts[]="**Qué conviene revisar**\n{$card['warning']}";
        }
        if(count($cards)===2){
            $comparisons=CurriculumService::all()['question_comparisons']??[];
            $contrast=$comparisons[implode('|',array_column($cards,'key'))]??$comparisons[implode('|',array_reverse(array_column($cards,'key')))]??'Cada definición relaciona datos diferentes. Compará sus condiciones de uso y sus fórmulas, que aparecen abajo en el mismo orden.';
            $parts[]="**Diferencia clave**\n".$contrast;
        }
        $output['source_ids']=array_values(array_unique(array_merge(...array_map(fn($card)=>$card['source_ids']??[],$cards))));
        $output['tutor_message_jopara']=implode("\n\n",array_unique($parts));
        $output['formula_display']=['latex'=>implode('\\qquad ',array_filter(array_column($cards,'formula'))),'note'=>implode(' · ',array_column($cards,'title'))];
        if(count($cards)===1)$output['visual_action']=$cards[0]['visual'];
        return $output;
    }
}
