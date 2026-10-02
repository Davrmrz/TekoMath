const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
global.window={};
for(const file of ['curriculum','language_data','language','problem_guide','question_resolver','trig_questions','lesson_engine'])vm.runInThisContext(fs.readFileSync(`assets/js/${file}.js`,'utf8'));
const events=[['','explain'],['que es tangente',''],['Dame un ejemplo','example'],['y otro ejemplo',''],['y por que',''],['por que es positiva en el tercer cuadrante',''],['cual es el dominio de la tangente',''],['diferencia entre seno y coseno',''],['explicame arctan',''],['como funciona una galaxia',''],['','resume']];
let state=LessonEngine.initial('funciones','trigonometricas_intro');const actual=[];
for(const [message,action] of events){state=LessonEngine.transition(state,message,action);actual.push({state,response:LessonEngine.response(state)});}
const r=spawnSync('C:/xampp1/php/php.exe',['tests/question_trace.php'],{input:JSON.stringify(events),encoding:'utf8'});assert.equal(r.status,0,r.stderr);const expected=JSON.parse(r.stdout);
for(let i=0;i<actual.length;i++){
 assert.deepEqual(actual[i].state,expected[i].state,`state ${i}`);
 delete expected[i].response.pedagogical_state;
 assert.deepEqual(actual[i].response,expected[i].response,`response ${i}`);
}
const text=i=>actual[i].response.tutor_message_jopara;
assert.match(text(1),/cateto opuesto/);assert.doesNotMatch(text(1),/Cómo interpretar la relación|A 90° el punto/);
assert.match(actual[1].response.formula_display.latex,/tan/);assert.equal(actual[1].response.visual_action.funcType,'tan');
assert.match(text(2),/opuesto 20/);assert.match(text(3),/tan\(45°\)=1/);assert.match(text(4),/hipotenusa se cancela/);
assert.match(text(5),/mismo signo/);assert.match(text(6),/90°/);assert.match(text(7),/Diferencia clave/);assert.match(text(8),/principal/);
assert.match(text(9),/No identifiqué/);assert.equal(actual[10].state.mode,'TEACHING_MODE');assert.equal(actual[10].state.subtopic,'trigonometricas_intro');assert.equal(actual[10].state.lesson.step,0);
for(const phrase of ['que es tangente','EXPLICAME TANGENTE','dame un ejemplo de tangente']) {const s=LessonEngine.transition(LessonEngine.initial('funciones','concepto'),phrase);assert.deepEqual(s.question_context.keys,['trigonometria:tangente']);}
assert.deepEqual(QuestionResolver.match('qué es la tangente inversa'),['trigonometria:arctangente']);
assert.deepEqual(QuestionResolver.match('constante'),[],'No accidental tan match inside a word');
let own=LessonEngine.transition(state,'Resolver 2x + 6 = 14','own_problem');own=LessonEngine.transition(own,'que es tangente','');assert.ok(own.own_problem);assert.equal(LessonEngine.response(own).formula_display.latex,'');
console.log('PASS: contextual retrieval, follow-ups, comparisons, ambiguity, inverse aliases, original lesson resume, problem protection and PHP/JS parity');

const conceptual=LessonEngine.transition(LessonEngine.initial('funciones','concepto'),'por qué tangente no está definida en 90°');assert.equal(conceptual.own_problem,undefined);assert.match(LessonEngine.response(conceptual).tutor_message_jopara,/no se puede calcular/);
