const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'teko.test') return route.abort();
      if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<div class="brand"></div><iframe src="/TekoBot/Hackaton/index.html"></iframe><script src="/jopamath_i18n.js"></script>' });
      const file = path.join(__dirname, '..', decodeURIComponent(url.pathname));
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({ status: 404, body: '{}' });
      return route.fulfill({ body: fs.readFileSync(file), contentType: file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : 'application/octet-stream' });
    });
    await page.goto('http://teko.test/');
    const frame = page.frames().find(f => f.url().includes('index.html'));
    await frame.waitForSelector('#btn-hint');
    assert.equal(await frame.evaluate(() => JopaMathI18n.getLanguage()), 'es');
    await page.click('[data-lang="jopara"]');
    await frame.waitForFunction(() => localStorage.getItem('kyhyjey_lang') === 'jopara');
    assert.equal(await frame.locator('#btn-hint').textContent(), 'Eme’ẽ chéve peteĩ pista');
    const state = await frame.evaluate(() => JSON.parse(localStorage.getItem('kyhyjey_state_' + localStorage.getItem('kyhyjey_session'))));
    if (state) assert.equal(state.language, 'jopara');
    await page.click('[data-lang="es"]');
    await frame.waitForFunction(() => localStorage.getItem('kyhyjey_lang') === 'es');
    assert.equal(await frame.locator('#btn-hint').textContent(), 'Dame una pista');
    await page.reload();
    assert.equal(await page.frames().find(f => f.url().includes('index.html')).evaluate(() => JopaMathI18n.getLanguage()), 'es');
    const restoredFrame = page.frames().find(f => f.url().includes('index.html'));
    const saved = await restoredFrame.evaluate(() => {
      const uuid = localStorage.getItem('kyhyjey_session');
      const source = QuestionResolver.cards().find(card => card.key === 'trigonometria:seno').definition;
      const history = [{role: 'assistant', message: source}, {role: 'user', message: source}];
      localStorage.setItem('kyhyjey_history_' + uuid, JSON.stringify(history));
      localStorage.setItem('kyhyjey_local_' + uuid, '1');
      return {uuid, source};
    });
    await page.click('[data-lang="jopara"]');
    await page.reload();
    const historyFrame = page.frames().find(f => f.url().includes('index.html'));
    await historyFrame.waitForFunction(() => document.querySelector('.chat-message.user'));
    assert.match(await historyFrame.locator('.chat-message.tutor').last().innerText(), /Seno ha’e y\/ρ/);
    assert.equal(await historyFrame.locator('.chat-message.user .message-bubble').textContent(), saved.source);
    const originalHistory = await historyFrame.evaluate(uuid => JSON.parse(localStorage.getItem('kyhyjey_history_' + uuid)), saved.uuid);
    assert.equal(originalHistory[0].message, saved.source);
    assert.deepEqual(errors, []);
    console.log('PASS: real tutor iframe, shared preference, active state, UI switching and reload');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
