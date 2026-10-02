<?php
require_once __DIR__.'/../services/pedagogy_service.php';
require_once __DIR__.'/../services/tutor_state.php';
$state=TutorState::initial('funciones','concepto');
$state['workshop']=['stage'=>'statement'];
$events=json_decode(stream_get_contents(STDIN),true);$out=[];
foreach($events as [$message,$action]){if($state['workshop']['stage']==='topic'&&$action!=='new_problem')$state=PedagogyService::transition($state,'No sé el tema','topic_unsure');$state=PedagogyService::transition($state,$message,$action);if($state['workshop']['stage']==='confirm')$state=PedagogyService::transition($state,'Sí, son correctos','confirm_data');$out[]=['workshop'=>$state['workshop'],'response'=>PedagogyService::response($state)];}
echo json_encode($out,JSON_UNESCAPED_UNICODE);
