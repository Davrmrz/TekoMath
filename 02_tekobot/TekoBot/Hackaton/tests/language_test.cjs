const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
global.window={};
for(const f of ['curriculum','language_data','language','problem_guide','question_resolver','trig_questions','lesson_engine'])vm.runInThisContext(fs.readFileSync(`assets/js/${f}.js`,'utf8'));
assert.deepEqual(window.TUTOR_LANGUAGE_DATA,JSON.parse(fs.readFileSync('database/language_profiles.json','utf8')));
const states=[];
for(const language of ['jopara','es_py','es'])for(const unit of window.TUTOR_CURRICULUM.units)for(const lesson of unit.subtopics){
 for(const mode of ['TOPIC_SELECTED','TEACHING_MODE','EXAMPLE_MODE','READY_CHECK','PRACTICE_MODE','REVIEW_MODE']){
  const s=LessonEngine.initial(unit.key,lesson.id);s.language=language;s.mode=mode;states.push(s);
 }
}
const text='Observá $x^2 + 2 = 6$, \\(\\frac{3}{5}\\), sen(30°), 25%, {{nombre}}, https://example.com/querés y `vos + 2`.\nRecordá que f(x) = 2x + 1.\nPodés explicar con tus palabras.';
const r=spawnSync('C:/xampp1/php/php.exe',['tests/language_trace.php'],{input:JSON.stringify({states,text}),encoding:'utf8',maxBuffer:30*1024*1024});
assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');const php=JSON.parse(r.stdout);
assert.deepEqual(php.protected,TutorLanguage.protect(text));assert.equal(php.valid,text);assert.equal(php.missing,null);assert.equal(php.extra,null);
for(const [i,lang] of ['jopara','es_py','es'].entries())assert.equal(php.text[i],TutorLanguage.text(text,lang));
for(const [i,s] of states.entries()){
 const response=LessonEngine.response(s);assert.deepEqual(response,php.responses[i],`${s.language} ${s.topic}/${s.subtopic} ${s.mode}`);
 if(s.language!=='jopara')assert.doesNotMatch(response.tutor_message_jopara,/Maitei|Iporã|Jahecha|Ñamba|Ko’ág|Ha'ete/);
 if(s.language==='es')assert.doesNotMatch(response.tutor_message_jopara,/\b(?:querés|podés|tenés|vos|identificá|revisá|explicá|fijate|nomás|dale)\b/iu);
}
const lesson=LessonEngine.initial('funciones','concepto');lesson.mode='TEACHING_MODE';
const outputs=['jopara','es_py','es'].map(language=>LessonEngine.response({...lesson,language}));
assert.equal(new Set(outputs.map(r=>r.tutor_message_jopara)).size,3);
// Check the language contract instead of one historical wording of the lesson.
assert.match(outputs[0].tutor_message_jopara,/Ñaikũmby|Nemandu'áke/);
for(const output of outputs)assert.match(output.tutor_message_jopara,/función|dominio/);
for(const output of outputs)assert.deepEqual(output.formula_display,outputs[0].formula_display);
for(const lang of ['jopara','es_py','es']){
 const own=LessonEngine.response({...lesson,language:lang,own_problem:{statement:'Resolver 2x + 6 = 14'}});
 assert.doesNotMatch(own.tutor_message_jopara,/x\s*=\s*4|2x\s*=\s*8|8\s*\/\s*2/);
 assert.equal(own.formula_display.latex,'');
}
console.log(`PASS: ${states.length} localized responses, PHP/JS parity, three distinct registers, immutable math, damaged output rejection and problem safeguards`);
