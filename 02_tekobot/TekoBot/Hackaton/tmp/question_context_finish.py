from pathlib import Path
p=Path('assets/js/question_resolver.js');s=p.read_text(encoding='utf8')
s=s.replace('ese esa lo la', 'ese esa esta este lo la')
s=s.replace("        if(previous?.intent==='compare'", """        if(!keys.length && !previous && referential && ['TEACHING_MODE','EXAMPLE_MODE','CHECK_UNDERSTANDING','READY_CHECK'].includes(state.mode)) {
            const current=`${state.topic}:${state.subtopic}`;
            if(this.cards().some(card=>card.key===current))keys=[current];
        }
        if(keys.length===1 && facets.includes(keys[0]) && !followup)chosenIntent='definition';
        if(previous?.intent==='compare'""")
p.write_text(s,encoding='utf8')
p=Path('services/question_resolver.php');s=p.read_text(encoding='utf8').replace('ese esa lo la','ese esa esta este lo la')
s=s.replace("        if(($previous['intent']??'')==='compare'", """        if(!$keys&&!$previous&&$referential&&in_array($state['mode'],['TEACHING_MODE','EXAMPLE_MODE','CHECK_UNDERSTANDING','READY_CHECK'],true)){
            $current=$state['topic'].':'.$state['subtopic'];
            if(array_filter(self::cards(),fn($card)=>$card['key']===$current))$keys=[$current];
        }
        if(count($keys)===1&&in_array($keys[0],$facets,true)&&!$followup)$chosenIntent='definition';
        if(($previous['intent']??'')==='compare'""")
p.write_text(s,encoding='utf8')
# New focused/simplified prompts remain localized.
p=Path('database/language_profiles.json');import json;d=json.loads(p.read_text(encoding='utf8'))
d['phrases'].append({'source':'Explicámelo más fácil','context':'UI','jopara':'Jahecha de otra manera','es_py':'Explicame más fácil','es':'Explícamelo de forma sencilla'})
d['neutral_words'].update({'pensalo':'piénsalo','agrandás':'agrandas','indicá':'indica','subís':'subes','avanzás':'avanzas'})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
# Invalidate stale copies of the response engine at both entry points (index.php serves index.html).
p=Path('index.html');s=p.read_text(encoding='utf8')
for f in ['curriculum','question_resolver','problem_guide','lesson_engine','language_data','language','app']:
    s=s.replace(f'assets/js/{f}.js"',f'assets/js/{f}.js?v=20260926-context"')
p.write_text(s,encoding='utf8')
p=Path('views/footer.php');s=p.read_text(encoding='utf8')
for f in ['curriculum','question_resolver','problem_guide','lesson_engine','language_data','language','app']:
    s=s.replace(f'assets/js/{f}.js"',f'assets/js/{f}.js?v=20260926-context"')
p.write_text(s,encoding='utf8')
