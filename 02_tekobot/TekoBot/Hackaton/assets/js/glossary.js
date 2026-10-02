// Searchable glossary available without a chat, API, or internet connection.
document.addEventListener('DOMContentLoaded',()=>{
 const host=document.getElementById('math-glossary');if(!host)return;
 const search=host.querySelector('input'),filter=host.querySelector('select'),list=host.querySelector('.glossary-results'),count=host.querySelector('[role=status]');
 const labels={prerequisite:'Conocimientos previos',first_course:'Primer curso',extension:'Ampliación: funciones inversas'};
 const cards=QuestionResolver.cards().slice().sort((a,b)=>a.title.localeCompare(b.title,'es'));
 function render(){
  const term=QuestionResolver.normalize(search.value);
  const matches=cards.filter(c=>(!filter.value||c.scope===filter.value)&&(!term||[c.title,...c.aliases].some(t=>QuestionResolver.normalize(t).includes(term))));
  list.replaceChildren();count.textContent=`${matches.length} conceptos encontrados de ${cards.length}`;
  const language=document.getElementById('language-mode')?.value||'jopara';
  const higher=QuestionResolver.higherTopic(search.value);
  if(higher){
   const notice=document.createElement('p');notice.className='glossary-notice';notice.textContent=window.TUTOR_CURRICULUM.glossary_policy.notice;list.append(notice);
   const source=window.TUTOR_CURRICULUM.glossary_sources[higher.source_id];
   if(source){const link=document.createElement('a');link.href=source.url;link.textContent=`Referencia: ${source.title}`;link.target='_blank';link.rel='noopener';list.append(link);}
  }
  for(const c of matches){
   const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=c.title;details.append(summary);
   const badge=document.createElement('small');badge.textContent=labels[c.scope]||'Primer curso';details.append(badge);
   for(const raw of [c.definition,c.detail!==c.definition?c.detail:'',c.example?`Ejemplo: ${c.example}`:'',c.domain,c.range,c.scope_note].filter(Boolean)){
    const p=document.createElement('p');p.textContent=TutorLanguage.text(raw,language);details.append(p);
   }
   for(const id of c.source_ids||[]){const source=window.TUTOR_CURRICULUM.glossary_sources[id];if(!source)continue;const a=document.createElement('a');a.href=source.url;a.textContent=source.title;a.target='_blank';a.rel='noopener';details.append(a);}
   list.append(details);
  }
  if(!matches.length&&!higher){const p=document.createElement('p');p.textContent='No encontré ese término. Probá otro nombre o una pregunta más específica; no significa que sea de un curso mayor.';list.append(p);}
 }
 search.addEventListener('input',render);filter.addEventListener('change',render);document.getElementById('language-mode')?.addEventListener('change',render);render();
});
