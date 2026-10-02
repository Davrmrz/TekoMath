from pathlib import Path
p=Path('assets/js/lesson_engine.js');s=p.read_text(encoding='utf8');s=s.replace("        action=this.action(message,action,s);", """        const routingAction=action || Object.keys(this.labels).find(k=>this.normalize(this.labels[k])===this.normalize(message)) || '';
        if(routingAction==='resume') delete s.question_context;
        const question=QuestionResolver.transition(s,message,routingAction);
        if(question) return question;
        action=this.action(message,action,s);""")
s=s.replace("s.mode='QUESTION_MODE';s.question_pending=action==='question';", "s.mode='QUESTION_MODE';s.question_pending=action==='question';\n            if(action==='question_text')s.question_context={keys:[],intent:'definition',message,example_index:0};")
s=s.replace("        if(s.own_problem) return ProblemGuide.response(s);", "        if(s.own_problem) return ProblemGuide.response(s);\n        if(s.mode==='QUESTION_MODE' && !s.question_pending && s.question_context) return QuestionResolver.response(s);")
p.write_text(s,encoding='utf8')
p=Path('services/pedagogy_service.php');s=p.read_text(encoding='utf8');s=s.replace("require_once __DIR__ . '/problem_guide.php';", "require_once __DIR__ . '/problem_guide.php';\nrequire_once __DIR__ . '/question_resolver.php';")
s=s.replace("        $action = self::action($message, $action, $state);", """        $routingAction=$action;
        if($routingAction==='')foreach(self::LABELS as $key=>$label)if(self::normalize($label)===self::normalize($message)){$routingAction=$key;break;}
        if($routingAction==='resume')unset($state['question_context']);
        $question=QuestionResolver::transition($state,$message,$routingAction);
        if($question)return $question;
        $action = self::action($message, $action, $state);""")
s=s.replace("$state['question_pending'] = $action === 'question';", "$state['question_pending'] = $action === 'question';\n            if($action==='question_text')$state['question_context']=['keys'=>[],'intent'=>'definition','message'=>$message,'example_index'=>0];")
s=s.replace("        if (isset($state['own_problem'])) return ProblemGuide::response($state);", "        if (isset($state['own_problem'])) return ProblemGuide::response($state);\n        if($state['mode']==='QUESTION_MODE' && !($state['question_pending']??false) && isset($state['question_context'])) return QuestionResolver::response($state);")
p.write_text(s,encoding='utf8')
p=Path('index.html');s=p.read_text(encoding='utf8').replace('<script src="assets/js/lesson_engine.js">','<script src="assets/js/question_resolver.js"></script>\n<script src="assets/js/lesson_engine.js">');p.write_text(s,encoding='utf8')
p=Path('tests/lesson_parity_test.cjs');s=p.read_text(encoding='utf8').replace("vm.runInThisContext(fs.readFileSync('assets/js/lesson_engine.js','utf8'));", "vm.runInThisContext(fs.readFileSync('assets/js/question_resolver.js','utf8'));\nvm.runInThisContext(fs.readFileSync('assets/js/lesson_engine.js','utf8'));");p.write_text(s,encoding='utf8')
p=Path('services/ai_service.php');s=p.read_text(encoding='utf8');s=s.replace("        $context = ['history'=>$history, 'tutor_state'=>$state, 'lesson'=>CurriculumService::lesson($state['topic'], $state['subtopic']), 'draft'=>$draft['tutor_message_jopara']];", """        $lesson=CurriculumService::lesson($state['topic'], $state['subtopic']);
        if($state['mode']==='QUESTION_MODE' && isset($state['question_context'])) {
            $keys=$state['question_context']['keys'];
            $lesson=['requested_concepts'=>array_values(array_filter(QuestionResolver::cards(),fn($card)=>in_array($card['key'],$keys,true))), 'question'=>$state['question_context']];
        }
        $context = ['history'=>$history, 'tutor_state'=>$state, 'lesson'=>$lesson, 'draft'=>$draft['tutor_message_jopara']];""");p.write_text(s,encoding='utf8')
p=Path('assets/js/app.js');s=p.read_text(encoding='utf8');s=s.replace("        if (action.type === 'function_graph') {", """        if(['function_graph','unit_circle'].includes(action.type)) {
            document.getElementById('mec-view').style.display='none';
            document.getElementById('tab-circle').style.display='inline-block';
            document.getElementById('tab-graph').style.display='inline-block';
        }
        if (action.type === 'function_graph') {""");p.write_text(s,encoding='utf8')
p=Path('services/question_resolver.php');s=p.read_text(encoding='utf8').replace("$parts[]='**Diferencia clave**\\nCompará qué datos relaciona cada definición y qué se obtiene al aplicarla. Las fórmulas de abajo corresponden a cada concepto en el mismo orden.';", "$parts[]=\"**Diferencia clave**\\nCompará qué datos relaciona cada definición y qué se obtiene al aplicarla. Las fórmulas de abajo corresponden a cada concepto en el mismo orden.\";");p.write_text(s,encoding='utf8')
