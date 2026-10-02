class TrigQuestions {
 static transition(state,message,action){
  if(state.own_problem||action==='own_problem'){delete state.numeric_query;return false;}
  const text=message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/−/g,'-');
  const aliases={seno:'sin',sen:'sin',sin:'sin',coseno:'cos',cos:'cos',tangente:'tan',tan:'tan',tg:'tan',cotangente:'cot',cot:'cot',secante:'sec',sec:'sec',cosecante:'csc',csc:'csc'};
  const follow=text.match(/^(?:y\s+)?(?:de\s+|para\s+)?(-?\d+(?:[.,]\d+)?)\s*(°|grados|radianes|rad)?[?¿\s]*$/);
  if(state.numeric_query&&follow&&!action){state.numeric_query={...state.numeric_query,input:Number(follow[1].replace(',','.')),radians:follow[2]?['radianes','rad'].includes(follow[2]):state.numeric_query.radians,implicit:false,simple:false};return true;}
  const matches=[...text.matchAll(/\b(cosecante|cotangente|secante|tangente|coseno|seno|sen|sin|cos|tan|tg|cot|sec|csc)\s*(?:de\s*)?\(?\s*(-?\d+(?:[.,]\d+)?)\s*(°|grados|radianes|rad)?\s*\)?/g)];
  if(matches.length===1&&!/[+*/=]/.test(text)&&!state.workshop){const m=matches[0];state.numeric_query={kind:aliases[m[1]],input:Number(m[2].replace(',','.')),radians:['radianes','rad'].includes(m[3]),implicit:!m[3],simple:false};return true;}
  if(state.numeric_query&&(/no entendi|no entiendo|mas facil|por que|mba.?ere/.test(text)||['confused','hint','more'].includes(action))){state.numeric_query.simple=true;return true;}
  delete state.numeric_query;return false;
 }
 static response(state){const q=state.numeric_query,r=q.radians?q.input:q.input*Math.PI/180,s=Math.sin(r),c=Math.cos(r),kind=q.kind,names={sin:'sen',cos:'cos',tan:'tan',cot:'cot',sec:'sec',csc:'csc'};
  const bad=['tan','sec'].includes(kind)?Math.abs(c)<1e-10:['cot','csc'].includes(kind)?Math.abs(s)<1e-10:false;
  let v={sin:s,cos:c,tan:s/c,cot:c/s,sec:1/c,csc:1/s}[kind];if(Math.abs(v)<1e-10)v=0;if(Math.abs(v-1)<1e-10)v=1;if(Math.abs(v+1)<1e-10)v=-1;
  const value=bad?'no está definida':String(Math.round(v*1e6)/1e6),angle=q.input+(q.radians?' rad':'°'),rel=bad?'':Math.abs(v-Math.round(v))<1e-10?' = ':' ≈ ';
  const first=bad?`${names[kind]}(${angle}) no está definida.`:`${names[kind]}(${angle})${rel}${value}.`;
  const why={sin:'El seno es la altura del punto en la circunferencia de radio uno. En 90°, el punto está arriba de todo: su altura es 1.',cos:'El coseno es la coordenada horizontal del punto en la circunferencia de radio uno.',tan:'La tangente divide el seno por el coseno. Si el coseno es cero, esa división no está definida.',cot:'La cotangente divide el coseno por el seno. Si el seno es cero, esa división no está definida.',sec:'La secante es uno dividido por el coseno. El denominador no puede ser cero.',csc:'La cosecante es uno dividido por el seno. El denominador no puede ser cero.'};
  let explanation=why[kind];if(kind==='sin'&&Math.abs(r-Math.PI/2)>1e-10)explanation='El seno es la altura del punto en la circunferencia de radio uno. Buscamos esa coordenada vertical para el ángulo indicado.';
  const text=(q.simple?'Vamos con una sola idea.\n\n':'')+first+'\n\n'+explanation+(q.implicit?'\n\nTomé el ángulo en grados. Si te referías a radianes, indicámelo.':'');
  return TutorLanguage.response({tutor_message_jopara:text,formula_display:{latex:bad?'':`\\${kind==='cot'?'cot':names[kind]==='sen'?'sin':names[kind]}(${q.input}${q.radians?'':'^\\circ'})${rel.includes('≈')?'\\approx':'='}${value}`,note:'Consulta del ángulo indicado'},visual_action:{type:'function_graph',funcType:kind,angle_deg:q.radians?q.input*180/Math.PI:q.input},quick_options:[{id:'confused',label:'Explicámelo más fácil'},{id:'resume',label:'Retomar donde estábamos'}]},state);
 }
}
