const {chromium}=require('C:/Users/bogad/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
for(const offline of [false,true]){
 const page=await browser.newPage({viewport:{width:1365,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8127')?r.continue():r.abort());if(offline)await page.route('**/api/**',r=>r.abort());
 await page.goto('http://127.0.0.1:8127/'+(offline?'index.html':'index.php'));
 await page.locator('#btn-toggle-sidebar').click();await page.locator('#glossary-search').fill('arcoseno');
 assert.equal(await page.locator('.glossary-results details').count(),1);await page.locator('.glossary-results summary').click();assert.match(await page.locator('.glossary-results').innerText(),/ángulo principal/);
 await page.locator('#glossary-search').fill('derivada');assert.equal(await page.locator('.glossary-notice').innerText(),'esa pregunta abarca a temas de un curso mayor');
 await page.locator('#glossary-search').fill('fracción');assert.ok(await page.locator('.glossary-results details').count()>2);
 await page.screenshot({path:`tmp/pdfs/glossary-${offline?'offline':'server'}.png`});
 await page.locator('.curriculum-unit').first().locator('summary').click();await page.getByRole('button',{name:'Función lineal',exact:true}).click();
 async function ask(text){await page.locator('#chat-input').fill(text);await page.locator('#send-btn').click();await page.waitForFunction(()=>!document.getElementById('typing-indicator'));return page.locator('.chat-message.tutor').last().innerText();}
 assert.match(await ask('que es el arcoseno'),/ángulo principal/);assert.match(await page.locator('#active-formula-note').innerText(),/seno/i);
 assert.match(await ask('que es la arcotangente'),/ángulo principal/);assert.match(await page.locator('#active-formula-note').innerText(),/tangente/i);
 assert.match(await ask('deriva x^2'),/esa pregunta abarca a temas de un curso mayor/);assert.equal(await page.locator('#active-formula').innerText(),'');
 assert.match(await ask('que es una ecuacion cuadratica'),/ax²/);assert.match(await ask('que es algo desconocido'),/No identifiqué/);
 assert.deepEqual(errors,[]);await page.close();
}
await browser.close();console.log('PASS: searchable glossary, source-backed entries, inverse explanations/visuals, advanced topic notice, unknown clarification; server and offline');})().catch(e=>{console.error(e);process.exit(1)});
