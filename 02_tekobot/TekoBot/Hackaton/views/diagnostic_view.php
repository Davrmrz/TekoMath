<?php
// views/diagnostic_view.php - Modal interactivo de Evaluación Diagnóstica (Pre-Test y Post-Test)
?>
<div id="diagnostic-modal" class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">📝 Evaluación Diagnóstica de Trigonometría</h3>
            <button id="btn-close-diagnostic" class="btn-close-modal">&times;</button>
        </div>
        
        <p style="font-size: 0.88rem; color: var(--text-muted);">
            Esta breve evaluación de 5 preguntas nos ayuda a medir tu conocimiento antes y después de aprender con el tutor en Jopara.
        </p>

        <form id="diagnostic-form">
            <div id="quiz-questions-list">
                <!-- Inyectado dinámicamente -->
            </div>

            <button type="submit" id="btn-submit-quiz" class="btn-send" style="width: 100%; justify-content: center; margin-top: 1rem;">
                Enviar Respuestas y Guardar Diagnóstico
            </button>
        </form>

        <div id="diagnostic-results" style="display: none; text-align: center; padding: 1rem;">
            <h4 style="color: var(--secondary); font-size: 1.2rem;">¡Evaluación Completada con Éxito!</h4>
            <p id="diag-score-text" style="font-size: 1.1rem; font-weight: 700; margin: 0.5rem 0;"></p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Tus resultados han sido registrados para medir tu aprendizaje con TekoBot.</p>
        </div>
    </div>
</div>

<script>
// Script específico para la evaluación diagnóstica
let quizStartTime = Date.now();
const diagnosticModal = document.getElementById('diagnostic-modal');
const closeBtn = document.getElementById('btn-close-diagnostic');
const quizForm = document.getElementById('diagnostic-form');
const quizList = document.getElementById('quiz-questions-list');
const quizResults = document.getElementById('diagnostic-results');

if (closeBtn && diagnosticModal) {
    closeBtn.addEventListener('click', () => {
        diagnosticModal.style.display = 'none';
    });
}

async function loadDiagnosticQuestions() {
    quizStartTime = Date.now();
    quizList.innerHTML = '<p style="text-align: center;">Cargando preguntas...</p>';
    quizForm.style.display = 'block';
    quizResults.style.display = 'none';

    try {
        const res = await fetch('api/diagnostic.php');
        const json = await res.json();
        if (json.success && json.questions) {
            renderQuestions(json.questions);
        }
    } catch (e) {
        // Fallback local
        const defaultQuestions = [
            { id: 1, question: '1. ¿En qué cuadrante se encuentra el ángulo de 135°?', options: ['Primer Cuadrante (I)', 'Segundo Cuadrante (II)', 'Tercer Cuadrante (III)', 'Cuarto Cuadrante (IV)'], correct_index: 1 },
            { id: 2, question: '2. ¿Cuál es el signo del coseno en el segundo cuadrante?', options: ['Positivo (+)', 'Negativo (-)', 'Cero', 'Indefinido'], correct_index: 1 },
            { id: 3, question: '3. ¿Cuál es el ángulo de referencia de 210°?', options: ['30°', '45°', '60°', '210°'], correct_index: 0 },
            { id: 4, question: '4. ¿Cuánto equivale π radianes en grados sexagesimales?', options: ['90°', '180°', '270°', '360°'], correct_index: 1 },
            { id: 5, question: '5. En la función y = 3 sen(x), ¿cuál es su amplitud?', options: ['1', '2', '3', '2π'], correct_index: 2 }
        ];
        renderQuestions(defaultQuestions);
    }
}

function renderQuestions(questions) {
    quizList.innerHTML = '';
    questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'quiz-question-card';
        
        let optsHtml = '';
        q.options.forEach((opt, optIdx) => {
            optsHtml += `
                <label class="quiz-option-label">
                    <input type="radio" name="q_${q.id}" value="${optIdx}" required>
                    <span>${opt}</span>
                </label>
            `;
        });

        card.innerHTML = `
            <div class="quiz-q-text">${q.question}</div>
            <div class="quiz-options-list">${optsHtml}</div>
        `;
        quizList.appendChild(card);
    });
}

if (quizForm) {
    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const durationSec = Math.round((Date.now() - quizStartTime) / 1000);
        
        const answers = {};
        let correctCount = 0;
        const total = 5;

        // Corrección estándar de las 5 preguntas
        const correctMap = { 1: 1, 2: 1, 3: 0, 4: 1, 5: 2 };

        for (let i = 1; i <= total; i++) {
            const selected = quizForm.querySelector(`input[name="q_${i}"]:checked`);
            if (selected) {
                const val = parseInt(selected.value);
                answers[i] = val;
                if (val === correctMap[i]) {
                    correctCount++;
                }
            }
        }

        try {
            await fetch('api/diagnostic.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: 1,
                    test_type: 'pre_test',
                    correct_answers: correctCount,
                    total_questions: total,
                    duration_seconds: durationSec,
                    details: answers
                })
            });
        } catch (err) {
            console.log("Guardado offline de diagnóstico...");
        }

        quizForm.style.display = 'none';
        quizResults.style.display = 'block';
        document.getElementById('diag-score-text').textContent = `Puntaje: ${correctCount} de ${total} correctas (${Math.round((correctCount/total)*100)}%)`;
    });
}
</script>
