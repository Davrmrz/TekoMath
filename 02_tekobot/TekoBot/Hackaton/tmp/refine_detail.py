from pathlib import Path
p=Path('assets/js/question_resolver.js');s=p.read_text(encoding='utf8').replace("const keys=matched.length?", "let keys=matched.length?")
s=s.replace("        if(/dominio|recorrido", "        if(previous?.intent==='compare' && previous.keys.length===1 && matched.length===1 && previous.keys[0]!==matched[0]) {keys=[previous.keys[0],matched[0]];intent='compare';}\n        if(/dominio|recorrido")
s=s.replace("            else if(q.intent==='why')", "            else if(q.intent==='detail')parts.push(card.definition,card.detail,card.why||card.example,card.usage||'Volvé a leer la definición e identificá qué datos se relacionan. En el ejemplo, comprobá qué representa cada cantidad antes de operar.');\n            else if(q.intent==='why')")
p.write_text(s,encoding='utf8')
p=Path('services/question_resolver.php');s=p.read_text(encoding='utf8').replace("        if(preg_match('/dominio|recorrido", "        if(($previous['intent']??'')==='compare'&&count($previous['keys'])===1&&count($matched)===1&&$previous['keys'][0]!==$matched[0]){$keys=[$previous['keys'][0],$matched[0]];$intent='compare';}\n        if(preg_match('/dominio|recorrido")
s=s.replace("            elseif($q['intent']==='why')", "            elseif($q['intent']==='detail')array_push($parts,$card['definition'],$card['detail'],$card['why']??$card['example'],$card['usage']??'Volvé a leer la definición e identificá qué datos se relacionan. En el ejemplo, comprobá qué representa cada cantidad antes de operar.');\n            elseif($q['intent']==='why')")
p.write_text(s,encoding='utf8')
