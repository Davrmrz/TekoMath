from pathlib import Path
p=Path('assets/js/question_resolver.js');s=p.read_text(encoding='utf8')
a=s.index('    static normalize');b=s.index('    static cards',a)
s=s[:a]+'''    static normalize(text) {
        return text.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')
            .replace(/[¿?¡!.,;:()"“”]/g,' ').replace(/\\b(?:pq|xq)\\b/g,'por que').replace(/\\bq\\b/g,'que')
            .replace(/\\s+/g,' ').trim();
    }
    static isFollowup(text) {
        const words=new Set('y por que como para sirve se usa funciona es son eso esto ese esa lo la el los las un una de del en al con sin su sus me mas detalle detalles explica explicame explicalo explicamelo explicar explicas explicarme entendi entiendo entendiendo quedo claro otra manera forma nuevo facil breve corto resumen pocas palabras sencillo sencilla simple otro otra ejemplo ejemplos mostrame muestrame dame das dar podes puedes podrias grafico grafica dibuja dibujalo representa representar visualmente concepto relacion paso pasos aplica utiliza positiva positivo negativas negativo negativa positivos cuadrante primero segundo tercer tercero cuarto mismo misma cuando donde cual signo dominio recorrido rango definida definido existe puede ampliar si no porfa favor nomas entonces'.split(' '));
        return text.split(' ').every(word=>words.has(word)||/^\\d+$/.test(word));
    }
    static intent(text,action) {
        if(/diferencia|compar|versus|\\bvs\\b/.test(text))return 'compare';
        if(/recorrido|rango|valores.*salida/.test(text))return 'range';
        if(/dominio|definida|definido|existe/.test(text))return 'domain';
        if(/signo|positiv|negativ|cuadrante/.test(text))return 'signs';
        if(/ejemplo/.test(text)||action==='example')return 'example';
        if(/por que(?: |$)/.test(text))return 'why';
        if(/para que|sirve|aplica|utiliza/.test(text))return 'usage';
        if(/graf|dibuj|represent.*visual/.test(text))return 'graph';
        if(/no ent|no me quedo claro|facil|sencill|simple|resum|breve|corto|pocas palabras|otra manera|otra forma/.test(text)||['confused','partial'].includes(action))return 'simple';
        if(/mas |detalle|explica/.test(text)||action==='more')return 'detail';
        return 'definition';
    }
''' +s[b:]
a=s.index('    static transition(');b=s.index('    static response(',a)
s=s[:a]+'''    static transition(state,message,action) {
        if(action==='resume'){delete state.question_context;return null;}
        if(action && !['example','more','confused','partial'].includes(action))return null;
        const text=this.normalize(message),intent=this.intent(text,action);
        const previous=state.mode==='QUESTION_MODE'?state.question_context:null;
        let matched=this.match(message);
        const facets=['funciones:dominio','funciones:recorrido','trigonometria:signos'];
        const focused=['domain','range','signs','graph'].includes(intent);
        const concrete=matched.filter(key=>!facets.includes(key));
        if(intent!=='compare' && concrete.length)matched=concrete;
        const explicitQuestion=/[¿?]/.test(message)||/^(que|como|por que|cual|para que|explica|hablame|contame|decime|dime|mostrame|muestrame|dame|me |puedes|podes|podrias|no ent|no me quedo)/.test(text);
        if(state.mode==='PRACTICE_MODE'&&!explicitQuestion)return null;
        const referential=this.isFollowup(text) && /^(y |por que|como|para que|no |mas |otra |otro |un ejemplo|dame|mostrame|muestrame|explica|si |eso|en que|ver |graf|me |puedes|podes|podrias|cual|resum)/.test(text);
        const followup=previous && (['example','more','confused','partial'].includes(action)||referential);
        if(!matched.length && !previous && action)return null;
        if(!matched.length && state.mode==='TOPIC_SELECTED' && ['explicame','explica','ensename'].includes(text))return null;
        if(!matched.length && !followup && !explicitQuestion && state.mode!=='QUESTION_MODE')return null;
        // A named concept wins. A pronoun or short follow-up refers to the last answer.
        if(previous?.keys?.length && focused && !concrete.length && referential)matched=[];
        let keys=matched.length?matched:(followup?(previous.keys||[]):[]),chosenIntent=intent;
        if(previous?.intent==='compare' && previous.keys.length===1 && matched.length===1 && previous.keys[0]!==matched[0]) {keys=[previous.keys[0],matched[0]];chosenIntent='compare';}
        if(state.mode!=='QUESTION_MODE')state.return_stack.push({mode:state.mode,lesson:JSON.parse(JSON.stringify(state.lesson)),active_exercise_id:state.active_exercise_id});
        state.mode='QUESTION_MODE';state.question_pending=false;state.feedback=null;
        const same=previous && JSON.stringify(previous.keys)===JSON.stringify(keys);
        state.question_context={keys,intent:chosenIntent,message,example_index:chosenIntent==='example'&&same&&previous.intent==='example'?previous.example_index+1:0};
        return state;
    }
''' +s[b:]
s=s.replace('const q=state.question_context;','const q=state.question_context||{keys:[],intent:\'definition\'};')
s=s.replace("const quick=[{id:'example',label:'Dame un ejemplo'},{id:'more',label:'Explicá con más detalle'},{id:'resume',label:'Retomar donde estábamos'}];", "const quick=[{id:q.intent==='example'?'more':'example',label:q.intent==='example'?'Explicá por qué funciona':'Dame un ejemplo'},{id:'confused',label:'Explicámelo más fácil'},{id:'resume',label:'Retomar donde estábamos'}];")
s=s.replace("        const parts=[];", """        const focused=['domain','range','signs','graph'].includes(q.intent);
        if(focused && cards.some(card=>!card[q.intent])) {
            const labels={domain:'el dominio',range:'el recorrido',signs:'los signos',graph:'la gráfica'};
            output.tutor_message_jopara=`Identifiqué **${cards.map(c=>c.title).join(' y ')}**, pero no tengo una explicación específica de ${labels[q.intent]} para esa consulta. Escribí la función o indicá qué parte querés revisar.`;
            return output;
        }
        const parts=[];""")
s=s.replace("if(['domain','signs','graph'].includes(q.intent) && card[q.intent])", "if(focused && card[q.intent])")
s=s.replace("else if(q.intent==='example')", "else if(q.intent==='simple')parts.push(card.simple||card.definition);\n            else if(q.intent==='example')",1)
s=s.replace("else parts.push(card.definition,`**Cómo entenderlo**\\n${card.detail}`);", "else parts.push(card.definition);")
s=s.replace("if(card.warning)parts.push", "if(card.warning && ['detail','example'].includes(q.intent))parts.push")
p.write_text(s,encoding='utf8')
