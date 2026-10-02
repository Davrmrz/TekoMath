from pathlib import Path
p=Path('assets/js/problem_guide.js');s=p.read_text(encoding='utf-8').replace('if(this.detects(message,action))','if(action===\'own_problem\' || (!state.own_problem && this.detects(message,action)))');p.write_text(s,encoding='utf-8')
p=Path('services/problem_guide.php');s=p.read_text(encoding='utf-8').replace("($action === '' && preg_match", "(!isset($state['own_problem']) && $action === '' && preg_match");p.write_text(s,encoding='utf-8')
p=Path('assets/js/app.js');s=p.read_text(encoding='utf-8').replace("if(action==='resume') document.getElementById('own-problem').checked=false;", "if(action==='resume'||action==='own_problem') document.getElementById('own-problem').checked=false;");p.write_text(s,encoding='utf-8')
p=Path('tests/stage2_browser.cjs');s=p.read_text(encoding='utf-8').replace('count(),56','count(),59');p.write_text(s,encoding='utf-8')
