from pathlib import Path
p=Path('tests/voice_plot_test.cjs');s=p.read_text(encoding='utf-8');s='\n'.join(line for line in s.splitlines() if 'console.log(await page.evaluate' not in line)+'\n';p.write_text(s,encoding='utf-8')
