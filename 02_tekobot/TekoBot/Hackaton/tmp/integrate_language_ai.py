from pathlib import Path
p=Path('assets/js/app.js');s=p.read_text(encoding='utf8').replace('        tutorState = LessonEngine.initial(topic, subtopic);','        tutorState = LessonEngine.initial(topic, subtopic);\n        tutorState.language=currentLanguage;')
s=s.replace("chatUI.appendMessage('tutor','Maitei 👋 Elegí una unidad y un subtema para comenzar. Voy a explicarte la idea, mostrar un ejemplo y acompañarte cuando quieras practicar.');", "chatUI.appendMessage('tutor',TutorLanguage.text('Hola. Elegí una unidad y un subtema para comenzar. Voy a explicarte la idea, mostrar un ejemplo y acompañarte cuando quieras practicar.',currentLanguage));")
p.write_text(s,encoding='utf8')
p=Path('assets/js/lesson_engine.js');s=p.read_text(encoding='utf8').replace("return ids.map(id=>({id,label:id==='example' && state.mode==='EXAMPLE_MODE'?'Mostrame otro ejemplo':this.labels[id]}));","return TutorLanguage.options(ids.map(id=>({id,label:id==='example' && state.mode==='EXAMPLE_MODE'?'Mostrame otro ejemplo':this.labels[id]})),state.language);")
p.write_text(s,encoding='utf8')
# More complete protection for plain-text mathematical statements (kept verbatim).
p=Path('assets/js/language.js');s=p.read_text(encoding='utf-8-sig').replace(r'|\b(?:sen|sin|cos|tan|log|ln)',r'|[^\n.!?]*[=^√π≤≥][^\n.!?]*|\b(?:sen|sin|cos|tan|log|ln)');p.write_text(s,encoding='utf8')
p=Path('services/language_service.php');s=p.read_text(encoding='utf-8-sig').replace(r'|\b(?:sen|sin|cos|tan|log|ln)',r'|[^\n.!?]*[=^√π≤≥][^\n.!?]*|\b(?:sen|sin|cos|tan|log|ln)');p.write_text(s,encoding='utf8')
p=Path('services/ai_service.php');s=p.read_text(encoding='utf8');s=s.replace("require_once __DIR__ . '/math_service.php';","require_once __DIR__ . '/math_service.php';\nrequire_once __DIR__ . '/language_service.php';")
s=s.replace('Usa guaraní jopara con traducción breve.','Respeta el registro de state.language; integra jopara solo cuando ese sea el idioma seleccionado.')
s=s.replace('$draft[\'tutor_message_jopara\']="Ñamba’apo oñondive · Trabajemos juntos.\\n\\n";', '$draft[\'tutor_message_jopara\']=TutorLanguage::text("Trabajemos juntos.\\n\\n",$state[\'language\']??\'jopara\');')
s=s.replace('$draft[\'tutor_message_jopara\'].="Ko’ág̃a nde · Ahora te toca. Escribí tu próximo paso y explicá por qué. El resultado y la operación anterior quedan para vos.";', '$draft[\'tutor_message_jopara\'].=TutorLanguage::text("Ahora te toca. Escribí tu próximo paso y explicá por qué. El resultado y la operación anterior quedan para vos.",$state[\'language\']??\'jopara\');')
s=s.replace("$context = ['history'=>$history, 'tutor_state'=>$state, 'lesson'=>$lesson, 'draft'=>$draft['tutor_message_jopara']];", "$protected=TutorLanguage::protect($draft['tutor_message_jopara']);\n        $context = ['history'=>$history, 'tutor_state'=>$state, 'lesson'=>$lesson, 'draft'=>$protected['text'], 'localization_only'=>true];")
s=s.replace("$draft['tutor_message_jopara'] = $result['tutor_message_jopara'];", "$localized=TutorLanguage::acceptLocalized($result['tutor_message_jopara'],$protected);\n            if($localized!==null)$draft['tutor_message_jopara']=$localized;")
s=s.replace("$systemPrompt = file_get_contents(__DIR__ . '/../prompts/system_tutor.txt');", """$systemPrompt = file_get_contents(__DIR__ . '/../prompts/system_tutor.txt');
        $language=TutorLanguage::normalize($context['tutor_state']['language']??$context['language']??'jopara');
        $systemPrompt.="\\n\\n".TutorLanguage::instruction($language);
        if($context['localization_only']??false) $systemPrompt.="\\nLOCALIZACIÓN DEL BORRADOR: adapta la redacción de draft al registro seleccionado. Conserva todas sus ideas, condiciones, ejemplos y dificultad. No agregues cálculos ni información. Copia cada token [[MJ_PROTECTED_N]] exactamente una vez, en el mismo orden: contiene matemáticas o datos inmutables. No sustituyas tokens por valores del historial o del libro. No añadas números, fórmulas, HTML ni enlaces fuera de los tokens. Devuelve tutor_message_jopara con el texto adaptado. No saludes ni añadas despedidas.";""")
s=s.replace("{$msg['message']}","""{$historyMessage}""")
s=s.replace("$role = ($msg['role'] === 'user') ? 'Estudiante' : 'Tutor Kyhyjey';", "$role = ($msg['role'] === 'user') ? 'Estudiante' : 'Tutor Kyhyjey';\n                $historyMessage=$msg['message']??$msg['content']??'';")
s=s.replace('Genera la respuesta del tutor en Guaraní Jopara en formato JSON estricto siguiendo las reglas pedagógicas de Kyhyje\'ỹ.','Genera la respuesta del tutor en el registro seleccionado ({$language}), en formato JSON estricto siguiendo las reglas pedagógicas de Kyhyje\'ỹ.')
p.write_text(s,encoding='utf8')
p=Path('prompts/system_tutor.txt');s=p.read_text(encoding='utf8').replace('Tu objetivo principal es enseñar, con Guaraní Jopara natural y comprensible.','Tu objetivo principal es enseñar en el registro elegido por el estudiante: jopara, español paraguayo o español neutro.')
s=s.replace('con frases comprensibles y aclaraciones en español.','con frases comprensibles; aclara en español solo cuando sea necesario, sin repetir automáticamente cada frase en dos idiomas.')
p.write_text(s,encoding='utf8')
