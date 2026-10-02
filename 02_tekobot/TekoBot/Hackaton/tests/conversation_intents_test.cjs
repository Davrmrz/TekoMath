const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
global.window={};for(const f of ['curriculum','language_data','language','problem_guide','question_resolver','problem_workshop_data','natural_problem','workshop_expression','general_problem','problem_workshop','trig_questions','lesson_engine'])vm.runInThisContext(fs.readFileSync(`assets/js/${f}.js`,'utf8'));
const aliases=['volvamos a donde estabamos','Seguimos donde estábamos','retomemos','sigamos con lo anterior','volvamos a lo que estábamos viendo','continuemos con la lección','podemos retomar donde quedamos','Dale, volvamos a donde estábamos, por favor','jasegi jey'];
const events=[['','explain']],states=[];let state=LessonEngine.initial('trigonometria','circunferencia');state=LessonEngine.transition(state,'','explain');states.push(state);
for(const phrase of aliases){
 const before=structuredClone(state);events.push(['qué es coseno',''],[phrase,'']);
 state=LessonEngine.transition(state,'qué es coseno','');states.push(state);
 const expected=LessonEngine.transition(state,'','resume');state=LessonEngine.transition(state,phrase,'');states.push(state);
 assert.deepEqual(state,expected,phrase);assert.equal(state.mode,before.mode);assert.equal(state.subtopic,before.subtopic);assert.deepEqual(state.lesson,before.lesson);assert.equal(state.question_context,undefined);
}
const php=spawnSync('C:/xampp1/php/php.exe',['tests/pedagogy_trace.php'],{input:JSON.stringify(events),encoding:'utf8'});assert.equal(php.status,0,php.stderr);assert.deepEqual(states,JSON.parse(php.stdout));
for(const [phrase,intent] of [['me das otro ejemplo','example'],['mostrame un ejemplo diferente','example'],['no me quedó claro','confused'],['explicamelo de otra manera','confused'],['explicame con más detalle','more'],['quiero saber más','more'],['necesito una ayudita','hint'],['hagamos un ejercicio','practice']])assert.equal(LessonEngine.conversationalAction(phrase,state),intent,phrase);
for(const phrase of ['no quiero volver a donde estábamos','antes de volver explicame coseno','quiero seguir con seno de 30','dame un ejemplo de tangente','por qué el seno vuelve a cero','si volvemos al origen cambia la función'])assert.equal(LessonEngine.conversationalAction(phrase,state),'',phrase);
const practice={...state,mode:'PRACTICE_MODE',active_exercise_id:'exercise-unchanged'};
const question=LessonEngine.transition(practice,'qué es coseno','');
const resumed=LessonEngine.transition(question,'retomemos','');assert.equal(resumed.mode,'PRACTICE_MODE');assert.equal(resumed.active_exercise_id,'exercise-unchanged');
console.log('PASS: resume paraphrases, polite/accent variants, related conversational intents, no keyword false positives, preserved lesson/practice and PHP/JS parity');
