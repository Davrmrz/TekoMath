const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
global.window={};
vm.runInThisContext(fs.readFileSync('assets/js/curriculum.js','utf8'));
for(const file of ['language_data','language'])vm.runInThisContext(fs.readFileSync(`assets/js/${file}.js`,'utf8'));
vm.runInThisContext(fs.readFileSync('assets/js/problem_guide.js','utf8'));
vm.runInThisContext(fs.readFileSync('assets/js/question_resolver.js','utf8'));
vm.runInThisContext(fs.readFileSync('assets/js/trig_questions.js','utf8'));
vm.runInThisContext(fs.readFileSync('assets/js/lesson_engine.js','utf8'));
const events=[['','explain'],['¿Por qué seno usa Y?',''],['','resume'],['No entendí',''],['','example'],['','check'],['Sí',''],['','example'],['','check'],['','understood'],['','question'],['','resume'],['','practice'],['12',''],['','hint'],['segundo cuadrante',''],['','finish']];
const php=process.env.TEST_PHP || 'C:/xampp1/php/php.exe';
const r=spawnSync(php,['tests/pedagogy_trace.php'],{input:JSON.stringify(events),encoding:'utf8'});
assert.equal(r.status,0,r.stderr);
const expected=JSON.parse(r.stdout), actual=[];
let state=LessonEngine.initial('trigonometria','circunferencia');
for(const [message,action] of events) {state=LessonEngine.transition(state,message,action);actual.push(state);}
assert.deepEqual(actual,expected);
assert.deepEqual(window.TUTOR_CURRICULUM,JSON.parse(fs.readFileSync('database/curriculum.json','utf8')));
console.log('PASS: PHP/JavaScript transition parity and generated curriculum');
