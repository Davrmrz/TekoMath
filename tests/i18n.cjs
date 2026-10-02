const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    await page.route('http://teko.test/**', route => route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<div class="brand"></div><h1 class="welcome__title">¡Hola, <span class="welcome__name">Inicio</span>!</h1>
        <button class="btn" id="action"><span id="icon">★</span>Inicio Docente</button>
        <h2 class="card__title">Zona de Juegos Arcade</h2>
        <input placeholder="Correo electrónico"><div id="dynamic"></div>`
    }));
    await page.goto('http://teko.test/');
    await page.evaluate(() => {
      window.clicks = 0;
      window.originalIcon = document.querySelector('#icon');
      document.querySelector('#action').addEventListener('click', () => window.clicks++);
    });
    await page.addScriptTag({ path: path.join(__dirname, '..', 'jopamath_i18n.js') });
    await page.click('[data-lang="jopara"]');
    // Any observer feedback loop prevents these browser operations from finishing.
    assert.equal(await page.locator('.card__title').textContent(), 'Ñembosarái Renda Arcade 🎮');
    assert.equal(await page.locator('#action').textContent(), "★Mbo'ehára Ñepyrũha");
    assert.equal(await page.locator('.welcome__name').textContent(), 'Inicio');
    assert.equal(await page.locator('input').getAttribute('placeholder'), 'Ñanduti veve (Email)');
    await page.click('#action');
    assert.equal(await page.evaluate(() => window.clicks), 1);
    assert.equal(await page.evaluate(() => originalIcon === document.querySelector('#icon')), true);
    await page.evaluate(() => {
      document.querySelector('#dynamic').innerHTML = '<button class="btn">Siguiente Pregunta</button>';
    });
    assert.equal(await page.locator('#dynamic button').textContent(), 'Upe riregua 👉');
    await page.evaluate(() => { document.querySelector('#dynamic button').firstChild.nodeValue = 'Finalizar Quiz'; });
    assert.equal(await page.locator('#dynamic button').textContent(), 'Emohu\u0027ã Quiz 🏁');
    for (let i = 0; i < 5; i++) {
      await page.click('[data-lang="es"]');
      assert.equal(await page.locator('#dynamic button').textContent(), 'Finalizar Quiz');
      assert.equal(await page.locator('#action').textContent(), '★Inicio Docente');
      await page.click('[data-lang="jopara"]');
    }
    await page.reload();
    await page.addScriptTag({ path: path.join(__dirname, '..', 'jopamath_i18n.js') });
    assert.equal(await page.locator('html').getAttribute('lang'), 'gn');
    await page.evaluate(() => {
      Storage.prototype.setItem = () => { throw new Error('Storage blocked'); };
    });
    await page.click('[data-lang="es"]');
    assert.equal(await page.locator('html').getAttribute('lang'), 'es');
    await page.evaluate(() => {
      document.querySelector('#dynamic').innerHTML = `<div id="mission-modal-backdrop"><h3>1. EXPLORÁ</h3><p>Calcula el valor exacto de cos(120°) paso a paso.</p><button id="mission-answer">Porque cos(120°) = −1/2.</button><span class="katex">Calcula x = 2</span></div>`;
      window.missionClicks = 0;
      document.querySelector('#mission-answer').onclick = () => window.missionClicks++;
    });
    await page.click('[data-lang="jopara"]');
    assert.equal(await page.locator('#mission-modal-backdrop h3').textContent(), '1. EHESA’ỸIJO');
    assert.equal(await page.locator('#mission-modal-backdrop p').textContent(), 'Eheka valor exacto ko’ãva rehegua: cos(120°) peteĩ paso rire ambue.');
    assert.equal(await page.locator('.katex').textContent(), 'Calcula x = 2');
    await page.click('#mission-answer');
    assert.equal(await page.evaluate(() => window.missionClicks), 1);
    await page.click('[data-lang="es"]');
    assert.equal(await page.locator('#mission-answer').textContent(), 'Porque cos(120°) = −1/2.');
    await page.evaluate(() => {
      window.languageEvents = [];
      window.addEventListener('jopamath:languagechange', e => window.languageEvents.push(e.detail.language));
    });
    await page.click('[data-lang="jopara"]');
    await page.evaluate(() => { document.querySelector('#mission-modal-backdrop p').textContent = '¡Correcto!'; });
    assert.equal(await page.locator('#mission-modal-backdrop p').textContent(), '¡Oĩ porã!');
    assert.deepEqual(await page.evaluate(() => window.languageEvents), ['jopara']);
    await page.click('[data-lang="es"]');
    assert.equal(await page.locator('#mission-modal-backdrop p').textContent(), '¡Correcto!');
    console.log('PASS: switching, observer stability, events, identity, dynamic text, originals, persistence and blocked storage');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
