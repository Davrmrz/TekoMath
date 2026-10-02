<?php
require_once __DIR__.'/../services/tutor_state.php';
require_once __DIR__.'/../services/pedagogy_service.php';
$state=TutorState::initial('funciones','trigonometricas_intro');$out=[];
foreach(json_decode(stream_get_contents(STDIN),true) as [$message,$action]){
 $state=PedagogyService::transition($state,$message,$action);
 $out[]=['state'=>$state,'response'=>PedagogyService::response($state)];
}
echo json_encode($out,JSON_UNESCAPED_UNICODE);
