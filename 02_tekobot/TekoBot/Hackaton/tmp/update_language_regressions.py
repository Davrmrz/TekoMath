from pathlib import Path
for name in ['question_browser.cjs','stage2_browser.cjs','learning_upgrade_browser.cjs']:
    p=Path('tests')/name;s=p.read_text(encoding='utf8')
    for a,b in [('Sí, explicame','Sí, jahecha'),('Mostrame un ejemplo','Jahecha peteĩ ejemplo'),('Mostrame otro ejemplo','Jahecha otro ejemplo'),('Retomar donde estábamos','Jasegi donde estábamos'),('Volver a la lección','Jajevy a la lección'),('/Ahora te toca/','/Ko’ág̃a nde turno/')]:s=s.replace(a,b)
    if name=='learning_upgrade_browser.cjs':s=s.replace("getByLabel('Pendiente'","getByLabel('Forma de la curva'").replace('/-2x/','/-2 · x/')
    p.write_text(s,encoding='utf8')
