<?php
/** A numeric calculation tree, independent from generated prose. */
class WorkshopExpression {
 public static function numeric(string $text): ?float {
  $t=trim($text);if(preg_match('/^[+-]?[1-9]\d{0,2}(?:\.\d{3})+(?:,\d+)?$/',$t))$t=str_replace('.','',$t);
  $t=str_replace(',','.',$t);return preg_match('/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/',$t)&&is_finite((float)$t)?(float)$t:null;
 }
 public static function parse(string $text): ?array {
  try{
   $spoken=['cero'=>0,'uno'=>1,'una'=>1,'dos'=>2,'tres'=>3,'cuatro'=>4,'cinco'=>5,'seis'=>6,'siete'=>7,'ocho'=>8,'nueve'=>9,'diez'=>10,'once'=>11,'doce'=>12,'trece'=>13,'catorce'=>14,'quince'=>15,'veinte'=>20,'treinta'=>30,'petei'=>1,'mokoi'=>2,'mbohapy'=>3,'irundy'=>4,'po'=>5,'potei'=>6,'pokoi'=>7,'poapy'=>8,'porundy'=>9,'pa'=>10];$text=preg_replace_callback('/\b(?:cero|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|veinte|treinta|petei|mokoi|mbohapy|irundy|po|potei|pokoi|poapy|porundy|pa)\b/u',fn($m)=>(string)$spoken[$m[0]],$text);
   $text=preg_replace(['/multiplicado por/','/dividido (?:por|entre)/','/elevado a(?: la)?/'],['*','/','^'],$text);
   $text=str_replace('√','sqrt',preg_replace('/(\d)\s*x\s*(?=[\d(])/','$1*',$text));
   $text=preg_replace('/^(?:¿?cuanto es|calcular?|resuelve|resolver?)\s+/u','',$text);$text=preg_replace('/[?=]\s*$/','',$text);
   $text=preg_replace(['/\bpor\b/','/\bentre\b/','/\bmas\b/','/\bmenos\b/','/×|·|\bx\b/u','/÷|:/u','/²/u','/³/u'],['*','/','+','-','*','/','^2','^3'],$text);
   preg_match_all('/\d+(?:[.,]\d+)*|\.\d+|[a-z_]+|[^\s]/u',$text,$matches);$tokens=$matches[0];if(!$tokens||count($tokens)>100)return null;
   $i=0;$op=fn($name,...$args)=>['op'=>$name,'args'=>$args];$functions=['sqrt'=>'sqrt','raiz'=>'sqrt','ln'=>'ln','sen'=>'sin_deg','sin'=>'sin_deg','cos'=>'cos_deg','tan'=>'tan_deg'];
   $atom=function()use(&$i,$tokens,$op,$functions,&$sum){$t=$tokens[$i++]??'';
    if($t==='('){$n=$sum();if(($tokens[$i++]??'')!==')')throw new Exception();}
    elseif(isset($functions[$t])){if(($tokens[$i++]??'')!=='(')throw new Exception();$n=$op($functions[$t],$sum());if(($tokens[$i++]??'')!==')')throw new Exception();}
    else{$value=self::numeric($t);if($value===null)throw new Exception();$n=['value'=>$value];}
    while(in_array($tokens[$i]??'',['!','%'],true))$n=$tokens[$i++]==='!'?$op('factorial',$n):$op('div',$n,['value'=>100]);return $n;};
   $power=function()use(&$i,$tokens,$op,$atom,&$unary){$n=$atom();if(($tokens[$i]??'')==='^'){$i++;$n=$op('pow',$n,$unary());}return $n;};
   $unary=function()use(&$i,$tokens,$op,$power,&$unary){if(($tokens[$i]??'')==='+'){$i++;return $unary();}if(($tokens[$i]??'')==='-'){$i++;return $op('sub',['value'=>0],$unary());}return $power();};
   $product=function()use(&$i,$tokens,$op,$unary){$n=$unary();while(in_array($tokens[$i]??'',['*','/'],true)){$t=$tokens[$i++];$n=$op($t==='*'?'mul':'div',$n,$unary());}return $n;};
   $sum=function()use(&$i,$tokens,$op,$product){$n=$product();while(in_array($tokens[$i]??'',['+','-'],true)){$t=$tokens[$i++];$n=$op($t==='+'?'add':'sub',$n,$product());}return $n;};
   $ast=$sum();if($i!==count($tokens)||!isset($ast['op']))return null;$expected=self::evaluate($ast);$steps=self::explain($ast);
   $notation=preg_match('/[1-9]\d{0,2}\.\d{3}|,\d/',$text)?' Punto de miles y coma decimal.':'';
   return ['rule'=>'general','ast'=>$ast,'expected'=>$expected,'answer_unit'=>'','summary'=>"Vamos a calcular:\n".self::expression($ast).$notation,'steps'=>$steps,'hint'=>$steps[0]];
  }catch(Throwable $e){return null;}
 }
 public static function evaluate(array $node,int $depth=0): float {
  if($depth>8)throw new InvalidArgumentException('Expresión demasiado larga.');
  if(isset($node['value'])&&(is_int($node['value'])||is_float($node['value']))&&is_finite((float)$node['value']))return (float)$node['value'];
  $args=$node['args']??[];$op=$node['op']??'';$unary=['sqrt','sin_deg','cos_deg','tan_deg','factorial','ln'];if(count($args)!==(in_array($op,$unary,true)?1:2))throw new InvalidArgumentException('Argumentos inválidos.');
  $a=array_map(fn($n)=>self::evaluate($n,$depth+1),$args);$v=null;
  switch($op){case 'add':$v=$a[0]+$a[1];break;case 'sub':$v=$a[0]-$a[1];break;case 'mul':$v=$a[0]*$a[1];break;case 'div':if($a[1]==0)throw new InvalidArgumentException('División por cero.');$v=$a[0]/$a[1];break;case 'pow':if(abs($a[1])>100)throw new InvalidArgumentException('Exponente excesivo.');$v=pow($a[0],$a[1]);break;case 'sqrt':$v=sqrt($a[0]);break;case 'ln':$v=log($a[0]);break;case 'sin_deg':$v=sin(deg2rad($a[0]));break;case 'cos_deg':$v=cos(deg2rad($a[0]));break;case 'tan_deg':if(abs(cos(deg2rad($a[0])))<1e-10)throw new InvalidArgumentException('Tangente no definida.');$v=tan(deg2rad($a[0]));break;case 'factorial':if(floor($a[0])!=$a[0]||$a[0]<0||$a[0]>170)throw new InvalidArgumentException('Factorial fuera de rango.');$v=1;for($i=2;$i<=$a[0];$i++)$v*=$i;break;default:throw new InvalidArgumentException('Operación no admitida.');}
  if(!is_finite($v))throw new InvalidArgumentException('Resultado no real.');return $v;
 }
 public static function expression(array $node): string {
  if(isset($node['value']))return (string)$node['value'];$a=array_map([self::class,'expression'],$node['args']);$symbol=['add'=>'+','sub'=>'−','mul'=>'·','div'=>'/','pow'=>'^'];return isset($symbol[$node['op']])?'('.$a[0].' '.$symbol[$node['op']].' '.$a[1].')':$node['op'].'('.$a[0].')';
 }
 public static function explain(array $node): array {
  if(isset($node['value']))return [];$steps=[];foreach($node['args'] as $child)$steps=array_merge($steps,self::explain($child));
  $methods=['add'=>'Sumá las cantidades.','sub'=>'Restá la segunda cantidad de la primera.','mul'=>'Multiplicá los factores.','div'=>'Dividí la primera cantidad por la segunda. El divisor no puede ser cero.','pow'=>'Elevá la base al exponente.','sqrt'=>'Buscá la raíz cuadrada no negativa.','sin_deg'=>'Usá seno en modo grados (DEG).','cos_deg'=>'Usá coseno en modo grados (DEG).','tan_deg'=>'Usá tangente en modo grados (DEG).','factorial'=>'Multiplicá los enteros positivos hasta el número indicado. Por definición, 0! = 1.','ln'=>'Usá logaritmo natural; la entrada debe ser positiva.'];
  $method=$methods[$node['op']];
  if(array_filter($node['args'],fn($n)=>($n['op']??'')==='div'))$method=['add'=>'Para sumar fracciones, usá un denominador común.','sub'=>'Para restar fracciones, usá un denominador común.','mul'=>'Multiplicá numeradores entre sí y denominadores entre sí.','div'=>'Multiplicá por el recíproco de la segunda fracción. No puede ser cero.'][$node['op']]??$method;
  if($node['op']==='mul'&&count(array_filter($node['args'],fn($n)=>isset($n['value'])&&floor($n['value'])==$n['value']&&$n['value']>=0))===2){$b=$node['args'][1]['value'];if($b>=10&&$b<100){$t=floor($b/10)*10;$u=$b-$t;if($u)$method="Separá el segundo factor:\n{$b} = {$t} + {$u}\nMultiplicá por cada parte y sumá los dos productos.";}}
  $steps[]=$method."\n".self::expression($node);return $steps;
 }
 public static function plan(array $input): ?array {
  try {
   $ast=$input['calculation']??[];self::evaluate($ast);
   $unknown=$input['unknown']??'';$facts=$input['facts']??[];$reason=$input['reason']??'';$unit=$input['unit']??'';
   if(!is_string($unknown)||strlen($unknown)>200||!$unknown||!is_array($facts)||count($facts)<1||count($facts)>12||!is_string($reason)||strlen($reason)>1200||!is_string($unit)||strlen($unit)>30)return null;
   foreach($facts as $fact)if(!is_string($fact)||strlen($fact)>240)return null;
   // The model extracts the relationship; the interpreter generates all math and steps.
   $expression=self::expression($ast);
   $steps=self::explain($ast);if(count($steps)>12)return null;
   return ['stage'=>'confirm','rule'=>'general','ast'=>$ast,'step'=>0,'attempts'=>0,'summary'=>"Datos identificados:\n• ".implode("\n• ",$facts)."\nIncógnita: ".$unknown."\nUnidad de respuesta: ".($unit?:'sin unidad')."\nRelación propuesta: ".$expression,
    'steps'=>$steps,'hint'=>$steps[0]??'Revisá la relación propuesta.','answer_unit'=>$unit];
  }catch(Throwable $e){return null;}
 }
}
