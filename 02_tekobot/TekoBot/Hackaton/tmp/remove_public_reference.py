import json
from pathlib import Path
p=Path('database/curriculum.json');d=json.loads(p.read_text(encoding='utf8'))
d['glossary_sources'].pop('user_contenido',None)
for u in d['units']:
 for t in u['subtopics']:t['group']=t.get('group','').replace(' · Contenido.pdf','')
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p=Path('index.html');p.write_text(p.read_text(encoding='utf8').replace('20260926-mobile','20260926-private-reference'),encoding='utf8')
