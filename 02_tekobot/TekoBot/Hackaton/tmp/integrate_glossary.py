from pathlib import Path
p=Path('assets/js/question_resolver.js');s=p.read_text(encoding='utf8');pos=s.index('    static cards()')
s=s[:pos]+'''    static higherTopic(message) {
        // 'Fórmulas trigonométricas derivadas' means derived identities, not calculus.
        const text=' '+this.normalize(message).replace(/formulas trigonometricas (?:fundamentales y )?derivadas/g,'identidades trigonometricas')+' ';
        return (window.TUTOR_CURRICULUM.advanced_topics||[]).find(topic=>topic.aliases.some(alias=>text.includes(' '+this.normalize(alias)+' ')))||null;
    }
    static scopeResponse(state) {
        return {tutor_message_jopara:window.TUTOR_CURRICULUM.glossary_policy.notice,
            formula_display:{latex:'',note:'Fuera del alcance de primer curso · '+state.scope_query.title},
            visual_action:{type:'none'},quick_options:[],scope:'higher_course',source_ids:[state.scope_query.source_id]};
    }
''' +s[pos:]
# Exact newly authored entries win ties against broad lesson cards.
s=s.replace('hits.sort((a,b)=>b.length-a.length);',"hits.sort((a,b)=>b.length-a.length || Number(b.key.startsWith('glossary:'))-Number(a.key.startsWith('glossary:')));")
# Scoped sources delivered to UI, definitions only for foundational entries when there is no separate detail.
s=s.replace("        output.tutor_message_jopara=parts.join('\\n\\n');", "        output.source_ids=[...new Set(cards.flatMap(card=>card.source_ids||[]))];\n        output.tutor_message_jopara=[...new Set(parts)].join('\\n\\n');")
p.write_text(s,encoding='utf8')
p=Path('services/question_resolver.php');s=p.read_text(encoding='utf8');pos=s.index('    public static function cards()')
s=s[:pos]+'''    public static function higherTopic(string $message): ?array {
        $text=' '.preg_replace('/formulas trigonometricas (?:fundamentales y )?derivadas/u','identidades trigonometricas',self::normalize($message)).' ';
        foreach(CurriculumService::all()['advanced_topics']??[] as $topic)foreach($topic['aliases'] as $alias)if(str_contains($text,' '.self::normalize($alias).' '))return $topic;
        return null;
    }
    public static function scopeResponse(array $state): array {
        return ['tutor_message_jopara'=>CurriculumService::all()['glossary_policy']['notice'],
            'formula_display'=>['latex'=>'','note'=>'Fuera del alcance de primer curso · '.$state['scope_query']['title']],
            'visual_action'=>['type'=>'none'],'quick_options'=>[],'scope'=>'higher_course','source_ids'=>[$state['scope_query']['source_id']]];
    }
''' +s[pos:]
s=s.replace("usort($hits,fn($a,$b)=>$b['length']<=>$a['length']);", "usort($hits,fn($a,$b)=>($b['length']<=>$a['length'])?:((int)str_starts_with($b['key'],'glossary:')<=>(int)str_starts_with($a['key'],'glossary:')));")
s=s.replace('$output[\'tutor_message_jopara\']=implode("\\n\\n",$parts);', "$output['source_ids']=array_values(array_unique(array_merge(...array_map(fn($card)=>$card['source_ids']??[],$cards))));\n        $output['tutor_message_jopara']=implode(\"\\n\\n\",array_unique($parts));")
p.write_text(s,encoding='utf8')
p=Path('assets/js/lesson_engine.js');s=p.read_text(encoding='utf8').replace('        delete s.last_response;', '''        delete s.last_response;
        const higher=action==='resume'?null:QuestionResolver.higherTopic(message);
        delete s.scope_query;
        if(higher){s.scope_query=higher;return s;}''')
s=s.replace('    static response(state) {','    static response(state) {\n        if(state.scope_query)return QuestionResolver.scopeResponse(state);');p.write_text(s,encoding='utf8')
p=Path('services/pedagogy_service.php');s=p.read_text(encoding='utf8').replace("        $problem = ProblemGuide::transition", "        $higher=$action==='resume'?null:QuestionResolver::higherTopic($message);\n        unset($state['scope_query']);\n        if($higher){$state['scope_query']=$higher;return $state;}\n        $problem = ProblemGuide::transition")
s=s.replace('    public static function response(array $state): array {','    public static function response(array $state): array {\n        if(isset($state[\'scope_query\']))return QuestionResolver::scopeResponse($state);');p.write_text(s,encoding='utf8')
p=Path('services/ai_service.php');s=p.read_text(encoding='utf8').replace('        if (isset($state[\'own_problem\'])) {',"        if(isset($state['scope_query']) || ($draft['scope']??'')==='higher_course')return $draft;\n        if (isset($state['own_problem'])) {",1);p.write_text(s,encoding='utf8')
# Build pipeline keeps glossary when curriculum is regenerated.
p=Path('scripts/build_question_bank.py');s=p.read_text(encoding='utf8');s+='\n# Reapply glossary and inverse-function content after rebuilding lesson cards.\nimport runpy\nrunpy.run_path(str(Path(__file__).resolve().with_name("build_glossary.py")))\n';p.write_text(s,encoding='utf8')
