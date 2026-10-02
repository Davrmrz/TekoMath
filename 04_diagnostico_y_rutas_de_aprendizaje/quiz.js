/* ============================================
   TEKO MATH — Generador de Quiz & Práctica Rápida (quiz.js)
   Genera evaluaciones dinámicas basadas en contenidos y dificultad
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Elementos de la Tarjeta de Práctica ----
  const topicBtns = document.querySelectorAll('.topic-pill-btn');
  const diffBtns = document.querySelectorAll('.diff-pill-btn');
  const btnStartPractice = document.getElementById('btn-start-practice');

  // ---- Elementos del Modal de Quiz ----
  const modalQuiz = document.getElementById('modal-quiz-repaso');
  const modalCloseBtn = document.getElementById('quiz-modal-close');
  const progressFill = document.getElementById('quiz-progress-fill');
  const qCounter = document.getElementById('quiz-q-counter');
  const qTopicBadge = document.getElementById('quiz-topic-badge');
  const qDiffBadge = document.getElementById('quiz-diff-badge');
  const qTitle = document.getElementById('quiz-q-title');
  const qOptionsWrap = document.getElementById('quiz-options-wrap');
  const qExplanation = document.getElementById('quiz-explanation');
  const qNextBtn = document.getElementById('quiz-next-btn');

  const quizBody = document.getElementById('quiz-interactive-body');
  const quizResults = document.getElementById('quiz-results-body');
  const resultScore = document.getElementById('quiz-result-score');
  const resultMsg = document.getElementById('quiz-result-msg');
  const btnRetryQuiz = document.getElementById('btn-retry-quiz');

  // Estado
  let selectedTopic = 'Trigonometría';
  let selectedDiff = 'facil'; // facil, medio, dificil
  let currentQuestions = [];
  let currentQIdx = 0;
  let correctCount = 0;

  // Selección de tema
  topicBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      topicBtns.forEach(b => b.classList.remove('topic-pill-btn--active'));
      btn.classList.add('topic-pill-btn--active');
      selectedTopic = btn.getAttribute('data-topic') || btn.textContent.trim();
    });
  });

  // Selección de dificultad
  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => b.classList.remove('diff-pill-btn--active'));
      btn.classList.add('diff-pill-btn--active');
      selectedDiff = btn.getAttribute('data-diff') || 'facil';
    });
  });

  // Abrir y Cerrar Modal
  function openQuizModal() {
    if (!modalQuiz) return;
    modalQuiz.classList.add('quiz-modal-backdrop--open');
  }

  function closeQuizModal() {
    if (!modalQuiz) return;
    modalQuiz.classList.remove('quiz-modal-backdrop--open');
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeQuizModal);
  }

  if (modalQuiz) {
    modalQuiz.addEventListener('click', (e) => {
      if (e.target === modalQuiz) closeQuizModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalQuiz && modalQuiz.classList.contains('quiz-modal-backdrop--open')) {
      closeQuizModal();
    }
  });

  // Banco Dinámico de Preguntas de Repaso por Tema y Dificultad
  const QUESTION_BANK = {
    'Trigonometría': {
      facil: [
        { q: '¿Qué razón trigonométrica se define como Cateto Opuesto / Hipotenusa?', opts: ['Seno', 'Coseno', 'Tangente', 'Secante'], correct: 0, exp: 'Por definición en el triángulo rectángulo, sen(θ) = Cateto Opuesto / Hipotenusa.' },
        { q: '¿Cuál es el valor de sen(90°)?', opts: ['1', '0', '-1', '1/2'], correct: 0, exp: 'En el círculo unitario, a 90° (π/2 rad) la coordenada Y es 1.' },
        { q: '¿Cuál es el valor de cos(0°)?', opts: ['1', '0', '-1', '√2/2'], correct: 0, exp: 'En el ángulo 0°, el punto sobre la circunferencia unitaria es (1, 0), por lo que cos(0°) = 1.' },
        { q: '¿Cuál es la función recíproca del Seno?', opts: ['Cosecante (csc)', 'Secante (sec)', 'Cotangente (cot)', 'Tangente'], correct: 0, exp: 'csc(θ) = 1 / sen(θ).' },
        { q: '¿Cuánto suman los ángulos interiores de cualquier triángulo?', opts: ['180°', '90°', '360°', '270°'], correct: 0, exp: 'La suma de los tres ángulos internos en geometría euclidiana siempre es 180° (π radianes).' }
      ],
      medio: [
        { q: '¿Cuál es el valor exacto de sen(30°)?', opts: ['1/2', '√3/2', '√2/2', '1'], correct: 0, exp: 'sen(30°) = sen(π/6) = 1/2.' },
        { q: '¿Cuál es el valor de cos(60°)?', opts: ['1/2', '√3/2', '√2/2', '0'], correct: 0, exp: 'cos(60°) = cos(π/3) = 1/2.' },
        { q: '¿Qué signo tiene tan(θ) en el Segundo Cuadrante (90° a 180°)?', opts: ['Negativo (−)', 'Positivo (+)', 'Cero', 'Indefinido'], correct: 0, exp: 'tan = sen/cos. En Q2, sen > 0 y cos < 0, por tanto tan < 0.' },
        { q: '¿Cuál es el período fundamental de la función f(x) = sen(x)?', opts: ['2π rad (360°)', 'π rad (180°)', '4π rad', 'π/2 rad'], correct: 0, exp: 'La onda del seno completa un ciclo completo cada 2π radianes.' },
        { q: '¿Cuál es el valor de tan(45°)?', opts: ['1', '0', '√3', '1/√3'], correct: 0, exp: 'A 45°, los catetos opuesto y adyacente son iguales, luego tan(45°) = 1.' }
      ],
      dificil: [
        { q: '¿Cuál de las siguientes es la identidad fundamental pitagórica?', opts: ['sen²(x) + cos²(x) = 1', 'sen²(x) − cos²(x) = 1', 'tan²(x) + 1 = sen²(x)', 'sen(2x) = 2sen(x)'], correct: 0, exp: 'La identidad fundamental pitagórica establece que sen²(x) + cos²(x) = 1.' },
        { q: '¿En qué valores de x la función tan(x) tiene asíntotas verticales?', opts: ['x = π/2 + kπ', 'x = kπ', 'x = 2kπ', 'En ningún punto'], correct: 0, exp: 'Como tan(x) = sen(x)/cos(x), se indetermina donde cos(x) = 0, es decir en x = π/2 + kπ.' },
        { q: '¿A qué equivale 1 + tan²(x)?', opts: ['sec²(x)', 'csc²(x)', 'cot²(x)', 'cos²(x)'], correct: 0, exp: 'Dividiendo la identidad pitagórica entre cos²(x) se obtiene 1 + tan²(x) = sec²(x).' },
        { q: '¿Cuál es el rango de la función f(x) = sec(x)?', opts: ['(−∞, −1] ∪ [1, ∞)', '[−1, 1]', '(−∞, ∞)', '[0, ∞)'], correct: 0, exp: 'Dado que |cos(x)| ≤ 1, su recíproco sec(x) toma valores mayores o iguales a 1, o menores o iguales a −1.' },
        { q: '¿Cuánto vale csc(30°)?', opts: ['2', '1/2', '√2', '√3/2'], correct: 0, exp: 'csc(30°) = 1 / sen(30°) = 1 / (1/2) = 2.' }
      ]
    }
  };

  // Iniciar Práctica
  if (btnStartPractice) {
    btnStartPractice.addEventListener('click', () => {
      // Buscar preguntas para el tema o usar Trigonometría por defecto
      let bank = QUESTION_BANK[selectedTopic] || QUESTION_BANK['Trigonometría'];
      let list = bank[selectedDiff] || bank['facil'];

      currentQuestions = JSON.parse(JSON.stringify(list));
      // Barajar preguntas
      currentQuestions.sort(() => Math.random() - 0.5);

      currentQIdx = 0;
      correctCount = 0;

      if (quizBody) quizBody.style.display = 'block';
      if (quizResults) quizResults.style.display = 'none';

      openQuizModal();
      renderCurrentQuestion();
    });
  }

  function renderCurrentQuestion() {
    if (currentQIdx >= currentQuestions.length) {
      showResults();
      return;
    }

    const q = currentQuestions[currentQIdx];
    const total = currentQuestions.length;

    // Actualizar badges y progreso
    if (progressFill) progressFill.style.width = `${((currentQIdx + 1) / total) * 100}%`;
    if (qCounter) qCounter.textContent = `Pregunta ${currentQIdx + 1} de ${total}`;
    if (qTopicBadge) qTopicBadge.textContent = selectedTopic;
    if (qDiffBadge) {
      const labels = { facil: '🟢 Fácil', medio: '🟡 Medio', dificil: '🔴 Desafío' };
      qDiffBadge.textContent = labels[selectedDiff] || selectedDiff;
    }

    if (qTitle) qTitle.textContent = q.q;
    if (qExplanation) qExplanation.style.display = 'none';
    if (qNextBtn) qNextBtn.style.display = 'none';

    // Opciones
    if (qOptionsWrap) {
      qOptionsWrap.innerHTML = '';
      const opts = q.opts.map((opt, idx) => ({ text: opt, isCorrect: idx === q.correct }));
      opts.sort(() => Math.random() - 0.5);

      opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => handleAnswer(btn, opt.isCorrect, q.exp));
        qOptionsWrap.appendChild(btn);
      });
    }
  }

  function handleAnswer(btn, isCorrect, explanation) {
    const allBtns = qOptionsWrap.querySelectorAll('.quiz-opt-btn');
    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
      btn.classList.add('quiz-opt-btn--correct');
      correctCount++;
    } else {
      btn.classList.add('quiz-opt-btn--wrong');
    }

    if (qExplanation) {
      qExplanation.innerHTML = `<strong>${isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto'}</strong>: ${explanation}`;
      qExplanation.style.display = 'block';
    }

    if (qNextBtn) {
      qNextBtn.style.display = 'inline-flex';
      qNextBtn.onclick = () => {
        currentQIdx++;
        renderCurrentQuestion();
      };
    }
  }

  function showResults() {
    if (quizBody) quizBody.style.display = 'none';
    if (quizResults) quizResults.style.display = 'block';

    const total = currentQuestions.length;
    const scorePct = Math.round((correctCount / total) * 100);

    if (resultScore) resultScore.textContent = `${correctCount} / ${total} (${scorePct}%)`;

    if (resultMsg) {
      if (scorePct >= 80) {
        resultMsg.textContent = '🌟 ¡Excelente dominio del tema! Estás listo para tus evaluaciones.';
      } else if (scorePct >= 50) {
        resultMsg.textContent = '👍 ¡Buen intento! Te sugerimos repasar las fórmulas en el visualizador.';
      } else {
        resultMsg.textContent = '💡 Te recomendamos consultar con Teko Bot o revisar el material didáctico.';
      }
    }

    // Guardar progreso en la base de datos para que le aparezca al docente
    try {
      const formData = new FormData();
      formData.append('tema', selectedTopic);
      formData.append('dificultad', selectedDiff);
      formData.append('aciertos', correctCount.toString());
      formData.append('total_preguntas', total.toString());

      fetch('api_progreso.php', {
        method: 'POST',
        body: formData
      }).catch(err => console.error('Error al guardar progreso:', err));
    } catch (err) {
      console.error('Error al enviar progreso:', err);
    }
  }

  if (btnRetryQuiz) {
    btnRetryQuiz.addEventListener('click', () => {
      btnStartPractice.click();
    });
  }

});
