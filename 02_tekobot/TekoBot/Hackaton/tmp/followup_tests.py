from pathlib import Path
p=Path('scripts/expand_explanations.py');s=p.read_text(encoding='utf-8').replace('s=s.replace(needle,block+needle);p.write_text', 's=s if block in s else s.replace(needle,block+needle);p.write_text');p.write_text(s,encoding='utf-8')
p=Path('tests/learning_upgrade_browser.cjs');s=p.read_text(encoding='utf-8').replace("assert.match(text,/Ahora te toca/);", "assert.match(text,/Ahora te toca/);\n assert.equal(await page.locator('#mec-view').isVisible(),true);\n assert.match(await page.locator('#mec-view .plot-formula').innerText(),/-2x/);")
s=s.replace("await page.getByLabel('Pendiente',{exact:true}).evaluate", "assert.match(await page.locator('.chat-message.tutor').last().innerText(),/Cómo trabajar paso a paso/);\n assert.ok((await page.locator('.chat-message.tutor').last().innerText()).length>1200);\n await page.getByLabel('Pendiente',{exact:true}).evaluate")
p.write_text(s,encoding='utf-8')
p=Path('tests/voice_plot_test.cjs');s=p.read_text(encoding='utf-8').replace("window.micTest={stopped:0,deny:false};", "window.micTest={stopped:0,deny:false,starts:0};")
s=s.replace("window.SpeechRecognition=class {start(){this.onstart();this.onresult({results:[[{transcript:'Mi problema matemático'}]]});}stop(){this.onend();}};", "window.SpeechRecognition=class {constructor(){window.testRecognition=this;}start(){window.micTest.starts++;this.onstart();this.onresult({results:[[{transcript:window.micTest.starts===1?'Mi problema matemático':'y otra frase'}]]});}stop(){this.onend();}};")
s=s.replace("await page.locator('#btn-mic').click();await page.evaluate(()=>window.micTest.deny=true);", """assert.equal(await page.evaluate(()=>window.testRecognition.continuous),true);
 await page.evaluate(()=>window.testRecognition.onend());
 await page.waitForFunction(()=>window.micTest.starts===2);
 assert.equal(await page.locator('#chat-input').inputValue(),'Mi problema matemático y otra frase');
 assert.equal(await page.evaluate(()=>window.micTest.stopped),1);
 await page.locator('#btn-mic').click();
 await page.waitForTimeout(800);
 assert.equal(await page.evaluate(()=>window.micTest.starts),2);
 assert.equal(await page.locator('#btn-mic').getAttribute('aria-pressed'),'false');
 await page.evaluate(()=>window.micTest.deny=true);""")
p.write_text(s,encoding='utf-8')
