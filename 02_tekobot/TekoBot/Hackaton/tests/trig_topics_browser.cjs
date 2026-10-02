const {chromium}=require('C:/Users/bogad/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
for(const offline of [false,true]){
 const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8127')?r.continue():r.abort());if(offline)await page.route('**/api/**',r=>r.abort());
 await page.goto('http://127.0.0.1:8127/'+(offline?'index.html':'index.php'));
 await page.locator('#btn-toggle-sidebar').click();await page.locator('.curriculum-unit').first().locator('summary').click();await page.getByRole('button',{name:'Función lineal',exact:true}).click();
 async function ask(text){await page.locator('#chat-input').fill(text);await page.locator('#send-btn').click();await page.waitForFunction(()=>!document.getElementById('typing-indicator'));return page.locator('.chat-message.tutor').last().innerText();}
 for(const [name,kind] of [['seno','sin'],['coseno','cos'],['tangente','tan'],['cotangente','cot'],['secante','sec'],['cosecante','csc']]){
  await ask('qué es '+name);assert.equal(await page.getByLabel('Función trigonométrica').inputValue(),kind);assert.ok(await page.locator('#graph-view').isVisible());
  assert.equal(await page.getByLabel('Tamaño del triángulo',{exact:true}).isVisible(),false);
  await ask('explicame con más detalle');assert.match(await page.locator('.chat-message.tutor').last().innerText(),/Período|período/);
 }
 const triangleReply=await ask('que es un triangulo rectangulo');assert.match(triangleReply,/90°/);assert.doesNotMatch(triangleReply,/semejantes/);assert.match(await page.locator('#graph-view .plot-formula').innerText(),/a² \+ b² = h²/);assert.equal(await page.getByLabel('Función trigonométrica').locator('option:checked').innerText(),'Triángulo rectángulo');
 await ask('qué es semejanza de triángulos');assert.equal(await page.getByLabel('Función trigonométrica').inputValue(),'triangle');
 const before=await page.locator('#graph-view .plot-formula').innerText();await page.getByLabel('Tamaño del triángulo',{exact:true}).fill('2');await page.getByLabel('Tamaño del triángulo',{exact:true}).dispatchEvent('input');assert.notEqual(await page.locator('#graph-view .plot-formula').innerText(),before);
 await ask('qué es cotangente');await page.getByLabel('Ángulo del gráfico',{exact:true}).fill('180');await page.getByLabel('Ángulo del gráfico',{exact:true}).dispatchEvent('input');assert.match(await page.locator('#graph-view .plot-formula').innerText(),/No definida/);
 const data=await page.evaluate(()=>({tan:TopicTrigGraph.base('tan',Math.PI/2),sec:TopicTrigGraph.base('sec',Math.PI/2),cot:TopicTrigGraph.base('cot',0),csc:TopicTrigGraph.base('csc',Math.PI),cot90:TopicTrigGraph.base('cot',Math.PI/2),sec60:TopicTrigGraph.base('sec',Math.PI/3),csc30:TopicTrigGraph.base('csc',Math.PI/6)}));
 for(const k of ['tan','sec','cot','csc'])assert.ok(Number.isNaN(data[k]));assert.ok(Math.abs(data.cot90)<1e-9);assert.ok(Math.abs(data.sec60-2)<1e-9);assert.ok(Math.abs(data.csc30-2)<1e-9);
 await page.locator('#graph-view .plot-reference summary').click();await page.locator('#graph-view .plot-reference img').scrollIntoViewIfNeeded();assert.ok(await page.locator('#graph-view .plot-reference img').evaluate(img=>img.complete&&img.naturalWidth>0));
 await page.locator('#graph-view .plot-reference summary').click();await page.locator('#graph-view').scrollIntoViewIfNeeded();await page.locator('#graph-view').screenshot({path:`tmp/pdfs/trig-topics-${offline?'offline':'server'}.png`});
 // Exercise the actual pointer path on the circle and verify the numeric output changes.
 await page.locator('#trig-graph-canvas').evaluate(el=>el.scrollIntoView({block:'center'}));
 const box=await page.locator('#trig-graph-canvas').boundingBox();const dims=await page.locator('#trig-graph-canvas').evaluate(el=>({w:el.width,h:el.height}));const old=await page.getByLabel('Ángulo del gráfico',{exact:true}).inputValue();await page.mouse.move(box.x+box.width/2+60*box.width/dims.w,box.y+83*box.height/dims.h);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+23*box.height/dims.h,{steps:6});await page.mouse.up();assert.notEqual(await page.getByLabel('Ángulo del gráfico',{exact:true}).inputValue(),old);
 await page.setViewportSize({width:390,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));assert.deepEqual(errors,[]);
 if(!offline){await page.setViewportSize({width:500,height:1200});await page.evaluate(()=>{document.body.innerHTML='<main style="width:440px;margin:20px auto;padding:12px;background:white"><canvas id="qa-trig"></canvas></main>';window.qaTrig=new TopicTrigGraph('qa-trig',{funcType:'sin'});qaTrig.setParameters({funcType:'cot',angle:135});});await page.locator('main').screenshot({path:'tmp/pdfs/trig-visual-review.png'});}
 await page.close();
}
await browser.close();console.log('PASS: six topic graphs, deep follow-ups, similarity, drag/keyboard controls, poles, reciprocal values, textbook images and mobile layout; PHP and offline');})().catch(e=>{console.error(e);process.exit(1)});
