from pathlib import Path
p=Path('assets/js/lesson_engine.js');s=p.read_text(encoding='utf-8')
s=s.replace('action=this.action(message,action,s);', "if(ProblemGuide.start(s,message,action)) return s;\n        action=this.action(message,action,s);")
s=s.replace('static response(s) {','static response(s) {\n        if(s.own_problem) return ProblemGuide.response(s);')
s=s.replace("return {tutor_message_jopara:text,", "if((s.language||'jopara')==='jopara') text='Ñaikũmby oñondive · Comprendamos juntos.\\n\\n'+text+'\\n\\nEñemokyre’ỹ · ¡Ánimo! Ehai ne porandu: escribí tu duda.';\n        return {tutor_message_jopara:text,")
p.write_text(s,encoding='utf-8')
p=Path('services/pedagogy_service.php');s=p.read_text(encoding='utf-8')
s=s.replace("require_once __DIR__ . '/curriculum_service.php';", "require_once __DIR__ . '/curriculum_service.php';\nrequire_once __DIR__ . '/problem_guide.php';")
s=s.replace("$action = self::action($message, $action, $state);", "$problem = ProblemGuide::transition($state, $message, $action);\n        if ($problem) return $problem;\n        unset($state['own_problem']);\n        $action = self::action($message, $action, $state);")
s=s.replace('public static function response(array $state): array {', 'public static function response(array $state): array {\n        if (isset($state[\'own_problem\'])) return ProblemGuide::response($state);')
s=s.replace("return ['tutor_message_jopara'=>$text,'pedagogical_state'", "if (($state['language'] ?? 'jopara') === 'jopara') $text=\"Ñaikũmby oñondive · Comprendamos juntos.\\n\\n\".$text.\"\\n\\nEñemokyre’ỹ · ¡Ánimo! Ehai ne porandu: escribí tu duda.\";\n        return ['tutor_message_jopara'=>$text,'pedagogical_state'")
p.write_text(s,encoding='utf-8')
p=Path('api/chat.php');s=p.read_text(encoding='utf-8').replace('$next = PedagogyService::transition', "$tutorState['language'] = $language;\n        $next = PedagogyService::transition");p.write_text(s,encoding='utf-8')
p=Path('assets/js/app.js');s=p.read_text(encoding='utf-8')
s=s.replace("const msg = userMsg.trim();", "const msg = userMsg.trim();\n        if(!action && document.getElementById('own-problem')?.checked) action='own_problem';\n        if(action==='resume') document.getElementById('own-problem').checked=false;\n        if(tutorState) tutorState.language=currentLanguage;")
s=s.replace("if(action.type === 'none') {\n            ['circle-view'", "if(action.type === 'none') {\n            if(!tutorState?.own_problem) {updateTopicVisualizer(currentTopic);return;}\n            ['circle-view'")
s=s.replace("button.title=topic.page ? `Índice del libro · página ${topic.page}` : 'Ampliación de Contenido.pdf';", "button.title=topic.page ? `Libro MEC 2016 · página ${topic.page}` : 'Ampliación didáctica';")
needle="context.textContent=lesson ?"
pos=s.index(needle);end=s.index('\n',pos)
s=s[:end]+'''
        if(lesson) {
            const source=document.createElement(lesson.source?'a':'span');source.className='lesson-source';
            source.textContent=lesson.source?`Aranduka · MEC 2016, página ${lesson.source.printed_page}`:lesson.source_note;
            if(lesson.source){source.href=lesson.source.url;source.target='_blank';source.rel='noopener';}
            context.append(source);
        }'''+s[end:]
p.write_text(s,encoding='utf-8')
