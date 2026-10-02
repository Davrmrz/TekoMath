<?php
class NaturalProblem {
 public static function clarification(string $text): ?string {
  if(!preg_match('/elevacion|sombra|escalera/u',$text))return null;
  $angle=preg_match('/\d+(?:\.\d+)?\s*(?:°|grados)/u',$text);$length=preg_match('/\d+(?:\.\d+)?\s*(?:metros?|m|cm|km)\b/u',$text);
  if(!$angle)return 'Falta el ángulo en grados. ¿Cuánto mide?';
  if(!$length)return 'Falta una longitud. Indicá si es distancia horizontal, sombra, altura o escalera, con su unidad.';
  return 'Ya tengo una longitud y un ángulo. ¿Qué buscás: altura, distancia horizontal o longitud de la escalera? Si hay altura del observador o suelo inclinado, aclaralo.';
 }
 public static function parse(string $text): ?array {
  $config=ProblemWorkshop::data()['natural'];foreach($config['number_words'] as $word=>$value)$text=preg_replace('/\b'.$word.'\b/u',(string)$value,$text);
  if(preg_match('/inclinad|pendiente|altura de los ojos|altura del observador|radian|dos arbol|dos edificio|-\s*\d/u',$text))return null;
  preg_match_all('/(\d+(?:\.\d+)?)\s*(?:°|grados)/u',$text,$angles,PREG_SET_ORDER);preg_match_all('/(\d+(?:\.\d+)?)\s*(kilometros?|km|centimetros?|cm|metros?|m)\b/u',$text,$lengths,PREG_SET_ORDER);
  if(count($angles)!==1||count($lengths)!==1)return null;$angle=(float)$angles[0][1];$raw=(float)$lengths[0][1];$unit=$lengths[0][2];$length=$raw*(str_starts_with($unit,'k')?1000:(str_starts_with($unit,'c')?.01:1));if($angle<=0||$angle>=90||$length<=0)return null;
  $height=preg_match('/altura|alto|parte mas alta|cima|cuanto mide (?:el|un|la|una) (?:arbol|edificio|torre|poste|pared)/u',$text);$distance=preg_match('/(?:cuanto|cual|calcula|hallar|determina|calcular)[^?.]*(?:distancia|longitud de la sombra|mide la sombra)/u',$text);$id=null;
  if(str_contains($text,'sombra')&&$height&&!$distance)$id='shadow_height';
  elseif(str_contains($text,'elevacion')&&preg_match('/distancia|separad|alejad|de la base|a la base/u',$text)&&$height&&!$distance)$id='elevation_height';
  elseif(str_contains($text,'elevacion')&&$distance&&preg_match('/altura|alto|mide/u',$text))$id='elevation_distance';
  elseif(str_contains($text,'escalera')&&$height&&preg_match('/suelo|horizontal/u',$text))$id='ladder_height';
  if(!$id)return null;$rule=null;foreach($config['rules'] as $r)if($r['id']===$id)$rule=$r;
  $f=$id==='ladder_height'?sin(deg2rad($angle)):tan(deg2rad($angle));$expected=$id==='elevation_distance'?$length/$f:$length*$f;
  $replace=fn($s)=>str_replace(['{length}','{angle}'],[(string)$length,(string)$angle],$s);
  return ['rule'=>$id,'expected'=>$expected,'tolerance'=>.005000001,'steps'=>array_map($replace,$rule['steps']),'hint'=>$rule['hint'],'unit'=>'m','summary'=>$replace($rule['summary'])];
 }
 public static function answer(string $message): ?float {
  $text=preg_replace('/^(?:el arbol mide|la altura es|mide|es|mi respuesta es|el resultado es)\s*/u','',trim(mb_strtolower($message)));$factor=1;
  if(preg_match('/\s*(metros?|m|centimetros?|cm|kilometros?|km)\s*$/u',$text,$m,PREG_OFFSET_CAPTURE)){$unit=$m[1][0];$factor=str_starts_with($unit,'c')?.01:(str_starts_with($unit,'k')?1000:1);$text=substr($text,0,$m[0][1]);}$value=ProblemWorkshop::number($text);return $value===null?null:$value*$factor;
 }
}
