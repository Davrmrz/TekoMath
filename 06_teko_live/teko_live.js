/* ============================================
   TEKO MATH — TEKO LIVE (Arena de Clase en Vivo / Kahoot)
   Lógica Multijugador en Tiempo Real (teko_live.js)
   ============================================ */

(function () {
  'use strict';

  // Audio Sintetizador Web Audio API (efectos de sonido dinámicos)
  const TekoAudio = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
    },
    beep(freq = 440, type = 'sine', duration = 0.1, gainVal = 0.1) {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    },
    correct() {
      this.beep(523.25, 'triangle', 0.12, 0.15); // C5
      setTimeout(() => this.beep(659.25, 'triangle', 0.15, 0.18), 100); // E5
      setTimeout(() => this.beep(783.99, 'triangle', 0.25, 0.2), 200); // G5
      setTimeout(() => this.beep(1046.50, 'sine', 0.35, 0.25), 320); // C6
    },
    wrong() {
      this.beep(300, 'sawtooth', 0.18, 0.15);
      setTimeout(() => this.beep(220, 'sawtooth', 0.25, 0.18), 120);
    },
    tick() {
      this.beep(880, 'sine', 0.04, 0.05);
    },
    fanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((n, i) => {
        setTimeout(() => this.beep(n, 'triangle', 0.3, 0.2), i * 140);
      });
    }
  };

  // Estado Global del Módulo
  const state = {
    salaId: null,
    codigoPin: null,
    isHost: false, // true = Docente, false = Estudiante
    pollInterval: null,
    localTimeLeft: 0,
    timerInterval: null,
    ultimaPreguntaIdx: -1,
    ultimoEstado: null,
    haRespondido: false
  };

  // Formas de las opciones
  const OPTION_SHAPES = [
    { icon: '🔺', name: 'Triángulo', class: 'teko-opt-btn--red' },
    { icon: '🔷', name: 'Rombo', class: 'teko-opt-btn--blue' },
    { icon: '🟡', name: 'Círculo', class: 'teko-opt-btn--yellow' },
    { icon: '🟩', name: 'Cuadrado', class: 'teko-opt-btn--green' }
  ];

  // Elementos UI del Overlay
  let overlay, container, headerEl, bodyEl;

  function initUI() {
    overlay = document.getElementById('teko-live-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'teko-live-overlay';
      overlay.className = 'teko-live-overlay';
      overlay.innerHTML = `
        <div class="teko-live-container" id="teko-live-container">
          <div class="teko-live-header" id="teko-live-header"></div>
          <div class="teko-live-body" id="teko-live-body"></div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    container = document.getElementById('teko-live-container');
    headerEl = document.getElementById('teko-live-header');
    bodyEl = document.getElementById('teko-live-body');
  }

  function openModal() {
    initUI();
    overlay.classList.add('teko-live-overlay--active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (state.pollInterval) clearInterval(state.pollInterval);
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.pollInterval = null;
    state.timerInterval = null;
    if (overlay) overlay.classList.remove('teko-live-overlay--active');
    document.body.style.overflow = '';
  }

  // ============================================
  // POLLING Y SINCRONIZACIÓN EN TIEMPO REAL
  // ============================================
  async function syncRoomState() {
    if (!state.salaId && !state.codigoPin) return;
    try {
      const url = `api_sala.php?action=estado&sala_id=${state.salaId || ''}&codigo_pin=${state.codigoPin || ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        if (data.error && data.error.includes('no encontrada')) {
          closeModal();
          alert('La sala de clase ha sido cerrada por el docente.');
        }
        return;
      }

      state.salaId = data.sala.id;
      state.codigoPin = data.sala.codigo_pin;

      renderHeader(data);
      renderView(data);
    } catch (e) {
      console.warn('Error en sincronización Teko Live:', e);
    }
  }

  function startPolling() {
    if (state.pollInterval) clearInterval(state.pollInterval);
    syncRoomState();
    state.pollInterval = setInterval(syncRoomState, 1200);
  }

  // ============================================
  // RENDERIZADO DEL ENCABEZADO
  // ============================================
  function renderHeader(data) {
    const s = data.sala;
    headerEl.innerHTML = `
      <div class="teko-live-header__left">
        <span class="pill pill--purple" style="font-weight:800;">⚡ TEKO LIVE</span>
        <span class="teko-live-header__pin-box">
          PIN: <span>${s.codigo_pin}</span>
          <button type="button" class="btn btn--sm" id="btn-copy-live-pin" title="Copiar PIN" style="padding:2px 6px;font-size:0.75rem;background:#f3e8ff;border:1px solid #c084fc;">📋</button>
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:0.85rem;font-weight:700;color:var(--gray-600);">${escapeHtml(s.titulo)}</span>
        <button class="teko-live-close-btn" id="btn-close-teko-live" title="Cerrar / Salir">&times;</button>
      </div>
    `;

    document.getElementById('btn-close-teko-live')?.addEventListener('click', () => {
      if (state.isHost) {
        if (confirm('¿Deseas finalizar y cerrar esta sala de clase?')) {
          finalizarSala();
        }
      } else {
        if (confirm('¿Deseas salir de la sala de juego?')) {
          closeModal();
        }
      }
    });

    document.getElementById('btn-copy-live-pin')?.addEventListener('click', () => {
      navigator.clipboard.writeText(s.codigo_pin);
      const btn = document.getElementById('btn-copy-live-pin');
      if (btn) btn.textContent = '✅';
      setTimeout(() => { if (btn) btn.textContent = '📋'; }, 1500);
    });
  }

  // ============================================
  // RENDERIZADO PRINCIPAL POR ESTADO
  // ============================================
  function renderView(data) {
    const s = data.sala;
    const estado = s.estado;

    // Detectar cambio de pregunta
    if (s.pregunta_actual !== state.ultimaPreguntaIdx || estado !== state.ultimoEstado) {
      state.ultimaPreguntaIdx = s.pregunta_actual;
      state.ultimoEstado = estado;
      state.haRespondido = false;

      if (estado === 'en_pregunta') {
        TekoAudio.beep(600, 'sine', 0.15, 0.12);
      } else if (estado === 'podio_final') {
        TekoAudio.fanfare();
      }
    }

    switch (estado) {
      case 'lobby':
        renderLobbyView(data);
        break;
      case 'en_pregunta':
        renderQuestionView(data);
        break;
      case 'mostrando_resultado':
        renderResultsView(data);
        break;
      case 'podio_final':
        renderPodiumView(data);
        break;
      case 'cerrada':
        closeModal();
        alert('La sala ha sido finalizada.');
        break;
    }
  }

  // --- VISTA 1: LOBBY ---
  function renderLobbyView(data) {
    const s = data.sala;
    const alumnos = data.alumnos || [];

    let actionBtnHtml = '';
    if (state.isHost) {
      actionBtnHtml = `
        <button type="button" class="btn btn--primary btn--purple-solid btn--lg" id="btn-start-game" style="font-size:1.15rem;padding:12px 36px;box-shadow:4px 4px 0 #1a1a1a;" ${alumnos.length === 0 ? 'disabled' : ''}>
          ▶️ ¡Comenzar Teko Quiz (${alumnos.length} Alumnos)!
        </button>
      `;
    } else {
      actionBtnHtml = `
        <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:12px 20px;display:inline-flex;align-items:center;gap:10px;color:#166534;font-weight:700;">
          <span style="font-size:1.4rem;">👋</span>
          <span>¡Estás dentro! Esperando a que el profesor inicie el juego...</span>
        </div>
      `;
    }

    bodyEl.innerHTML = `
      <div class="teko-lobby">
        <div class="teko-lobby__pin-hero">
          <div class="teko-lobby__pin-label">CÓDIGO PIN DE LA SALA</div>
          <div class="teko-lobby__pin-number">${s.codigo_pin}</div>
        </div>

        <div class="teko-lobby__player-count">
          <span>👥 Alumnos Conectados (${alumnos.length})</span>
        </div>

        <div class="teko-lobby__player-grid">
          ${alumnos.length === 0 ? `
            <div style="color:var(--gray-500);font-size:0.9rem;padding:20px;font-style:italic;">
              Ingresa el código PIN desde tu pantalla para unirte...
            </div>
          ` : alumnos.map(al => `
            <div class="teko-lobby__player-badge">
              <span>👤</span> ${escapeHtml(al.nombre)}
            </div>
          `).join('')}
        </div>

        <div>
          ${actionBtnHtml}
        </div>
      </div>
    `;

    if (state.isHost) {
      document.getElementById('btn-start-game')?.addEventListener('click', iniciarJuego);
    }
  }

  // --- VISTA 2: PREGUNTA ACTIVA ---
  function renderQuestionView(data) {
    const s = data.sala;
    const p = data.pregunta;
    const mi = data.mi_estado;
    const esHost = state.isHost;

    if (!p) return;

    // Control de tiempo restante
    const tRestante = s.tiempo_restante;
    const timerClass = tRestante <= 5 ? 'teko-timer-badge--warning' : '';

    if (tRestante <= 5 && tRestante > 0) {
      TekoAudio.tick();
    }

    let footerControls = '';
    if (esHost) {
      footerControls = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
          <span style="font-weight:700;color:var(--purple-700);">📊 ${data.total_respondieron} de ${data.alumnos_count} respondieron</span>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-host-reveal">⏹️ Revelar Respuestas</button>
        </div>
      `;
    }

    let optionsHtml = '';
    p.opciones.forEach((opt, idx) => {
      const shape = OPTION_SHAPES[idx % 4];
      const yaRespondio = Boolean(mi && mi.respondio);
      const isSelected = Boolean(mi && mi.ultima_respuesta === idx);

      let extraClasses = shape.class;
      if (isSelected) extraClasses += ' teko-opt-btn--selected';
      if (yaRespondio && !isSelected) extraClasses += ' teko-opt-btn--wrong-dim';

      optionsHtml += `
        <button type="button" class="teko-opt-btn ${extraClasses}" data-opt-idx="${idx}" ${yaRespondio || esHost ? 'disabled' : ''}>
          <span class="teko-opt-btn__icon">${shape.icon}</span>
          <span class="teko-opt-btn__text">${escapeHtml(opt.texto)}</span>
        </button>
      `;
    });

    bodyEl.innerHTML = `
      <div class="teko-game-topbar">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="pill pill--purple" style="font-weight:800;">Pregunta ${p.numero} / ${p.total}</span>
          <span class="pill pill--green" style="font-weight:700;">${escapeHtml(p.concepto)}</span>
        </div>
        <div class="teko-timer-badge ${timerClass}">
          ${tRestante}s
        </div>
      </div>

      <div class="teko-question-card">
        <h2 class="teko-question-card__text">${escapeHtml(p.enunciado)}</h2>
      </div>

      ${mi && mi.respondio ? `
        <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:10px;text-align:center;font-weight:800;color:#92400e;margin-bottom:14px;">
          ⚡ ¡Respuesta enviada! Esperando que termine el tiempo...
        </div>
      ` : ''}

      <div class="teko-options-grid">
        ${optionsHtml}
      </div>

      ${footerControls}
    `;

    if (!esHost && (!mi || !mi.respondio)) {
      document.querySelectorAll('.teko-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const optIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
          enviarRespuesta(optIdx, s.pregunta_actual);
        });
      });
    }

    if (esHost) {
      document.getElementById('btn-host-reveal')?.addEventListener('click', revelarResultado);
    }
  }

  // --- VISTA 3: RESULTADOS Y LEADERBOARD ---
  function renderResultsView(data) {
    const s = data.sala;
    const p = data.pregunta;
    const mi = data.mi_estado;
    const stats = data.stats_respuestas || {};
    const leaderboard = data.leaderboard || [];
    const esHost = state.isHost;

    const maxCount = Math.max(1, ...Object.values(stats));

    let barsHtml = '';
    [0, 1, 2, 3].forEach(idx => {
      const shape = OPTION_SHAPES[idx];
      const count = stats[idx] || 0;
      const heightPct = Math.round((count / maxCount) * 100);
      const opt = p && p.opciones && p.opciones[idx];
      const isCorrect = opt && opt.es_correcta;

      barsHtml += `
        <div class="teko-bar-column">
          <div class="teko-bar-fill" style="height:${Math.max(20, heightPct)}%;background:${isCorrect ? '#16a34a' : '#ef4444'};">
            ${count}
          </div>
          <div class="teko-bar-label">${shape.icon} ${isCorrect ? '✅' : ''}</div>
        </div>
      `;
    });

    let studentFeedbackHtml = '';
    if (mi) {
      if (mi.es_correcta) {
        studentFeedbackHtml = `
          <div style="background:#dcfce7;border:2.5px solid #16a34a;border-radius:14px;padding:14px;margin-bottom:18px;color:#166534;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.8rem;">🎉</span>
              <div>
                <div style="font-size:1.1rem;">¡RESPUESTA CORRECTA!</div>
                <div style="font-size:0.85rem;font-weight:600;">+${mi.puntos_ganados_ultimo} pts | Puesto #${mi.puesto || 1} 🔥 Racha: ${mi.racha}</div>
              </div>
            </div>
            <span style="font-size:1.3rem;">🚀</span>
          </div>
        `;
      } else {
        studentFeedbackHtml = `
          <div style="background:#fee2e2;border:2.5px solid #dc2626;border-radius:14px;padding:14px;margin-bottom:18px;color:#991b1b;font-weight:800;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.8rem;">❌</span>
            <div>
              <div style="font-size:1.1rem;">¡Respuesta Incorrecta!</div>
              <div style="font-size:0.85rem;font-weight:600;">No sumaste puntos en esta ronda. ¡A por la siguiente!</div>
            </div>
          </div>
        `;
      }
    }

    let hostActionBtn = '';
    if (esHost) {
      const esUltima = s.pregunta_actual + 1 >= s.total_preguntas;
      hostActionBtn = `
        <button type="button" class="btn btn--primary btn--purple-solid btn--lg" id="btn-next-question" style="font-size:1.1rem;padding:10px 28px;">
          ${esUltima ? '🏆 Ver Podio Final' : '➡️ Siguiente Pregunta'}
        </button>
      `;
    }

    bodyEl.innerHTML = `
      <div class="teko-results-screen">
        ${studentFeedbackHtml}

        <div style="background:#ffffff;border:2px solid #1a1a1a;border-radius:16px;padding:14px;margin-bottom:16px;text-align:left;">
          <span class="pill pill--green" style="font-weight:800;font-size:0.75rem;">💡 Explicación del Profesor</span>
          <p style="margin:6px 0 0 0;font-size:0.92rem;color:var(--gray-800);">${escapeHtml(p ? p.explicacion : '')}</p>
        </div>

        <h4 style="font-family:var(--font-display);margin:0 0 10px 0;">Distribución de Respuestas</h4>
        <div class="teko-answer-bars">
          ${barsHtml}
        </div>

        <div class="teko-leaderboard">
          <div class="teko-leaderboard__title">
            <span>🔥 Tabla de Posiciones (Top 5)</span>
          </div>
          ${leaderboard.map((item, idx) => `
            <div class="teko-leaderboard__row ${idx === 0 ? 'teko-leaderboard__row--top1' : ''}">
              <div class="teko-leaderboard__left">
                <span class="teko-leaderboard__rank">#${idx + 1}</span>
                <span>${escapeHtml(item.nombre)}</span>
                ${item.racha >= 2 ? `<span style="font-size:0.8rem;background:#ffedd5;color:#c2410c;padding:2px 6px;border-radius:6px;border:1px solid #fdba74;">🔥 ${item.racha}</span>` : ''}
              </div>
              <span class="teko-leaderboard__points">${item.puntos} pts</span>
            </div>
          `).join('')}
        </div>

        <div>
          ${hostActionBtn}
        </div>
      </div>
    `;

    if (esHost) {
      document.getElementById('btn-next-question')?.addEventListener('click', siguientePregunta);
    }
  }

  // --- VISTA 4: PODIO FINAL 🏆 ---
  function renderPodiumView(data) {
    const podio = data.podio_final || [];
    const esHost = state.isHost;

    const first = podio[0] || { nombre: '-', puntos: 0 };
    const second = podio[1] || { nombre: '-', puntos: 0 };
    const third = podio[2] || { nombre: '-', puntos: 0 };

    bodyEl.innerHTML = `
      <div class="teko-podium-screen">
        <h2 style="font-family:var(--font-display);font-size:2rem;font-weight:900;color:var(--ink);margin:0;">
          🏆 ¡PODIO DE CAMPEONES TEKO!
        </h2>
        <p style="color:var(--gray-600);margin:4px 0 20px 0;">¡Felicitaciones a todos los participantes por su gran desempeño trigonométrico!</p>

        <div class="teko-podium-stage">
          <!-- 2do Lugar -->
          <div class="teko-podium-pillar teko-podium-pillar--2nd">
            <div class="teko-podium-avatar">🥈</div>
            <div class="teko-podium-name">${escapeHtml(second.nombre)}</div>
            <div class="teko-podium-score">${second.puntos} pts</div>
            <div class="teko-podium-rank-label">2°</div>
          </div>

          <!-- 1er Lugar -->
          <div class="teko-podium-pillar teko-podium-pillar--1st">
            <div class="teko-podium-avatar">👑</div>
            <div class="teko-podium-name">${escapeHtml(first.nombre)}</div>
            <div class="teko-podium-score">${first.puntos} pts</div>
            <div class="teko-podium-rank-label">1°</div>
          </div>

          <!-- 3er Lugar -->
          <div class="teko-podium-pillar teko-podium-pillar--3rd">
            <div class="teko-podium-avatar">🥉</div>
            <div class="teko-podium-name">${escapeHtml(third.nombre)}</div>
            <div class="teko-podium-score">${third.puntos} pts</div>
            <div class="teko-podium-rank-label">3°</div>
          </div>
        </div>

        <div style="margin-top:24px;">
          <button type="button" class="btn btn--secondary btn--lg" id="btn-finish-podium">
            🏁 Cerrar y Volver al Dashboard
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-finish-podium')?.addEventListener('click', () => {
      if (esHost) {
        finalizarSala();
      } else {
        closeModal();
      }
    });
  }

  // ============================================
  // ACCIONES AJAX CON LA API
  // ============================================

  // Docente: Crear Sala
  window.crearSalaLive = async function (packId = 'pack_cuadrantes', tiempoLimite = 20) {
    try {
      const formData = new FormData();
      formData.append('pack_id', packId);
      formData.append('tiempo_limite', tiempoLimite);

      const res = await fetch('api_sala.php?action=crear_sala', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        state.isHost = true;
        state.salaId = data.sala_id;
        state.codigoPin = data.codigo_pin;
        openModal();
        startPolling();
      } else {
        alert(data.error || 'No se pudo crear la sala');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al crear la sala en vivo');
    }
  };

  // Alumno: Unirse a Sala
  window.unirseSalaLive = async function (pin) {
    if (!pin) {
      alert('Por favor ingresa el código PIN de 6 dígitos.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('codigo_pin', pin);

      const res = await fetch('api_sala.php?action=unirse_sala', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        state.isHost = false;
        state.salaId = data.sala_id;
        state.codigoPin = data.codigo_pin;
        openModal();
        startPolling();
      } else {
        alert(data.error || 'No se pudo ingresar a la sala');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al unirse a la sala');
    }
  };

  // Iniciar Juego (Docente)
  async function iniciarJuego() {
    try {
      const formData = new FormData();
      formData.append('sala_id', state.salaId);

      const res = await fetch('api_sala.php?action=iniciar_juego', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        syncRoomState();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Revelar Resultado (Docente)
  async function revelarResultado() {
    try {
      const formData = new FormData();
      formData.append('sala_id', state.salaId);

      const res = await fetch('api_sala.php?action=revelar_resultado', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        syncRoomState();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Siguiente Pregunta (Docente)
  async function siguientePregunta() {
    try {
      const formData = new FormData();
      formData.append('sala_id', state.salaId);

      const res = await fetch('api_sala.php?action=siguiente_pregunta', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        syncRoomState();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Responder (Estudiante)
  async function enviarRespuesta(opcionIdx, preguntaIdx) {
    if (state.haRespondido) return;
    state.haRespondido = true;

    try {
      const formData = new FormData();
      formData.append('sala_id', state.salaId);
      formData.append('opcion_idx', opcionIdx);
      formData.append('pregunta_idx', preguntaIdx);

      const res = await fetch('api_sala.php?action=responder', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        if (data.es_correcta) {
          TekoAudio.correct();
        } else {
          TekoAudio.wrong();
        }
        syncRoomState();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Finalizar Sala (Docente)
  async function finalizarSala() {
    try {
      const formData = new FormData();
      formData.append('sala_id', state.salaId);

      await fetch('api_sala.php?action=cerrar_sala', {
        method: 'POST',
        body: formData
      });
      closeModal();
    } catch (e) {
      console.error(e);
      closeModal();
    }
  }

  // Utilidad para sanitizar texto
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ============================================
  // GESTIÓN DE PACKS PERSONALIZADOS DE PREGUNTAS (DOCENTE)
  // ============================================

  let packQuestions = [];

  function updatePackQuestionsCount() {
    const counter = document.getElementById('pack-questions-count');
    if (counter) counter.textContent = packQuestions.length;
  }

  function renderPackQuestionCard(idx) {
    const q = packQuestions[idx] || {
      enunciado: '',
      concepto: 'Trigonometría',
      explicacion: '',
      opciones: [
        { texto: '', es_correcta: true },
        { texto: '', es_correcta: false },
        { texto: '', es_correcta: false },
        { texto: '', es_correcta: false }
      ]
    };

    const card = document.createElement('div');
    card.className = 'custom-stage-box anim-fade-up';
    card.id = `pack-q-card-${idx}`;
    card.style.marginBottom = '12px';

    card.innerHTML = `
      <div class="custom-stage-box__header">
        <span class="pill pill--purple" style="font-size:0.75rem;font-weight:800;">Pregunta #${idx + 1}</span>
        ${packQuestions.length > 1 ? `
          <button type="button" class="btn btn--secondary btn--sm btn-delete-pack-q" data-q-idx="${idx}" style="color:#dc2626;border-color:#fca5a5;padding:2px 8px;font-size:0.7rem;">
            Eliminar 🗑️
          </button>
        ` : ''}
      </div>

      <div class="form-group" style="margin-bottom:8px;">
        <label class="form-label" style="font-size:0.8rem;">Enunciado de la Pregunta</label>
        <input type="text" class="form-input purple-focus pack-q-enunciado" data-q-idx="${idx}" placeholder="Ej: ¿En qué cuadrante el coseno es positivo y el seno es negativo?" value="${escapeHtml(q.enunciado)}" required>
      </div>

      <div class="teacher-grid-2col" style="margin-bottom:8px;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:0.8rem;">Concepto Evaluado</label>
          <select class="form-input purple-focus pack-q-concepto" data-q-idx="${idx}" style="cursor:pointer;font-size:0.82rem;">
            <option value="Cuadrantes" ${q.concepto === 'Cuadrantes' ? 'selected' : ''}>Cuadrantes</option>
            <option value="Seno" ${q.concepto === 'Seno' ? 'selected' : ''}>Seno</option>
            <option value="Coseno" ${q.concepto === 'Coseno' ? 'selected' : ''}>Coseno</option>
            <option value="Tangente" ${q.concepto === 'Tangente' ? 'selected' : ''}>Tangente</option>
            <option value="Recíprocas" ${q.concepto === 'Recíprocas' ? 'selected' : ''}>Recíprocas (Sec, Csc, Cot)</option>
            <option value="Ángulos Notables" ${q.concepto === 'Ángulos Notables' ? 'selected' : ''}>Ángulos Notables</option>
            <option value="Identidades" ${q.concepto === 'Identidades' ? 'selected' : ''}>Identidades Fundamentales</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:0.8rem;">Explicación / Feedback del Profesor (Opcional)</label>
          <input type="text" class="form-input purple-focus pack-q-explicacion" data-q-idx="${idx}" placeholder="Ej: En el Cuadrante IV, X es positiva y Y es negativa." value="${escapeHtml(q.explicacion)}">
        </div>
      </div>

      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" style="font-size:0.8rem;">Opciones de Respuesta (Marca la Correcta):</label>
        <div class="custom-options-builder">
          ${[0, 1, 2, 3].map(optIdx => {
            const shape = OPTION_SHAPES[optIdx];
            const optVal = q.opciones && q.opciones[optIdx] ? q.opciones[optIdx].texto : '';
            const isCorrect = q.opciones && q.opciones[optIdx] ? q.opciones[optIdx].es_correcta : (optIdx === 0);
            return `
              <div class="custom-opt-row">
                <input type="radio" name="pack_q_${idx}_correct" value="${optIdx}" ${isCorrect ? 'checked' : ''} title="Marcar como correcta">
                <span style="font-size:1rem;flex-shrink:0;">${shape.icon}</span>
                <input type="text" class="form-input pack-q-opt" data-q-idx="${idx}" data-opt-idx="${optIdx}" placeholder="Opción ${shape.name}..." value="${escapeHtml(optVal)}" required>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    return card;
  }

  function reRenderAllPackQuestions() {
    const container = document.getElementById('pack-questions-container');
    if (!container) return;
    container.innerHTML = '';
    packQuestions.forEach((_, i) => {
      container.appendChild(renderPackQuestionCard(i));
    });
    updatePackQuestionsCount();

    // Event listener para eliminar preguntas
    container.querySelectorAll('.btn-delete-pack-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const qIdx = parseInt(btn.getAttribute('data-q-idx'), 10);
        if (packQuestions.length > 1) {
          packQuestions.splice(qIdx, 1);
          reRenderAllPackQuestions();
        }
      });
    });
  }

  // Cargar paquetes en el <select id="live-pack-select">
  window.cargarPacksDisponibles = async function (selectedPackId = null) {
    const packSelect = document.getElementById('live-pack-select');
    if (!packSelect) return;

    try {
      const res = await fetch('api_sala.php?action=packs');
      const data = await res.json();

      if (data.success && Array.isArray(data.packs)) {
        packSelect.innerHTML = '';
        data.packs.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = `${p.titulo} (${p.preguntas ? p.preguntas.length : p.total_preguntas} Preguntas)`;
          if (selectedPackId && p.id === selectedPackId) {
            opt.selected = true;
          }
          packSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.warn('Error al cargar lista de packs:', e);
    }
  };

  // Inicializar listeners en carga de página
  document.addEventListener('DOMContentLoaded', () => {
    // Formulario de unirse en Dashboard
    const joinForm = document.getElementById('form-teko-live-join');
    const pinInput = document.getElementById('teko-live-pin-input');
    if (joinForm && pinInput) {
      joinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = pinInput.value.trim();
        window.unirseSalaLive(pin);
      });
    }

    // Botón de crear sala en Docente
    const btnCreateLive = document.getElementById('btn-open-create-live');
    if (btnCreateLive) {
      btnCreateLive.addEventListener('click', () => {
        const packSelect = document.getElementById('live-pack-select');
        const packId = packSelect ? packSelect.value : 'pack_cuadrantes';
        window.crearSalaLive(packId);
      });
    }

    // Cargar selector de packs
    window.cargarPacksDisponibles();

    // Modal de Creación de Pack
    const btnOpenCreatePack = document.getElementById('btn-open-create-pack-modal');
    const modalCreatePack = document.getElementById('modal-create-pack');
    const btnAddPackQ = document.getElementById('btn-add-pack-question');
    const btnLoadSamplePack = document.getElementById('btn-load-sample-pack');
    const formCreatePack = document.getElementById('form-create-custom-pack');

    if (btnOpenCreatePack && modalCreatePack) {
      btnOpenCreatePack.addEventListener('click', () => {
        modalCreatePack.classList.add('teacher-modal-backdrop--open');
        if (packQuestions.length === 0) {
          packQuestions = [{
            enunciado: '',
            concepto: 'Trigonometría',
            explicacion: '',
            opciones: [
              { texto: '', es_correcta: true },
              { texto: '', es_correcta: false },
              { texto: '', es_correcta: false },
              { texto: '', es_correcta: false }
            ]
          }];
          reRenderAllPackQuestions();
        }
      });
    }

    // Botón añadir pregunta al pack
    if (btnAddPackQ) {
      btnAddPackQ.addEventListener('click', () => {
        packQuestions.push({
          enunciado: '',
          concepto: 'Trigonometría',
          explicacion: '',
          opciones: [
            { texto: '', es_correcta: true },
            { texto: '', es_correcta: false },
            { texto: '', es_correcta: false },
            { texto: '', es_correcta: false }
          ]
        });
        reRenderAllPackQuestions();
        // Scroll hacia la última pregunta
        const container = document.getElementById('pack-questions-container');
        if (container) container.scrollTop = container.scrollHeight;
      });
    }

    // Cargar preguntas de ejemplo
    if (btnLoadSamplePack) {
      btnLoadSamplePack.addEventListener('click', () => {
        document.getElementById('pack-title').value = '⚡ Gran Desafío de Razones & Teorema de Pitágoras';
        document.getElementById('pack-theme').value = 'Trigonometría';
        document.getElementById('pack-time-select').value = '20';

        packQuestions = [
          {
            enunciado: 'En un triángulo rectángulo, si el cateto opuesto mide 3 y el cateto adyacente mide 4, ¿cuánto mide la hipotenusa?',
            concepto: 'Ángulos Notables',
            explicacion: 'Por el Teorema de Pitágoras: √(3² + 4²) = √(9 + 16) = √25 = 5.',
            opciones: [
              { texto: '5', es_correcta: true },
              { texto: '7', es_correcta: false },
              { texto: '√7', es_correcta: false },
              { texto: '6', es_correcta: false }
            ]
          },
          {
            enunciado: 'Con los mismos datos (Opuesto = 3, Adyacente = 4, Hipotenusa = 5), ¿cuál es el valor de sen(θ)?',
            concepto: 'Seno',
            explicacion: 'sen(θ) = Cateto Opuesto / Hipotenusa = 3/5.',
            opciones: [
              { texto: '3/5', es_correcta: true },
              { texto: '4/5', es_correcta: false },
              { texto: '3/4', es_correcta: false },
              { texto: '5/3', es_correcta: false }
            ]
          },
          {
            enunciado: '¿Y cuál es el valor de la Cosecante csc(θ)?',
            concepto: 'Recíprocas',
            explicacion: 'csc(θ) = 1 / sen(θ) = Hipotenusa / Opuesto = 5/3.',
            opciones: [
              { texto: '5/3', es_correcta: true },
              { texto: '5/4', es_correcta: false },
              { texto: '3/5', es_correcta: false },
              { texto: '4/3', es_correcta: false }
            ]
          }
        ];

        reRenderAllPackQuestions();
      });
    }

    // Guardar Pack Personalizado
    if (formCreatePack) {
      formCreatePack.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('pack-title').value.trim();
        const theme = document.getElementById('pack-theme').value;
        const timeLimit = document.getElementById('pack-time-select').value;

        if (!title) {
          alert('Por favor ingresa un título para el pack.');
          return;
        }

        // Construir array de preguntas desde el DOM
        const questionsPayload = [];
        const questionCards = document.querySelectorAll('#pack-questions-container .custom-stage-box');

        questionCards.forEach((card, i) => {
          const enunciadoInput = card.querySelector('.pack-q-enunciado');
          const conceptoSelect = card.querySelector('.pack-q-concepto');
          const explicacionInput = card.querySelector('.pack-q-explicacion');
          const optInputs = card.querySelectorAll('.pack-q-opt');
          const correctRadio = card.querySelector(`input[name="pack_q_${i}_correct"]:checked`);

          const correctIdx = correctRadio ? parseInt(correctRadio.value, 10) : 0;

          const opciones = [];
          optInputs.forEach((input, optI) => {
            opciones.push({
              texto: input.value.trim() || `Opción ${optI + 1}`,
              es_correcta: optI === correctIdx
            });
          });

          questionsPayload.push({
            enunciado: enunciadoInput ? enunciadoInput.value.trim() : `Pregunta ${i + 1}`,
            concepto: conceptoSelect ? conceptoSelect.value : 'Trigonometría',
            explicacion: explicacionInput ? explicacionInput.value.trim() : '',
            opciones: opciones
          });
        });

        const submitBtn = document.getElementById('btn-save-pack-submit');
        if (submitBtn) submitBtn.disabled = true;

        try {
          const formData = new FormData();
          formData.append('titulo', title);
          formData.append('tema', theme);
          formData.append('tiempo_defecto', timeLimit);
          formData.append('preguntas_json', JSON.stringify(questionsPayload));

          const res = await fetch('api_sala.php?action=crear_pack', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();

          if (data.success) {
            modalCreatePack.classList.remove('teacher-modal-backdrop--open');
            formCreatePack.reset();
            packQuestions = [];

            // Actualizar select y seleccionar el nuevo pack
            await window.cargarPacksDisponibles(data.pack.id);

            alert('🎉 ¡Pack de preguntas guardado con éxito! Ya puedes usarlo para iniciar una sala en vivo.');
          } else {
            alert(data.error || 'No se pudo guardar el pack.');
          }
        } catch (err) {
          console.error(err);
          alert('Error de conexión al guardar el pack.');
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }
  });

})();

