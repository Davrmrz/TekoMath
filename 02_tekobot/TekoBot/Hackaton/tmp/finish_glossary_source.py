from pathlib import Path
p=Path('scripts/build_glossary.py');s=p.read_text(encoding='utf8');s=s.replace("d['glossary_policy']=", """d['glossary_sources']['una_calculus']={'title':'UNA · Programa de Ingeniería Mecatrónica','url':'https://www.ing.una.py/FIUNA3/?page_id=1535','type':'official_university_reference','note':'Fuente universitaria paraguaya para contenidos fuera del nivel escolar; no se presenta como aprobación MEC del glosario.'}
d['advanced_topics'] += [
 {'id':'integrals','title':'Integrales','aliases':['integral','integrales','integrar','antiderivada','antiderivadas','calculo integral','integracion por partes'],'scope':'higher_education','source_id':'una_calculus'},
 {'id':'differential_equations','title':'Ecuaciones diferenciales','aliases':['ecuacion diferencial','ecuaciones diferenciales','transformada de laplace','series de fourier'],'scope':'higher_education','source_id':'una_calculus'}]
d['glossary_policy']=""")
p.write_text(s,encoding='utf8')
