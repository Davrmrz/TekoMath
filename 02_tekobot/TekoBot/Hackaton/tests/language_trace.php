<?php
require_once __DIR__.'/../services/pedagogy_service.php';
$input=json_decode(stream_get_contents(STDIN),true);
$out=[];
foreach($input['states'] as $state){$response=PedagogyService::response($state);unset($response['pedagogical_state']);$out[]=$response;}
$text=$input['text'];$p=TutorLanguage::protect($text);
echo json_encode(['responses'=>$out,'protected'=>$p,'text'=>array_map(fn($lang)=>TutorLanguage::text($text,$lang),['jopara','es_py','es']),
'valid'=>TutorLanguage::acceptLocalized($p['text'],$p),'missing'=>TutorLanguage::acceptLocalized(str_replace('[[MJ_PROTECTED_0]]','',$p['text']),$p),'extra'=>TutorLanguage::acceptLocalized($p['text'].' 99',$p)],JSON_UNESCAPED_UNICODE);
