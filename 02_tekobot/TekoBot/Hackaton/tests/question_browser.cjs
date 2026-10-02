const {chromium}=require('C:/Users/bogad/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 for(const offline of [false,true]){
 const page=await browser.newPage({viewport:{width:1365,height:950}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8127')?r.continue():r.abort());
 if(offline)await page.route('**/api/**',r=>r.abort());
 await page.goto('http://127.0.0.1:8127/index.html');await page.locator('#btn-toggle-sidebar').click();
 await page.locator('.curriculum-unit').first().locator('summary').click();await page.getByRole('button',{name:'Funciones trigonométricas',exact:true}).click();
 async function ask(message){await page.locator('#chat-input').fill(message);await page.locator('#send-btn').click();await page.waitForFunction(()=>!document.getElementById('typing-indicator'));return page.locator('.chat-message.tutor').last().innerText();}
 const answer=await ask('que es tangente');assert.match(answer,/cateto opuesto/);assert.doesNotMatch(answer,/Cómo interpretar la relación|cos\(90°\)=0/);
 assert.equal(await page.locator('#graph-view').isVisible(),true);assert.equal(await page.locator('#mec-view').isVisible(),false);assert.match(await page.locator('#active-formula-note').innerText(),/Tangente/);
 assert.ok(answer.length<650);
 assert.match(await ask('me lo explicas mas facil porfa'),/rampa/);
 const range=await ask('y su recorrido');assert.match(range,/recorrido.*todo R/);assert.doesNotMatch(range,/dominio|90°/);
 assert.match(await ask('y el dominio'),/90°/);
 assert.match(await ask('y por que'),/hipotenusa se cancela/);
 assert.match(await ask('dame un ejemplo'),/opuesto 3/);
 await page.reload();assert.match(await ask('otro ejemplo'),/opuesto 5/);
 assert.match(await ask('que diferencia hay entre seno y coseno'),/Diferencia clave/);
 assert.match(await ask('que es un agujero negro'),/No identifiqué/);
 await page.getByRole('button',{name:'Jasegi donde estábamos',exact:true}).click();
 await page.getByRole('button',{name:'Sí, jahecha',exact:true}).waitFor();
 assert.match(await page.locator('#lesson-context').innerText(),/Funciones trigonométricas/);
 await ask('que es tangente');await page.evaluate(()=>Promise.allSettled(document.getAnimations().map(a=>a.finished)));
 await page.screenshot({path:`tmp/qa/contextual-questions-${offline?'offline':'server'}.png`,fullPage:true});
 assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();console.log('PASS: server and offline concept-specific answer, matching formula/plot, follow-ups, reload, comparison, clarification and lesson resume');
})().catch(e=>{console.error(e);process.exit(1)});
