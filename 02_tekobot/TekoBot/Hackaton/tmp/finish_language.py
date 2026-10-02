from pathlib import Path
import json
p=Path('database/language_profiles.json');d=json.loads(p.read_text(encoding='utf8'))
for source,neutral in [('para vos','para ti'),('con vos','contigo')]:
    d['phrases'].append({'source':source,'context':'GENERAL','jopara':source,'es_py':source,'es':neutral})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for file in ['assets/js/language.js','services/language_service.php']:
    p=Path(file);s=p.read_text(encoding='utf8')
    if file.endswith('.js'):s=s.replace('[=^√π≤≥]',r'[=^√π≤≥+×÷\/]')
    else:s=s.replace('[=^√π≤≥]','[=^√π≤≥+×÷/]')
    s=s.replace(r'|\d+(?:[.,]\d+)?',r'|[−-]?\d+(?:[.,]\d+)?')
    p.write_text(s,encoding='utf8')
