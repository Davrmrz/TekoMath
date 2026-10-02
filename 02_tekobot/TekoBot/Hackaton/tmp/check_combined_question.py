from pathlib import Path
p=Path('tests/adaptive_questions_test.cjs');s=p.read_text(encoding='utf-8-sig').replace("['','resume']];", "['','resume'],['cuál es el dominio y recorrido de la tangente','']];")
s=s.replace("// A question during practice", "assert.match(text(14),/\\*\\*Dominio\\*\\*/);assert.match(text(14),/\\*\\*Recorrido\\*\\*/);assert.match(text(14),/todo R/);\n// A question during practice")
p.write_text(s,encoding='utf8')
