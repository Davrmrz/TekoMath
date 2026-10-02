/* ============================================
   TEKO MATH — Motor de Juego Arcade (juego.js)
   Desafíos trigonométricos interactivos
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Elementos DOM ----
  const modesGrid = document.getElementById('modes-grid');
  const gameArena = document.getElementById('game-arena');
  const summaryBox = document.getElementById('game-summary');
  
  const timerFill = document.getElementById('timer-fill');
  const timerText = document.getElementById('timer-text');
  const scoreVal = document.getElementById('score-val');
  const comboVal = document.getElementById('combo-val');
  const totalScoreVal = document.getElementById('total-score-val');
  const bestScoreVal = document.getElementById('best-score-val');

  const qTopic = document.getElementById('q-topic');
  const qPrompt = document.getElementById('q-prompt');
  const qCanvas = document.getElementById('q-canvas');
  const qOptions = document.getElementById('q-options');

  const btnExit = document.getElementById('btn-exit-game');
  const btnRestart = document.getElementById('btn-restart-game');

  // ---- User Dropdown Topnav ----
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('topnav__user-dropdown--open');
    });

    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && e.target !== userMenuBtn) {
        userDropdown.classList.remove('topnav__user-dropdown--open');
      }
    });
  }

  // ---- Estado del Juego ----
  let currentMode = null;
  let score = 0;
  let combo = 1;
  let streak = 0;
  let currentQuestion = 0;
  const TOTAL_QUESTIONS = 7;
  let timerInterval = null;
  let timeLeft = 12; // segundos por pregunta
  const TIME_PER_QUESTION = 12;

  // Cargar récord guardado
  let highScore = parseInt(localStorage.getItem('teko_game_highscore') || '0', 10);
  if (bestScoreVal) bestScoreVal.textContent = highScore;

  // ---- BASE DE DATOS DE PREGUNTAS ----

  // Modo 1: Círculo Unitario y Valores Notables
  const CIRCLE_QUESTIONS = [
    {
      topic: 'Ángulos Notables · 30°',
      prompt: '¿Cuál es el valor exacto de sen(30°)?',
      options: ['1/2', '√3/2', '√2/2', '1'],
      correct: 0
    },
    {
      topic: 'Ángulos Notables · 45°',
      prompt: '¿Cuál es el valor exacto de cos(45°)?',
      options: ['√2/2', '1/2', '√3/2', '0'],
      correct: 0
    },
    {
      topic: 'Ángulos Notables · 60°',
      prompt: '¿Cuál es el valor de tan(60°)?',
      options: ['√3', '1/√3', '1', '√3/2'],
      correct: 0
    },
    {
      topic: 'Ejes Cartesianos · 90° (π/2)',
      prompt: '¿Cuánto vale sen(90°) o sen(π/2)?',
      options: ['1', '0', '-1', 'Indefinido'],
      correct: 0
    },
    {
      topic: 'Ejes Cartesianos · 180° (π)',
      prompt: '¿Cuánto vale cos(180°)?',
      options: ['-1', '0', '1', '1/2'],
      correct: 0
    },
    {
      topic: 'Funciones Recíprocas',
      prompt: 'Si sen(θ) = 1/2, ¿cuánto vale csc(θ)?',
      options: ['2', '1/2', '√2', '4'],
      correct: 0
    },
    {
      topic: 'Identidades Fundamentales',
      prompt: '¿A qué es igual sen²(θ) + cos²(θ)?',
      options: ['1', '0', 'tan(θ)', '2'],
      correct: 0
    }
  ];

  // Modo 2: Adivina la Gráfica
  const GRAPH_FUNCS = ['sen', 'cos', 'tan', 'csc', 'sec', 'cot'];

  // Modo 3: Signos por Cuadrante
  const QUADRANT_QUESTIONS = [
    { topic: 'Cuadrante II (90° a 180°)', prompt: '¿Qué signo tiene sen(θ) en el Cuadrante II?', options: ['[+] Positivo', '[−] Negativo'], correct: 0 },
    { topic: 'Cuadrante II (90° a 180°)', prompt: '¿Qué signo tiene cos(θ) en el Cuadrante II?', options: ['[−] Negativo', '[+] Positivo'], correct: 0 },
    { topic: 'Cuadrante III (180° a 270°)', prompt: '¿Qué signo tiene tan(θ) en el Cuadrante III?', options: ['[+] Positivo', '[−] Negativo'], correct: 0 },
    { topic: 'Cuadrante IV (270° a 360°)', prompt: '¿Qué signo tiene cos(θ) en el Cuadrante IV?', options: ['[+] Positivo', '[−] Negativo'], correct: 0 },
    { topic: 'Cuadrante IV (270° a 360°)', prompt: '¿Qué signo tiene sen(θ) en el Cuadrante IV?', options: ['[−] Negativo', '[+] Positivo'], correct: 0 },
    { topic: 'Cuadrante III (180° a 270°)', prompt: '¿Qué signo tiene sec(θ) en el Cuadrante III?', options: ['[−] Negativo', '[+] Positivo'], correct: 0 },
    { topic: 'Cuadrante I (0° a 90°)', prompt: '¿Qué signo tienen TODAS las funciones en el Cuadrante I?', options: ['[+] Todas Positivas', '[−] Todas Negativas'], correct: 0 }
  ];

  // ============================================
  // TARJETAS DE CONCEPTOS (FLASHCARDS 3D) ENGINE
  // ============================================

  const flashcardsArena = document.getElementById('flashcards-arena');
  const flashcard3D = document.getElementById('flashcard-3d');
  const fcCanvas = document.getElementById('fc-canvas');

  const fcFrontBadge = document.getElementById('fc-front-badge');
  const fcIconWrap = document.getElementById('fc-icon-wrap');
  const fcFrontTitle = document.getElementById('fc-front-title');
  const fcFrontFormula = document.getElementById('fc-front-formula');
  const fcFrontDesc = document.getElementById('fc-front-desc');
  const fcBtnAudio = document.getElementById('fc-btn-audio');

  const fcBackBadge = document.getElementById('fc-back-badge');
  const fcBackTitle = document.getElementById('fc-back-title');
  const fcSignsGrid = document.getElementById('fc-signs-grid');
  const fcMnemonicLabel = document.getElementById('fc-mnemonic-label');
  const fcMnemonicText = document.getElementById('fc-mnemonic-text');
  const fcQuizPrompt = document.getElementById('fc-quiz-prompt');
  const fcQuizOptions = document.getElementById('fc-quiz-options');
  const fcQuizFeedback = document.getElementById('fc-quiz-feedback');

  const fcCounterText = document.getElementById('fc-counter-text');
  const fcMasteryText = document.getElementById('fc-mastery-text');
  const fcProgressFill = document.getElementById('fc-progress-fill');

  const btnFcPrev = document.getElementById('btn-fc-prev');
  const btnFcNext = document.getElementById('btn-fc-next');
  const btnFcFlip = document.getElementById('btn-fc-flip');
  const btnFcReview = document.getElementById('btn-fc-review');
  const btnFcMaster = document.getElementById('btn-fc-master');
  const btnFcShuffle = document.getElementById('btn-flashcards-shuffle');
  const btnExitFc = document.getElementById('btn-exit-flashcards');

  // Catálogo de Tarjetas de Conceptos
  const CONCEPT_CARDS = [
    {
      id: 'seno',
      cat: 'directas',
      name: 'Seno · sen(θ)',
      badge: 'Razón Directa',
      icon: '📈',
      formula: 'sen(θ) = Cateto Opuesto / Hipotenusa = Y',
      desc: 'En el círculo unitario (r = 1), el seno corresponde a la coordenada vertical Y del punto sobre la circunferencia.',
      drawType: 'sen',
      signs: [
        { quad: 'Cuad. I (0°-90°)', val: '+', isPos: true },
        { quad: 'Cuad. II (90°-180°)', val: '+', isPos: true },
        { quad: 'Cuad. III (180°-270°)', val: '−', isPos: false },
        { quad: 'Cuad. IV (270°-360°)', val: '−', isPos: false }
      ],
      mnemonic: 'El Seno es POSITIVO en la mitad SUPERIOR del plano (Cuadrantes I y II), donde Y > 0. Valores clave: sen(30°) = 1/2, sen(90°) = 1.',
      audio: 'Función Seno: equivale a la coordenada vertical Y en el círculo unitario. Es positiva en los cuadrantes uno y dos, y negativa en tres y cuatro.',
      quiz: {
        prompt: '¿En qué cuadrantes el seno sen(θ) es estrictamente positivo?',
        options: ['Cuadrantes I y II', 'Cuadrantes I y IV', 'Cuadrantes II y III', 'Solo en Cuadrante I'],
        correct: 0,
        explanation: '¡Correcto! En los cuadrantes I y II la coordenada Y está por encima del origen, por lo que sen(θ) > 0.'
      }
    },
    {
      id: 'coseno',
      cat: 'directas',
      name: 'Coseno · cos(θ)',
      badge: 'Razón Directa',
      icon: '📉',
      formula: 'cos(θ) = Cateto Adyacente / Hipotenusa = X',
      desc: 'En el círculo unitario (r = 1), el coseno representa la proyección horizontal X desde el origen hasta el punto.',
      drawType: 'cos',
      signs: [
        { quad: 'Cuad. I (0°-90°)', val: '+', isPos: true },
        { quad: 'Cuad. II (90°-180°)', val: '−', isPos: false },
        { quad: 'Cuad. III (180°-270°)', val: '−', isPos: false },
        { quad: 'Cuad. IV (270°-360°)', val: '+', isPos: true }
      ],
      mnemonic: 'El Coseno es POSITIVO en la mitad DERECHA del plano (Cuadrantes I y IV), donde X > 0. Valores clave: cos(60°) = 1/2, cos(0°) = 1, cos(180°) = −1.',
      audio: 'Función Coseno: representa la proyección horizontal X en la circunferencia unitaria. Es positiva a la derecha en los cuadrantes uno y cuatro.',
      quiz: {
        prompt: 'Si θ = 120° (Cuadrante II), ¿cuál es el valor exacto de cos(120°)?',
        options: ['−1/2', '+1/2', '−√3/2', '0'],
        correct: 0,
        explanation: '¡Excelente! En el Cuadrante II el coseno es negativo: cos(120°) = −cos(60°) = −1/2.'
      }
    },
    {
      id: 'tangente',
      cat: 'directas',
      name: 'Tangente · tan(θ)',
      badge: 'Razón Directa',
      icon: '⚡',
      formula: 'tan(θ) = sen(θ) / cos(θ) = Y / X',
      desc: 'Representa la pendiente de la recta radial y la longitud del segmento tangente a la circunferencia.',
      drawType: 'tan',
      signs: [
        { quad: 'Cuad. I (0°-90°)', val: '+ (+/+)', isPos: true },
        { quad: 'Cuad. II (90°-180°)', val: '− (+/−)', isPos: false },
        { quad: 'Cuad. III (180°-270°)', val: '+ (−/−)', isPos: true },
        { quad: 'Cuad. IV (270°-360°)', val: '− (−/+)', isPos: false }
      ],
      mnemonic: 'La Tangente es POSITIVA cuando Seno y Coseno tienen el MISMO signo (Cuadrantes I y III: +/+ o −/−). En 90° y 270° no existe (asíntotas).',
      audio: 'Función Tangente: es el cociente entre seno y coseno, o Y dividido X. Es positiva en los cuadrantes uno y tres.',
      quiz: {
        prompt: '¿Por qué tan(90°) está indefinida en trigonometría?',
        options: ['Porque cos(90°) = 0 y no se puede dividir entre cero', 'Porque sen(90°) = 0', 'Porque el radio vale cero', 'Porque es negativa'],
        correct: 0,
        explanation: '¡Exacto! Como tan(θ) = sen(θ)/cos(θ) y cos(90°) = 0, la división por cero no está definida en los reales.'
      }
    },
    {
      id: 'cosecante',
      cat: 'reciprocas',
      name: 'Cosecante · csc(θ)',
      badge: 'Razón Recíproca',
      icon: '🔄',
      formula: 'csc(θ) = 1 / sen(θ) = Hipotenusa / Opuesto',
      desc: 'Es la recíproca multiplicativa directa del seno. Comparte exactamente el mismo signo que sen(θ) en cada cuadrante.',
      drawType: 'csc',
      signs: [
        { quad: 'Cuad. I (0°-90°)', val: '+', isPos: true },
        { quad: 'Cuad. II (90°-180°)', val: '+', isPos: true },
        { quad: 'Cuad. III (180°-270°)', val: '−', isPos: false },
        { quad: 'Cuad. IV (270°-360°)', val: '−', isPos: false }
      ],
      mnemonic: 'Regla del "Co-inverso": Cosecante va con Seno (Csc ↔ Sen). Si sen(30°) = 1/2, entonces csc(30°) = 2/1 = 2.',
      audio: 'Cosecante: es la inversa recíproca del seno. Si sen(θ) vale un medio, su cosecante vale dos.',
      quiz: {
        prompt: 'Si sen(θ) = 3/5 en el Cuadrante I, ¿cuál es el valor de csc(θ)?',
        options: ['5/3', '3/5', '4/5', '5/4'],
        correct: 0,
        explanation: '¡Muy bien! Como csc(θ) = 1/sen(θ), simplemente invertimos la fracción: 1 / (3/5) = 5/3.'
      }
    },
    {
      id: 'secante',
      cat: 'reciprocas',
      name: 'Secante · sec(θ)',
      badge: 'Razón Recíproca',
      icon: '📐',
      formula: 'sec(θ) = 1 / cos(θ) = Hipotenusa / Adyacente',
      desc: 'Es la razón recíproca multiplicativa del coseno. Comparte siempre los mismos signos (+ / −) que el coseno.',
      drawType: 'sec',
      signs: [
        { quad: 'Cuad. I (0°-90°)', val: '+', isPos: true },
        { quad: 'Cuad. II (90°-180°)', val: '−', isPos: false },
        { quad: 'Cuad. III (180°-270°)', val: '−', isPos: false },
        { quad: 'Cuad. IV (270°-360°)', val: '+', isPos: true }
      ],
      mnemonic: 'Regla del "Co-inverso": Secante va con Coseno (Sec ↔ Cos). Si cos(60°) = 1/2, entonces sec(60°) = 2.',
      audio: 'Secante: es la inversa recíproca del coseno. Es positiva en los cuadrantes uno y cuatro, igual que cos(θ).',
      quiz: {
        prompt: '¿En qué cuadrante la secante sec(θ) es negativa?',
        options: ['Cuadrantes II y III', 'Cuadrantes I y IV', 'Solo en Cuadrante I', 'En todos los cuadrantes'],
        correct: 0,
        explanation: '¡Brillante! Como sec(θ) = 1/cos(θ), tiene signo negativo donde cos(θ) < 0 (Cuadrantes II y III).'
      }
    },
    {
      id: 'cotangente',
      cat: 'reciprocas',
      name: 'Cotangente · cot(θ)',
      badge: 'Razón Recíproca',
      icon: '📏',
      formula: 'cot(θ) = 1 / tan(θ) = cos(θ) / sen(θ) = X / Y',
      desc: 'Es la recíproca de la tangente. Expresa la razón entre el cateto adyacente y el cateto opuesto.',
      drawType: 'cot',
      signs: [
        { quad: 'Cuad. I (0°-90°)', val: '+', isPos: true },
        { quad: 'Cuad. II (90°-180°)', val: '−', isPos: false },
        { quad: 'Cuad. III (180°-270°)', val: '+', isPos: true },
        { quad: 'Cuad. IV (270°-360°)', val: '−', isPos: false }
      ],
      mnemonic: 'Cotangente y Tangente son POSITIVAS en los cuadrantes impares (I y III), y NEGATIVAS en los pares (II y IV). cot(45°) = 1.',
      audio: 'Cotangente: es la inversa de la tangente, o coseno dividido seno. Vale uno en 45 grados.',
      quiz: {
        prompt: 'Si tan(θ) = 4/3, ¿cuánto vale cot(θ)?',
        options: ['3/4', '4/3', '5/4', '−3/4'],
        correct: 0,
        explanation: '¡Correcto! cot(θ) = 1/tan(θ) = 3/4.'
      }
    },
    {
      id: 'cuadrantes',
      cat: 'cuadrantes',
      name: 'Signos por Cuadrante & Mnemotecnia',
      badge: 'Círculo Unitario',
      icon: '🧭',
      formula: 'Mnemotecnia: "TODOS - SIN - TA - COS"',
      desc: 'Regla nemotécnica universal para recordar las funciones que son estrictamente POSITIVAS (+) en cada cuadrante.',
      drawType: 'cuadrantes',
      signs: [
        { quad: 'I: TODOS (+)', val: 'Todas (+)', isPos: true },
        { quad: 'II: SIN (+)', val: 'Sen & Csc (+)', isPos: true },
        { quad: 'III: TA (+)', val: 'Tan & Cot (+)', isPos: true },
        { quad: 'IV: COS (+)', val: 'Cos & Sec (+)', isPos: true }
      ],
      mnemonic: 'I: TODOS son positivos (+). II: Solo SIN (Seno/Csc). III: Solo TA (Tangente/Cot). IV: Solo COS (Coseno/Sec).',
      audio: 'Mnemotecnia de cuadrantes: Todos en el primero, Seno en el segundo, Tangente en el tercero, Coseno en el cuarto.',
      quiz: {
        prompt: 'Un ángulo θ tiene sen(θ) < 0 y cos(θ) > 0. ¿En qué cuadrante se encuentra?',
        options: ['Cuadrante IV', 'Cuadrante II', 'Cuadrante III', 'Cuadrante I'],
        correct: 0,
        explanation: '¡Perfecto! En el Cuadrante IV X > 0 (coseno positivo) y Y < 0 (seno negativo).'
      }
    },
    {
      id: 'pitagorica',
      cat: 'identidades',
      name: 'Identidad Fundamental Pitagórica',
      badge: 'Identidad Clave',
      icon: '📐',
      formula: 'sen²(θ) + cos²(θ) = 1',
      desc: 'Nace del Teorema de Pitágoras (a² + b² = c²) aplicado al triángulo rectángulo inscrito en el círculo unitario (r = 1).',
      drawType: 'pitagorica',
      signs: [
        { quad: 'sen²(θ) + cos²(θ)', val: '= 1', isPos: true },
        { quad: '1 + tan²(θ)', val: '= sec²(θ)', isPos: true },
        { quad: '1 + cot²(θ)', val: '= csc²(θ)', isPos: true },
        { quad: 'sen(θ)', val: '= ±√(1−cos²)', isPos: true }
      ],
      mnemonic: '¡Siempre da 1 sin importar el ángulo θ! Ejemplo: sen²(30°) + cos²(30°) = (1/2)² + (√3/2)² = 1/4 + 3/4 = 4/4 = 1.',
      audio: 'Identidad Fundamental: el seno al cuadrado de cualquier ángulo más el coseno al cuadrado del mismo ángulo siempre es igual a uno.',
      quiz: {
        prompt: 'Si cos(θ) = 0.6 y θ está en el Cuadrante I, ¿cuánto vale sen(θ)?',
        options: ['0.8', '0.4', '0.64', '1.0'],
        correct: 0,
        explanation: '¡Excelente! sen(θ) = √(1 − cos²(θ)) = √(1 − 0.36) = √0.64 = 0.8.'
      }
    }
  ];

  let currentCategory = 'all';
  let filteredCards = [...CONCEPT_CARDS];
  let currentCardIndex = 0;
  let masteredCards = JSON.parse(localStorage.getItem('teko_flashcards_mastery') || '[]');

  // Inicializar handlers de Flashcards
  function initFlashcardsHandlers() {
    // Filtros de Categoría
    document.querySelectorAll('.flashcards-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.flashcards-filter-btn').forEach(b => b.classList.remove('flashcards-filter-btn--active'));
        btn.classList.add('flashcards-filter-btn--active');
        currentCategory = btn.getAttribute('data-cat');
        applyCategoryFilter();
      });
    });

    // Flip al hacer clic en la tarjeta o botón
    if (flashcard3D) {
      flashcard3D.addEventListener('click', (e) => {
        // Evitar flip si hace clic en un botón interactivo dentro de la tarjeta
        if (e.target.closest('button') || e.target.closest('.fc-quiz-btn')) return;
        toggleFlipCard();
      });
    }

    if (btnFcFlip) {
      btnFcFlip.addEventListener('click', () => toggleFlipCard());
    }

    // Navegación
    if (btnFcPrev) {
      btnFcPrev.addEventListener('click', () => navigateCard(-1));
    }

    if (btnFcNext) {
      btnFcNext.addEventListener('click', () => navigateCard(1));
    }

    // Mezclar
    if (btnFcShuffle) {
      btnFcShuffle.addEventListener('click', () => {
        shuffleArray(filteredCards);
        currentCardIndex = 0;
        renderCurrentFlashcard();
      });
    }

    // Audio / Síntesis de voz
    if (fcBtnAudio) {
      fcBtnAudio.addEventListener('click', (e) => {
        e.stopPropagation();
        playCardAudio();
      });
    }

    // Acciones de Dominio
    if (btnFcMaster) {
      btnFcMaster.addEventListener('click', () => markCardMastered(true));
    }

    if (btnFcReview) {
      btnFcReview.addEventListener('click', () => markCardMastered(false));
    }

    // Salir
    if (btnExitFc) {
      btnExitFc.addEventListener('click', () => {
        flashcardsArena.style.display = 'none';
        modesGrid.style.display = 'grid';
      });
    }

    // Atajos de teclado para Flashcards
    document.addEventListener('keydown', (e) => {
      if (flashcardsArena.style.display !== 'block') return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlipCard();
      } else if (e.code === 'ArrowRight') {
        navigateCard(1);
      } else if (e.code === 'ArrowLeft') {
        navigateCard(-1);
      }
    });
  }

  function startFlashcardsMode() {
    modesGrid.style.display = 'none';
    gameArena.classList.remove('game-arena--active');
    summaryBox.style.display = 'none';
    flashcardsArena.style.display = 'block';

    currentCategory = 'all';
    document.querySelectorAll('.flashcards-filter-btn').forEach(b => {
      b.classList.toggle('flashcards-filter-btn--active', b.getAttribute('data-cat') === 'all');
    });

    applyCategoryFilter();
  }

  function applyCategoryFilter() {
    if (currentCategory === 'all') {
      filteredCards = [...CONCEPT_CARDS];
    } else {
      filteredCards = CONCEPT_CARDS.filter(c => c.cat === currentCategory);
    }
    currentCardIndex = 0;
    renderCurrentFlashcard();
  }

  function toggleFlipCard() {
    if (flashcard3D) {
      flashcard3D.classList.toggle('is-flipped');
    }
  }

  function navigateCard(direction) {
    if (filteredCards.length === 0) return;
    if (flashcard3D) flashcard3D.classList.remove('is-flipped');

    currentCardIndex = (currentCardIndex + direction + filteredCards.length) % filteredCards.length;
    renderCurrentFlashcard();
  }

  function renderCurrentFlashcard() {
    const card = filteredCards[currentCardIndex];
    if (!card) return;

    if (flashcard3D) flashcard3D.classList.remove('is-flipped');

    // UI Frente
    if (fcFrontBadge) fcFrontBadge.textContent = card.badge;
    if (fcIconWrap) fcIconWrap.textContent = card.icon;
    if (fcFrontTitle) fcFrontTitle.textContent = card.name;
    if (fcFrontFormula) fcFrontFormula.textContent = card.formula;
    if (fcFrontDesc) fcFrontDesc.textContent = card.desc;

    // UI Reverso
    if (fcBackBadge) fcBackBadge.textContent = card.badge;
    if (fcBackTitle) fcBackTitle.textContent = `Reglas & Valores: ${card.name}`;

    // Signos por cuadrante
    if (fcSignsGrid) {
      fcSignsGrid.innerHTML = card.signs.map(s => `
        <div class="flashcard-sign-badge">
          <span class="flashcard-sign-badge__quad">${s.quad}</span>
          <span class="flashcard-sign-badge__val ${s.isPos ? 'flashcard-sign-badge__val--pos' : 'flashcard-sign-badge__val--neg'}">${s.val}</span>
        </div>
      `).join('');
    }

    if (fcMnemonicText) fcMnemonicText.textContent = card.mnemonic;

    // Mini Desafío
    if (fcQuizPrompt) fcQuizPrompt.textContent = card.quiz.prompt;
    if (fcQuizFeedback) fcQuizFeedback.style.display = 'none';

    if (fcQuizOptions) {
      fcQuizOptions.innerHTML = '';
      card.quiz.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = 'fc-quiz-btn';
        btn.textContent = optText;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          evalMiniQuiz(btn, idx === card.quiz.correct, card.quiz.explanation);
        });
        fcQuizOptions.appendChild(btn);
      });
    }

    // Progreso
    if (fcCounterText) fcCounterText.textContent = `Tarjeta ${currentCardIndex + 1} de ${filteredCards.length}`;
    if (fcProgressFill) {
      const pct = ((currentCardIndex + 1) / filteredCards.length) * 100;
      fcProgressFill.style.width = `${pct}%`;
    }

    updateMasteryUI();

    // Dibujar diagrama en canvas
    drawFlashcardDiagram(card.drawType);
  }

  function evalMiniQuiz(btn, isCorrect, explanation) {
    const allQuizBtns = fcQuizOptions.querySelectorAll('.fc-quiz-btn');
    allQuizBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
      btn.classList.add('fc-quiz-btn--correct');
      fcQuizFeedback.className = 'flashcard-quiz-feedback flashcard-quiz-feedback--good';
      fcQuizFeedback.innerHTML = `🌟 ${explanation}`;
      markCardMastered(true, false);
    } else {
      btn.classList.add('fc-quiz-btn--wrong');
      fcQuizFeedback.className = 'flashcard-quiz-feedback flashcard-quiz-feedback--bad';
      fcQuizFeedback.innerHTML = `🔍 Revisa: ${explanation}`;
    }
    fcQuizFeedback.style.display = 'block';
  }

  function markCardMastered(isMastered, advance = true) {
    const card = filteredCards[currentCardIndex];
    if (!card) return;

    if (isMastered) {
      if (!masteredCards.includes(card.id)) {
        masteredCards.push(card.id);
        localStorage.setItem('teko_flashcards_mastery', JSON.stringify(masteredCards));
      }
      if (btnFcMaster) {
        btnFcMaster.classList.add('spark-anim');
        setTimeout(() => btnFcMaster.classList.remove('spark-anim'), 400);
      }
    } else {
      masteredCards = masteredCards.filter(id => id !== card.id);
      localStorage.setItem('teko_flashcards_mastery', JSON.stringify(masteredCards));
    }

    updateMasteryUI();

    if (advance) {
      setTimeout(() => {
        navigateCard(1);
      }, 300);
    }
  }

  function updateMasteryUI() {
    const totalMastered = masteredCards.length;
    if (fcMasteryText) {
      fcMasteryText.textContent = `⭐ ${totalMastered} de ${CONCEPT_CARDS.length} dominadas`;
    }

    const currentCard = filteredCards[currentCardIndex];
    const isCurrentMastered = currentCard && masteredCards.includes(currentCard.id);
    if (btnFcMaster) {
      btnFcMaster.style.background = isCurrentMastered ? '#86efac' : '#dcfce7';
      btnFcMaster.textContent = isCurrentMastered ? '✅ Dominada' : '⭐ ¡Lo Domino! (+10 pts)';
    }
  }

  function playCardAudio() {
    const card = filteredCards[currentCardIndex];
    if (!card) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(card.audio || card.desc);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(card.desc);
    }
  }

  function drawFlashcardDiagram(drawType) {
    if (!fcCanvas) return;
    const ctx = fcCanvas.getContext('2d');
    const w = fcCanvas.width = 260;
    const h = fcCanvas.height = 120;
    const cx = w / 2;
    const cy = h / 2;
    const r = 44;

    ctx.clearRect(0, 0, w, h);

    // Fondo tenue
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Ejes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(10, cy);
    ctx.lineTo(w - 10, cy);
    ctx.moveTo(cx, 10);
    ctx.lineTo(cx, h - 10);
    ctx.stroke();

    // Circunferencia
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    const angle = (55 * Math.PI) / 180;
    const px = cx + r * Math.cos(angle);
    const py = cy - r * Math.sin(angle);

    // Radio
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    if (drawType === 'sen') {
      // Proyección vertical Y (verde)
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('sen(θ) = Y', px + 6, cy - r / 2);
    } else if (drawType === 'cos') {
      // Proyección horizontal X (morado)
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, cy);
      ctx.stroke();

      ctx.fillStyle = '#7e22ce';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('cos(θ) = X', cx + 4, cy + 16);
    } else if (drawType === 'tan') {
      // Tangente (dorado)
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3.5;
      const tanX = cx + r;
      const tanY = cy - r * Math.tan(angle);
      ctx.beginPath();
      ctx.moveTo(tanX, cy);
      ctx.lineTo(tanX, Math.max(8, tanY));
      ctx.stroke();

      ctx.fillStyle = '#a16207';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('tan(θ)', tanX + 4, cy - 14);
    } else if (drawType === 'cuadrantes') {
      // Cuadrantes I, II, III, IV labels
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#166534';
      ctx.fillText('I (+/+)', cx + 12, cy - 18);
      ctx.fillStyle = '#991b1b';
      ctx.fillText('II (−/+)', cx - 44, cy - 18);
      ctx.fillText('III (−/−)', cx - 44, cy + 24);
      ctx.fillStyle = '#166534';
      ctx.fillText('IV (+/−)', cx + 12, cy + 24);
    } else {
      // General / Recíprocas
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Inicializar listeners al cargar
  initFlashcardsHandlers();

  // Iniciar Modos
  document.querySelectorAll('[data-start-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-start-mode');
      if (mode === 'flashcards') {
        startFlashcardsMode();
      } else {
        startGame(mode);
      }
    });
  });

  function startGame(mode) {
    currentMode = mode;
    score = 0;
    combo = 1;
    streak = 0;
    currentQuestion = 0;
    updateScoreUI();

    modesGrid.style.display = 'none';
    flashcardsArena.style.display = 'none';
    summaryBox.style.display = 'none';
    gameArena.classList.add('game-arena--active');

    loadNextQuestion();
  }

  function updateScoreUI() {
    if (scoreVal) scoreVal.textContent = score;
    if (comboVal) comboVal.textContent = `x${combo} Combo`;
  }

  function loadNextQuestion() {
    clearInterval(timerInterval);

    if (currentQuestion >= TOTAL_QUESTIONS) {
      endGame();
      return;
    }

    currentQuestion++;
    timeLeft = TIME_PER_QUESTION;
    updateTimerUI();

    // Iniciar temporizador
    timerInterval = setInterval(() => {
      timeLeft -= 0.1;
      if (timeLeft <= 0) {
        timeLeft = 0;
        clearInterval(timerInterval);
        handleTimeout();
      }
      updateTimerUI();
    }, 100);

    qCanvas.style.display = 'none';

    if (currentMode === 'circle') {
      const q = CIRCLE_QUESTIONS[(currentQuestion - 1) % CIRCLE_QUESTIONS.length];
      renderQuestion(q);
    } else if (currentMode === 'graph') {
      renderGraphQuestion();
    } else if (currentMode === 'quadrant') {
      const q = QUADRANT_QUESTIONS[(currentQuestion - 1) % QUADRANT_QUESTIONS.length];
      renderQuestion(q);
    }
  }

  function updateTimerUI() {
    const pct = Math.max(0, (timeLeft / TIME_PER_QUESTION) * 100);
    if (timerFill) timerFill.style.width = `${pct}%`;
    if (timerText) timerText.textContent = `${Math.ceil(timeLeft)}s`;
  }

  function renderQuestion(q) {
    qTopic.textContent = `Pregunta ${currentQuestion}/${TOTAL_QUESTIONS} · ${q.topic}`;
    qPrompt.textContent = q.prompt;

    // Mezclar opciones
    const optionsWithIdx = q.options.map((opt, idx) => ({ text: opt, isCorrect: idx === q.correct }));
    shuffleArray(optionsWithIdx);

    qOptions.innerHTML = '';
    optionsWithIdx.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'game-option-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => selectAnswer(btn, opt.isCorrect));
      qOptions.appendChild(btn);
    });
  }

  function renderGraphQuestion() {
    qCanvas.style.display = 'block';
    const targetFunc = GRAPH_FUNCS[Math.floor(Math.random() * GRAPH_FUNCS.length)];
    
    qTopic.textContent = `Pregunta ${currentQuestion}/${TOTAL_QUESTIONS} · Reconocimiento Gráfico`;
    qPrompt.textContent = '¿A cuál de estas funciones pertenece la siguiente gráfica?';

    drawMiniWave(targetFunc);

    const wrongFuncs = GRAPH_FUNCS.filter(f => f !== targetFunc);
    shuffleArray(wrongFuncs);
    const chosenOptions = [targetFunc, wrongFuncs[0], wrongFuncs[1], wrongFuncs[2]];
    shuffleArray(chosenOptions);

    qOptions.innerHTML = '';
    chosenOptions.forEach(funcName => {
      const btn = document.createElement('button');
      btn.className = 'game-option-btn';
      btn.textContent = getFuncLabel(funcName);
      btn.addEventListener('click', () => selectAnswer(btn, funcName === targetFunc));
      qOptions.appendChild(btn);
    });
  }

  function getFuncLabel(f) {
    const labels = {
      sen: 'f(x) = sen(x)',
      cos: 'f(x) = cos(x)',
      tan: 'f(x) = tan(x)',
      csc: 'f(x) = csc(x)',
      sec: 'f(x) = sec(x)',
      cot: 'f(x) = cot(x)'
    };
    return labels[f] || f;
  }

  function drawMiniWave(funcName) {
    const ctx = qCanvas.getContext('2d');
    const width = qCanvas.width = qCanvas.offsetWidth || 400;
    const height = qCanvas.height = 180;

    ctx.clearRect(0, 0, width, height);

    // Ejes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Dibujar curva
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 3.5;
    ctx.beginPath();

    const scaleX = width / (4 * Math.PI);
    const scaleY = height / 3.5;
    const midY = height / 2;
    const midX = width / 2;

    let started = false;
    for (let px = 0; px < width; px += 2) {
      const x = (px - midX) / scaleX;
      let yVal = 0;

      if (funcName === 'sen') yVal = Math.sin(x);
      else if (funcName === 'cos') yVal = Math.cos(x);
      else if (funcName === 'tan') yVal = Math.tan(x);
      else if (funcName === 'csc') yVal = 1 / Math.sin(x);
      else if (funcName === 'sec') yVal = 1 / Math.cos(x);
      else if (funcName === 'cot') yVal = 1 / Math.tan(x);

      if (Math.abs(yVal) > 4) {
        started = false;
        continue;
      }

      const py = midY - yVal * scaleY;
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  function selectAnswer(button, isCorrect) {
    clearInterval(timerInterval);
    const allBtns = qOptions.querySelectorAll('.game-option-btn');
    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
      button.classList.add('game-option-btn--correct');
      streak++;
      combo = Math.min(4, 1 + Math.floor(streak / 2));
      const pointsEarned = Math.round((100 + timeLeft * 10) * combo);
      score += pointsEarned;
    } else {
      button.classList.add('game-option-btn--wrong');
      streak = 0;
      combo = 1;
    }

    updateScoreUI();

    setTimeout(() => {
      loadNextQuestion();
    }, 900);
  }

  function handleTimeout() {
    const allBtns = qOptions.querySelectorAll('.game-option-btn');
    allBtns.forEach(b => b.disabled = true);
    streak = 0;
    combo = 1;
    updateScoreUI();

    setTimeout(() => {
      loadNextQuestion();
    }, 900);
  }

  function endGame() {
    gameArena.classList.remove('game-arena--active');
    summaryBox.style.display = 'block';

    if (totalScoreVal) totalScoreVal.textContent = `${score} pts`;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('teko_game_highscore', highScore.toString());
      if (bestScoreVal) bestScoreVal.textContent = highScore;
    }
  }

  if (btnExit) {
    btnExit.addEventListener('click', () => {
      clearInterval(timerInterval);
      gameArena.classList.remove('game-arena--active');
      summaryBox.style.display = 'none';
      flashcardsArena.style.display = 'none';
      modesGrid.style.display = 'grid';
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      if (currentMode) startGame(currentMode);
    });
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

});
