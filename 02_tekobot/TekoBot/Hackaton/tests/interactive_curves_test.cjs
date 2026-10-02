const {chromium}=require('C:/Users/bogad/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:650,height:1000}});
await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));
await page.evaluate(()=>{document.body.innerHTML='<main style="width:380px;margin:20px auto;background:white"><canvas id="test-plot"></canvas></main>';window.graph=new MECVisualizers('test-plot');graph.renderTopicVisual('funciones');});
await page.waitForTimeout(100);
assert.equal(await page.evaluate(()=>graph.evaluate(2)),1);
const original=await page.locator('.plot-formula').textContent();
const drag=async(handle,dx,dy)=>{
const p=await page.evaluate(handle=>{const g=graph,v=g.plot,r=g.canvas.getBoundingClientRect();return handle?{x:r.left+g.handle.x,y:r.top+g.handle.y}:{x:r.left+v.left+(4-v.xmin)*v.sx,y:r.top+v.top+(v.ymax-g.evaluate(4))*v.sy};},handle);
await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+dx,p.y+dy,{steps:8});await page.mouse.up();};
await drag(false,20,-20);
assert.notEqual(await page.locator('.plot-formula').textContent(),original);
assert.ok(await page.evaluate(()=>graph.shift>0 && graph.intercept>0));
await page.getByRole('button',{name:'Restablecer'}).click();
await drag(true,0,-20);assert.ok(await page.evaluate(()=>graph.slope>1));
for(const [kind,value] of [['cuadratica',4],['exponencial',18],['lineal',2],['constante',1],['modulo',2],['parte_entera',2]]){
await page.getByLabel('Tipo de función',{exact:true}).selectOption(kind);assert.equal(await page.evaluate(()=>graph.evaluate(2)),value);
}
await page.getByLabel('Tipo de función',{exact:true}).selectOption('logaritmica');
assert.ok(await page.evaluate(()=>Number.isNaN(graph.evaluate(0))));
await page.waitForFunction(()=>document.querySelector('.plot-reference img').naturalWidth>0);
await page.screenshot({path:'tmp/pdfs/interactive-curves.png'});
await page.setViewportSize({width:360,height:900});
await page.evaluate(()=>document.querySelector('main').style.width='100%');
await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>graph.canvas.width<=360));
await browser.close();console.log('PASS: curve drag, shape drag, formula synchronization, reset, seven function families, logarithmic domain, PDF image and responsive canvas');
})().catch(e=>{console.error(e);process.exit(1)});
