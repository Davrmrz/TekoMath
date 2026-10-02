<?php
require_once __DIR__.'/natural_problem.php';
require_once __DIR__.'/workshop_expression.php';
require_once __DIR__.'/general_problem.php';
class ProblemWorkshop {
 public static function generalAnswer(string $message,string $unit): ?float {$text=preg_replace('/^(?:x\s*=|(?:mi )?(?:resultado|respuesta)(?: es)?\s*[:=]?)\s*/i','',trim($message));if(in_array($unit,['m','metros','metro'],true))return NaturalProblem::answer($text);if($unit!==''&&str_ends_with(mb_strtolower($text),mb_strtolower($unit)))$text=substr($text,0,-strlen($unit));return self::number($text);}
 public static function data(): array {return json_decode(file_get_contents(__DIR__.'/../database/problem_workshop.json'),true);}
 public static function number(string $text): ?float {$parts=explode('/',trim($text));if(count($parts)>2)return null;$a=WorkshopExpression::numeric(trim($parts[0]));$b=count($parts)===2?WorkshopExpression::numeric(trim($parts[1])):1;if($a===null||$b===null||$b==0)return null;$v=$a/$b;return is_finite($v)?$v:null;}
 public static function parse(string $message,string $topic='unsure'): ?array {
  $text=trim(strtr(mb_strtolower($message,'UTF-8'),['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ã'=>'a','ẽ'=>'e','ĩ'=>'i','õ'=>'o','ũ'=>'u','ỹ'=>'y','−'=>'-','×'=>'*','÷'=>'/']));$expression=WorkshopExpression::parse($text);if($expression)return $expression;$text=preg_replace('/(\d),(\d)/','$1.$2',$text);
  $general=GeneralProblem::parse($text,$topic);if($general)return $general;
  $natural=NaturalProblem::parse($text);if($natural)return $natural;
  foreach(self::data()['rules'] as $rule){if(!preg_match('~'.$rule['pattern'].'~u',$text,$m))continue;$expected=null;
   if($rule['id']==='linear'){$a=in_array($m[1],['','+'],true)?1:($m[1]==='-'?-1:(float)$m[1]);$b=(float)preg_replace('/\s/','',$m[2]??'0');$c=(float)$m[3];if(!$a)return null;$expected=($c-$b)/$a;}
   if($rule['id']==='arithmetic'){$a=self::number($m[1]);$b=self::number($m[3]);if($a===null||$b===null||($m[2]==='/'&&$b==0))return null;$expected=match($m[2]){'+'=>$a+$b,'-'=>$a-$b,'*'=>$a*$b,'/'=>$a/$b};}
   if($rule['id']==='hypotenuse'){$a=(float)$m[1];$b=(float)$m[2];if($a<=0||$b<=0)return null;$expected=hypot($a,$b);}
   if($expected!==null&&is_finite($expected))return ['rule'=>$rule['id'],'expected'=>$expected];
  }return null;
 }
 public static function transition(array $state,string $message,string $action): array {
  $w=&$state['workshop'];
  if($action===''){$command=QuestionResolver::normalize($message);if(preg_match('/^(siguiente(?: paso)?|continuar|jasegi)$/',$command))$action='next_step';elseif(preg_match('/^(dame una pista|una pista|pista|petei pista)$/',$command))$action='hint';elseif(preg_match('/^(otro problema|nuevo problema)$/',$command))$action='new_problem';elseif(preg_match('/^(corregir datos|cambiar datos)$/',$command))$action='edit_problem';}
  if($w['stage']==='topic'&&$action===''&&self::parse($message,'unsure')){$w=['stage'=>'statement','topic'=>'unsure'];return self::transition($state,$message,'');}
  if(in_array($action,['new_problem','change_topic'],true)){$w=['stage'=>'topic'];return $state;}
  if($w['stage']==='topic'){$normalized=QuestionResolver::normalize($message);$topic=null;$best=0;foreach(self::data()['topics'] as $t){$score=$action==='topic_'.$t['id']||QuestionResolver::normalize($t['label'])===$normalized?1000:max([0,...array_map('strlen',array_filter($t['aliases'],fn($a)=>str_contains(' '.$normalized.' ',' '.$a.' ')))]);if($score>$best){$topic=$t;$best=$score;}}
   if($topic){$pending=$w['pending_statement']??null;$w=['stage'=>'statement','topic'=>$topic['id']];if($pending){$w['stage']='clarify';$w['statement']=$pending;return self::transition($state,$pending,'');}}else $w['pending_statement']=$message;return $state;}
  if($action==='edit_problem'){$w=['stage'=>'statement','topic'=>$w['topic']??'unsure'];return $state;}
  if($w['stage']==='confirm'){if($action==='confirm_data'||preg_match('/^(si(?: son correctos)?|correcto|esta bien|confirmo|hee|oipora)$/',QuestionResolver::normalize($message)))$w['stage']=count($w['steps']??[])===1?'answer':'guidance';return $state;}
  if(in_array($w['stage'],['statement','clarify'],true)){$statement=$w['stage']==='clarify'&&isset($w['statement'])?$w['statement'].' '.$message:$message;$plan=self::parse($message,$w['topic']??'unsure')??self::parse($statement,$w['topic']??'unsure');$w=$plan?['stage'=>'confirm','topic'=>$w['topic']??'unsure','statement'=>self::parse($message,$w['topic']??'unsure')?$message:$statement,'rule'=>$plan['rule'],'step'=>0,'attempts'=>0]+(isset($plan['steps'])?array_intersect_key($plan,array_flip(['steps','hint','summary','unit','ast','answer_unit'])):[]):['stage'=>'clarify','topic'=>$w['topic']??'unsure','statement'=>$statement];return $state;}
  if(in_array($action,['hint','confused'],true)){$w['feedback']='hint';return $state;}
  if($action==='next_step'){unset($w['feedback']);$rule=(isset($w['steps'])?['steps'=>$w['steps'],'hint'=>$w['hint']]:self::rule($w['rule']));$w['step']=min($w['step']+1,count($rule['steps'])-1);if($w['step']===count($rule['steps'])-1)$w['stage']='answer';return $state;}
  if($w['stage']==='correct')return $state;
  $answer=isset($w['ast'])?self::generalAnswer($message,$w['answer_unit']??''):(isset($w['unit'])?NaturalProblem::answer($message):self::number(preg_replace('/\s*cm\s*$/i','',preg_replace('/^(?:x\s*=|(?:mi )?(?:resultado|respuesta)(?: es)?\s*[:=]?)\s*/i','',$message))));
  if($answer===null){$w['feedback']='format';return $state;}$plan=isset($w['ast'])?['expected'=>WorkshopExpression::evaluate($w['ast'])]:self::parse($w['statement'],$w['topic']??'unsure');if(!$plan){$w['stage']='clarify';return $state;}
  $w['attempts']++;$w['feedback']=abs($answer-$plan['expected'])<=($plan['tolerance']??1e-6*max(1,abs($plan['expected'])))?'correct':'incorrect';if($w['feedback']==='correct')$w['stage']='correct';return $state;
 }
 private static function topic(array $w): ?array {foreach(self::data()['topics'] as $t)if($t['id']===($w['topic']??''))return $t;return null;}
 private static function rule(string $id): array {foreach(self::data()['rules'] as $rule)if($rule['id']===$id)return $rule;throw new InvalidArgumentException('Problema no reconocido.');}
 public static function response(array $state): array {
  $w=$state['workshop'];$options=[];
  if($w['stage']==='topic'){$text=self::data()['topic_question'];$options=array_map(fn($t)=>['id'=>'topic_'.$t['id'],'label'=>$t['label']],self::data()['topics']);}
  elseif($w['stage']==='statement'){$topic=self::topic($w);$text='**'.($topic['label']??'Tu problema')."**\n\nEscribí el enunciado completo. ".($topic['prompt']??'').' Primero te mostraré los datos y la incógnita para confirmarlos.';$options=[['id'=>'change_topic','label'=>'Cambiar tema']];}
  elseif($w['stage']==='confirm'){$description=$w['rule']==='linear'?'La incógnita es x; buscamos el valor que hace verdadera la igualdad.':($w['rule']==='hypotenuse'?'Los datos son los dos catetos; buscamos la hipotenusa.':'Buscamos el resultado de la operación indicada.');$text="**Revisemos la interpretación**\n\n".($w['summary']??('Enunciado: '.$w['statement']."\n".$description))."\n\n¿Es esto lo que querés calcular?";$options=[['id'=>'confirm_data','label'=>'Sí, son correctos'],['id'=>'edit_problem','label'=>'Corregir datos'],['id'=>'change_topic','label'=>'Cambiar tema']];}
  elseif($w['stage']==='clarify'){$topic=self::topic($w);preg_match_all('/[+-]?\d+(?:[.,]\d+)?\s*(?:°|grados|cm|metros|m|%|km)?/u',$w['statement']??'',$quantities);$text='Tema: '.($topic['label']??'Por identificar').".\n".($quantities[0]?'Cantidades detectadas (falta asignarles su significado): '.implode('; ',$quantities[0]).".\n":'').(NaturalProblem::clarification(QuestionResolver::normalize($w['statement']??''))??(($topic['prompt']??'')."\n\n".self::data()['unknown']));$options=[['id'=>'edit_problem','label'=>'Corregir datos'],['id'=>'change_topic','label'=>'Cambiar tema']];}
  elseif($w['stage']==='correct'){$text='¡Correcto! Tu resultado coincide con la comprobación del problema. Terminaste este ejercicio; podés comenzar otro.';$options=[['id'=>'new_problem','label'=>'Otro problema']];}
  else {$rule=(isset($w['steps'])?['steps'=>$w['steps'],'hint'=>$w['hint']]:self::rule($w['rule']));$text='**Paso '.($w['step']+1).' de '.count($rule['steps'])."**\n\n".$rule['steps'][$w['step']];$feedback=$w['feedback']??'';
   if($feedback==='incorrect')$text="Todavía no es correcto. Revisá tu cálculo y volvé a intentarlo.\n\n".$rule['steps'][$w['step']];elseif($feedback==='hint')$text=$rule['steps'][$w['step']];elseif($feedback==='format')$text='Escribí un único resultado numérico, una fracción o x = tu valor. No puedo calificar una explicación como si fuera un resultado. Si necesitás ayuda, pedí una pista.';
   $text.="\n\n".($w['stage']==='answer'?(isset($w['unit'])?'Enviá tu resultado en '.$w['unit'].'; se acepta redondeo a dos decimales. ':''):'').($w['stage']==='answer'?'Escribí tu resultado.':'Podés continuar o enviar tu resultado.');
   if($w['stage']!=='answer')$options[]=['id'=>'next_step','label'=>'Siguiente paso'];$options[]=['id'=>'hint','label'=>'Una pista'];$options[]=['id'=>'edit_problem','label'=>'Corregir datos'];$options[]=['id'=>'new_problem','label'=>'Otro problema'];
  }
  return TutorLanguage::response(['tutor_message_jopara'=>$text,'formula_display'=>['latex'=>'','note'=>'Problema guiado · resultado reservado para vos'],'visual_action'=>['type'=>'none'],'quick_options'=>$options],$state);
 }
}
