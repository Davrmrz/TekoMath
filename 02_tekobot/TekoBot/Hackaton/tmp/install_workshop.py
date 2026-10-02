from pathlib import Path
p=Path('index.html');s=p.read_text(encoding='utf8');a=s.index('<!-- Modal Diagnóstico -->');b=s.index('<!-- Scripts de los Módulos',a);s=s[:a]+s[b:]
s=s.replace('id="btn-diagnostic" class="btn-header">Evaluación Diagnóstica','id="btn-problem-workshop" class="btn-header">Resolver un problema')
s=s.replace('<script src="assets/js/lesson_engine.js', '<script src="assets/js/problem_workshop_data.js?v=20260926-workshop"></script>\n<script src="assets/js/problem_workshop.js?v=20260926-workshop"></script>\n<script src="assets/js/lesson_engine.js')
s=s.replace('20260926-private-reference','20260926-workshop');p.write_text(s,encoding='utf8')
p=Path('views/footer.php');s=p.read_text(encoding='utf8').replace('<script src="assets/js/lesson_engine.js','<script src="assets/js/problem_workshop_data.js?v=20260926-workshop"></script>\n<script src="assets/js/problem_workshop.js?v=20260926-workshop"></script>\n<script src="assets/js/lesson_engine.js');p.write_text(s,encoding='utf8')
