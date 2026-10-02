from pathlib import Path
p=Path('tests/voice_plot_test.cjs');s=p.read_text(encoding='utf-8').replace("await page.waitForFunction(()=>document.getElementById('chat-input').value.length>0);", "console.log(await page.evaluate(()=>({status:document.querySelector('.voice-status')?.textContent, mic:window.micTest, recognition:String(window.SpeechRecognition), disabled:document.getElementById('btn-mic').disabled})));\n await page.waitForFunction(()=>document.getElementById('chat-input').value.length>0);")
p.write_text(s,encoding='utf-8')
