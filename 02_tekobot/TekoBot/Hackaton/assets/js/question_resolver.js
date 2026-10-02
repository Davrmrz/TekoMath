// Concept retrieval is deliberately separate from the selected lesson and scored practice.
class QuestionResolver {
    static normalize(text) {
        return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
            .replace(/[¿?¡!.,;:()"“”]/g,' ').replace(/\b(?:pq|xq)\b/g,'por que').replace(/\bq\b/g,'que')
            .replace(/\s+/g,' ').trim();
    }
    static isFollowup(text) {
        const words=new Set('y por que como para sirve se usa funciona es son eso esto ese esa esta este lo la el los las un una de del en al con sin su sus me mas detalle detalles explica explicame explicalo explicamelo explicar explicas explicarme entendi entiendo entendiendo quedo claro otra manera forma nuevo mejor explicacion facil breve corto resumen pocas palabras sencillo sencilla simple otro otra ejemplo ejemplos mostrame muestrame dame das dar podes puedes podrias grafico grafica dibuja dibujalo representa representar visualmente concepto relacion paso pasos aplica utiliza positiva positivo negativas negativo negativa positivos cuadrante primero segundo tercer tercero cuarto mismo misma cuando donde cual signo dominio recorrido rango definida definido existe puede ampliar si no porfa favor nomas entonces'.split(' '));
        return text.split(' ').every(word=>words.has(word)||/^\d+$/.test(word));
    }
    static intent(text,action) {
        if(/diferencia|compar|versus|\bvs\b/.test(text))return 'compare';
        if(/dominio/.test(text)&&/recorrido|rango/.test(text))return 'domain_range';
        if(/recorrido|rango|valores.*salida/.test(text))return 'range';
        if(/dominio|definida|definido|existe/.test(text))return 'domain';
        if(/signo|positiv|negativ|cuadrante/.test(text))return 'signs';
        if(/ejemplo/.test(text)||action==='example')return 'example';
        if(/por que(?: |$)/.test(text))return 'why';
        if(/para que|sirve|aplica|utiliza/.test(text))return 'usage';
        if(/graf|dibuj|represent.*visual/.test(text))return 'graph';
        if(/no ent|no me quedo claro|facil|sencill|simple|resum|breve|corto|pocas palabras|otra manera|otra forma|explica\w* mejor|mejor explicacion/.test(text)||['confused','partial'].includes(action))return 'simple';
        if(/mas |detalle|explica/.test(text)||action==='more')return 'detail';
        return 'definition';
    }
    static higherTopic(message) {
        // 'Fórmulas trigonométricas derivadas' means derived identities, not calculus.
        const text=' '+this.normalize(message).replace(/formulas trigonometricas (?:fundamentales y )?derivadas/g,'identidades trigonometricas')+' ';
        return (window.TUTOR_CURRICULUM.advanced_topics||[]).find(topic=>topic.aliases.some(alias=>text.includes(' '+this.normalize(alias)+' ')))||null;
    }
    static scopeResponse(state) {
        return {tutor_message_jopara:window.TUTOR_CURRICULUM.glossary_policy.notice,
            formula_display:{latex:'',note:'Fuera del alcance de primer curso · '+state.scope_query.title},
            visual_action:{type:'none'},quick_options:[],scope:'higher_course',source_ids:[state.scope_query.source_id]};
    }
    static cards(){return window.TUTOR_CURRICULUM.question_bank||[];}
    static match(message) {
        const text=' '+this.normalize(message)+' ', hits=[];
        for(const card of this.cards()) for(const raw of card.aliases) {
            const alias=' '+this.normalize(raw)+' ',start=text.indexOf(alias);
            if(start>=0)hits.push({key:card.key,start,end:start+alias.length-1,length:alias.length});
        }
        hits.sort((a,b)=>b.length-a.length || Number(b.key.startsWith('glossary:'))-Number(a.key.startsWith('glossary:')));
        const chosen=[];
        for(const hit of hits) if(!chosen.some(x=>x.key===hit.key || (hit.start<x.end && hit.end>x.start))) chosen.push(hit);
        const result=chosen.sort((a,b)=>a.start-b.start).map(h=>h.key);
        return result.length>1?result.filter(k=>k!=='funciones:concepto'):result;
    }
    static transition(state,message,action) {
        if(action==='resume'){delete state.question_context;return null;}
        if(action && !['example','more','confused','partial'].includes(action))return null;
        const text=this.normalize(message),intent=this.intent(text,action);
        const previous=state.mode==='QUESTION_MODE'?state.question_context:null;
        let matched=this.match(message);
        const facets=['funciones:dominio','funciones:recorrido','trigonometria:signos'];
        const focused=['domain','range','domain_range','signs','graph'].includes(intent);
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
        if(!keys.length && !previous && referential && ['TEACHING_MODE','EXAMPLE_MODE','CHECK_UNDERSTANDING','READY_CHECK'].includes(state.mode)) {
            const current=`${state.topic}:${state.subtopic}`;
            if(this.cards().some(card=>card.key===current))keys=[current];
        }
        if(keys.length && keys.every(key=>facets.includes(key)) && !followup)chosenIntent='definition';
        if(previous?.intent==='compare' && previous.keys.length===1 && matched.length===1 && previous.keys[0]!==matched[0]) {keys=[previous.keys[0],matched[0]];chosenIntent='compare';}
        if(state.mode!=='QUESTION_MODE')state.return_stack.push({mode:state.mode,lesson:JSON.parse(JSON.stringify(state.lesson)),active_exercise_id:state.active_exercise_id});
        state.mode='QUESTION_MODE';state.question_pending=false;state.feedback=null;
        const same=previous && JSON.stringify(previous.keys)===JSON.stringify(keys);
        state.question_context={keys,intent:chosenIntent,message,example_index:chosenIntent==='example'&&same&&previous.intent==='example'?previous.example_index+1:0};
        return state;
    }
    static response(state) {
        return TutorLanguage.response(this.rawResponse(state),state);
    }
    static rawResponse(state) {
        const q=state.question_context||{keys:[],intent:'definition'};
        const cards=q.keys.map(k=>this.cards().find(c=>c.key===k)).filter(Boolean);
        const quick=[{id:q.intent==='example'?'more':'example',label:q.intent==='example'?'Explicá con más detalle':'Dame un ejemplo'},{id:'confused',label:'Explicámelo más fácil'},{id:'resume',label:'Retomar donde estábamos'}];
        const output={formula_display:{latex:'',note:'Consulta puntual · La lección conserva su lugar'},visual_action:{type:'none'},quick_options:quick};
        if(!cards.length || cards.length>2 || (q.intent==='compare'&&cards.length<2)) {
            output.tutor_message_jopara=cards.length===1?`¿Con qué concepto querés comparar **${cards[0].title}**? Escribí los dos nombres para que pueda explicar sus diferencias.`:'No identifiqué con suficiente precisión el concepto de tu pregunta. ¿Podés nombrarlo o escribir la parte que querés entender? Por ejemplo: «qué es tangente», «diferencia entre seno y coseno» o «qué es dominio». Conservé el punto de tu lección.';
            output.quick_options=[{id:'resume',label:'Retomar donde estábamos'}];return output;
        }
        const focused=['domain','range','domain_range','signs','graph'].includes(q.intent);
        if(focused && cards.some(card=>q.intent==='domain_range'?(!card.domain||!card.range):!card[q.intent])) {
            const labels={domain_range:'el dominio y el recorrido',domain:'el dominio',range:'el recorrido',signs:'los signos',graph:'la gráfica'};
            output.tutor_message_jopara=`Identifiqué **${cards.map(c=>c.title).join(' y ')}**, pero no tengo una explicación específica de ${labels[q.intent]} para esa consulta. Escribí la función o indicá qué parte querés revisar.`;
            return output;
        }
        const parts=[];
        for(const card of cards) {
            parts.push(`**${card.title}**`);
            if(q.intent==='domain_range')parts.push(`**Dominio**\n${card.domain}`,`**Recorrido**\n${card.range}`);
            else if(focused && card[q.intent]) parts.push(card[q.intent]);
            else if(q.intent==='simple')parts.push(card.simple||card.definition);
            else if(q.intent==='example')parts.push('**Ejemplo docente, paso a paso**',card.definition,q.example_index%2?card.example_alt:card.example,`**Por qué se usa esta relación**\n${card.why||card.detail}`);
            else if(q.intent==='detail')parts.push(card.definition,card.detail,card.why||card.example,card.usage||'Volvé a leer la definición e identificá qué datos se relacionan. En el ejemplo, comprobá qué representa cada cantidad antes de operar.');
            else if(q.intent==='why')parts.push(card.why||`La relación se entiende a partir de esta idea: ${card.definition}\n\n${card.detail}`);
            else if(q.intent==='usage')parts.push(card.usage||`${card.definition}\n\n${card.detail}`,`**Ejemplo de aplicación**\n${card.example}`);
            else if(q.intent==='compare'||cards.length===2)parts.push(card.definition,card.detail);
            else parts.push(card.definition);
            if(card.warning && ['detail','example'].includes(q.intent))parts.push(`**Qué conviene revisar**\n${card.warning}`);
        }
        if(cards.length===2) {
            const comparisons=window.TUTOR_CURRICULUM.question_comparisons||{};
            const contrast=comparisons[cards.map(c=>c.key).join('|')]||comparisons[[...cards].reverse().map(c=>c.key).join('|')]||'Cada definición relaciona datos diferentes. Compará sus condiciones de uso y sus fórmulas, que aparecen abajo en el mismo orden.';
            parts.push('**Diferencia clave**\n'+contrast);
        }
        output.source_ids=[...new Set(cards.flatMap(card=>card.source_ids||[]))];
        output.tutor_message_jopara=[...new Set(parts)].join('\n\n');
        output.formula_display={latex:cards.map(c=>c.formula).filter(Boolean).join('\\qquad '),note:cards.map(c=>c.title).join(' · ')};
        if(cards.length===1)output.visual_action=cards[0].visual;
        return output;
    }
}
window.QuestionResolver=QuestionResolver;
