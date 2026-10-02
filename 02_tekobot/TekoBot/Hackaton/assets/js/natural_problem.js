// Extract quantities by their role, independent of sentence order. No eval.
class NaturalProblem {
 static clarification(text){
  if(!/elevacion|sombra|escalera/.test(text))return null;
  const angle=/\d+(?:\.\d+)?\s*(?:°|grados)/.test(text),length=/\d+(?:\.\d+)?\s*(?:metros?|m|cm|km)\b/.test(text);
  if(!angle)return 'Falta el ángulo en grados. ¿Cuánto mide?';
  if(!length)return 'Falta una longitud. Indicá si es distancia horizontal, sombra, altura o escalera, con su unidad.';
  return 'Ya tengo una longitud y un ángulo. ¿Qué buscás: altura, distancia horizontal o longitud de la escalera? Si hay altura del observador o suelo inclinado, aclaralo.';
 }
 static parse(text){
  const config=window.PROBLEM_WORKSHOP.natural;
  for(const [word,value] of Object.entries(config.number_words))text=text.replace(new RegExp('\\b'+word+'\\b','g'),String(value));
  if(/inclinad|pendiente|altura de los ojos|altura del observador|radian|dos arbol|dos edificio|-\s*\d/.test(text))return null;
  const angles=[...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:°|grados)/g)];
  const lengths=[...text.matchAll(/(\d+(?:\.\d+)?)\s*(kilometros?|km|centimetros?|cm|metros?|m)\b/g)];
  if(angles.length!==1||lengths.length!==1)return null;
  const angle=Number(angles[0][1]),raw=Number(lengths[0][1]),unit=lengths[0][2],length=raw*(/^k/.test(unit)?1000:/^c/.test(unit)?.01:1);
  if(angle<=0||angle>=90||length<=0)return null;
  let id;
  const height=/altura|alto|parte mas alta|cima|cuanto mide (?:el|un|la|una) (?:arbol|edificio|torre|poste|pared)/.test(text);
  const asksDistance=/(?:cuanto|cual|calcula|hallar|determina|calcular)[^?.]*(?:distancia|longitud de la sombra|mide la sombra)/.test(text);
  if(/sombra/.test(text)&&height&&!asksDistance)id='shadow_height';
  else if(/elevacion/.test(text)&&/distancia|separad|alejad|de la base|a la base/.test(text)&&height&&!asksDistance)id='elevation_height';
  else if(/elevacion/.test(text)&&asksDistance&&/altura|alto|mide/.test(text))id='elevation_distance';
  else if(/escalera/.test(text)&&height&&/suelo|horizontal/.test(text))id='ladder_height';
  if(!id)return null;
  const rule=config.rules.find(r=>r.id===id),f=id==='ladder_height'?Math.sin(angle*Math.PI/180):Math.tan(angle*Math.PI/180),expected=id==='elevation_distance'?length/f:length*f;
  const replace=s=>s.replaceAll('{length}',String(length)).replaceAll('{angle}',String(angle));
  return {rule:id,expected,tolerance:.005000001,steps:rule.steps.map(replace),hint:rule.hint,unit:'m',summary:replace(rule.summary)};
 }
 static answer(message){let text=message.toLowerCase().trim().replace(/^(?:el arbol mide|la altura es|mide|es|mi respuesta es|el resultado es)\s*/,'');let factor=1;const u=text.match(/\s*(metros?|m|centimetros?|cm|kilometros?|km)\s*$/);if(u){factor=/^c/.test(u[1])?.01:/^k/.test(u[1])?1000:1;text=text.slice(0,u.index);}const value=ProblemWorkshop.number(text);return value===null?null:value*factor;}
}
