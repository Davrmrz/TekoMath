// Bounded, deterministic interpretation. Never evaluate arbitrary student code.
class ProblemWorkshop {
 static generalAnswer(message,unit){let text=message.trim().replace(/^(?:x\s*=|(?:mi )?(?:resultado|respuesta)(?: es)?\s*[:=]?)\s*/i,'');if(['m','metros','metro'].includes(unit))return NaturalProblem.answer(text);if(unit&&text.toLowerCase().endsWith(unit.toLowerCase()))text=text.slice(0,-unit.length);return this.number(text);}
 static number(text){const parts=text.trim().split('/');if(parts.length>2)return null;const a=WorkshopExpression.numeric(parts[0]),b=parts.length===2?WorkshopExpression.numeric(parts[1]):1;if(a===null||b===null||b===0)return null;const v=a/b;return Number.isFinite(v)?v:null;}
 static parse(message,topic='unsure'){let text=message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/').trim();
  const expression=WorkshopExpression.parse(text);if(expression)return expression;text=text.replace(/(\d),(\d)/g,'$1.$2');
  const general=GeneralProblem.parse(text,topic);if(general)return general;
  const natural=NaturalProblem.parse(text);if(natural)return natural;
  for(const rule of window.PROBLEM_WORKSHOP.rules){const m=text.match(new RegExp(rule.pattern));if(!m)continue;let expected;
   if(rule.id==='linear'){const a=['','+'].includes(m[1])?1:m[1]==='-'?-1:Number(m[1]),b=Number((m[2]||'0').replace(/\s/g,'')),c=Number(m[3]);if(!a)return null;expected=(c-b)/a;}
   if(rule.id==='arithmetic'){const a=this.number(m[1]),b=this.number(m[3]);if(a===null||b===null)return null;expected={'+':()=>a+b,'-':()=>a-b,'*':()=>a*b,'/':()=>a/b}[m[2]]();}
   if(rule.id==='hypotenuse'){const a=Number(m[1]),b=Number(m[2]);if(a<=0||b<=0)return null;expected=Math.hypot(a,b);}
   if(Number.isFinite(expected))return {rule:rule.id,expected};
  }return null;
 }
 static transition(state,message,action){const w=state.workshop;
  if(!action){const command=QuestionResolver.normalize(message);if(/^(siguiente(?: paso)?|continuar|jasegi)$/.test(command))action='next_step';else if(/^(dame una pista|una pista|pista|petei pista)$/.test(command))action='hint';else if(/^(otro problema|nuevo problema)$/.test(command))action='new_problem';else if(/^(corregir datos|cambiar datos)$/.test(command))action='edit_problem';}
  if(w.stage==='topic'&&!action&&this.parse(message,'unsure')){state.workshop={stage:'statement',topic:'unsure'};return this.transition(state,message,'');}
  if(action==='new_problem'||action==='change_topic'){state.workshop={stage:'topic'};return state;}
  if(w.stage==='topic'){
   const normalized=QuestionResolver.normalize(message);const topic=window.PROBLEM_WORKSHOP.topics.map(t=>({t,score:action==='topic_'+t.id||QuestionResolver.normalize(t.label)===normalized?1000:Math.max(0,...t.aliases.filter(a=>(' '+normalized+' ').includes(' '+a+' ')).map(a=>a.length))})).sort((a,b)=>b.score-a.score).find(x=>x.score>0)?.t;
   if(topic){state.workshop={stage:'statement',topic:topic.id};}else{w.pending_statement=message;}
   if(topic&&w.pending_statement){state.workshop.statement=w.pending_statement;state.workshop.stage='clarify';return this.transition(state,w.pending_statement,'');}return state;
  }
  if(action==='edit_problem'){state.workshop={stage:'statement',topic:w.topic||'unsure'};return state;}
  if(w.stage==='confirm'){if(action==='confirm_data'||/^(si(?: son correctos)?|correcto|esta bien|confirmo|hee|oipora)$/.test(QuestionResolver.normalize(message)))w.stage=w.steps?.length===1?'answer':'guidance';return state;}
  if(w.stage==='statement'||w.stage==='clarify'){const statement=w.stage==='clarify'&&w.statement?w.statement+' '+message:message;const plan=this.parse(message,w.topic)||this.parse(statement,w.topic);state.workshop=plan?{stage:'confirm',topic:w.topic||'unsure',statement:this.parse(message,w.topic)?message:statement,rule:plan.rule,step:0,attempts:0,...(plan.steps?{steps:plan.steps,hint:plan.hint,summary:plan.summary,...(plan.unit?{unit:plan.unit}:{}),...(plan.ast?{ast:plan.ast,answer_unit:plan.answer_unit}:{})}: {})}:{stage:'clarify',topic:w.topic||'unsure',statement};return state;}
  if(action==='hint'||action==='confused'){w.feedback='hint';return state;}
  if(action==='next_step'){delete w.feedback;const rule=(w.steps?{steps:w.steps,hint:w.hint}:window.PROBLEM_WORKSHOP.rules.find(r=>r.id===w.rule));w.step=Math.min(w.step+1,rule.steps.length-1);if(w.step===rule.steps.length-1)w.stage='answer';return state;}
  if(w.stage==='correct')return state;
  const answer=w.ast?this.generalAnswer(message,w.answer_unit):w.unit?NaturalProblem.answer(message):this.number(message.replace(/^(?:x\s*=|(?:mi )?(?:resultado|respuesta)(?: es)?\s*[:=]?)\s*/i,'').replace(/\s*cm\s*$/i,''));
  if(answer===null){w.feedback='format';return state;}
  const plan=w.ast?{expected:WorkshopExpression.evaluate(w.ast)}:this.parse(w.statement,w.topic);if(!plan){w.stage='clarify';return state;}
  w.attempts++;w.feedback=Math.abs(answer-plan.expected)<=(plan.tolerance??1e-6*Math.max(1,Math.abs(plan.expected)))?'correct':'incorrect';if(w.feedback==='correct')w.stage='correct';return state;
 }
 static response(state){const w=state.workshop,rule=(w.steps?{steps:w.steps,hint:w.hint}:window.PROBLEM_WORKSHOP.rules.find(r=>r.id===w.rule));let text,options=[];
  if(w.stage==='topic'){text=window.PROBLEM_WORKSHOP.topic_question;options=window.PROBLEM_WORKSHOP.topics.map(t=>({id:'topic_'+t.id,label:t.label}));}
  else if(w.stage==='statement'){const topic=window.PROBLEM_WORKSHOP.topics.find(t=>t.id===w.topic);text=`**${topic?.label||'Tu problema'}**\n\nEscribí el enunciado completo. ${topic?.prompt||''} Primero te mostraré los datos y la incógnita para confirmarlos.`;options=[{id:'change_topic',label:'Cambiar tema'}];}
  else if(w.stage==='confirm'){const description=w.rule==='linear'?'La incógnita es x; buscamos el valor que hace verdadera la igualdad.':w.rule==='hypotenuse'?'Los datos son los dos catetos; buscamos la hipotenusa.':'Buscamos el resultado de la operación indicada.';text=`**Revisemos la interpretación**\n\n${w.summary||('Enunciado: '+w.statement+'\n'+description)}\n\n¿Es esto lo que querés calcular?`;options=[{id:'confirm_data',label:'Sí, son correctos'},{id:'edit_problem',label:'Corregir datos'},{id:'change_topic',label:'Cambiar tema'}];}
  else if(w.stage==='clarify'){const topic=window.PROBLEM_WORKSHOP.topics.find(t=>t.id===w.topic);const quantities=w.statement?.match(/[+-]?\d+(?:[.,]\d+)?\s*(?:°|grados|cm|metros|m|%|km)?/g)||[];text=`Tema: ${topic?.label||'Por identificar'}.\n${quantities.length?'Cantidades detectadas (falta asignarles su significado): '+quantities.join('; ')+'.\n':''}${NaturalProblem.clarification(QuestionResolver.normalize(w.statement||''))||((topic?.prompt||'')+'\n\n'+window.PROBLEM_WORKSHOP.unknown)}`;options=[{id:'edit_problem',label:'Corregir datos'},{id:'change_topic',label:'Cambiar tema'}];}
  else if(w.stage==='correct'){text='¡Correcto! Tu resultado coincide con la comprobación del problema. Terminaste este ejercicio; podés comenzar otro.';options=[{id:'new_problem',label:'Otro problema'}];}
  else {text=`**Paso ${w.step+1} de ${rule.steps.length}**\n\n${rule.steps[w.step]}`;if(w.feedback==='incorrect')text='Todavía no es correcto. Revisá tu cálculo y volvé a intentarlo.\n\n'+rule.steps[w.step];else if(w.feedback==='hint')text=rule.steps[w.step];else if(w.feedback==='format')text='Escribí un único resultado numérico, una fracción o x = tu valor. No puedo calificar una explicación como si fuera un resultado. Si necesitás ayuda, pedí una pista.';
   text+='\n\n'+(w.stage==='answer'?(w.unit?`Enviá tu resultado en ${w.unit}; se acepta redondeo a dos decimales. `: ''):'')+(w.stage==='answer'?'Escribí tu resultado.':'Podés continuar o enviar tu resultado.');
   options=[...(w.stage!=='answer'?[{id:'next_step',label:'Siguiente paso'}]:[]),{id:'hint',label:'Una pista'},{id:'edit_problem',label:'Corregir datos'},{id:'new_problem',label:'Otro problema'}];
  }
  return TutorLanguage.response({tutor_message_jopara:text,formula_display:{latex:'',note:'Problema guiado · resultado reservado para vos'},visual_action:{type:'none'},quick_options:options},state);
 }
}
