<?php
require_once __DIR__.'/../services/workshop_expression.php';
$input=['facts'=>['Largo: 8 metros','Ancho: 3 metros'],'unknown'=>'Área del rectángulo','unit'=>'m²','reason'=>'El área de un rectángulo se obtiene multiplicando largo por ancho.','calculation'=>['op'=>'mul','args'=>[['value'=>8],['value'=>3]]]];
$plan=WorkshopExpression::plan($input);if(!$plan||$plan['stage']!=='confirm'||WorkshopExpression::evaluate($plan['ast'])!==24.0||isset($plan['expected'])||str_contains(json_encode($plan),'24'))throw new Exception('Invalid plan or answer leak');
foreach([['op'=>'div','args'=>[['value'=>1],['value'=>0]]],['op'=>'eval','args'=>[['value'=>1],['value'=>2]]],['op'=>'sqrt','args'=>[['value'=>-1]]]] as $ast){$input['calculation']=$ast;if(WorkshopExpression::plan($input)!==null)throw new Exception('Unsafe expression accepted');}
echo "PASS: structured model-plan validation, independent calculation, no premature result, division/domain/operation rejection\n";
