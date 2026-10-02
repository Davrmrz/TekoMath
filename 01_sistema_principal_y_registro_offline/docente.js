/* ============================================
   TEKO MATH — Script del Dashboard Docente (docente.js)
   Gestión interactiva conectada con la base de datos
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Elementos de UI ----
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  // Menú de usuario
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

  // Menú móvil
  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('topnav__hamburger--open');
      mobileMenu.classList.toggle('topnav__mobile-menu--open');
    });
  }

  // ---- Modales Generales ----
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('teacher-modal-backdrop--open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) {
      document.querySelectorAll('.teacher-modal-backdrop').forEach(m => {
        m.classList.remove('teacher-modal-backdrop--open');
      });
    } else {
      modal.classList.remove('teacher-modal-backdrop--open');
    }
    document.body.style.overflow = '';
  }

  // Abrir modales por atributo data-open-modal
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-modal]');
    if (trigger) {
      e.preventDefault();
      const modalType = trigger.getAttribute('data-open-modal');
      const targetModal = document.getElementById(`modal-${modalType}`);
      if (targetModal) openModal(targetModal);
    }

    // Botones de cerrar modal (&times; o [data-close-modal])
    const closeBtn = e.target.closest('.teacher-modal__close, [data-close-modal]');
    if (closeBtn) {
      e.preventDefault();
      const modal = closeBtn.closest('.teacher-modal-backdrop');
      if (modal) closeModal(modal);
    }

    // Clic en fondo backdrop oscuro
    if (e.target.classList.contains('teacher-modal-backdrop')) {
      closeModal(e.target);
    }
  });

  // Cerrar modales con tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // ---- Toast de Notificaciones ----
  function showToast(msg, icon = '✅') {
    let toast = document.getElementById('teacher-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'teacher-toast';
      toast.className = 'teacher-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="teacher-toast__icon">${icon}</span> <span>${msg}</span>`;
    toast.classList.add('teacher-toast--show');

    setTimeout(() => {
      toast.classList.remove('teacher-toast--show');
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
  }

  // ---- GESTIÓN DE TAREAS (API MySQL) ----
  // ---- GESTIÓN DE MISIONES DE APRENDIZAJE Y EJERCICIOS (API MySQL) ----
  const formTask = document.getElementById('form-create-task');
  const tasksContainer = document.getElementById('teacher-tasks-list');
  const tasksEmptyState = document.getElementById('tasks-empty-state');
  const btnLoadSample = document.getElementById('btn-load-sample-exercises');


  // Función Inteligente para Detectar Concepto Trigonométrico en el Texto
  function detectTrigConcept(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    if (lower.includes('cosecant') || lower.includes('csc(') || lower.includes(' csc ') || lower.includes('cosecante')) return 'Cosecante';
    if (lower.includes('secant') || lower.includes('sec(') || lower.includes(' sec ') || lower.includes('secante')) return 'Secante';
    if (lower.includes('cotangent') || lower.includes('cot(') || lower.includes(' cot ') || lower.includes('cotangente')) return 'Cotangente';
    if (lower.includes('tangent') || lower.includes('tan(') || lower.includes(' tan ') || lower.includes('tangente') || lower.includes('tg(')) return 'Tangente';
    if (lower.includes('cosen') || lower.includes('cos(') || lower.includes(' cos ') || lower.includes('coseno')) return 'Coseno';
    if (lower.includes('seno') || lower.includes('sen(') || lower.includes(' sen ') || lower.includes('sin(')) return 'Seno';
    return null;
  }

  // Auto-detección en tiempo real mientras la docente escribe
  const inputQ2Prompt = document.getElementById('cust-q2-prompt');
  const selectQ2Concept = document.getElementById('cust-q2-concept');
  if (inputQ2Prompt && selectQ2Concept) {
    inputQ2Prompt.addEventListener('input', () => {
      const detected = detectTrigConcept(inputQ2Prompt.value);
      if (detected && selectQ2Concept.value !== detected) {
        selectQ2Concept.value = detected;
        selectQ2Concept.style.borderColor = '#8b5cf6';
        setTimeout(() => selectQ2Concept.style.borderColor = '', 800);
      }
    });
  }

  const inputQ4Prompt = document.getElementById('cust-q4-prompt');
  const selectQ4Concept = document.getElementById('cust-q4-concept');
  if (inputQ4Prompt && selectQ4Concept) {
    inputQ4Prompt.addEventListener('input', () => {
      const detected = detectTrigConcept(inputQ4Prompt.value);
      if (detected && selectQ4Concept.value !== detected) {
        selectQ4Concept.value = detected;
        selectQ4Concept.style.borderColor = '#8b5cf6';
        setTimeout(() => selectQ4Concept.style.borderColor = '', 800);
      }
    });
  }

  // Cargar Ejercicios de Ejemplo para la Docente
  if (btnLoadSample) {
    btnLoadSample.addEventListener('click', () => {
      document.getElementById('task-title').value = 'MISIÓN: Desafío de Razones Directas y Recíprocas';
      document.getElementById('task-lore').value = 'Demuestra tu comprensión de Seno, Coseno, Tangente y sus funciones recíprocas en los 4 cuadrantes.';
      document.getElementById('task-desc').value = 'Resuelve los ejercicios interactivos guiados y supera los desafíos de análisis.';
      
      // Etapa 2
      document.getElementById('cust-q2-prompt').value = 'Si el ángulo θ está en el Cuadrante III, ¿cuál es el signo de la Tangente tan(θ)?';
      document.getElementById('cust-q2-concept').value = 'Tangente';
      document.getElementById('cust-q2-opt-0').value = 'Positiva (+), porque tanto el seno como el coseno son negativos: (−)/(−) = (+)';
      document.getElementById('cust-q2-opt-1').value = 'Negativa (−), porque todos los valores en el Cuadrante III son negativos';
      document.getElementById('cust-q2-opt-2').value = 'Cero, porque la tangente no existe en el Cuadrante III';
      document.getElementById('cust-q2-opt-3').value = 'Indefinida en todo el cuadrante';
      
      // Etapa 4
      document.getElementById('cust-q4-prompt').value = 'Un radar registra que cos(θ) = 1/2 y tan(θ) < 0. ¿En qué cuadrante se encuentra el ángulo y cuánto vale sen(θ)?';
      document.getElementById('cust-q4-concept').value = 'Coseno';
      document.getElementById('cust-q4-opt-0').value = 'Cuadrante IV, y sen(θ) = −√3/2';
      document.getElementById('cust-q4-opt-1').value = 'Cuadrante II, y sen(θ) = +√3/2';
      document.getElementById('cust-q4-opt-2').value = 'Cuadrante I, y sen(θ) = +1/2';
      document.getElementById('cust-q4-opt-3').value = 'Cuadrante III, y sen(θ) = −1/2';

      // Etapa 5
      document.getElementById('cust-q5-prompt').value = 'Para desbloquear el radar, si csc(θ) = 2 en el Cuadrante II, ¿cuánto vale sen(θ) y cos(θ)?';
      document.getElementById('cust-q5-opt-0').value = 'sen(θ) = 1/2 y cos(θ) = −√3/2';
      document.getElementById('cust-q5-opt-1').value = 'sen(θ) = 2 y cos(θ) = 1/2';
      document.getElementById('cust-q5-opt-2').value = 'sen(θ) = −1/2 y cos(θ) = +√3/2';

      showToast('¡Ejercicios de ejemplo cargados en el editor!', '✨');
    });
  }

  // Eliminar misión
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-delete-task');
    if (!btn) return;

    const id = btn.getAttribute('data-id');
    if (!id) return;

    if (!confirm('¿Deseas eliminar esta misión asignada?')) return;

    try {
      const formData = new FormData();
      formData.append('id', id);

      const res = await fetch('api_tareas.php?action=delete', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        const card = document.getElementById(`task-card-${id}`);
        if (card) card.remove();

        if (tasksContainer && tasksContainer.children.length === 0) {
          if (tasksEmptyState) tasksEmptyState.style.display = 'flex';
        }

        showToast('Misión eliminada correctamente.', '🗑️');
      } else {
        alert(data.error || 'Error al eliminar la misión');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al eliminar la misión', '⚠️');
    }
  });

  // Crear Misión de Aprendizaje y Ejercicios
  if (formTask) {
    formTask.addEventListener('submit', async (e) => {
      e.preventDefault();
      const templateKey = templateSelect ? templateSelect.value : '';
      const title = document.getElementById('task-title').value.trim();
      const category = document.getElementById('task-category').value;
      const due = document.getElementById('task-due').value;
      const points = document.getElementById('task-points').value || '100';
      const lore = document.getElementById('task-lore') ? document.getElementById('task-lore').value.trim() : '';
      const desc = document.getElementById('task-desc').value.trim();

      if (!title || !due) return;

      const submitBtn = formTask.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const formData = new FormData();
        formData.append('titulo', title);
        formData.append('tema', category);
        formData.append('fecha_entrega', due);
        formData.append('puntos', points);
        formData.append('historia', lore);
        formData.append('instrucciones', desc);

        // Construir estructura interactiva completa de 5 etapas personalizada
        const q2CorrectIdx = parseInt(document.querySelector('input[name="cust_q2_correct"]:checked')?.value || '0', 10);
        const q4CorrectIdx = parseInt(document.querySelector('input[name="cust_q4_correct"]:checked')?.value || '0', 10);
        const q5CorrectIdx = parseInt(document.querySelector('input[name="cust_q5_correct"]:checked')?.value || '0', 10);

        const q2Concept = document.getElementById('cust-q2-concept')?.value || 'Coseno';
        const q4Concept = document.getElementById('cust-q4-concept')?.value || 'Tangente';
        const q5Concept = detectTrigConcept(document.getElementById('cust-q5-prompt')?.value || '') || 'Seno';

        const conceptsList = Array.from(new Set([q2Concept, q4Concept, q5Concept].filter(Boolean)));

        const customMissionData = {
          id_template: 'custom_' + Date.now(),
          titulo: title,
          tema: category,
          subtitulo: desc,
          puntos: parseInt(points, 10),
          insignia: '🌟 Experto en Trigonometría',
          conceptos: conceptsList,
          historia: lore,
          etapas: [
            {
              tipo: 'explora',
              numero: 1,
              badge: '1. EXPLORÁ',
              titulo: 'Exploración: Círculo Unitario y Razones',
              instruccion: 'Gira el dial para observar cómo varían las proyecciones y razones en cada cuadrante.',
              visual_tipo: 'circulo_unitario',
              angulo_default: 120
            },
            {
              tipo: 'descubri',
              numero: 2,
              badge: '2. DESCUBRÍ',
              titulo: 'Descubrimiento Conceptual: ' + q2Concept,
              concepto: q2Concept,
              pregunta: document.getElementById('cust-q2-prompt')?.value || '¿Cuál es la propiedad clave?',
              opciones: [
                { id: 'c_opt_a', texto: document.getElementById('cust-q2-opt-0')?.value || 'Opción A', es_correcta: q2CorrectIdx === 0, feedback_positivo: '¡Excelente deducción conceptual! 🌟', feedback_diagnostico: 'Revisa la regla de los signos y cuadrantes.' },
                { id: 'c_opt_b', texto: document.getElementById('cust-q2-opt-1')?.value || 'Opción B', es_correcta: q2CorrectIdx === 1, feedback_positivo: '¡Correcto!', feedback_diagnostico: 'Analiza nuevamente las proyecciones horizontal y vertical.' },
                { id: 'c_opt_c', texto: document.getElementById('cust-q2-opt-2')?.value || 'Opción C', es_correcta: q2CorrectIdx === 2, feedback_positivo: '¡Muy bien!', feedback_diagnostico: 'Verifica los signos en el cuadrante indicado.' },
                { id: 'c_opt_d', texto: document.getElementById('cust-q2-opt-3')?.value || 'Opción D', es_correcta: q2CorrectIdx === 3, feedback_positivo: '¡Brillante!', feedback_diagnostico: 'Pista: observa qué coordenada determina este valor.' }
              ],
              pistas: [
                'Nivel 1: Recuerda la relación entre las coordenadas cartesianas X e Y en el círculo unitario.',
                'Nivel 2: Utiliza la regla nemotécnica "TODOS - SIN - TA - COS".'
              ]
            },
            {
              tipo: 'resolve',
              numero: 3,
              badge: '3. RESOLVÉ',
              titulo: 'Resolución Guiada Paso a Paso',
              concepto: q2Concept,
              enunciado: 'Calcula el valor exacto guiado aplicando el ángulo de referencia con el eje X.',
              pasos: [
                {
                  paso_num: 1,
                  titulo_paso: 'Paso 1: Ángulo de Referencia',
                  instruccion: 'Identifica el ángulo de referencia agudo respecto al eje horizontal.',
                  opciones: [
                    { id: 'p1_a', texto: 'α = 60° (o valor agudo base)', es_correcta: true, feedback: '¡Correcto!' },
                    { id: 'p1_b', texto: 'α = 30°', es_correcta: false, feedback_diagnostico: 'Calcula la distancia al eje 180°.' }
                  ]
                },
                {
                  paso_num: 2,
                  titulo_paso: 'Paso 2: Valor Notable y Signo',
                  instruccion: 'Aplica el signo correspondiente al cuadrante.',
                  opciones: [
                    { id: 'p2_a', texto: 'Valor con signo del cuadrante aplicado', es_correcta: true, feedback: '¡Excelente resolución paso a paso!' },
                    { id: 'p2_b', texto: 'Valor con signo opuesto', es_correcta: false, feedback_diagnostico: 'Cuidado con el signo en este cuadrante.' }
                  ]
                }
              ],
              pistas: [
                'Nivel 1: En el Cuadrante II el ángulo de referencia es 180° − θ.',
                'Nivel 2: Conserva el valor notable y asigna el signo del cuadrante.'
              ]
            },
            {
              tipo: 'desafio',
              numero: 4,
              badge: '4. DESAFÍO',
              titulo: 'Desafío de Análisis: ' + q4Concept,
              concepto: q4Concept,
              pregunta: document.getElementById('cust-q4-prompt')?.value || 'Desafío de análisis',
              opciones: [
                { id: 'des_a', texto: document.getElementById('cust-q4-opt-0')?.value || 'Opción A', es_correcta: q4CorrectIdx === 0, feedback_positivo: '¡Brillante resolución del desafío! 🌟', feedback_diagnostico: 'Revisa las condiciones dadas en el enunciado.' },
                { id: 'des_b', texto: document.getElementById('cust-q4-opt-1')?.value || 'Opción B', es_correcta: q4CorrectIdx === 1, feedback_positivo: '¡Genial!', feedback_diagnostico: 'Analiza los signos de las funciones mencionadas.' },
                { id: 'des_c', texto: document.getElementById('cust-q4-opt-2')?.value || 'Opción C', es_correcta: q4CorrectIdx === 2, feedback_positivo: '¡Muy bien!', feedback_diagnostico: 'Verifica en qué cuadrantes se cumplen ambas condiciones.' },
                { id: 'des_d', texto: document.getElementById('cust-q4-opt-3')?.value || 'Opción D', es_correcta: q4CorrectIdx === 3, feedback_positivo: '¡Perfecto!', feedback_diagnostico: 'Cuidado con los signos en este cuadrante.' }
              ],
              pistas: [
                'Nivel 1: Plantea las dos condiciones por separado y busca su intersección.',
                'Nivel 2: Consulta la tarjeta interactiva de concepto para comprobar los signos.'
              ]
            },
            {
              tipo: 'desafio_final',
              numero: 5,
              badge: '5. DESAFÍO FINAL',
              titulo: 'Desafío Final: Calibración Maestra',
              concepto: q4Concept,
              pregunta: document.getElementById('cust-q5-prompt')?.value || 'Desafío final',
              opciones: [
                { id: 'fin_a', texto: document.getElementById('cust-q5-opt-0')?.value || 'Opción A', es_correcta: q5CorrectIdx === 0, feedback_positivo: '¡Misión cumplida con éxito rotundo! 🏆', feedback_diagnostico: 'Revisa los cálculos finales.' },
                { id: 'fin_b', texto: document.getElementById('cust-q5-opt-1')?.value || 'Opción B', es_correcta: q5CorrectIdx === 1, feedback_positivo: '¡Excelente!', feedback_diagnostico: 'Cuidado con los signos trigonométricos.' },
                { id: 'fin_c', texto: document.getElementById('cust-q5-opt-2')?.value || 'Opción C', es_correcta: q5CorrectIdx === 2, feedback_positivo: '¡Muy bien!', feedback_diagnostico: 'Verifica los valores notables.' }
              ],
              pistas: [
                'Nivel 1: Aplica las identidades trigonométricas fundamentales.',
                'Nivel 2: Recuerda que sen²(θ) + cos²(θ) = 1.'
              ]
            }
          ]
        };

        formData.append('mision_data_json', JSON.stringify(customMissionData));

        const res = await fetch('api_tareas.php', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success && data.tarea) {
          const t = data.tarea;
          if (tasksEmptyState) {
            tasksEmptyState.style.setProperty('display', 'none', 'important');
            tasksEmptyState.classList.add('is-hidden');
          }

          const card = document.createElement('article');
          card.className = 'mission-card anim-fade-up';
          card.id = `task-card-${t.id}`;
          card.innerHTML = `
            <div>
              <div class="mission-card__header">
                <span class="pill pill--purple" style="font-size:0.75rem;font-weight:800;">📚 ${escapeHtml(t.tema)}</span>
                <span class="pill pill--green" style="font-size:0.7rem;">💯 ${escapeHtml(t.puntos)} pts</span>
              </div>
              <h3 class="mission-card__title">${escapeHtml(t.titulo)}</h3>
              <p class="mission-card__story">${escapeHtml(t.historia || t.instrucciones || 'Experiencia interactiva guiada en 5 etapas.')}</p>
              
              <div class="mission-card__stages-preview">
                <span class="mission-card__stage-dot">1. Explorá 👁️</span>
                <span class="mission-card__stage-dot">2. Descubrí 💡</span>
                <span class="mission-card__stage-dot">3. Resolvé 📐</span>
                <span class="mission-card__stage-dot">4. Desafío ⚡</span>
                <span class="mission-card__stage-dot">5. Final 🏆</span>
              </div>

              <div style="font-size:0.78rem;color:var(--gray-500);margin-bottom:8px;">
                <span>⏳ Vence: <strong>${escapeHtml(t.fecha_entrega)}</strong></span>
              </div>
            </div>
            <div class="mission-card__footer">
              <span style="font-size:0.76rem;color:var(--gray-500);font-weight:600;">👨‍🏫 Prof. ${escapeHtml(t.docente_nombre)}</span>
              <button class="btn btn--secondary btn--sm btn-delete-task" data-id="${t.id}" style="color:#dc2626;border-color:#fca5a5;padding:4px 10px;">
                Eliminar 🗑️
              </button>
            </div>
          `;

          if (tasksContainer) tasksContainer.prepend(card);

          closeModal(modalTask);
          formTask.reset();
          showToast('¡Misión y ejercicios asignados exitosamente a los alumnos!', '🎉');
        } else {
          alert(data.error || 'No se pudo crear la misión');
        }
      } catch (err) {
        console.error(err);
        showToast('Error de conexión al crear la misión', '⚠️');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

});
