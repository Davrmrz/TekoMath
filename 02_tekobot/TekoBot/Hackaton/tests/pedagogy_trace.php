<?php
require_once __DIR__.'/../services/tutor_state.php';
require_once __DIR__.'/../services/pedagogy_service.php';
$s=TutorState::initial('trigonometria','circunferencia');
$out=[];
foreach(json_decode(stream_get_contents(STDIN),true) as $event) {
    $s=PedagogyService::transition($s,$event[0],$event[1]);
    $out[]=$s;
}
echo json_encode($out,JSON_UNESCAPED_UNICODE);
