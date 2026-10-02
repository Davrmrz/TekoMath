const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
global.window={};
for(const f of ['curriculum','language_data','language','problem_guide','question_resolver','problem_workshop_data','natural_problem','workshop_expression','general_problem','problem_workshop','trig_questions','lesson_engine'])vm.runInThisContext(fs.readFileSync(`assets/js/${f}.js`,'utf8'));
const cases=[['347 × 26','9.022',9022],['347x26','9022',9022],['12 + 8','20',20],['12 - 19','-7',-7],['24 ÷ 6','4',4],['1,5 × 2','3',3],['3/4 + 1/2','5/4',1.25],['(2/3) × (3/4)','1/2',.5],['(2/3) / (4/5)','5/6',5/6],['2 + 3 * 4','14',14],['(2 + 3) * 4','20',20],['2^3^2','512',512],['-2^2','-4',-4],['(-2)^2','4',4],['2^-3','0,125',.125],['√(81) + 1','10',10],['5!','120',120],['20% * 150','30',30],['sen(30)','0,5',.5],['ln(1)','0',0],['9.022 + 1','9.023',9023],['1.234,5 + 2','1.236,5',1236.5]];
const events=[];
for(const [statement,answer,expected] of cases){const plan=ProblemWorkshop.parse(statement);assert.ok(plan,statement);assert.ok(Math.abs(plan.expected-expected)<1e-9,statement);events.push(['otro','new_problem'],['Números','topic_arithmetic'],[statement,''],['Sí','confirm_data'],['pista','hint'],['siguiente','next_step'],[answer,'']);}
let state=LessonEngine.initial('funciones','concepto');state.workshop={stage:'topic'};
const actual=events.map(([m,a])=>{state=LessonEngine.transition(state,m,a);return {workshop:structuredClone(state.workshop),response:LessonEngine.response(state)};});
for(let i=6;i<actual.length;i+=7)assert.equal(actual[i].workshop.stage,'correct',cases[(i-6)/7][0]);
for(const i of [3,4,5])assert.doesNotMatch(actual[i].response.tutor_message_jopara,/fracci[oó]n|numerador|denominador/i);
const php=spawnSync('C:/xampp1/php/php.exe',['tests/workshop_intake_trace.php'],{input:JSON.stringify(events),encoding:'utf8',maxBuffer:5e6});assert.equal(php.status,0,php.stderr);assert.deepEqual(actual,JSON.parse(php.stdout));
for(const input of ['2 / 0','1/(2-2)','sqrt(-1)','ln(0)','tan(90)','(-1)!','2^101','2 +','2 ** 3','alert(1)','2 + 3 texto','(2+3','1..2+3'])assert.equal(ProblemWorkshop.parse(input),null,input);
for(const [input,value] of [['9.022',9022],['0.125',.125],['9,022',9.022],['1.234,56',1234.56],['3/4',.75],['1/0',null],['1 2',null]])assert.equal(ProblemWorkshop.number(input),value,input);
console.log('PASS: operation-specific teaching, localized answers, expression precedence, domains, and complete PHP/JS conversation parity (22 exercises)');
