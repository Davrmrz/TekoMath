<?php
require_once __DIR__ . '/../services/tutor_state.php';
require_once __DIR__ . '/../services/pedagogy_service.php';
function verify(bool $ok, string $label): void { if (!$ok) throw new RuntimeException($label); }
$total=0;
foreach(CurriculumService::all()['units'] as $unit) foreach($unit['subtopics'] as $lesson) {
    $s=TutorState::initial($unit['key'],$lesson['id']);
    verify($s['subtopic']===$lesson['id'],'Selected subtopic');
    verify(PedagogyService::transition($s,'','practice')['mode']==='TOPIC_SELECTED','No forced practice');
    $s=PedagogyService::transition($s,'','explain');
    foreach($lesson['sections'] as $i=>$section) {
        verify($s['lesson']['step']===$i,'Section cursor');
        $saved=$s['lesson'];
        $s=PedagogyService::transition($s,'¿Por qué?');
        verify($s['mode']==='QUESTION_MODE','Interrupt');
        $s=PedagogyService::transition($s,'Otra duda');
        verify(count($s['return_stack'])===1,'Nested questions must not stack duplicate frames');
        $s=PedagogyService::transition($s,'','resume');
        verify($s['mode']==='TEACHING_MODE' && $s['lesson']===$saved,'Exact resume');
        $first=PedagogyService::response($s)['tutor_message_jopara'];
        $s=PedagogyService::transition($s,'No entendí');
        verify(PedagogyService::response($s)['tutor_message_jopara']!==$first,'Alternative explanation');
        $s=PedagogyService::transition($s,'','example');
        verify(str_contains(PedagogyService::response($s)['tutor_message_jopara'],$section['example']),'Complete teaching example');
        $s=PedagogyService::transition($s,'','check');
        $s=PedagogyService::transition($s,'Sí');
    }
    verify($s['mode']==='READY_CHECK','Ready after essential sections');
    verify($s['recent_evidence']===[],'Teaching must not create mastery evidence');
    $s=PedagogyService::transition($s,'','practice');
    verify($s['mode']==='PRACTICE_MODE','Explicit consent starts practice');
    verify(PedagogyService::response($s)['visual_action']['type']==='none','No answer-revealing stale visual');
    $total++;
}
$s=TutorState::initial('trigonometria','circunferencia');
$s=PedagogyService::transition($s,'','known');
$s=PedagogyService::transition($s,'','practice');
$s=PedagogyService::transition($s,'12');
verify($s['mode']==='PRACTICE_MODE','No substring acceptance');
$s=PedagogyService::transition($s,'segundo cuadrante');
verify($s['mode']==='REVIEW_MODE','Exact starter answer');
echo "PASS: $total subtopics; teaching, examples, interruptions, alternatives, consent and no fabricated mastery\n";
