const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
global.window={};for(const f of ['curriculum','language_data','language','problem_guide','question_resolver','problem_workshop_data','natural_problem','workshop_expression','general_problem','problem_workshop','trig_questions','lesson_engine'])vm.runInThisContext(fs.readFileSync(`assets/js/${f}.js`,'utf8'));
const building='Desde un punto ubicado a 20 metros de la base de un edificio, una persona observa la parte más alta con un ángulo de elevación de 35°.';
const events=[['funciones trigonometricas',''],[building,''],['sí','confirm_data'],['siguiente','next_step'],['siguiente','next_step'],['14,00 m',''],['otro','new_problem'],['Números','topic_arithmetic'],['234 × 12',''],['sí','confirm_data'],['2808',''],['otro','new_problem'],['Trigonometría','topic_trigonometry'],['Desde una distancia de 20 metros se ve la parte más alta de un edificio. ¿Cuál es su altura? El ángulo de elevación no aparece.',''],['35 grados',''],['sí','confirm_data'],['14,00','']];
let state=LessonEngine.initial('funciones','concepto');state.workshop={stage:'topic'};
const actual=events.map(([m,a])=>{state=LessonEngine.transition(state,m,a);return {workshop:structuredClone(state.workshop),response:LessonEngine.response(state)};});
assert.equal(actual[0].workshop.topic,'trigonometry');assert.equal(actual[1].workshop.stage,'confirm');assert.equal(actual[1].workshop.rule,'elevation_height');
assert.match(actual[1].response.tutor_message_jopara,/observador|persona observa/);assert.match(actual[3].response.tutor_message_jopara,/Jaipuru tangente/);
assert.equal(actual[5].workshop.stage,'correct');assert.equal(actual[9].workshop.stage,'answer');assert.equal(actual[9].workshop.steps.length,1);
const brief=actual[9].response.tutor_message_jopara;
assert.ok(brief.split(/\s+/).length<65,brief);assert.match(brief,/Emboja’o/);assert.match(brief,/12 = 10 \+ 2/);assert.doesNotMatch(brief,/2808|seno|coseno|raíces|paréntesis|miles/);
assert.equal(actual[10].workshop.stage,'correct');assert.equal(actual[13].workshop.stage,'clarify');assert.match(actual[13].response.tutor_message_jopara,/Mboy grado/);assert.equal(actual[14].workshop.stage,'confirm');assert.equal(actual[16].workshop.stage,'correct');
for(const language of ['es','es_py']){const text=LessonEngine.response({...state,language,workshop:actual[9].workshop}).tutor_message_jopara;assert.doesNotMatch(text,/Emboja’o|Eipuru|Ehai/);assert.match(text,/12 = 10 \+ 2/);}
const php=spawnSync('C:/xampp1/php/php.exe',['tests/workshop_intake_trace.php'],{input:JSON.stringify(events),encoding:'utf8'});assert.equal(php.status,0,php.stderr);assert.deepEqual(actual,JSON.parse(php.stdout));
console.log('PASS: screenshot regressions, specific trig topic, building interpretation, missing-angle follow-up, concise single-step multiplication, Jopara and Spanish, PHP/JS parity');
