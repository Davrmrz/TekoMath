<?php
require_once __DIR__.'/../services/pedagogy_service.php';require_once __DIR__.'/../services/tutor_state.php';
$state=TutorState::initial('funciones','concepto');$state['workshop']=['stage'=>'topic'];$out=[];
foreach(json_decode(stream_get_contents(STDIN),true) as [$m,$a]){$state=PedagogyService::transition($state,$m,$a);$out[]=['workshop'=>$state['workshop'],'response'=>PedagogyService::response($state)];}echo json_encode($out,JSON_UNESCAPED_UNICODE);
