// Local counterpart of PedagogyService. Curriculum content comes from the same JSON.
class LessonEngine {
    static labels = {
        explain:'Sí, explicame', known:'Ya conozco el tema', question:'Tengo una pregunta',
        example:'Mostrame un ejemplo', check:'Comprobar comprensión', understood:'Sí, se entiende',
        partial:'Más o menos', confused:'No entendí', practice:'Sí, vamos a practicar',
        more:'Explicame un poco más', resume:'Retomar donde estábamos', hint:'Dame una pista',
        review:'Repasar lo aprendido', finish:'Terminar por ahora'
    };
    static unit(topic) { return window.TUTOR_CURRICULUM.units.find(u=>u.key===topic); }
    static lesson(state) { return this.unit(state.topic)?.subtopics.find(t=>t.id===state.subtopic); }
    static initial(topic, subtopic) {
        const unit=this.unit(topic), lesson=unit.subtopics.find(t=>t.id===subtopic);
        return {schema_version:2,unit_id:unit.id,topic,subtopic,mode:'TOPIC_SELECTED',
            lesson:{section_id:lesson.sections[0].id,step:0,variant:0,completed_sections:[]},
            return_stack:[],active_exercise_id:null,hint_level:0,assistance_level:3,difficulty_level:1,
            error_counts:[],recent_evidence:[],remediation_target:null,revision:1};
    }
    static options(state) {
        const ids={TOPIC_SELECTED:['explain','known','question'],TEACHING_MODE:['example','question','confused'],
            EXAMPLE_MODE:['check','example','question','more'],QUESTION_MODE:['resume'],
            CHECK_UNDERSTANDING:['understood','partial','confused','question'],
            READY_CHECK:['practice','more','question'],PRACTICE_MODE:['hint','question','review'],
            REVIEW_MODE:['more','finish','question'],COMPLETED:['review','question']}[state.mode] || ['question'];
        if(state.return_stack.length && state.mode==='EXAMPLE_MODE') ids.push('resume');
        return TutorLanguage.options(ids.map(id=>({id,label:id==='example' && state.mode==='EXAMPLE_MODE'?'Mostrame otro ejemplo':this.labels[id]})),state.language);
    }
    static normalize(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[¿?¡!.]/g,'').trim(); }
    static conversationalAction(message,state) {
        if(state.workshop)return '';
        let text=QuestionResolver.normalize(message);
        // Recognize complete conversational requests, not keywords inside a math question.
        text=text.replace(/^(?:(?:bueno|dale|ok|okay|entonces|por favor|porfa)\s+)+/,'').replace(/\s+(?:por favor|porfa|gracias)$/,'');
        for(const [id,label] of Object.entries(this.labels)) {
            if([label,...['jopara','es_py','es'].map(lang=>TutorLanguage.text(label,lang,'UI'))].some(value=>QuestionResolver.normalize(value)===text))return id;
        }
        for(const [id,patterns] of Object.entries(TutorLanguage.data().conversation_intents||{})) {
            if(patterns.some(pattern=>new RegExp(pattern,'u').test(text)))return id;
        }
        return '';
    }
    static action(message, action, state) {
        if (action) return action;
        const text=this.normalize(message);
        const found=Object.keys(this.labels).find(k=>this.normalize(this.labels[k])===text);
        if (found) return found;
        if (/no entendi|no entiendo|mas o menos|explica\w* mejor|mejor explicacion|mas facil|mas simple/.test(text)) return 'confused';
        if (/otro ejemplo|un ejemplo/.test(text)) return 'example';
        if (/^(si|entendi|se entiende)$/.test(text)) return {TOPIC_SELECTED:'explain',CHECK_UNDERSTANDING:'understood',READY_CHECK:'practice'}[state.mode] || 'question_text';
        if (/^(explicame|explica|ensename)/.test(text) && state.mode==='TOPIC_SELECTED') return 'explain';
        return state.mode==='PRACTICE_MODE' && !/[?¿]|por que|que significa|ayuda/.test(message) ? 'answer' : 'question_text';
    }
    static transition(current, message, action='') {
        const s=JSON.parse(JSON.stringify(current)), lesson=this.lesson(s), mode=s.mode;
        action=action||this.conversationalAction(message,s);
        delete s.last_response;
        const higher=action==='resume'?null:(QuestionResolver.higherTopic(message)||((s.scope_query && !QuestionResolver.match(message).length && (QuestionResolver.isFollowup(QuestionResolver.normalize(message))||['more','example','confused'].includes(action)))?s.scope_query:null));
        delete s.scope_query;
        if(higher){s.scope_query=higher;return s;}
        if(s.workshop)return ProblemWorkshop.transition(s,message,action);
        if(TrigQuestions.transition(s,message,action))return s;
        if(ProblemGuide.start(s,message,action)) return s;
        const routingAction=action || Object.keys(this.labels).find(k=>this.normalize(this.labels[k])===this.normalize(message)) || '';
        if(routingAction==='resume') delete s.question_context;
        const question=QuestionResolver.transition(s,message,routingAction);
        if(question) return question;
        action=this.action(message,action,s); s.feedback=null; s.question_pending=false;
        const allowed=this.options(s).map(o=>o.id);
        if (['question','question_text'].includes(action)) {
            if (mode!=='QUESTION_MODE') s.return_stack.push({mode,lesson:{...s.lesson,completed_sections:[...s.lesson.completed_sections]},active_exercise_id:s.active_exercise_id});
            s.mode='QUESTION_MODE';s.question_pending=action==='question';
            if(action==='question_text')s.question_context={keys:[],intent:'definition',message,example_index:0};
        } else if (action==='resume' && (mode==='QUESTION_MODE' || s.return_stack.length)) {
            Object.assign(s,s.return_stack.pop() || {mode:'TEACHING_MODE'});
        } else if(action==='example' && ['TEACHING_MODE','EXAMPLE_MODE','QUESTION_MODE','CHECK_UNDERSTANDING','READY_CHECK'].includes(mode)) {
            s.lesson.example_variant=(mode==='EXAMPLE_MODE'||this.normalize(message).includes('otro ejemplo')) ? (s.lesson.example_variant||0)+1 : 0;
            s.mode='EXAMPLE_MODE';
        } else if (['confused','partial','more'].includes(action)) {
            if (mode==='QUESTION_MODE' && s.return_stack.length) Object.assign(s,s.return_stack.pop());
            s.mode='TEACHING_MODE';s.lesson.variant=action==='more'?0:(s.lesson.variant||0)+1;
        } else if (allowed.includes(action)) {
            switch(action) {
                case 'explain':s.mode='TEACHING_MODE';break;
                case 'known':s.mode='READY_CHECK';break;
                case 'example':s.mode='EXAMPLE_MODE';break;
                case 'check':s.mode='CHECK_UNDERSTANDING';break;
                case 'understood':
                    s.lesson.completed_sections=[...new Set([...s.lesson.completed_sections,s.lesson.section_id])];
                    if(s.lesson.step+1<lesson.sections.length) {
                        s.lesson.step++;s.lesson.section_id=lesson.sections[s.lesson.step].id;s.lesson.variant=0;s.mode='TEACHING_MODE';
                    } else s.mode='READY_CHECK';
                    break;
                case 'practice':s.mode='PRACTICE_MODE';s.active_exercise_id=lesson.practice?.id||'reflection';s.hint_level=0;break;
                case 'hint':s.hint_level=Math.min(4,s.hint_level+1);s.feedback='hint';break;
                case 'review':s.mode='REVIEW_MODE';break;
                case 'finish':s.mode='COMPLETED';break;
            }
        } else if (action==='answer' && mode==='PRACTICE_MODE') {
            if(lesson.practice?.answers.includes(this.normalize(message))) {s.feedback='correct';s.mode='REVIEW_MODE';}
            else s.feedback=lesson.practice?'try_again':'reflection';
        }
        return s;
    }
    static response(state) {
        if(state.scope_query)return QuestionResolver.scopeResponse(state);
        if(state.workshop)return ProblemWorkshop.response(state);
        if(state.numeric_query)return TrigQuestions.response(state);
        if(state.own_problem) return ProblemGuide.response(state);
        if(state.mode==='QUESTION_MODE' && !state.question_pending) return QuestionResolver.response(state);
        return TutorLanguage.response(this.rawResponse(state),state);
    }
    static rawResponse(s) {
        const lesson=this.lesson(s), section=lesson.sections[s.lesson.step]||lesson.sections[0], title=lesson.title;
        let text='',formula='',visual={type:'none'};
        switch(s.mode) {
            case 'TOPIC_SELECTED':text=`Hola.\nVamos a estudiar **${title}**. ¿Querés que primero te explique desde el principio?`;break;
            case 'TEACHING_MODE':text=`**${title}**\n\n${s.lesson.variant>0?section.alternative:section.concept}`;formula=section.formula;visual=section.visual;break;
            case 'EXAMPLE_MODE': {
                const alternate=(s.lesson.example_variant||0)%2===1;
                text=`Veamos un ejemplo del profesor.\n\n${alternate?section.example_alt:section.example}\n\nEste ejemplo está resuelto para mostrarte cómo se usa la idea.`;formula=section.formula;visual=alternate?{type:'none'}:section.visual;break;
            }
            case 'QUESTION_MODE':text='¿Qué parte querés que aclaremos? Podés escribir tu duda; guardé el punto donde estábamos.';break;
            case 'CHECK_UNDERSTANDING':text=`Hasta acá trabajamos esta idea:\n\n${section.concept}\n\n¿Se entiende esta relación?`;break;
            case 'READY_CHECK':text=`Ya tenemos una base para **${title}**. ¿Querés que empecemos a practicar? También podemos explicar un poco más.`;break;
            case 'PRACTICE_MODE':
                text=lesson.practice?.prompt||`Vamos a razonar sobre **${title}**: explicá con tus palabras qué representa cada dato de la fórmula y por qué se usa en el ejemplo. Esta primera actividad es una reflexión guiada, sin calificación automática.`;
                if(['hint','try_again'].includes(s.feedback)) text='Vamos por partes. '+(lesson.practice?.hint||'Identificá la entrada, la salida y la relación que las conecta. Empezá por una sola idea.');
                if(s.feedback==='reflection') text='Gracias por explicar tu razonamiento. En esta actividad local no voy a marcarlo como correcto sin comprobarlo. Podés comparar tu explicación con el ejemplo o hacer una pregunta concreta.';
                break;
            case 'REVIEW_MODE':text=(s.feedback==='correct'?`¡Bien! ${lesson.practice?.explanation||''}\n\n`:'')+`**Repaso: ${title}**\n\n${section.concept}\n\nUna actividad no alcanza para afirmar dominio. Podés seguir repasando o terminar por ahora.`;formula=section.formula;break;
            default:text=`Guardamos el punto de esta lección de **${title}**. Cuando quieras, podés volver a repasarla.`;
        }
        if(s.mode==='TEACHING_MODE') {
            const card=QuestionResolver.cards().find(c=>c.key===`${s.topic}:${s.subtopic}`);
            if(s.lesson.variant>0)text=`**${title}**\n\n${card?.simple||card?.definition||section.concept}\n\n¿Qué parte te cuesta: identificar los datos o entender la relación?`;
            else {
                const blocks=['**'+title+'**','**La idea principal**\n'+section.concept];
                if(card?.detail && card.detail!==section.concept && !card.detail.includes(section.example))blocks.push('**Entendamos la relación**\n'+card.detail);
                if(card?.why)blocks.push('**Por qué funciona**\n'+card.why);
                if(card?.usage)blocks.push('**Cuándo usarlo**\n'+card.usage);
                blocks.push('**Veamos cómo se aplica**\n'+section.example);
                if(section.example_alt && section.example_alt!==section.example)blocks.push('**Otro ejemplo para comparar**\n'+section.example_alt+'\n\nCompará los datos de ambos ejemplos: pueden cambiar las cantidades o la forma de presentar el problema, pero la definición y las condiciones de la relación siguen siendo las mismas. Identificá qué se conserva antes de hacer una cuenta nueva.');
                if(card?.warning)blocks.push('**Qué conviene revisar**\n'+card.warning);
                blocks.push('**Cómo razonar con esta idea**\nAntes de calcular, identificá qué representa cada dato y qué cantidad buscás. Relacioná esos datos con la definición; después elegí la fórmula y comprobá sus condiciones. En el ejemplo, seguí cada transformación y preguntate por qué es válida.\n\nPara comprobar que entendiste, explicá con tus palabras qué relación usamos y qué cambiaría si cambiara uno de los datos. Podés pedirme otro ejemplo o una explicación más sencilla.');
                text=blocks.join('\n\n');
            }
        }
        return {tutor_message_jopara:text,formula_display:{latex:formula,note:title},visual_action:visual,quick_options:this.options(s)};
    }
}
window.LessonEngine=LessonEngine;
