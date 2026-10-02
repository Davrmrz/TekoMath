const {chromium}=require('C:/Users/bogad/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 for(const offline of [false,true]){
  const page=await browser.newPage({viewport:{width:1365,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8129')?r.continue():r.abort());
  if(offline)await page.route('**/api/**',r=>r.abort());
  await page.goto(`http://127.0.0.1:8129/${offline?'index.html':'index.php'}`);
  async function language(value){await page.locator('#btn-toggle-sidebar').click();await page.locator('#language-mode').selectOption(value);await page.locator('#btn-close-sidebar').click();}
  await language('es');
  await page.locator('#btn-toggle-sidebar').click();await page.locator('.curriculum-unit').first().locator('summary').click();
  await page.getByRole('button',{name:'Función lineal',exact:true}).click();
  await page.getByRole('button',{name:'Sí, explícame',exact:true}).waitFor();
  assert.match(await page.locator('.chat-message.tutor').last().innerText(),/Quieres|quieres/);
  await page.getByRole('button',{name:'Sí, explícame',exact:true}).click();
  await page.getByRole('button',{name:'Muéstrame un ejemplo',exact:true}).waitFor();
  let text=await page.locator('.chat-message.tutor').last().innerText();assert.match(text,/valor elegido/);assert.doesNotMatch(text,/Maitei|Iporã|querés|podés|identificá/);
  await language('es_py');
  await page.getByRole('button',{name:'Mostrame un ejemplo',exact:true}).click();
  await page.getByRole('button',{name:'Mostrame otro ejemplo',exact:true}).waitFor();
  text=await page.locator('.chat-message.tutor').last().innerText();assert.match(text,/Mirá este ejemplo/);
  await language('jopara');
  await page.getByRole('button',{name:'Jahecha otro ejemplo',exact:true}).click();
  await page.waitForFunction(()=>!document.getElementById('typing-indicator'));
  text=await page.locator('.chat-message.tutor').last().innerText();assert.match(text,/Jahecha peteĩ ejemplo/);assert.match(text,/Ñaikũmby esta relación/);
  await language('es');await page.reload();
  await page.getByRole('button',{name:'Muéstrame otro ejemplo',exact:true}).waitFor();
  assert.equal(await page.locator('#language-mode').inputValue(),'es');
  await page.locator('#chat-input').fill('qué es tangente');await page.locator('#send-btn').click();await page.waitForFunction(()=>!document.getElementById('typing-indicator'));
  text=await page.locator('.chat-message.tutor').last().innerText();assert.match(text,/cateto opuesto/);assert.doesNotMatch(text,/Jahecha|Ñaik|querés|podés/);
  assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();console.log('PASS: PHP and offline UI, selected language on welcome, live switching, explanations/examples/questions, reload and no JS errors');
})().catch(e=>{console.error(e);process.exit(1)});
