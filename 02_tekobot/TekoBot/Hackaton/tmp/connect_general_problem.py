from pathlib import Path
p=Path('assets/js/problem_workshop.js');s=p.read_text(encoding='utf8').replace('static parse(message){','static parse(message,topic=\'unsure\'){').replace('const natural=NaturalProblem.parse(text);','const general=GeneralProblem.parse(text,topic);if(general)return general;\n  const natural=NaturalProblem.parse(text);')
s=s.replace('this.parse(message)','this.parse(message,w.topic)').replace('this.parse(statement)','this.parse(statement,w.topic)').replace('this.parse(w.statement)','this.parse(w.statement,w.topic)')
s=s.replace('unit:plan.unit}',"...(plan.unit?{unit:plan.unit}:{}),...(plan.ast?{ast:plan.ast,answer_unit:plan.answer_unit}:{})}")
p.write_text(s,encoding='utf8')
p=Path('services/problem_workshop.php');s=p.read_text(encoding='utf8').replace("require_once __DIR__.'/workshop_expression.php';", "require_once __DIR__.'/workshop_expression.php';\nrequire_once __DIR__.'/general_problem.php';").replace('parse(string $message):','parse(string $message,string $topic=\'unsure\'):').replace('$natural=NaturalProblem::parse($text);', '$general=GeneralProblem::parse($text,$topic);if($general)return $general;\n  $natural=NaturalProblem::parse($text);')
s=s.replace('self::parse($message)',"self::parse($message,$w['topic']??'unsure')").replace('self::parse($statement)',"self::parse($statement,$w['topic']??'unsure')").replace("self::parse($w['statement'])","self::parse($w['statement'],$w['topic']??'unsure')").replace("['steps','hint','summary','unit']","['steps','hint','summary','unit','ast','answer_unit']")
p.write_text(s,encoding='utf8')
for name in ['index.html','views/footer.php']:
 p=Path(name);s=p.read_text(encoding='utf8').replace('<script src="assets/js/problem_workshop.js','<script src="assets/js/general_problem.js?v=20260926-intake"></script>\n<script src="assets/js/problem_workshop.js');p.write_text(s,encoding='utf8')
for name in ['tests/workshop_test.cjs','tests/natural_workshop_test.cjs','tests/workshop_intake_test.cjs']:
 p=Path(name);s=p.read_text(encoding='utf8').replace("'workshop_expression','problem_workshop'","'workshop_expression','general_problem','problem_workshop'");p.write_text(s,encoding='utf8')
