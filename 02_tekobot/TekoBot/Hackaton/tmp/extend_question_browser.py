from pathlib import Path
p=Path('tests/question_browser.cjs');s=p.read_text(encoding='utf8')
s=s.replace("assert.match(await ask('y por que'),/hipotenusa se cancela/);", """assert.ok(answer.length<650);
 assert.match(await ask('me lo explicas mas facil porfa'),/rampa/);
 const range=await ask('y su recorrido');assert.match(range,/recorrido.*todo R/);assert.doesNotMatch(range,/dominio|90°/);
 assert.match(await ask('y el dominio'),/90°/);
 assert.match(await ask('y por que'),/hipotenusa se cancela/);""")
p.write_text(s,encoding='utf8')
