/* ============================================
   TEKO MATH — Motor de Misiones de Aprendizaje (misiones.js)
   Experiencias interactivas, visuales y progresivas en 5 etapas:
   1. EXPLORÁ  2. DESCUBRÍ  3. RESOLVÉ  4. DESAFÍO  5. DESAFÍO FINAL
   ============================================ */

(function() {
  'use strict';

  const localize = text => window.JopaMathI18n?.getLanguage() === 'jopara'
    ? window.JopaMathI18n.translateText(text, true) : text;

  // ---- Estado de la Misión Activa ----
  let currentMission = null;
  let currentMissionData = null;
  let currentStageIndex = 0; // 0 to 4 (Etapas 1 a 5)
  let stageAttemptCount = 0;
  let stageHadError = false;
  let stepIndexInResolve = 0;
  let missionTimerInterval = null;
  let missionSecondsElapsed = 0;

  // ---- Métricas y Telemetría Pedagógica ----
  let telemetry = {
    aciertos: 0,
    errores: 0,
    intentos: 0,
    pistas_usadas: 0,
    autocorrecciones: 0,
    desafios_superados: 0,
    tiempo_segundos: 0,
    conceptos_stats: {}, // { 'Seno': { correct: 0, errors: 0 }, ... }
    detalles_etapas: []
  };

  // ---- Canvas State para Etapa 1 (EXPLORÁ) ----
  let canvasAngleDeg = 120;
  let canvasAnimationId = null;

  // Inicializar al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    initMissionTriggers();
    createMissionModalDOM();
  });

  /**
   * Vincula botones de "Iniciar Misión" en las tarjetas del dashboard
   */
  function initMissionTriggers() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open-mision]');
      if (btn) {
        e.preventDefault();
        const taskId = btn.getAttribute('data-open-mision');
        cargarYIniciarMision(taskId);
      }
    });
  }

  /**
   * Inyecta el contenedor modal de la misión en el documento
   */
  function createMissionModalDOM() {
    if (document.getElementById('mission-modal-backdrop')) return;

    const modalHTML = `
      <div class="mission-modal-backdrop" id="mission-modal-backdrop" role="dialog" aria-modal="true">
        <div class="mission-modal-container">
          
          <!-- Header de Misión -->
          <div class="mission-header">
            <div class="mission-header__meta">
              <div class="mission-header__top-row">
                <span class="pill pill--green" id="m-header-badge" style="font-size:0.75rem;font-weight:800;">🚀 MISIÓN DE APRENDIZAJE</span>
                <span class="pill pill--purple" id="m-header-topic" style="font-size:0.75rem;">Trigonometría</span>
                <span style="color:var(--green-200);font-size:0.78rem;font-family:var(--font-mono);" id="m-header-timer">⏱️ 00:00</span>
              </div>
              <h2 class="mission-header__title" id="m-header-title">MISIÓN: El cuadrante perdido</h2>
              <p class="mission-header__subtitle" id="m-header-subtitle">Restaura las coordenadas en el plano cartesiano.</p>
            </div>
            <button class="mission-close-btn" id="m-close-btn" aria-label="Cerrar Misión">&times;</button>
          </div>

          <!-- Stepper de 5 Etapas -->
          <div class="mission-stepper" id="m-stepper">
            <div class="mission-step-pill active" data-step="0">
              <span class="mission-step-pill__num">1</span>
              <span>EXPLORÁ</span>
            </div>
            <div class="mission-stepper-divider"></div>
            <div class="mission-step-pill" data-step="1">
              <span class="mission-step-pill__num">2</span>
              <span>DESCUBRÍ</span>
            </div>
            <div class="mission-stepper-divider"></div>
            <div class="mission-step-pill" data-step="2">
              <span class="mission-step-pill__num">3</span>
              <span>RESOLVÉ</span>
            </div>
            <div class="mission-stepper-divider"></div>
            <div class="mission-step-pill" data-step="3">
              <span class="mission-step-pill__num">4</span>
              <span>DESAFÍO</span>
            </div>
            <div class="mission-stepper-divider"></div>
            <div class="mission-step-pill" data-step="4">
              <span class="mission-step-pill__num">5</span>
              <span>FINAL</span>
            </div>
          </div>

          <!-- Cuerpo Dinámico de la Etapa -->
          <div class="mission-body" id="m-body">
            <!-- Inyectado dinámicamente -->
          </div>

          <!-- Footer con Telemetría en Vivo y Botones de Avance -->
          <div class="mission-footer" id="m-footer">
            <div class="mission-footer__telemetry">
              <div class="mission-telemetry-badge" title="Aciertos en la misión">
                <span>🎯</span> <strong id="m-tel-aciertos">0</strong> aciertos
              </div>
              <div class="mission-telemetry-badge" title="Autocorrecciones tras error">
                <span>🔄</span> <strong id="m-tel-autocorr">0</strong> autocorrecciones
              </div>
              <div class="mission-telemetry-badge" title="Pistas solicitadas">
                <span>💡</span> <strong id="m-tel-pistas">0</strong> pistas
              </div>
            </div>
            <div class="mission-footer__actions">
              <button class="btn btn--secondary btn--sm" id="m-btn-cancel">Salir</button>
              <button class="btn btn--primary btn--green btn--md" id="m-btn-next-stage">
                <span>Continuar Etapa</span> ➡️
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Eventos de cierre y control
    document.getElementById('m-close-btn').addEventListener('click', cerrarMision);
    document.getElementById('m-btn-cancel').addEventListener('click', () => {
      if (confirm(localize('¿Deseas salir de la misión actual? El avance de esta sesión no se guardará.'))) {
        cerrarMision();
      }
    });

    document.getElementById('m-btn-next-stage').addEventListener('click', avanzarEtapa);
  }

  /**
   * Carga los datos de la misión desde la API y arranca la experiencia
   */
  async function cargarYIniciarMision(taskId) {
    try {
      const res = await fetch(`api_tareas.php?action=detalle&id=${encodeURIComponent(taskId)}`);
      const data = await res.json();

      if (!data.success || !data.mision) {
        alert(localize(data.error || 'No se pudo cargar la misión.'));
        return;
      }

      currentMission = data.mision;
      currentMissionData = data.mision_data;
      iniciarMision(currentMissionData);
    } catch (err) {
      console.error('Error al cargar misión:', err);
      alert(localize('Error de conexión al cargar la misión.'));
    }
  }

  /**
   * Reinicia la telemetría y muestra la Etapa 1
   */
  function iniciarMision(misionData) {
    currentStageIndex = 0;
    stageAttemptCount = 0;
    stageHadError = false;
    stepIndexInResolve = 0;
    missionSecondsElapsed = 0;

    telemetry = {
      aciertos: 0,
      errores: 0,
      intentos: 0,
      pistas_usadas: 0,
      autocorrecciones: 0,
      desafios_superados: 0,
      tiempo_segundos: 0,
      conceptos_stats: {},
      detalles_etapas: []
    };

    // Registrar conceptos en telemetría
    if (misionData.conceptos && Array.isArray(misionData.conceptos)) {
      misionData.conceptos.forEach(c => {
        telemetry.conceptos_stats[c] = { correct: 0, errors: 0 };
      });
    }

    // Actualizar Textos del Header
    document.getElementById('m-header-title').textContent = misionData.titulo || 'Misión de Aprendizaje';
    document.getElementById('m-header-subtitle').textContent = misionData.subtitulo || 'Experiencia interactiva guiada';
    document.getElementById('m-header-topic').textContent = misionData.tema || 'Trigonometría';

    // Iniciar temporizador
    clearInterval(missionTimerInterval);
    actualizarTimerHeader();
    missionTimerInterval = setInterval(() => {
      missionSecondsElapsed++;
      actualizarTimerHeader();
    }, 1000);

    // Abrir Modal
    const modalBackdrop = document.getElementById('mission-modal-backdrop');
    modalBackdrop.classList.add('active');

    // Renderizar Etapa 1
    renderStage(0);
  }

  function actualizarTimerHeader() {
    const mins = Math.floor(missionSecondsElapsed / 60).toString().padStart(2, '0');
    const secs = (missionSecondsElapsed % 60).toString().padStart(2, '0');
    const el = document.getElementById('m-header-timer');
    if (el) el.textContent = `⏱️ ${mins}:${secs}`;
  }

  function actualizarTelemetriaUI() {
    document.getElementById('m-tel-aciertos').textContent = telemetry.aciertos;
    document.getElementById('m-tel-autocorr').textContent = telemetry.autocorrecciones;
    document.getElementById('m-tel-pistas').textContent = telemetry.pistas_usadas;
  }

  function actualizarStepper(index) {
    const pills = document.querySelectorAll('.mission-step-pill');
    pills.forEach((p, idx) => {
      p.classList.remove('active', 'completed');
      if (idx < index) {
        p.classList.add('completed');
      } else if (idx === index) {
        p.classList.add('active');
      }
    });
  }

  /**
   * Renderizador polimórfico de etapas (1 a 5)
   */
  function renderStage(index) {
    currentStageIndex = index;
    stageAttemptCount = 0;
    stageHadError = false;
    actualizarStepper(index);
    actualizarTelemetriaUI();

    const bodyEl = document.getElementById('m-body');
    const nextBtn = document.getElementById('m-btn-next-stage');
    nextBtn.style.display = 'inline-flex';
    nextBtn.disabled = true; // Se habilita cuando cumple el objetivo de la etapa

    const stage = currentMissionData.etapas[index];
    if (!stage) {
      mostrarPantallaResultados();
      return;
    }

    let loreHTML = '';
    if (index === 0 && currentMissionData.historia) {
      loreHTML = `
        <div class="mission-lore-box">
          <span class="mission-lore-box__icon">📜</span>
          <p class="mission-lore-box__text"><strong>Contexto de la Misión:</strong> ${escapeHTML(currentMissionData.historia)}</p>
        </div>
      `;
    }

    if (stage.tipo === 'explora') {
      renderEtapaExplora(stage, bodyEl, loreHTML, nextBtn);
    } else if (stage.tipo === 'descubri' || stage.tipo === 'desafio' || stage.tipo === 'desafio_final') {
      renderEtapaOpcionMultiple(stage, bodyEl, loreHTML, nextBtn);
    } else if (stage.tipo === 'resolve') {
      renderEtapaResolvePasoAPaso(stage, bodyEl, loreHTML, nextBtn);
    }
  }

  // ============================================
  // ETAPA 1: EXPLORÁ (Lienzo interactivo & Observación)
  // ============================================
  function renderEtapaExplora(stage, container, loreHTML, nextBtn) {
    container.innerHTML = `
      ${loreHTML}
      <div class="stage-card">
        <div class="stage-card__header">
          <span class="stage-card__badge stage-card__badge--explora">${escapeHTML(stage.badge || '1. EXPLORÁ')}</span>
          <span class="pill pill--purple" style="font-size:0.75rem;">Laboratorio Interactivo</span>
        </div>
        <h3 class="stage-card__title">${escapeHTML(stage.titulo)}</h3>
        <p class="stage-card__prompt">${escapeHTML(stage.instruccion)}</p>

        <!-- Workbench Interactivo con Círculo Unitario y Dial -->
        <div class="mission-visual-workbench">
          <div class="mission-canvas-wrapper">
            <canvas id="m-explora-canvas" class="mission-canvas" width="400" height="280"></canvas>
          </div>
          <div class="mission-controls-box">
            <div class="mission-quadrant-dial" id="m-quad-dial">
              <span style="font-size:0.75rem;color:var(--gray-600);display:block;">Cuadrante Actual</span>
              <strong id="m-quad-text">Cuadrante II (90° a 180°)</strong>
            </div>
            
            <div class="mission-readout-grid">
              <div class="mission-readout-item">
                <span>Ángulo θ</span>
                <strong id="m-readout-deg">120°</strong>
              </div>
              <div class="mission-readout-item">
                <span>Radianes</span>
                <strong id="m-readout-rad">2π/3</strong>
              </div>
              <div class="mission-readout-item" style="border-color:#ca8a04;">
                <span style="color:#a16207;">⚡ Tangente tan(θ)</span>
                <strong id="m-readout-tan" style="color:#854d0e;">−1.732 (−)</strong>
              </div>

              <!-- Funciones Directas -->
              <div class="mission-readout-item" style="border-color:#86efac;">
                <span style="color:#15803d;">📈 Seno sen(θ)</span>
                <strong id="m-readout-sen" style="color:#166534;">+0.866 (+)</strong>
              </div>
              <div class="mission-readout-item" style="border-color:#c084fc;">
                <span style="color:#7e22ce;">📉 Coseno cos(θ)</span>
                <strong id="m-readout-cos" style="color:#6b21a8;">−0.500 (−)</strong>
              </div>
              <div class="mission-readout-item" style="border-color:#fde047;">
                <span style="color:#854d0e;">📏 Cotangente cot(θ)</span>
                <strong id="m-readout-cot" style="color:#713f12;">−0.577 (−)</strong>
              </div>

              <!-- Funciones Inversas / Recíprocas -->
              <div class="mission-readout-item" style="border-color:#bbf7d0;background:#f0fdf4;">
                <span style="color:#166534;">🔄 Cosecante csc(θ)</span>
                <strong id="m-readout-csc" style="color:#14532d;">+1.155 (+)</strong>
              </div>
              <div class="mission-readout-item" style="border-color:#e9d5ff;background:#faf5ff;">
                <span style="color:#6b21a8;">📐 Secante sec(θ)</span>
                <strong id="m-readout-sec" style="color:#581c87;">−2.000 (−)</strong>
              </div>
              <div class="mission-readout-item" style="background:#fefce8;">
                <span style="color:#713f12;">🔑 Identidad</span>
                <strong style="font-size:0.82rem;color:#854d0e;">sen·csc = cos·sec = 1</strong>
              </div>
            </div>

            <div>
              <label style="font-size:0.8rem;font-weight:700;display:flex;justify-content:space-between;margin-bottom:6px;">
                <span>Deslizar Ángulo (0° a 360°):</span>
                <span id="m-slider-label">120°</span>
              </label>
              <input type="range" id="m-angle-slider" min="0" max="360" step="1" value="${stage.angulo_default || 120}" 
                     style="width:100%;accent-color:var(--purple-600);cursor:pointer;">
            </div>
          </div>
        </div>

        <div class="mission-success-box" style="margin-bottom:0;">
          <div class="mission-success-box__header">
            <span>💡</span> <strong>Objetivo de Exploración:</strong>
          </div>
          <p class="mission-success-box__text">
            ${escapeHTML(stage.objetivo_texto || 'Gira el dial y observa cómo la coordenada horizontal (coseno) cambia a signo negativo en el Cuadrante II.')}
          </p>
        </div>
      </div>
    `;

    canvasAngleDeg = stage.angulo_default || 120;
    const canvas = document.getElementById('m-explora-canvas');
    const slider = document.getElementById('m-angle-slider');

    let interactionsCount = 0;

    function drawUnitCircle() {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width = canvas.parentElement.clientWidth || 400;
      const h = canvas.height = 280;

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(cx, cy) - 35;

      // Ejes coordenados
      ctx.strokeStyle = '#d4d4d8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(15, cy);
      ctx.lineTo(w - 15, cy);
      ctx.moveTo(cx, 15);
      ctx.lineTo(cx, h - 15);
      ctx.stroke();

      // Círculo unitario
      ctx.strokeStyle = '#7928ca';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Cálculo del punto
      const rad = (canvasAngleDeg * Math.PI) / 180;
      const px = cx + r * Math.cos(rad);
      const py = cy - r * Math.sin(rad); // En canvas el eje Y va invertido hacia abajo

      // Proyección Coseno (Horizontal en morado)
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, cy);
      ctx.stroke();

      // Proyección Seno (Vertical en verde)
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(px, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Radio / Hipotenusa
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Punto sobre la circunferencia
      ctx.fillStyle = '#7928ca';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Etiquetas de ejes
      ctx.fillStyle = '#71717a';
      ctx.font = '10px "Space Grotesk", sans-serif';
      ctx.fillText('+X (cos)', w - 45, cy - 6);
      ctx.fillText('+Y (sen)', cx + 6, 25);
      ctx.fillText('−X', 18, cy - 6);
      ctx.fillText('−Y', cx + 6, h - 18);
    }

    function updateReadouts(deg) {
      canvasAngleDeg = deg;
      const rad = (deg * Math.PI) / 180;
      const cosVal = Math.cos(rad);
      const senVal = Math.sin(rad);

      document.getElementById('m-readout-deg').textContent = `${deg}°`;
      document.getElementById('m-slider-label').textContent = `${deg}°`;
      document.getElementById('m-readout-rad').textContent = `${(deg / 180).toFixed(2)}π`;

      const cosSign = cosVal >= 0 ? '+' : '−';
      const senSign = senVal >= 0 ? '+' : '−';

      document.getElementById('m-readout-cos').textContent = `${cosVal.toFixed(3)} (${cosSign})`;
      document.getElementById('m-readout-sen').textContent = `${senVal.toFixed(3)} (${senSign})`;

      // Tangente tan(θ) = sen/cos
      const tanEl = document.getElementById('m-readout-tan');
      if (tanEl) {
        if (Math.abs(cosVal) < 0.001) {
          tanEl.textContent = 'Indefinido (Asíntota)';
        } else {
          const tanVal = senVal / cosVal;
          const tanSign = tanVal >= 0 ? '+' : '−';
          tanEl.textContent = `${tanVal.toFixed(3)} (${tanSign})`;
        }
      }

      // Cotangente cot(θ) = cos/sen = 1/tan
      const cotEl = document.getElementById('m-readout-cot');
      if (cotEl) {
        if (Math.abs(senVal) < 0.001) {
          cotEl.textContent = 'Indefinido (Asíntota)';
        } else {
          const cotVal = cosVal / senVal;
          const cotSign = cotVal >= 0 ? '+' : '−';
          cotEl.textContent = `${cotVal.toFixed(3)} (${cotSign})`;
        }
      }

      // Cosecante csc(θ) = 1/sen
      const cscEl = document.getElementById('m-readout-csc');
      if (cscEl) {
        if (Math.abs(senVal) < 0.001) {
          cscEl.textContent = 'Indefinido (Asíntota)';
        } else {
          const cscVal = 1 / senVal;
          const cscSign = cscVal >= 0 ? '+' : '−';
          cscEl.textContent = `${cscVal.toFixed(3)} (${cscSign})`;
        }
      }

      // Secante sec(θ) = 1/cos
      const secEl = document.getElementById('m-readout-sec');
      if (secEl) {
        if (Math.abs(cosVal) < 0.001) {
          secEl.textContent = 'Indefinido (Asíntota)';
        } else {
          const secVal = 1 / cosVal;
          const secSign = secVal >= 0 ? '+' : '−';
          secEl.textContent = `${secVal.toFixed(3)} (${secSign})`;
        }
      }

      // Detección de Cuadrante
      let quad = 'Cuadrante I (0° – 90°)';
      if (deg > 90 && deg <= 180) quad = 'Cuadrante II (90° – 180°)';
      else if (deg > 180 && deg <= 270) quad = 'Cuadrante III (180° – 270°)';
      else if (deg > 270 && deg <= 360) quad = 'Cuadrante IV (270° – 360°)';
      document.getElementById('m-quad-text').textContent = quad;

      drawUnitCircle();
    }

    slider.addEventListener('input', (e) => {
      const deg = parseInt(e.target.value, 10);
      updateReadouts(deg);
      interactionsCount++;
      if (interactionsCount >= 2) {
        nextBtn.disabled = false;
        nextBtn.classList.add('btn--glow');
      }
    });

    // Dibujo inicial y habilitar avance
    updateReadouts(canvasAngleDeg);
    setTimeout(() => {
      nextBtn.disabled = false;
    }, 1200);
  }

  // ============================================
  // ETAPAS 2, 4, 5: PREGUNTAS CON DIAGNÓSTICO INTELIGENTE
  // ============================================
  function renderEtapaOpcionMultiple(stage, container, loreHTML, nextBtn) {
    let badgeClass = 'stage-card__badge--descubri';
    if (stage.tipo === 'desafio') badgeClass = 'stage-card__badge--desafio';
    if (stage.tipo === 'desafio_final') badgeClass = 'stage-card__badge--final';

    const optionsHTML = stage.opciones.map((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      return `
        <button class="mission-option-btn" data-opt-id="${opt.id}" data-correct="${opt.es_correcta}">
          <span class="mission-option-btn__letter">${letter}</span>
          <span class="mission-option-btn__text">${escapeHTML(opt.texto)}</span>
        </button>
      `;
    }).join('');

    const conceptInfo = stage.concepto ? getConceptKnowledge(stage.concepto) : null;
    const conceptWidgetHTML = conceptInfo ? `
      <div class="mission-concept-widget-wrap">
        <button class="mission-concept-card-btn" id="m-btn-toggle-concept" type="button">
          <span>🃏</span> Tarjeta de Concepto: <strong>${escapeHTML(stage.concepto)}</strong> (Ver clave 💡)
        </button>
        <div class="mission-embedded-concept-card" id="m-concept-card-panel" style="display:none;">
          <div class="mission-embedded-concept-card__header">
            <h4 class="mission-embedded-concept-card__title">
              <span>🃏</span> Tarjeta Clave: ${escapeHTML(stage.concepto)}
            </h4>
            <button class="mission-embedded-concept-card__close" id="m-btn-close-concept" type="button">✕</button>
          </div>
          <div class="mission-embedded-concept-card__body">
            <div class="mission-embedded-formula">
              <strong>Fórmula / Definición:</strong><br>
              ${escapeHTML(conceptInfo.formula)}
            </div>
            <div class="mission-embedded-signs">
              ${conceptInfo.quads.map(q => `
                <div class="mission-embedded-sign-pill ${q.includes('+') ? 'mission-embedded-sign-pill--pos' : 'mission-embedded-sign-pill--neg'}">
                  ${escapeHTML(q)}
                </div>
              `).join('')}
            </div>
          </div>
          <div class="mission-embedded-mnemonic">
            <strong>💡 Clave Teko:</strong> ${escapeHTML(conceptInfo.mnemonic)}
          </div>
        </div>
      </div>
    ` : '';

    container.innerHTML = `
      ${loreHTML}
      <div class="stage-card">
        <div class="stage-card__header">
          <span class="stage-card__badge ${badgeClass}">${escapeHTML(stage.badge || 'DESAFÍO')}</span>
          ${stage.concepto ? `<span class="pill pill--purple" style="font-size:0.75rem;">📚 ${escapeHTML(stage.concepto)}</span>` : ''}
        </div>
        <h3 class="stage-card__title">${escapeHTML(stage.titulo)}</h3>
        <p class="stage-card__prompt" style="font-weight:600;font-size:1.05rem;color:var(--ink);">
          ${escapeHTML(stage.pregunta).replace(/\n/g, '<br>')}
        </p>

        <!-- Tarjeta de Concepto Interactiva -->
        ${conceptWidgetHTML}

        <!-- Lista de Opciones -->
        <div class="mission-options-list" id="m-options-wrap">
          ${optionsHTML}
        </div>

        <!-- Área de Feedback y Diagnóstico Pedagógico -->
        <div id="m-feedback-area"></div>

        <!-- Botón de Pistas Teko -->
        ${stage.pistas && stage.pistas.length > 0 ? `
          <div class="mission-hint-container">
            <button class="btn-teko-hint" id="m-btn-hint">
              <span>💡</span> Pedir una pista a Teko
            </button>
            <div id="m-hint-box-wrap"></div>
          </div>
        ` : ''}
      </div>
    `;

    // Listeners para la Tarjeta de Concepto Interactiva
    const btnToggleConcept = container.querySelector('#m-btn-toggle-concept');
    const panelConcept = container.querySelector('#m-concept-card-panel');
    const btnCloseConcept = container.querySelector('#m-btn-close-concept');

    if (btnToggleConcept && panelConcept) {
      btnToggleConcept.addEventListener('click', () => {
        const isHidden = panelConcept.style.display === 'none';
        panelConcept.style.display = isHidden ? 'block' : 'none';
      });
    }
    if (btnCloseConcept && panelConcept) {
      btnCloseConcept.addEventListener('click', () => {
        panelConcept.style.display = 'none';
      });
    }

    let hintIndex = 0;
    const btnHint = document.getElementById('m-btn-hint');
    if (btnHint) {
      btnHint.addEventListener('click', () => {
        if (hintIndex < stage.pistas.length) {
          telemetry.pistas_usadas++;
          actualizarTelemetriaUI();
          const hintText = stage.pistas[hintIndex];
          const hintWrap = document.getElementById('m-hint-box-wrap');
          hintWrap.innerHTML = `
            <div class="mission-hint-card">
              <span style="font-size:1.2rem;">🤖</span>
              <div class="mission-hint-card__content">
                <strong>Pista de Teko (${hintIndex + 1}/${stage.pistas.length}):</strong><br>
                ${escapeHTML(hintText)}
              </div>
            </div>
          `;
          hintIndex++;
          if (hintIndex >= stage.pistas.length) {
            btnHint.style.display = 'none';
          }
        }
      });
    }

    const optButtons = container.querySelectorAll('.mission-option-btn');
    optButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        evaluarOpcionMultiple(btn, stage, optButtons, nextBtn);
      });
    });
  }

  function evaluarOpcionMultiple(selectedBtn, stage, allButtons, nextBtn) {
    const isCorrect = selectedBtn.getAttribute('data-correct') === 'true';
    const optId = selectedBtn.getAttribute('data-opt-id');
    const optionData = stage.opciones.find(o => o.id === optId);
    const feedbackArea = document.getElementById('m-feedback-area');

    stageAttemptCount++;
    telemetry.intentos++;

    // Deshabilitar botones temporalmente
    allButtons.forEach(b => b.disabled = true);

    if (isCorrect) {
      selectedBtn.classList.add('selected-correct');
      telemetry.aciertos++;
      telemetry.desafios_superados++;

      // Registrar concepto
      if (stage.concepto && telemetry.conceptos_stats[stage.concepto]) {
        telemetry.conceptos_stats[stage.concepto].correct++;
      }

      // Si había tenido un error previo en esta misma etapa, cuenta como autocorrección
      if (stageHadError) {
        telemetry.autocorrecciones++;
      }

      actualizarTelemetriaUI();

      feedbackArea.innerHTML = `
        <div class="mission-success-box">
          <div class="mission-success-box__header">
            <span>🎉</span> <strong>¡Excelente deducción!</strong>
          </div>
          <p class="mission-success-box__text">
            ${escapeHTML(optionData.feedback_positivo || 'Has identificado correctamente las propiedades matemáticas.')}
          </p>
        </div>
      `;

      nextBtn.disabled = false;
      nextBtn.classList.add('btn--glow');
    } else {
      selectedBtn.classList.add('selected-wrong');
      telemetry.errores++;
      stageHadError = true;

      if (stage.concepto && telemetry.conceptos_stats[stage.concepto]) {
        telemetry.conceptos_stats[stage.concepto].errors++;
      }

      actualizarTelemetriaUI();

      // Diagnóstico guiado con reflexión y botón de reintento
      feedbackArea.innerHTML = `
        <div class="mission-diagnostic-box">
          <div class="mission-diagnostic-box__header">
            <span>👀</span> <strong>Revisemos esto juntos</strong>
          </div>
          <p class="mission-diagnostic-box__text">
            ${escapeHTML(optionData.feedback_diagnostico || 'Observa atentamente los datos y vuelve a intentarlo.')}
          </p>
          <div class="mission-diagnostic-actions">
            <button class="btn btn--primary btn--purple btn--sm" id="m-btn-retry-step">
              🔄 Intentar de nuevo
            </button>
          </div>
        </div>
      `;

      document.getElementById('m-btn-retry-step').addEventListener('click', () => {
        allButtons.forEach(b => {
          b.disabled = false;
          b.classList.remove('selected-wrong');
        });
        feedbackArea.innerHTML = '';
      });
    }
  }

  // ============================================
  // ETAPA 3: RESOLVÉ (Resolución guiada paso a paso)
  // ============================================
  function renderEtapaResolvePasoAPaso(stage, container, loreHTML, nextBtn) {
    const conceptInfo = stage.concepto ? getConceptKnowledge(stage.concepto) : null;
    const conceptWidgetHTML = conceptInfo ? `
      <div class="mission-concept-widget-wrap">
        <button class="mission-concept-card-btn" id="m-btn-toggle-concept-resolve" type="button">
          <span>🃏</span> Tarjeta de Concepto: <strong>${escapeHTML(stage.concepto)}</strong> (Ver clave 💡)
        </button>
        <div class="mission-embedded-concept-card" id="m-concept-card-panel-resolve" style="display:none;">
          <div class="mission-embedded-concept-card__header">
            <h4 class="mission-embedded-concept-card__title">
              <span>🃏</span> Tarjeta Clave: ${escapeHTML(stage.concepto)}
            </h4>
            <button class="mission-embedded-concept-card__close" id="m-btn-close-concept-resolve" type="button">✕</button>
          </div>
          <div class="mission-embedded-concept-card__body">
            <div class="mission-embedded-formula">
              <strong>Fórmula / Definición:</strong><br>
              ${escapeHTML(conceptInfo.formula)}
            </div>
            <div class="mission-embedded-signs">
              ${conceptInfo.quads.map(q => `
                <div class="mission-embedded-sign-pill ${q.includes('+') ? 'mission-embedded-sign-pill--pos' : 'mission-embedded-sign-pill--neg'}">
                  ${escapeHTML(q)}
                </div>
              `).join('')}
            </div>
          </div>
          <div class="mission-embedded-mnemonic">
            <strong>💡 Clave Teko:</strong> ${escapeHTML(conceptInfo.mnemonic)}
          </div>
        </div>
      </div>
    ` : '';

    container.innerHTML = `
      ${loreHTML}
      <div class="stage-card">
        <div class="stage-card__header">
          <span class="stage-card__badge stage-card__badge--resolve">${escapeHTML(stage.badge || '3. RESOLVÉ')}</span>
          ${stage.concepto ? `<span class="pill pill--purple" style="font-size:0.75rem;">📚 ${escapeHTML(stage.concepto)}</span>` : ''}
        </div>
        <h3 class="stage-card__title">${escapeHTML(stage.titulo)}</h3>
        <p class="stage-card__prompt" style="font-weight:600;font-size:1.05rem;color:var(--ink);">
          ${escapeHTML(stage.enunciado)}
        </p>

        <!-- Tarjeta de Concepto Interactiva -->
        ${conceptWidgetHTML}

        <div class="step-by-step-box" id="m-steps-container"></div>
        <div id="m-step-feedback-area"></div>

        ${stage.pistas && stage.pistas.length > 0 ? `
          <div class="mission-hint-container">
            <button class="btn-teko-hint" id="m-btn-hint-resolve">
              <span>💡</span> Pedir una pista a Teko
            </button>
            <div id="m-hint-resolve-wrap"></div>
          </div>
        ` : ''}
      </div>
    `;

    const btnToggleConcept = container.querySelector('#m-btn-toggle-concept-resolve');
    const panelConcept = container.querySelector('#m-concept-card-panel-resolve');
    const btnCloseConcept = container.querySelector('#m-btn-close-concept-resolve');

    if (btnToggleConcept && panelConcept) {
      btnToggleConcept.addEventListener('click', () => {
        const isHidden = panelConcept.style.display === 'none';
        panelConcept.style.display = isHidden ? 'block' : 'none';
      });
    }
    if (btnCloseConcept && panelConcept) {
      btnCloseConcept.addEventListener('click', () => {
        panelConcept.style.display = 'none';
      });
    }

    stepIndexInResolve = 0;
    renderPasoIndividual(stage, 0, nextBtn);

    let hintIndex = 0;
    const btnHint = document.getElementById('m-btn-hint-resolve');
    if (btnHint) {
      btnHint.addEventListener('click', () => {
        if (hintIndex < stage.pistas.length) {
          telemetry.pistas_usadas++;
          actualizarTelemetriaUI();
          document.getElementById('m-hint-resolve-wrap').innerHTML = `
            <div class="mission-hint-card">
              <span style="font-size:1.2rem;">🤖</span>
              <div class="mission-hint-card__content">
                <strong>Pista de Teko:</strong><br>
                ${escapeHTML(stage.pistas[hintIndex])}
              </div>
            </div>
          `;
          hintIndex++;
          if (hintIndex >= stage.pistas.length) btnHint.style.display = 'none';
        }
      });
    }
  }

  function renderPasoIndividual(stage, stepIndex, nextBtn) {
    const stepsContainer = document.getElementById('m-steps-container');
    const paso = stage.pasos[stepIndex];
    if (!paso) {
      // Todos los pasos completados
      nextBtn.disabled = false;
      nextBtn.classList.add('btn--glow');
      return;
    }

    const stepOptionsHTML = paso.opciones.map((opt, i) => `
      <button class="mission-option-btn step-opt-btn" data-step-opt="${opt.id}" data-correct="${opt.es_correcta}">
        <span class="mission-option-btn__letter">${String.fromCharCode(65 + i)}</span>
        <span class="mission-option-btn__text">${escapeHTML(opt.texto)}</span>
      </button>
    `).join('');

    const stepEl = document.createElement('div');
    stepEl.className = 'step-item step-item--active';
    stepEl.id = `step-card-${stepIndex}`;
    stepEl.innerHTML = `
      <div class="step-item__header">
        <span class="step-item__title">${escapeHTML(paso.titulo_paso || `Paso ${stepIndex + 1}`)}</span>
        <span class="pill pill--purple" style="font-size:0.68rem;">En curso</span>
      </div>
      <p style="font-size:0.9rem;color:var(--gray-700);margin-bottom:12px;">${escapeHTML(paso.instruccion)}</p>
      <div class="mission-options-list">${stepOptionsHTML}</div>
      <div class="step-feedback-zone"></div>
    `;

    stepsContainer.appendChild(stepEl);

    const btns = stepEl.querySelectorAll('.step-opt-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.getAttribute('data-correct') === 'true';
        const optId = btn.getAttribute('data-step-opt');
        const optData = paso.opciones.find(o => o.id === optId);
        const fbZone = stepEl.querySelector('.step-feedback-zone');

        btns.forEach(b => b.disabled = true);
        telemetry.intentos++;

        if (isCorrect) {
          btn.classList.add('selected-correct');
          stepEl.classList.remove('step-item--active');
          stepEl.classList.add('step-item--completed');
          stepEl.querySelector('.step-item__header .pill').className = 'pill pill--green';
          stepEl.querySelector('.step-item__header .pill').textContent = '✓ Completado';
          telemetry.aciertos++;

          if (stageHadError) {
            telemetry.autocorrecciones++;
          }
          actualizarTelemetriaUI();

          fbZone.innerHTML = `
            <div class="mission-success-box" style="margin-top:10px;padding:10px 14px;">
              <p class="mission-success-box__text" style="font-size:0.85rem;">
                ${escapeHTML(optData.feedback || '¡Paso completado!')}
              </p>
            </div>
          `;

          // Siguiente paso
          setTimeout(() => {
            if (stepIndex + 1 < stage.pasos.length) {
              stageHadError = false;
              renderPasoIndividual(stage, stepIndex + 1, nextBtn);
            } else {
              telemetry.desafios_superados++;
              nextBtn.disabled = false;
              nextBtn.classList.add('btn--glow');
            }
          }, 600);

        } else {
          btn.classList.add('selected-wrong');
          telemetry.errores++;
          stageHadError = true;
          actualizarTelemetriaUI();

          fbZone.innerHTML = `
            <div class="mission-diagnostic-box" style="margin-top:10px;padding:10px 14px;">
              <p class="mission-diagnostic-box__text" style="font-size:0.85rem;">
                ${escapeHTML(optData.feedback_diagnostico || 'Revisa este cálculo.')}
              </p>
              <button class="btn btn--secondary btn--sm" id="btn-retry-step-${stepIndex}" style="font-size:0.75rem;padding:3px 8px;">
                🔄 Reintentar paso
              </button>
            </div>
          `;

          stepEl.querySelector(`#btn-retry-step-${stepIndex}`).addEventListener('click', () => {
            btns.forEach(b => {
              b.disabled = false;
              b.classList.remove('selected-wrong');
            });
            fbZone.innerHTML = '';
          });
        }
      });
    });
  }

  /**
   * Avanzar a la siguiente etapa o finalizar la misión
   */
  function avanzarEtapa() {
    if (currentStageIndex + 1 < currentMissionData.etapas.length) {
      renderStage(currentStageIndex + 1);
    } else {
      mostrarPantallaResultados();
    }
  }

  /**
   * Pantalla de Resultados y Diagnóstico Completo de la Misión
   */
  async function mostrarPantallaResultados() {
    clearInterval(missionTimerInterval);
    actualizarStepper(5);

    const bodyEl = document.getElementById('m-body');
    const footerEl = document.getElementById('m-footer');
    footerEl.style.display = 'none'; // Ocultar barra inferior en resultados

    // Cálculo del Porcentaje de Dominio (Fórmula balanceada: aciertos, autocorrecciones vs pistas y errores)
    const totalDesafios = 5;
    const baseScore = (telemetry.desafios_superados / totalDesafios) * 80;
    const autocorrBonus = Math.min(15, telemetry.autocorrecciones * 5);
    const hintPenalty = Math.min(15, telemetry.pistas_usadas * 3);
    const dominioPct = Math.max(20, Math.min(100, Math.round(baseScore + autocorrBonus - hintPenalty + 15)));

    // Determinar Estado por Concepto
    const conceptosFinal = {};
    if (currentMissionData.conceptos && Array.isArray(currentMissionData.conceptos)) {
      currentMissionData.conceptos.forEach(c => {
        const stats = telemetry.conceptos_stats[c] || { correct: 1, errors: 0 };
        if (stats.errors === 0 || (stats.correct > stats.errors)) {
          conceptosFinal[c] = 'Dominado';
        } else {
          conceptosFinal[c] = 'Necesita práctica';
        }
      });
    } else {
      conceptosFinal['Trigonometría General'] = dominioPct >= 75 ? 'Dominado' : 'Necesita práctica';
    }

    const mins = Math.floor(missionSecondsElapsed / 60);
    const secs = missionSecondsElapsed % 60;
    const tiempoTexto = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Renderizado del HTML de Resultados
    bodyEl.innerHTML = `
      <div class="mission-results-view">
        <div class="results-badge-icon">🏆</div>
        <h2 class="results-title">¡Misión Completada con Éxito!</h2>
        <p class="results-subtitle">
          Has restablecido las coordenadas y completado las 5 etapas de <strong>${escapeHTML(currentMissionData.titulo)}</strong>.
        </p>

        <!-- Tarjeta de Dominio -->
        <div class="mastery-score-card">
          <span class="mastery-score-label">Nivel de Dominio Alcanzado</span>
          <div class="mastery-score-val" id="m-results-dominio">${dominioPct}%</div>
          <div class="mastery-progress-bar-wrap">
            <div class="mastery-progress-bar-fill" style="width:${dominioPct}%;"></div>
          </div>
        </div>

        <!-- Desglose por Concepto Matemático -->
        <div class="concepts-breakdown-section">
          <h3 class="concepts-breakdown-title">
            <span>📊</span> Diagnóstico Conceptual de Aprendizaje:
          </h3>
          <div class="concepts-grid">
            ${Object.entries(conceptosFinal).map(([concepto, estado]) => {
              const isDom = estado === 'Dominado';
              return `
                <div class="concept-card">
                  <span class="concept-card__name">${escapeHTML(concepto)}</span>
                  <span class="concept-card__status ${isDom ? 'concept-card__status--mastered' : 'concept-card__status--practice'}">
                    ${isDom ? '🟢 Dominado' : '🟡 Necesita práctica'}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Telemetría Pedagógica -->
        <div class="results-telemetry-grid">
          <div class="results-telemetry-card">
            <div class="results-telemetry-card__val">${telemetry.desafios_superados}/5</div>
            <div class="results-telemetry-card__lbl">Desafíos Superados</div>
          </div>
          <div class="results-telemetry-card">
            <div class="results-telemetry-card__val" style="color:#059669;">${telemetry.autocorrecciones}</div>
            <div class="results-telemetry-card__lbl">Autocorrecciones</div>
          </div>
          <div class="results-telemetry-card">
            <div class="results-telemetry-card__val" style="color:#d97706;">${telemetry.pistas_usadas}</div>
            <div class="results-telemetry-card__lbl">Pistas Usadas</div>
          </div>
          <div class="results-telemetry-card">
            <div class="results-telemetry-card__val" style="color:#2563eb;">${tiempoTexto}</div>
            <div class="results-telemetry-card__lbl">Tiempo Empleado</div>
          </div>
        </div>

        ${currentMissionData.insignia ? `
          <div style="margin-bottom:24px;">
            <span class="pill pill--purple" style="font-size:0.85rem;padding:6px 16px;border-width:2px;">
              🏅 Insignia Desbloqueada: <strong>${escapeHTML(currentMissionData.insignia)}</strong>
            </span>
          </div>
        ` : ''}

        <!-- Botones Finales -->
        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
          <button class="btn btn--secondary btn--md" id="m-btn-retry-all">
            🔄 Repetir Misión
          </button>
          <button class="btn btn--primary btn--green btn--md" id="m-btn-finish-all">
            ✅ Finalizar y Volver al Dashboard
          </button>
        </div>
      </div>
    `;

    document.getElementById('m-btn-retry-all').addEventListener('click', () => {
      footerEl.style.display = 'flex';
      iniciarMision(currentMissionData);
    });

    document.getElementById('m-btn-finish-all').addEventListener('click', () => {
      cerrarMision();
      window.location.reload();
    });

    // Guardar en la Base de Datos automáticamente
    await guardarProgresoMisionAPI(dominioPct, conceptosFinal);
  }

  /**
   * Envía la telemetría y resultados a la base de datos MySQL
   */
  async function guardarProgresoMisionAPI(dominioPct, conceptosFinal) {
    if (!currentMission || !currentMission.id) return;

    try {
      const formData = new FormData();
      formData.append('tarea_id', currentMission.id);
      formData.append('dominio_pct', dominioPct);
      formData.append('aciertos', telemetry.aciertos);
      formData.append('errores', telemetry.errores);
      formData.append('intentos', telemetry.intentos);
      formData.append('pistas_usadas', telemetry.pistas_usadas);
      formData.append('autocorrecciones', telemetry.autocorrecciones);
      formData.append('tiempo_segundos', missionSecondsElapsed);
      formData.append('desafios_superados', telemetry.desafios_superados);
      formData.append('total_desafios', 5);
      formData.append('conceptos_feedback', JSON.stringify(conceptosFinal));
      formData.append('detalles_json', JSON.stringify({
        fecha: new Date().toISOString(),
        conceptos_stats: telemetry.conceptos_stats
      }));

      await fetch('api_tareas.php?action=guardar_progreso_mision', {
        method: 'POST',
        body: formData
      });
    } catch (e) {
      console.error('Error guardando progreso:', e);
    }
  }

  function cerrarMision() {
    clearInterval(missionTimerInterval);
    const modalBackdrop = document.getElementById('mission-modal-backdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('active');
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getConceptKnowledge(conceptName) {
    const map = {
      'Seno': {
        formula: 'sen(θ) = Cateto Opuesto / Hipotenusa = Y',
        quads: ['I: (+)', 'II: (+)', 'III: (−)', 'IV: (−)'],
        mnemonic: 'Seno = Coordenada Y (altura). Positivo en la mitad superior (Cuadrantes I y II). sen(30°) = 1/2.'
      },
      'Coseno': {
        formula: 'cos(θ) = Cateto Adyacente / Hipotenusa = X',
        quads: ['I: (+)', 'II: (−)', 'III: (−)', 'IV: (+)'],
        mnemonic: 'Coseno = Coordenada X (horizontal). Positivo en la mitad derecha (Cuadrantes I y IV). cos(60°) = 1/2.'
      },
      'Tangente': {
        formula: 'tan(θ) = sen(θ) / cos(θ) = Y / X',
        quads: ['I: (+)', 'II: (−)', 'III: (+)', 'IV: (−)'],
        mnemonic: 'Positiva donde Seno y Coseno tienen el MISMO signo (Cuadrantes I y III). tan(45°) = 1.'
      },
      'Cotangente': {
        formula: 'cot(θ) = 1 / tan(θ) = cos(θ) / sen(θ) = X / Y',
        quads: ['I: (+)', 'II: (−)', 'III: (+)', 'IV: (−)'],
        mnemonic: 'Recíproca de tangente. Positiva en Cuadrantes I y III. cot(45°) = 1.'
      },
      'Secante': {
        formula: 'sec(θ) = 1 / cos(θ) = Hipotenusa / Cateto Adyacente',
        quads: ['I: (+)', 'II: (−)', 'III: (−)', 'IV: (+)'],
        mnemonic: 'Recíproca del Coseno (Sec ↔ Cos). Positiva en Cuadrantes I y IV. sec(60°) = 2.'
      },
      'Cosecante': {
        formula: 'csc(θ) = 1 / sen(θ) = Hipotenusa / Cateto Opuesto',
        quads: ['I: (+)', 'II: (+)', 'III: (−)', 'IV: (−)'],
        mnemonic: 'Recíproca del Seno (Csc ↔ Sen). Positiva en Cuadrantes I y II. csc(30°) = 2.'
      }
    };

    return map[conceptName] || {
      formula: `Definición y propiedades de ${conceptName}`,
      quads: ['I: (+)', 'II: (según signo)', 'III: (según signo)', 'IV: (según signo)'],
      mnemonic: `Recuerda la regla "TODOS - SIN - TA - COS" para identificar los signos de ${conceptName} en cada cuadrante.`
    };
  }

  // Exportar globalmente para integración
  window.TekoMisiones = {
    iniciar: cargarYIniciarMision,
    cerrar: cerrarMision
  };

})();
