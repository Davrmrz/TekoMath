from pathlib import Path
# Remove unconditional mixed-language framing; shared adapter controls all registers.
replacements={
'Maitei 👋':'Hola.', 'Jahecha peteĩ ejemplo del profesor.':'Veamos un ejemplo del profesor.',
"Ha'ete ya tenemos una base para":'Ya tenemos una base para','¡Iporã!':'¡Bien!',
'Ñamba’apo oñondive · Trabajemos juntos.':'Trabajemos juntos.',
'Ko’ág̃a nde · Ahora te toca.':'Ahora te toca.','Ñepytyvõ · Una pista':'Una pista'}
for file in ['assets/js/lesson_engine.js','assets/js/problem_guide.js','services/pedagogy_service.php','services/problem_guide.php']:
    p=Path(file);s=p.read_text(encoding='utf-8-sig')
    for old,new in replacements.items():s=s.replace(old,new)
    s='\n'.join(line for line in s.split('\n') if not ('Ñaikũmby oñondive · Comprendamos juntos.' in line))
    p.write_text(s,encoding='utf8')
# Wrap the three response producers; leave state, formulas and visuals untouched.
for file,klass in [('assets/js/lesson_engine.js','LessonEngine'),('assets/js/question_resolver.js','QuestionResolver'),('assets/js/problem_guide.js','ProblemGuide')]:
    p=Path(file);s=p.read_text(encoding='utf8')
    marker='    static response('
    start=s.index(marker);end=s.index(' {',start)
    argument=s[start+len(marker):end-1]
    s=s[:start]+s[start:].replace(marker,'    static rawResponse(',1)
    wrapper='    static response(state) {\n'
    if klass=='LessonEngine':
        wrapper+="        if(state.own_problem) return ProblemGuide.response(state);\n        if(state.mode==='QUESTION_MODE' && !state.question_pending && state.question_context) return QuestionResolver.response(state);\n"
        s=s.replace('        if(s.own_problem) return ProblemGuide.response(s);\n','').replace("        if(s.mode==='QUESTION_MODE' && !s.question_pending && s.question_context) return QuestionResolver.response(s);\n",'')
    wrapper+="        return TutorLanguage.response(this.rawResponse(state),state);\n    }\n"
    s=s[:start]+wrapper+s[start:]
    s=s.replace("((state.language||'jopara')==='jopara'?'Jahecha porã · Veamos tu pregunta.\\n\\n':'')+",'')
    p.write_text(s,encoding='utf8')
for file,klass in [('services/pedagogy_service.php','PedagogyService'),('services/question_resolver.php','QuestionResolver'),('services/problem_guide.php','ProblemGuide')]:
    p=Path(file);s=p.read_text(encoding='utf8');s=s.replace('<?php','<?php\nrequire_once __DIR__.\'/language_service.php\';',1)
    marker='    public static function response(array $state): array {'
    wrapper=marker+'\n'
    if klass=='PedagogyService':
        s=s.replace("        if (isset($state['own_problem'])) return ProblemGuide::response($state);\n",'').replace("        if($state['mode']==='QUESTION_MODE' && !($state['question_pending']??false) && isset($state['question_context'])) return QuestionResolver::response($state);\n",'')
        wrapper+="        if(isset($state['own_problem']))return ProblemGuide::response($state);\n        if($state['mode']==='QUESTION_MODE' && !($state['question_pending']??false) && isset($state['question_context']))return QuestionResolver::response($state);\n"
    wrapper+="        return TutorLanguage::response(self::rawResponse($state),$state);\n    }\n    private static function rawResponse(array $state): array {"
    s=s.replace(marker,wrapper)
    s=s.replace('(($state[\'language\']??\'jopara\')===\'jopara\'?"Jahecha porã · Veamos tu pregunta.\\n\\n":\'\').','')
    p.write_text(s,encoding='utf8')
# Load the same catalog in both entry points. PHP page was also missing the problem/question engines.
for file in ['index.html','views/footer.php']:
    p=Path(file);s=p.read_text(encoding='utf8');at='<script src="assets/js/lesson_engine.js"></script>'
    deps='<script src="assets/js/language_data.js"></script>\n<script src="assets/js/language.js"></script>\n'
    if 'assets/js/problem_guide.js' not in s:deps+='<script src="assets/js/problem_guide.js"></script>\n<script src="assets/js/question_resolver.js"></script>\n'
    s=s.replace(at,deps+at);p.write_text(s,encoding='utf8')
# Test harnesses that manually load the browser engine need its new dependency too.
for p in Path('tests').glob('*.cjs'):
    s=p.read_text(encoding='utf-8-sig')
    if "['curriculum','problem_guide'" in s:s=s.replace("['curriculum','problem_guide'","['curriculum','language_data','language','problem_guide'")
    if "vm.runInThisContext(fs.readFileSync('assets/js/curriculum.js','utf8'));" in s:
        s=s.replace("vm.runInThisContext(fs.readFileSync('assets/js/curriculum.js','utf8'));","vm.runInThisContext(fs.readFileSync('assets/js/curriculum.js','utf8'));\nfor(const file of ['language_data','language'])vm.runInThisContext(fs.readFileSync(`assets/js/${file}.js`,'utf8'));")
    p.write_text(s,encoding='utf8')
# State persistence and quick options update immediately on language change.
p=Path('assets/js/app.js');s=p.read_text(encoding='utf8')
s=s.replace('            offlineEngine.setLanguage(currentLanguage);\n            const confirmMsgs', '''            offlineEngine.setLanguage(currentLanguage);
            if(tutorState) {
                tutorState.language=currentLanguage;
                delete tutorState.last_response;
                localStorage.setItem(`kyhyjey_state_${sessionUuid}`,JSON.stringify(tutorState));
                const localized=LessonEngine.response(tutorState);
                chatUI.renderQuickOptions(localized.quick_options);
            }
            const confirmMsgs''')
s=s.replace('"¡Iporãite! Ko\'ág̃a ñañe\'ẽta Guaraní Jopara-pe. ¿Japrosigue con "','"Jasegi en jopara. ¿Jahechápa "')
s=s.replace('"¡Buenísimo! Ahora continuamos en Español Paraguayo. ¿Seguimos con "','"Dale, seguimos en español paraguayo. ¿Vemos "')
s=s.replace('"Perfecto. Continuaremos en Español estándar. ¿Continuamos con "','"Continuaremos en español neutro. ¿Seguimos con "')
p.write_text(s,encoding='utf8')
p=Path('assets/js/offline_core.js');s=p.read_text(encoding='utf8').replace('        const next = LessonEngine.transition(this.tutorState, message, action);','        this.tutorState.language=this.lang;\n        const next = LessonEngine.transition(this.tutorState, message, action);');p.write_text(s,encoding='utf8')
