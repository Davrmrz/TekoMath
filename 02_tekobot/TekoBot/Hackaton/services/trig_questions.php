<?php
class TrigQuestions {
 public static function transition(array &$state,string $message,string $action): bool {
  if(isset($state['own_problem'])||$action==='own_problem'){unset($state['numeric_query']);return false;}
  $text=strtr(mb_strtolower($message),['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','−'=>'-']);$aliases=['seno'=>'sin','sen'=>'sin','sin'=>'sin','coseno'=>'cos','cos'=>'cos','tangente'=>'tan','tan'=>'tan','tg'=>'tan','cotangente'=>'cot','cot'=>'cot','secante'=>'sec','sec'=>'sec','cosecante'=>'csc','csc'=>'csc'];
  if(isset($state['numeric_query'])&&$action===''&&preg_match('/^(?:y\s+)?(?:de\s+|para\s+)?(-?\d+(?:[.,]\d+)?)\s*(°|grados|radianes|rad)?[?¿\s]*$/u',$text,$f)){$state['numeric_query']=array_merge($state['numeric_query'],['input'=>(float)str_replace(',','.',$f[1]),'radians'=>!empty($f[2])?in_array($f[2],['radianes','rad'],true):$state['numeric_query']['radians'],'implicit'=>false,'simple'=>false]);return true;}
  preg_match_all('/\b(cosecante|cotangente|secante|tangente|coseno|seno|sen|sin|cos|tan|tg|cot|sec|csc)\s*(?:de\s*)?\(?\s*(-?\d+(?:[.,]\d+)?)\s*(°|grados|radianes|rad)?\s*\)?/u',$text,$matches,PREG_SET_ORDER);
  if(count($matches)===1&&!preg_match('~[+*/=]~',$text)&&!isset($state['workshop'])){$m=$matches[0];$state['numeric_query']=['kind'=>$aliases[$m[1]],'input'=>(float)str_replace(',','.',$m[2]),'radians'=>in_array($m[3]??'',['radianes','rad'],true),'implicit'=>empty($m[3]),'simple'=>false];return true;}
  if(isset($state['numeric_query'])&&(preg_match('/no entendi|no entiendo|mas facil|por que|mba.?ere/u',$text)||in_array($action,['confused','hint','more'],true))){$state['numeric_query']['simple']=true;return true;}
  unset($state['numeric_query']);return false;
 }
 public static function response(array $state): array {
  $q=$state['numeric_query'];$r=$q['radians']?$q['input']:deg2rad($q['input']);$s=sin($r);$c=cos($r);$kind=$q['kind'];$names=['sin'=>'sen','cos'=>'cos','tan'=>'tan','cot'=>'cot','sec'=>'sec','csc'=>'csc'];
  $bad=in_array($kind,['tan','sec'],true)?abs($c)<1e-10:(in_array($kind,['cot','csc'],true)?abs($s)<1e-10:false);
  $v=$bad?0:match($kind){'sin'=>$s,'cos'=>$c,'tan'=>$s/$c,'cot'=>$c/$s,'sec'=>1/$c,'csc'=>1/$s};if(abs($v)<1e-10)$v=0;if(abs($v-1)<1e-10)$v=1;if(abs($v+1)<1e-10)$v=-1;
  $value=$bad?'no está definida':(string)round($v,6);$angle=$q['input'].($q['radians']?' rad':'°');$rel=$bad?'':(abs($v-round($v))<1e-10?' = ':' ≈ ');$first=$bad?"{$names[$kind]}({$angle}) no está definida.":"{$names[$kind]}({$angle}){$rel}{$value}.";
  $why=['sin'=>'El seno es la altura del punto en la circunferencia de radio uno. En 90°, el punto está arriba de todo: su altura es 1.','cos'=>'El coseno es la coordenada horizontal del punto en la circunferencia de radio uno.','tan'=>'La tangente divide el seno por el coseno. Si el coseno es cero, esa división no está definida.','cot'=>'La cotangente divide el coseno por el seno. Si el seno es cero, esa división no está definida.','sec'=>'La secante es uno dividido por el coseno. El denominador no puede ser cero.','csc'=>'La cosecante es uno dividido por el seno. El denominador no puede ser cero.'];
  $explanation=$why[$kind];if($kind==='sin'&&abs($r-M_PI/2)>1e-10)$explanation='El seno es la altura del punto en la circunferencia de radio uno. Buscamos esa coordenada vertical para el ángulo indicado.';
  $text=($q['simple']?"Vamos con una sola idea.\n\n":'').$first."\n\n".$explanation.($q['implicit']?"\n\nTomé el ángulo en grados. Si te referías a radianes, indicámelo.":'');$symbol=$kind==='sin'?'sin':$names[$kind];
  return TutorLanguage::response(['tutor_message_jopara'=>$text,'formula_display'=>['latex'=>$bad?'':'\\'.$symbol.'('.$q['input'].($q['radians']?'':'^\\circ').')'.(str_contains($rel,'≈')?'\\approx':'=').$value,'note'=>'Consulta del ángulo indicado'],'visual_action'=>['type'=>'function_graph','funcType'=>$kind,'angle_deg'=>$q['radians']?rad2deg($q['input']):$q['input']],'quick_options'=>[['id'=>'confused','label'=>'Explicámelo más fácil'],['id'=>'resume','label'=>'Retomar donde estábamos']]],$state);
 }
}
