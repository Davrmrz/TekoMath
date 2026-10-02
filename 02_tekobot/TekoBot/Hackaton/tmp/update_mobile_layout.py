from pathlib import Path
p=Path('index.html');s=p.read_text(encoding='utf8')
start=s.index('        <!-- WIDGET 3:');end=s.index('    </section>',start)
s=s[:start]+s[end:]
s=s.replace('                <button class="widget-toggle-btn" title="Minimizar / Expandir">▼</button>\n','')
s=s.replace('WIDGETS COLAPSABLES','PANELES SIEMPRE ABIERTOS').replace(' (COLAPSABLE)','')
s=s.replace('<section class="visual-panel">','<section class="visual-panel" id="learning-visuals" aria-label="Fórmula y gráficos">').replace('<section class="chat-panel">','<section class="chat-panel" id="learning-chat" aria-label="Conversación con el tutor">')
s=s.replace('<main class="app-container">','<nav class="mobile-study-nav" aria-label="Navegación de estudio"><a href="#learning-chat">Conversación</a><a href="#learning-visuals">Fórmula y gráfico</a></nav>\n<main class="app-container">')
s=s.replace('20260926-triangle','20260926-mobile')
p.write_text(s,encoding='utf8')
p=Path('assets/js/app.js');s=p.read_text(encoding='utf8')
start=s.index('    // ── WIDGETS COLAPSABLES');end=s.index('    // ── MULTI-CHAT',start)
s=s[:start]+s[end:]
s=s.replace('                        if (data.updated_progress) renderProgressBars(data.updated_progress);','')
start=s.index('    function renderProgressBars(');end=s.index('    // ── EVENT LISTENERS',start)
s=s[:start]+s[end:]
s=s.replace('        await loadInitialProgress();\n','')
start=s.index('    async function loadInitialProgress()');end=s.index('    init();',start)
s=s[:start]+s[end:]
p.write_text(s,encoding='utf8')
