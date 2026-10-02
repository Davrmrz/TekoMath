const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{spawnSync}=require('child_process');
global.window={};for(const f of ['curriculum','language_data','language','problem_guide','question_resolver','trig_questions','lesson_engine'])vm.runInThisContext(fs.readFileSync(`assets/js/${f}.js`,'utf8'));
const events=[['que es una fraccion',''],['dame un ejemplo',''],['que es el arcoseno',''],['y su dominio',''],['explicame arcotangente',''],['que es cosecante',''],['que es una derivada',''],['explicame mas',''],['deriva x^2','own_problem'],['que es una ecuacion cuadratica',''],['que es una matriz',''],['que es un limite',''],['que es la tangente',''],['explica las formulas trigonometricas derivadas',''],['que es una integral',''],['que es un agujero negro',''],['que es el mcd','']];
let state=LessonEngine.initial('funciones','trigonometricas_intro');const actual=[];
for(const [message,action] of events){state=LessonEngine.transition(state,message,action);actual.push({state,response:LessonEngine.response(state)});}
const r=spawnSync('C:/xampp1/php/php.exe',['tests/question_trace.php'],{input:JSON.stringify(events),encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');const expected=JSON.parse(r.stdout);
for(let i=0;i<actual.length;i++){delete expected[i].response.pedagogical_state;assert.deepEqual(actual[i],expected[i],`turn ${i}`);}
const text=i=>actual[i].response.tutor_message_jopara,notice='esa pregunta abarca a temas de un curso mayor';
assert.match(text(0),/denominador/);assert.match(text(1),/3\/4/);assert.match(text(2),/ángulo principal/);assert.equal(actual[2].response.visual_action.funcType,'asin');assert.match(text(3),/−1, 1/);
assert.match(text(4),/No es 1\/tan/);assert.equal(actual[4].response.visual_action.funcType,'atan');assert.match(text(5),/Recíproco|recíproco/);
for(const i of [6,7,8,10,11,14]){assert.equal(text(i),notice,`scope turn ${i}`);assert.equal(actual[i].response.formula_display.latex,'');}
assert.match(text(9),/ax²/);assert.match(text(12),/cateto opuesto/);assert.notEqual(text(13),notice);assert.match(text(15),/No identifiqué/);assert.match(text(16),/divisor positivo/);
const glossary=QuestionResolver.cards();assert.ok(glossary.length>250);assert.equal(new Set(glossary.map(c=>c.key)).size,glossary.length);
for(const c of glossary){assert.ok(c.definition&&c.example&&c.scope,c.key);for(const id of c.source_ids)assert.ok(window.TUTOR_CURRICULUM.glossary_sources[id]);}
// Known advanced topics never reach AI, even with an own-problem state.
let own=LessonEngine.initial('funciones','concepto');own.own_problem={statement:'Resolver 2x+6=14'};
let blocked=LessonEngine.transition(own,'calcular la integral de x^2');assert.equal(LessonEngine.response(blocked).scope,'higher_course');assert.deepEqual(blocked.own_problem,own.own_problem);
assert.deepEqual(blocked.lesson,own.lesson);
console.log(`PASS: ${glossary.length} sourced concepts, inverse trig/reciprocal distinction, higher-course gate before own problems, follow-ups, unknowns and PHP/JS parity`);
