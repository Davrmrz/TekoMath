const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
global.window={};for(const file of ['curriculum','language_data','language','problem_guide','question_resolver','trig_questions','lesson_engine'])vm.runInThisContext(fs.readFileSync(`assets/js/${file}.js`,'utf8'));
const events=[['q es tangente',''],['me lo explicas mas facil porfa',''],['y su recorrido',''],['y el dominio',''],['me das otro ejemplo',''],['me das otro ejemplo',''],['no, hablame del coseno',''],['y su rango',''],['puedes explicarme por qué tan(90°) no existe',''],['qué es dominio',''],['explicame fotosintesis',''],['y por que',''],['qué es tanjente',''],['','resume'],['cuál es el dominio y recorrido de la tangente','']];
let state=LessonEngine.initial('funciones','trigonometricas_intro');const actual=[];
for(const [message,action] of events){state=LessonEngine.transition(state,message,action);actual.push({state,response:LessonEngine.response(state)});}
const run=spawnSync('C:/xampp1/php/php.exe',['tests/question_trace.php'],{input:JSON.stringify(events),encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.equal(run.stderr,'');const expected=JSON.parse(run.stdout);
for(let i=0;i<actual.length;i++){delete expected[i].response.pedagogical_state;assert.deepEqual(actual[i],expected[i],`turn ${i}`);}
const text=i=>actual[i].response.tutor_message_jopara;
assert.match(text(0),/cateto opuesto/);assert.ok(text(0).length<650);assert.doesNotMatch(text(0),/A 90° el punto|Cómo interpretar la relación/);
assert.match(text(1),/rampa/);assert.equal(actual[1].state.question_context.intent,'simple');
assert.match(text(2),/recorrido.*todo R/);assert.doesNotMatch(text(2),/dominio|90°/);
assert.match(text(3),/90°/);assert.equal(actual[3].state.question_context.intent,'domain');
assert.match(text(4),/opuesto 20/);assert.match(text(5),/tan\(45°\)=1/);
assert.deepEqual(actual[6].state.question_context.keys,['trigonometria:coseno']);assert.match(text(7),/recorrido.*\[−1, 1\]/);
assert.equal(actual[8].state.own_problem,undefined);assert.match(text(8),/no se puede calcular|no está definida/);
assert.deepEqual(actual[9].state.question_context.keys,['funciones:dominio']);assert.equal(actual[9].state.question_context.intent,'definition');
assert.match(text(10),/No identifiqué|Ne’ĩra aikũmby/);assert.match(text(11),/No identifiqué|Ne’ĩra aikũmby/);assert.equal(actual[10].response.formula_display.latex,'');
assert.match(text(12),/cateto opuesto/);assert.equal(actual[13].state.mode,'TOPIC_SELECTED');
assert.match(text(14),/\*\*Dominio\*\*/);assert.match(text(14),/\*\*Recorrido\*\*/);assert.match(text(14),/todo R/);
// A question during practice must not be scored as a wrong answer or discard the exercise.
let practice=LessonEngine.initial('trigonometria','tangente');practice.mode='PRACTICE_MODE';practice.active_exercise_id='keep-this-exercise';
let asked=LessonEngine.transition(practice,'me explicas que es tangente');assert.equal(asked.mode,'QUESTION_MODE');assert.equal(asked.feedback,null);
let resumed=LessonEngine.transition(asked,'','resume');assert.equal(resumed.mode,'PRACTICE_MODE');assert.equal(resumed.active_exercise_id,practice.active_exercise_id);
// Named topic missing a focused answer asks for detail instead of substituting a definition.
let missing=LessonEngine.transition(LessonEngine.initial('funciones','concepto'),'cuál es el dominio del factorial');assert.match(LessonEngine.response(missing).tutor_message_jopara,/no tengo una explicación específica/);assert.equal(LessonEngine.response(missing).formula_display.latex,'');
// Old saved question states cannot revive the unrelated lesson fallback.
let old=LessonEngine.initial('funciones','trigonometricas_intro');old.mode='QUESTION_MODE';old.question_pending=false;
assert.match(LessonEngine.response(old).tutor_message_jopara,/No identifiqué|Ne’ĩra aikũmby/);assert.equal(LessonEngine.response(old).formula_display.latex,'');
console.log('PASS: conversational phrasing, simple answers, range/domain distinction, examples, concept switches, ambiguity, legacy states and practice preservation; PHP/JS parity');
