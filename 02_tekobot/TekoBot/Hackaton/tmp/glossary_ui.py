from pathlib import Path
p=Path('index.html');s=p.read_text(encoding='utf8')
block='''    <section class="sidebar-section" id="math-glossary">
        <h4>Glosario matemático</h4>
        <p>Conocimientos previos y primer curso. Definiciones propias contrastadas con materiales del MEC; las funciones arco se incluyen como ampliación didáctica.</p>
        <label for="glossary-search">Buscar concepto</label>
        <input id="glossary-search" type="search" placeholder="Fracción, arcoseno, pendiente…" autocomplete="off">
        <label for="glossary-level">Nivel</label>
        <select id="glossary-level"><option value="">Todos los niveles incluidos</option value="prerequisite">Conocimientos previos</option><option value="first_course">Primer curso</option><option value="extension">Funciones inversas · ampliación</option></select>
        <p role="status" aria-live="polite"></p>
        <div class="glossary-results"></div>
        <details><summary>Fuentes y alcance</summary><p>La referencia oficial de 2021 es una priorización histórica. Este glosario no está certificado por el MEC ni garantiza ausencia de errores. Los términos desconocidos requieren aclaración.</p><a href="assets/books/contenido-trigonometria.pdf" target="_blank" rel="noopener">Contenido.pdf · referencia aportada</a></details>
    </section>
'''
s=s.replace('    <section class="sidebar-section" id="extra-data">',block+'    <section class="sidebar-section" id="extra-data">')
s=s.replace('<script src="assets/js/app.js?', '<script src="assets/js/glossary.js?v=20260926-glossary"></script>\n<script src="assets/js/app.js?')
s=s.replace('v=20260926-context','v=20260926-glossary');p.write_text(s,encoding='utf8')
p=Path('assets/css/components.css');s=p.read_text(encoding='utf8');s+='''
#math-glossary {font-size:.85rem;line-height:1.5;}
#math-glossary input,#math-glossary select {width:100%;box-sizing:border-box;padding:9px;margin:5px 0 10px;border:1px solid #bdd9cf;border-radius:8px;background:#fff;color:#164d3c;}
.glossary-results {max-height:430px;overflow:auto;}
.glossary-results details {padding:10px 3px;border-bottom:1px solid #dceae4;}
.glossary-results summary {cursor:pointer;font-weight:600;}
.glossary-results small {display:block;color:#527466;margin:6px 0;}
.glossary-results a {display:block;margin:6px 0;color:#12664c;}
.glossary-notice {padding:10px;background:#fff5d8;border-radius:8px;}
''';p.write_text(s,encoding='utf8')
