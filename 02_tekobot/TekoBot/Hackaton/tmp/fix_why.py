from pathlib import Path
for f in ['assets/js/question_resolver.js','services/question_resolver.php']:
 p=Path(f);s=p.read_text(encoding='utf8').replace('^por que|por que ','por que(?: |$)');p.write_text(s,encoding='utf8')
