const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
global.window = {};
for (const name of ['curriculum', 'language_data', 'language', 'problem_guide', 'question_resolver', 'trig_questions', 'lesson_engine']) {
    vm.runInThisContext(fs.readFileSync(`assets/js/${name}.js`, 'utf8'));
}
const cards = QuestionResolver.cards().filter(card => /^trigonometria:(seno|coseno|tangente|cotangente|secante|cosecante)$/.test(card.key));
assert.equal(cards.length, 6);
for (const card of cards) {
    for (const field of ['definition', 'detail', 'why', 'usage', 'warning', 'domain', 'range', 'signs', 'graph', 'example', 'simple']) {
        if (!card[field]) continue;
        const source = card[field];
        const translated = TutorLanguage.lessonText(source);
        assert.notEqual(translated, source, `${card.key}/${field} untranslated`);
        assert.equal(TutorLanguage.lessonText(translated), translated, `${card.key}/${field} translated twice`);
        // Preserve numerical data and the ordered mathematical operator sequence.
        const mathTokens = text => text.match(/\d+(?:[.,]\d+)?|[=≠≈√²πραθ∞∪[\]−+/*]/gu) || [];
        assert.deepEqual(mathTokens(translated), mathTokens(source), `${card.key}/${field} changed mathematics`);
    }
    const state = LessonEngine.initial('trigonometria', card.subtopic);
    state.mode = 'TEACHING_MODE';
    state.language = 'jopara';
    const response = LessonEngine.response(state);
    assert.doesNotMatch(response.tutor_message_jopara, /Los triángulos rectángulos que comparten|Para leer la gráfica, localizá|Las razones no tienen unidad|Compará los datos de ambos ejemplos/);
    assert.match(response.tutor_message_jopara, /Ñaikũmby ko relación/);
    assert.equal(response.formula_display.latex, card.formula);
}
const source = 'Entendamos la relación';
const literals = ['`' + source + '`', '```\n' + source + '\n```', '$' + source + '$', '\\(' + source + '\\)', '<a title="' + source + '">', '{{' + source + '}}'];
for (const literal of literals) assert.equal(TutorLanguage.lessonText(literal), literal);
const input = [...literals, ...Object.keys(window.TUTOR_LANGUAGE_DATA.lesson_phrases)];
const php = spawnSync('C:/xampp1/php/php.exe', ['-r', 'require "services/language_service.php"; $texts=json_decode(stream_get_contents(STDIN),true); echo json_encode(array_map(fn($text)=>TutorLanguage::lessonText($text),$texts),JSON_UNESCAPED_UNICODE);'], {input: JSON.stringify(input), encoding: 'utf8'});
assert.equal(php.status, 0, php.stderr);
assert.equal(php.stderr, '');
assert.deepEqual(JSON.parse(php.stdout), input.map(text => TutorLanguage.lessonText(text)));
console.log('PASS: six complete trig explanations, examples, numeric/operator preservation, idempotence, protected literals and PHP/JS parity');
