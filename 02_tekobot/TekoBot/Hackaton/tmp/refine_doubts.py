from pathlib import Path
import json
p=Path('assets/js/lesson_engine.js');s=p.read_text(encoding='utf8');a=s.index("        if(['TEACHING_MODE','EXAMPLE_MODE','QUESTION_MODE'].includes(s.mode)");b=s.index('        return {tutor_message_jopara:',a)
s=s[:a]+"""        if(s.mode==='TEACHING_MODE') {
            const card=QuestionResolver.cards().find(c=>c.key===`${s.topic}:${s.subtopic}`);
            if(s.lesson.variant>0)text=`**${title}**\\n\\n${card?.simple||card?.definition||section.concept}\\n\\n¿Qué parte te cuesta: identificar los datos o entender la relación?`;
            else text+=`\\n\\n${section.example}`;
        }
"""+s[b:];p.write_text(s,encoding='utf8')
p=Path('services/pedagogy_service.php');s=p.read_text(encoding='utf8');a=s.index("        if (in_array($state['mode'], ['TEACHING_MODE','EXAMPLE_MODE','QUESTION_MODE']");b=s.index("        return ['tutor_message_jopara'",a)
s=s[:a]+"""        if($state['mode']==='TEACHING_MODE') {
            $card=null;foreach(QuestionResolver::cards() as $c)if($c['key']===$state['topic'].':'.$state['subtopic']){$card=$c;break;}
            if($state['lesson']['variant']>0)$text='**'.$title."**\\n\\n".($card['simple']??$card['definition']??$section['concept'])."\\n\\n¿Qué parte te cuesta: identificar los datos o entender la relación?";
            else $text.="\\n\\n".$section['example'];
        }
"""+s[b:];p.write_text(s,encoding='utf8')
for file in ['index.html','views/footer.php']:
 p=Path(file);s=p.read_text(encoding='utf8').replace('<script src="assets/js/lesson_engine.js','<script src="assets/js/trig_questions.js?v=20260926-doubts"></script>\n<script src="assets/js/lesson_engine.js').replace('20260926-intake','20260926-doubts');p.write_text(s,encoding='utf8')
p=Path('assets/js/app.js');s=p.read_text(encoding='utf8').replace("funcType: action.funcType || 'sin', triangleMode:","funcType: action.funcType || 'sin', angle: action.angle_deg ?? 30, triangleMode:");p.write_text(s,encoding='utf8')
# Tests load the same resolver used by the browser.
for p in Path('tests').glob('*.cjs'):
 s=p.read_text(encoding='utf8');s=s.replace("'lesson_engine'","'trig_questions','lesson_engine'")
 if "vm.runInThisContext(fs.readFileSync('assets/js/lesson_engine.js'" in s:s=s.replace("vm.runInThisContext(fs.readFileSync('assets/js/lesson_engine.js'","vm.runInThisContext(fs.readFileSync('assets/js/trig_questions.js','utf8'));\nvm.runInThisContext(fs.readFileSync('assets/js/lesson_engine.js'")
 p.write_text(s,encoding='utf8')
p=Path('database/language_profiles.json');d=json.loads(p.read_text(encoding='utf8'));pairs=[
('Vamos con una sola idea.','Jahecha mbeguekatúpe, peteĩ idea año.','Mirá, vamos con una sola idea.','Veamos una sola idea.'),
('El seno es la altura del punto en la circunferencia de radio uno.','Emaña porã: el seno nos dice a qué altura está el punto en la circunferencia de radio uno.','Fijate: el seno indica la altura del punto en la circunferencia de radio uno.','El seno indica la altura del punto en la circunferencia de radio uno.'),
('El coseno es la coordenada horizontal del punto en la circunferencia de radio uno.','Koʼápe jahecha el coseno: nos indica la posición horizontal del punto en la circunferencia de radio uno.','Mirá la posición horizontal del punto: eso indica el coseno en la circunferencia de radio uno.','El coseno indica la coordenada horizontal del punto en la circunferencia de radio uno.'),
('En la circunferencia unitaria es la coordenada vertical.','Upéva jahecha en la circunferencia unitaria: es la coordenada vertical.','En la circunferencia unitaria, fijate en la coordenada vertical.','En la circunferencia unitaria es la coordenada vertical.'),
('¿Qué parte te cuesta: identificar los datos o entender la relación?','Mbaʼépa ndereikuaaporãi: ¿los datos o la relación entre ellos? Jahecha oñondive.','Contame qué parte te cuesta: ¿los datos o la relación?','¿Qué parte te cuesta: identificar los datos o entender la relación?'),
('Primero identificá','Ñepyrũrã, ehecha','Primero fijate en','Primero identifica'),
('Ahora escribí tu resultado para comprobarlo.','Koʼág̃a ehai tu resultado; jahecháta si está bien.','Ahora pasame tu resultado y lo comprobamos.','Ahora escribe tu resultado para comprobarlo.'),
('Todavía no es correcto. Revisá tu cálculo y volvé a intentarlo.','Neʼĩra oĩ porã. Emaña jey al cálculo y probá otra vez.','Todavía no está bien. Revisá la cuenta y probá de nuevo.','Todavía no es correcto. Revisa el cálculo e inténtalo de nuevo.'),
('Revisemos la interpretación','Jahecha oñondive los datos','Revisemos qué entendimos','Revisemos la interpretación')]
for source,jopara,es_py,es in pairs:
 d['phrases']=[p for p in d['phrases'] if p['source']!=source];d['phrases'].append({'source':source,'jopara':jopara,'es_py':es_py,'es':es,'context':'GENERAL'})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
Path('assets/js/language_data.js').write_text('// Generated from database/language_profiles.json\nwindow.TUTOR_LANGUAGE_DATA = '+json.dumps(d,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
