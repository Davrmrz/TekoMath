from pathlib import Path
import json
p=Path('database/language_profiles.json');d=json.loads(p.read_text(encoding='utf8'));d['neutral_words']['considerá']='considera';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p=Path('tests/language_browser.cjs');s=p.read_text(encoding='utf-8-sig');s=s.replace("  await page.locator('#language-mode').selectOption('es');\n  await page.locator('#btn-toggle-sidebar').click();", "  async function language(value){await page.locator('#btn-toggle-sidebar').click();await page.locator('#language-mode').selectOption(value);await page.locator('#btn-close-sidebar').click();}\n  await language('es');\n  await page.locator('#btn-toggle-sidebar').click();")
s=s.replace("await page.locator('#language-mode').selectOption('es_py');","await language('es_py');").replace("await page.locator('#language-mode').selectOption('jopara');","await language('jopara');").replace("await page.locator('#language-mode').selectOption('es');await page.reload();","await language('es');await page.reload();")
p.write_text(s,encoding='utf8')
