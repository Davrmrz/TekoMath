<?php
class GeneralProblem {
 public static function parse(string $text,string $topic='unsure'): ?array {
  preg_match_all('/\d+(?:\.\d+)?/u',$text,$matches);$nums=array_map('floatval',$matches[0]);if(count($nums)>12||preg_match('/-\s*\d|descuento.*aumento|aumento.*descuento/u',$text))return null;
  $v=fn($value)=>['value'=>$value];$op=fn($name,...$args)=>['op'=>$name,'args'=>$args];$ast=null;$unit='';$steps=[];
  if(in_array($topic,['arithmetic','unsure'],true)&&count($nums)===2&&preg_match('/(?:cuanto es|calcula|hallar|calcular).*%\s*de/u',$text)){
    $ast=$op('div',$op('mul',$v($nums[0]),$v($nums[1])),$v(100));$summary="Porcentaje: {$nums[0]} %. Cantidad base: {$nums[1]}. Incógnita: la parte correspondiente a ese porcentaje.";$method='Un porcentaje representa una cantidad por cada cien. Multiplicamos la base por el porcentaje y dividimos entre cien.';
    $steps=["Un porcentaje representa una cantidad por cada cien. Para calcular el {$nums[0]} % de {$nums[1]}, relacionamos la base y el porcentaje: ({$nums[0]} · {$nums[1]}) / 100.","Realizá las operaciones indicadas y enviá tu resultado final."];
  }
  elseif(in_array($topic,['statistics','unsure'],true)&&count($nums)>=2&&preg_match('/promedio|media aritmetica/u',$text)&&!preg_match('/frecuencia|ponderad|peso/u',$text)){
    $sum=$v($nums[0]);foreach(array_slice($nums,1) as $n)$sum=$op('add',$sum,$v($n));$cnt=count($nums);$ast=$op('div',$sum,$v($cnt));
    $summary='Datos de la lista: '.implode('; ',$nums).'. Cantidad de datos: '.$cnt.'. Incógnita: media aritmética sin ponderación.';$method='La media reparte por igual la suma de todos los datos. Sumamos cada dato una sola vez y dividimos por la cantidad de datos.';
    $steps=["La media reparte la suma total por igual entre los {$cnt} datos. Primer paso: sumá los valores: ".implode(' + ',$nums).".","Segundo paso: dividí la suma total obtenida entre {$cnt} (la cantidad de datos) y enviá el resultado."];
  }
  elseif(in_array($topic,['geometry','unsure'],true)&&str_contains($text,'rectangulo')&&count($nums)===2&&(str_contains($text,'area')!==str_contains($text,'perimetro'))){
    preg_match_all('/\d+(?:\.\d+)?\s*(cm|m|metros?|centimetros?)\b/u',$text,$m);$units=array_map(fn($u)=>str_starts_with($u,'c')?'cm':'m',$m[1]);if(count($units)!==2||$units[0]!==$units[1]||min($nums)<=0)return null;
    $area=str_contains($text,'area');$ast=$area?$op('mul',$v($nums[0]),$v($nums[1])):$op('mul',$v(2),$op('add',$v($nums[0]),$v($nums[1])));$unit=$units[0].($area?'²':'');
    $summary="Lados del rectángulo: {$nums[0]} y {$nums[1]} {$units[0]}. Buscamos ".($area?'el área':'el perímetro').", en {$unit}.";$method=$area?'El área cuenta la superficie: multiplicamos largo por ancho. La unidad se eleva al cuadrado.':'El perímetro recorre el borde: hay dos lados de cada longitud. Sumamos las dos medidas y multiplicamos por dos.';
    $steps=$area?["El área mide la superficie del rectángulo: multiplicamos la longitud del largo por el ancho ({$nums[0]} {$units[0]} · {$nums[1]} {$units[0]}).","Realizá la multiplicación y enviá el resultado en {$unit}."]:["El perímetro recorre el borde: sumamos el largo y el ancho ({$nums[0]} + {$nums[1]}) y multiplicamos por 2.","Realizá el cálculo y enviá el resultado en {$unit}."];
  }
  elseif(in_array($topic,['algebra','unsure'],true)&&count($nums)===2&&preg_match('/(doble|triple) de un numero/u',$text)&&preg_match('/mas|menos/u',$text)&&preg_match('/es|igual/u',$text)){
    $a=str_contains($text,'triple')?3:2;$minus=str_contains($text,'menos');$ast=$op('div',$op($minus?'add':'sub',$v($nums[1]),$v($nums[0])),$v($a));
    $summary="Incógnita: el número x. Interpretación: {$a}x ".($minus?'−':'+')." {$nums[0]} = {$nums[1]}.";$method='Deshacemos primero la suma o resta con la operación inversa en ambos miembros. Después deshacemos la multiplicación dividiendo por el coeficiente de x.';
    $steps=["Expresamos el enunciado como ecuación: {$a}x ".($minus?'−':'+')." {$nums[0]} = {$nums[1]}.","Despejamos el término con x aplicando la operación opuesta a {$nums[0]} en ambos miembros: {$a}x = {$nums[1]} ".($minus?'+':'−')." {$nums[0]}.","Dividimos ambos miembros por {$a} para despejar x. Hacé el cálculo final y enviá tu resultado."];
  }
  if(!$ast)return null;try{$expected=WorkshopExpression::evaluate($ast);return ['rule'=>'general','ast'=>$ast,'expected'=>$expected,'answer_unit'=>$unit,'summary'=>$summary,'steps'=>$steps,'hint'=>$method];}catch(Throwable $e){return null;}
 }
}
