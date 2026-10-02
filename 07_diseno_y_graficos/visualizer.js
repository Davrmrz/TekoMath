/* ============================================
   TEKO MATH — Visualizador Interactivo de las 6 Funciones Trigonométricas
   sen(θ), cos(θ), tan(θ), csc(θ), sec(θ), cot(θ)
   Modo didáctico interactivo con proyección animada y cuadro indicador completo
   ============================================ */

const TrigVisualizer = (() => {
  // Estado reactivo del visualizador
  const state = {
    func: 'sen',              // 'sen' | 'cos' | 'tan' | 'csc' | 'sec' | 'cot'
    angleDeg: 45,             // Ángulo en grados [-360, 360]
    isPlaying: true,          // Animación activa por defecto para captar atención
    animSpeed: 0.6,           // Velocidad de rotación
    showUnitCircle: true,     // Mostrar círculo unitario
    showAsymptotes: true,     // Mostrar asíntotas
    showCriticalPoints: true, // Ceros y extremos
    showProjectionGuides: true,// Rayos láser de proyección entre círculo y curva
    showReciprocal: false,    // Comparación recíproca activa
    hoverAngle: null,         // Hover sonda cartesiana
    pulsePhase: 0             // Fase de animación de pulsación
  };

  let canvas = null;
  let ctx = null;
  let animFrameId = null;

  // Metadata completa, fórmulas y relaciones geométricas de las 6 funciones
  const FUNC_DATA = {
    sen: {
      id: 'sen',
      name: 'Seno',
      shortName: 'sen(θ)',
      formula: 'y = \\text{sen}(\\theta)',
      htmlFormula: 'y = <strong>sen(θ)</strong>',
      ratioName: 'Cateto Opuesto / Hipotenusa',
      ratioFormula: 'y / 1',
      color: '#16a34a',
      colorLight: '#dcfce7',
      colorDark: '#14532d',
      glowColor: 'rgba(22, 163, 74, 0.4)',
      reciprocalId: 'csc',
      reciprocalName: 'Cosecante (csc)',
      reciprocalFormula: '\\csc(\\theta) = \\frac{1}{\\text{sen}(\\theta)}',
      domain: 'ℝ (todos los números reales)',
      range: '[-1, 1]  ⟹  −1 ≤ y ≤ 1',
      period: '2π (360°)',
      parity: 'Impar: sen(−θ) = −sen(θ)',
      zeros: 'θ = kπ  (0°, ±180°, ±360°...)',
      asymptotes: 'No tiene asíntotas (curva continua y suave)',
      extrema: 'Máx = 1 en 90° + k·360°; Mín = −1 en 270° + k·360°',
      quadrantSigns: { I: '+', II: '+', III: '−', IV: '−' },
      calc: (rad) => Math.sin(rad),
      calcReciprocal: (rad) => {
        const s = Math.sin(rad);
        return Math.abs(s) < 1e-6 ? null : 1 / s;
      },
      concept: 'El <strong>Seno</strong> equivale a la <strong>altura vertical (y)</strong> del punto sobre la circunferencia unitaria. Observa cómo el rayo verde proyecta la altura directamente sobre la onda sinusoidal.'
    },

    cos: {
      id: 'cos',
      name: 'Coseno',
      shortName: 'cos(θ)',
      formula: 'y = \\cos(\\theta)',
      htmlFormula: 'y = <strong>cos(θ)</strong>',
      ratioName: 'Cateto Adyacente / Hipotenusa',
      ratioFormula: 'x / 1',
      color: '#9333ea',
      colorLight: '#f3e8ff',
      colorDark: '#581c87',
      glowColor: 'rgba(147, 51, 234, 0.4)',
      reciprocalId: 'sec',
      reciprocalName: 'Secante (sec)',
      reciprocalFormula: '\\sec(\\theta) = \\frac{1}{\\cos(\\theta)}',
      domain: 'ℝ (todos los números reales)',
      range: '[-1, 1]  ⟹  −1 ≤ y ≤ 1',
      period: '2π (360°)',
      parity: 'Par: cos(−θ) = cos(θ)',
      zeros: 'θ = π/2 + kπ  (±90°, ±270°...)',
      asymptotes: 'No tiene asíntotas (curva continua y suave)',
      extrema: 'Máx = 1 en 0°, 360°; Mín = −1 en 180°',
      quadrantSigns: { I: '+', II: '−', III: '−', IV: '+' },
      calc: (rad) => Math.cos(rad),
      calcReciprocal: (rad) => {
        const c = Math.cos(rad);
        return Math.abs(c) < 1e-6 ? null : 1 / c;
      },
      concept: 'El <strong>Coseno</strong> equivale a la <strong>base horizontal (x)</strong> del triángulo en el círculo unitario. Inicia en 1 cuando el ángulo es 0° y desciende a 0 en 90°.'
    },

    tan: {
      id: 'tan',
      name: 'Tangente',
      shortName: 'tan(θ)',
      formula: 'y = \\tan(\\theta) = \\frac{\\text{sen}(\\theta)}{\\cos(\\theta)}',
      htmlFormula: 'y = <strong>tan(θ) = sen(θ) / cos(θ)</strong>',
      ratioName: 'Cateto Opuesto / Cateto Adyacente',
      ratioFormula: 'y / x',
      color: '#0284c7',
      colorLight: '#e0f2fe',
      colorDark: '#075985',
      glowColor: 'rgba(2, 132, 199, 0.4)',
      reciprocalId: 'cot',
      reciprocalName: 'Cotangente (cot)',
      reciprocalFormula: '\\cot(\\theta) = \\frac{1}{\\tan(\\theta)}',
      domain: 'ℝ \\ {±90°, ±270°...} (Indefinida cuando cos = 0)',
      range: 'ℝ  ⟹  (−∞, +∞)',
      period: 'π (180°)',
      parity: 'Impar: tan(−θ) = −tan(θ)',
      zeros: 'θ = kπ  (0°, ±180°, ±360°...)',
      asymptotes: 'θ = ±90°, ±270°... (Líneas rojas discontinuas)',
      extrema: 'No tiene máximos ni mínimos globales (crece infinitamente)',
      quadrantSigns: { I: '+', II: '−', III: '+', IV: '−' },
      calc: (rad) => {
        const c = Math.cos(rad);
        if (Math.abs(c) < 1e-5) return null;
        return Math.tan(rad);
      },
      calcReciprocal: (rad) => {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        if (Math.abs(s) < 1e-5) return null;
        return c / s;
      },
      concept: 'La <strong>Tangente</strong> es la longitud del segmento tangente a la circunferencia en x = 1. A medida que el ángulo se acerca a 90°, el segmento se dispara verticalmente hacia +∞.'
    },

    csc: {
      id: 'csc',
      name: 'Cosecante',
      shortName: 'csc(θ)',
      formula: 'y = \\csc(\\theta) = \\frac{1}{\\text{sen}(\\theta)}',
      htmlFormula: 'y = <strong>csc(θ) = 1 / sen(θ)</strong>',
      ratioName: 'Hipotenusa / Cateto Opuesto',
      ratioFormula: '1 / y',
      color: '#e11d48',
      colorLight: '#ffe4e6',
      colorDark: '#9f1239',
      glowColor: 'rgba(225, 29, 72, 0.4)',
      reciprocalId: 'sen',
      reciprocalName: 'Seno (sen)',
      reciprocalFormula: '\\text{sen}(\\theta) = \\frac{1}{\\csc(\\theta)}',
      domain: 'ℝ \\ {0°, ±180°, ±360°...} (Indefinida cuando sen = 0)',
      range: '(−∞, −1] ∪ [1, +∞)  ⟹  |y| ≥ 1',
      period: '2π (360°)',
      parity: 'Impar: csc(−θ) = −csc(θ)',
      zeros: 'No tiene ceros (nunca toca el eje horizontal y = 0)',
      asymptotes: 'θ = 0°, ±180°, ±360° (donde sen(θ) = 0)',
      extrema: 'Mínimo local = 1 en 90°; Máximo local = −1 en 270°',
      quadrantSigns: { I: '+', II: '+', III: '−', IV: '−' },
      calc: (rad) => {
        const s = Math.sin(rad);
        if (Math.abs(s) < 1e-5) return null;
        return 1 / s;
      },
      calcReciprocal: (rad) => Math.sin(rad),
      concept: 'La <strong>Cosecante</strong> es el inverso multiplicativo del Seno: <em>csc = 1/sen</em>. Fíjate cómo sus curvas en forma de U tocan los picos del seno en y = 1 y y = −1.'
    },

    sec: {
      id: 'sec',
      name: 'Secante',
      shortName: 'sec(θ)',
      formula: 'y = \\sec(\\theta) = \\frac{1}{\\cos(\\theta)}',
      htmlFormula: 'y = <strong>sec(θ) = 1 / cos(θ)</strong>',
      ratioName: 'Hipotenusa / Cateto Adyacente',
      ratioFormula: '1 / x',
      color: '#d97706',
      colorLight: '#fef3c7',
      colorDark: '#92400e',
      glowColor: 'rgba(217, 119, 6, 0.4)',
      reciprocalId: 'cos',
      reciprocalName: 'Coseno (cos)',
      reciprocalFormula: '\\cos(\\theta) = \\frac{1}{\\sec(\\theta)}',
      domain: 'ℝ \\ {±90°, ±270°...} (Indefinida cuando cos = 0)',
      range: '(−∞, −1] ∪ [1, +∞)  ⟹  |y| ≥ 1',
      period: '2π (360°)',
      parity: 'Par: sec(−θ) = sec(θ)',
      zeros: 'No tiene ceros (nunca toca el eje horizontal y = 0)',
      asymptotes: 'θ = ±90°, ±270° (donde cos(θ) = 0)',
      extrema: 'Mínimo local = 1 en 0°, 360°; Máximo local = −1 en 180°',
      quadrantSigns: { I: '+', II: '−', III: '−', IV: '+' },
      calc: (rad) => {
        const c = Math.cos(rad);
        if (Math.abs(c) < 1e-5) return null;
        return 1 / c;
      },
      calcReciprocal: (rad) => Math.cos(rad),
      concept: 'La <strong>Secante</strong> es el inverso multiplicativo del Coseno: <em>sec = 1/cos</em>. Posee asíntotas en ±90° porque la división entre cero produce valores infinitos.'
    },

    cot: {
      id: 'cot',
      name: 'Cotangente',
      shortName: 'cot(θ)',
      formula: 'y = \\cot(\\theta) = \\frac{\\cos(\\theta)}{\\text{sen}(\\theta)}',
      htmlFormula: 'y = <strong>cot(θ) = cos(θ) / sen(θ)</strong>',
      ratioName: 'Cateto Adyacente / Cateto Opuesto',
      ratioFormula: 'x / y',
      color: '#0d9488',
      colorLight: '#ccfbf1',
      colorDark: '#134e4a',
      glowColor: 'rgba(13, 148, 136, 0.4)',
      reciprocalId: 'tan',
      reciprocalName: 'Tangente (tan)',
      reciprocalFormula: '\\tan(\\theta) = \\frac{1}{\\cot(\\theta)}',
      domain: 'ℝ \\ {0°, ±180°, ±360°...} (Indefinida cuando sen = 0)',
      range: 'ℝ  ⟹  (−∞, +∞)',
      period: 'π (180°)',
      parity: 'Impar: cot(−θ) = −cot(θ)',
      zeros: 'θ = ±90°, ±270° (donde cos(θ) = 0)',
      asymptotes: 'θ = 0°, ±180°, ±360° (donde sen(θ) = 0)',
      extrema: 'No tiene máximos ni mínimos globales',
      quadrantSigns: { I: '+', II: '−', III: '+', IV: '−' },
      calc: (rad) => {
        const s = Math.sin(rad);
        if (Math.abs(s) < 1e-5) return null;
        return Math.cos(rad) / s;
      },
      calcReciprocal: (rad) => {
        const c = Math.cos(rad);
        if (Math.abs(c) < 1e-5) return null;
        return Math.tan(rad);
      },
      concept: 'La <strong>Cotangente</strong> es el inverso de la tangente: <em>cot = 1/tan = cos/sen</em>. Es decreciente en cada período y cruza el eje cero en ±90°.'
    }
  };

  // Helper de conversión a múltiplos elegantes de π
  function formatPiFraction(deg) {
    let normalized = deg % 360;
    if (normalized < 0) normalized += 360;
    const sign = deg < 0 ? '−' : '';

    const map = {
      0: '0 rad',
      30: 'π/6 rad',
      45: 'π/4 rad',
      60: 'π/3 rad',
      90: 'π/2 rad',
      120: '2π/3 rad',
      135: '3π/4 rad',
      150: '5π/6 rad',
      180: 'π rad',
      210: '7π/6 rad',
      225: '5π/4 rad',
      240: '4π/3 rad',
      270: '3π/2 rad',
      300: '5π/3 rad',
      315: '7π/4 rad',
      330: '11π/6 rad',
      360: '2π rad'
    };

    const absDeg = Math.round(Math.abs(deg));
    if (map[absDeg]) {
      return `${sign}${map[absDeg]}`;
    }

    const rad = (deg * Math.PI) / 180;
    return `${rad >= 0 ? '' : '−'}${Math.abs(rad).toFixed(2)} rad`;
  }

  // Diccionario de valores exactos con radicales
  function getExactValue(funcId, deg) {
    let normalized = Math.round(deg) % 360;
    if (normalized < 0) normalized += 360;

    const SQ2 = '√2 / 2';
    const SQ3 = '√3 / 2';
    const SQ3_3 = '√3 / 3';
    const SQ3_VAL = '√3';
    const TWO_SQ3 = '2√3 / 3';
    const SQ2_VAL = '√2';
    const INDEF = 'Indefinido (±∞)';

    const TABLE = {
      sen: {
        0: '0', 30: '1/2', 45: SQ2, 60: SQ3, 90: '1',
        120: SQ3, 135: SQ2, 150: '1/2', 180: '0',
        210: '−1/2', 225: '−' + SQ2, 240: '−' + SQ3, 270: '−1',
        300: '−' + SQ3, 315: '−' + SQ2, 330: '−1/2', 360: '0'
      },
      cos: {
        0: '1', 30: SQ3, 45: SQ2, 60: '1/2', 90: '0',
        120: '−1/2', 135: '−' + SQ2, 150: '−' + SQ3, 180: '−1',
        210: '−' + SQ3, 225: '−' + SQ2, 240: '−1/2', 270: '0',
        300: '1/2', 315: SQ2, 330: SQ3, 360: '1'
      },
      tan: {
        0: '0', 30: SQ3_3, 45: '1', 60: SQ3_VAL, 90: INDEF,
        120: '−' + SQ3_VAL, 135: '−1', 150: '−' + SQ3_3, 180: '0',
        210: SQ3_3, 225: '1', 240: SQ3_VAL, 270: INDEF,
        300: '−' + SQ3_VAL, 315: '−1', 330: '−' + SQ3_3, 360: '0'
      },
      csc: {
        0: INDEF, 30: '2', 45: SQ2_VAL, 60: TWO_SQ3, 90: '1',
        120: TWO_SQ3, 135: SQ2_VAL, 150: '2', 180: INDEF,
        210: '−2', 225: '−' + SQ2_VAL, 240: '−' + TWO_SQ3, 270: '−1',
        300: '−' + TWO_SQ3, 315: '−' + SQ2_VAL, 330: '−2', 360: INDEF
      },
      sec: {
        0: '1', 30: TWO_SQ3, 45: SQ2_VAL, 60: '2', 90: INDEF,
        120: '−2', 135: '−' + SQ2_VAL, 150: '−' + TWO_SQ3, 180: '−1',
        210: '−' + TWO_SQ3, 225: '−' + SQ2_VAL, 240: '−2', 270: INDEF,
        300: '2', 315: SQ2_VAL, 330: TWO_SQ3, 360: '1'
      },
      cot: {
        0: INDEF, 30: SQ3_VAL, 45: '1', 60: SQ3_3, 90: '0',
        120: '−' + SQ3_3, 135: '−1', 150: '−' + SQ3_VAL, 180: INDEF,
        210: SQ3_VAL, 225: '1', 240: SQ3_3, 270: '0',
        300: '−' + SQ3_3, 315: '−1', 330: '−' + SQ3_VAL, 360: INDEF
      }
    };

    if (TABLE[funcId] && TABLE[funcId][normalized] !== undefined) {
      return TABLE[funcId][normalized];
    }

    const rad = (deg * Math.PI) / 180;
    const val = FUNC_DATA[funcId].calc(rad);
    if (val === null || !isFinite(val)) return INDEF;
    return val.toFixed(4);
  }

  // Información del cuadrante y signo
  function getQuadrantInfo(deg) {
    let normalized = deg % 360;
    if (normalized < 0) normalized += 360;

    if (normalized === 0 || normalized === 360) return { name: 'Eje X (+)', q: 0, desc: 'θ = 0° (Frontera)' };
    if (normalized === 90) return { name: 'Eje Y (+)', q: 0, desc: 'θ = 90° (Frontera)' };
    if (normalized === 180) return { name: 'Eje X (−)', q: 0, desc: 'θ = 180° (Frontera)' };
    if (normalized === 270) return { name: 'Eje Y (−)', q: 0, desc: 'θ = 270° (Frontera)' };

    if (normalized > 0 && normalized < 90) return { name: 'Cuadrante I (0° a 90°)', q: 'I', desc: 'x > 0, y > 0' };
    if (normalized > 90 && normalized < 180) return { name: 'Cuadrante II (90° a 180°)', q: 'II', desc: 'x < 0, y > 0' };
    if (normalized > 180 && normalized < 270) return { name: 'Cuadrante III (180° a 270°)', q: 'III', desc: 'x < 0, y < 0' };
    return { name: 'Cuadrante IV (270° a 360°)', q: 'IV', desc: 'x > 0, y < 0' };
  }

  /* ============================================
     MOTOR DE RENDERIZADO EN CANVAS
     ============================================ */
  function render() {
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width;
    const height = canvas.height;

    state.pulsePhase = (state.pulsePhase + 0.05) % (Math.PI * 2);

    ctx.clearRect(0, 0, width, height);

    // Fondo limpio con malla muy suave
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const fData = FUNC_DATA[state.func];
    const angleRad = (state.angleDeg * Math.PI) / 180;
    const currentVal = fData.calc(angleRad);
    const recipVal = state.showReciprocal ? fData.calcReciprocal(angleRad) : null;

    // Área dividida: Izquierda = Círculo Unitario | Derecha = Plano Cartesiano
    const showCircle = state.showUnitCircle && width >= 540;
    const circleWidth = showCircle ? Math.min(width * 0.36, 270 * dpr) : 0;
    const graphX0 = circleWidth;
    const graphWidth = width - circleWidth;

    // 1. Círculo unitario y triángulo trigonométrico
    if (showCircle) {
      drawUnitCircle(0, 0, circleWidth, height, dpr, angleRad, fData);

      // Divisor elegante
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2 * dpr;
      ctx.setLineDash([5 * dpr, 4 * dpr]);
      ctx.beginPath();
      ctx.moveTo(circleWidth, 0);
      ctx.lineTo(circleWidth, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Plano cartesiano y ondas trigonométricas
    drawCartesianGraph(graphX0, 0, graphWidth, height, dpr, angleRad, currentVal, recipVal, fData);

    // 3. Rayo láser / Proyección visual entre círculo y curva
    if (showCircle && state.showProjectionGuides && currentVal !== null && isFinite(currentVal)) {
      drawLaserProjection(circleWidth, height, dpr, angleRad, currentVal, fData, graphX0, graphWidth);
    }
  }

  // Dibuja el círculo unitario interactivo
  function drawUnitCircle(x0, y0, w, h, dpr, angleRad, fData) {
    const cx = x0 + w / 2;
    const cy = y0 + h / 2;
    const r = Math.min(w * 0.38, h * 0.36);

    // Título superior
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${11 * dpr}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('CÍRCULO UNITARIO (R = 1)', cx, y0 + 22 * dpr);

    // Ejes X e Y del círculo
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5 * dpr;

    ctx.beginPath();
    ctx.moveTo(cx - r - 22 * dpr, cy);
    ctx.lineTo(cx + r + 22 * dpr, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 22 * dpr);
    ctx.lineTo(cx, cy + r + 22 * dpr);
    ctx.stroke();

    // Circunferencia unitaria R = 1
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Sector sombreado de ángulo
    ctx.fillStyle = fData.colorLight || 'rgba(124, 58, 237, 0.18)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, 0, -angleRad, angleRad < 0);
    ctx.closePath();
    ctx.fill();

    // Arco de ángulo θ
    ctx.strokeStyle = fData.color;
    ctx.lineWidth = 2.8 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(30 * dpr, r * 0.32), 0, -angleRad, angleRad < 0);
    ctx.stroke();

    // Coordenadas trigonométricas P(cos θ, sen θ)
    const cosVal = Math.cos(angleRad);
    const senVal = Math.sin(angleRad);
    const px = cx + cosVal * r;
    const py = cy - senVal * r;

    // Cateto Adyacente (Coseno - Base)
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, cy);
    ctx.stroke();

    // Cateto Opuesto (Seno - Altura)
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath();
    ctx.moveTo(px, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Radio vector / Hipotenusa = 1
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Punto móvil P con halo animado
    const halo = (Math.sin(state.pulsePhase) * 2 + 7) * dpr;
    ctx.fillStyle = fData.glowColor || 'rgba(22, 163, 74, 0.35)';
    ctx.beginPath();
    ctx.arc(px, py, halo, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fData.color;
    ctx.beginPath();
    ctx.arc(px, py, 5.5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Rótulos de catetos
    ctx.font = `bold ${9.5 * dpr}px monospace`;
    // Opuesto
    ctx.fillStyle = '#15803d';
    ctx.textAlign = cosVal >= 0 ? 'left' : 'right';
    ctx.fillText(`y = ${senVal.toFixed(2)}`, px + (cosVal >= 0 ? 6 * dpr : -6 * dpr), (cy + py) / 2);

    // Adyacente
    ctx.fillStyle = '#7e22ce';
    ctx.textAlign = 'center';
    ctx.fillText(`x = ${cosVal.toFixed(2)}`, (cx + px) / 2, cy + (senVal >= 0 ? 14 * dpr : -8 * dpr));

    // Indicador interactivo inferior
    ctx.fillStyle = '#64748b';
    ctx.font = `bold ${8.5 * dpr}px 'Space Grotesk', sans-serif`;
    ctx.fillText('⚡ Arrastra en el círculo para girar θ', cx, cy + r + 26 * dpr);
  }

  // Dibuja el plano cartesiano y las curvas
  function drawCartesianGraph(x0, y0, w, h, dpr, angleRad, currentVal, recipVal, fData) {
    const ox = x0 + w / 2;
    const oy = y0 + h / 2;

    const xMin = -Math.PI * 2.2;
    const xMax = Math.PI * 2.2;
    const xScale = (w - 40 * dpr) / (xMax - xMin);

    const yMax = 3.6;
    const yScale = (h - 60 * dpr) / (2 * yMax);

    function toScreenX(rad) { return ox + rad * xScale; }
    function toScreenY(val) { return oy - val * yScale; }

    // Rejilla de fondo
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1.2 * dpr;

    [-2, -1, 1, 2].forEach(yv => {
      const sy = toScreenY(yv);
      ctx.beginPath();
      ctx.moveTo(x0, sy);
      ctx.lineTo(x0 + w, sy);
      ctx.stroke();
    });

    // Eje Horizontal (θ en radianes)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(x0 + 10 * dpr, oy);
    ctx.lineTo(x0 + w - 10 * dpr, oy);
    ctx.stroke();

    // Eje Vertical (y)
    ctx.beginPath();
    ctx.moveTo(ox, y0 + 12 * dpr);
    ctx.lineTo(ox, y0 + h - 12 * dpr);
    ctx.stroke();

    // Rótulos de escala Y
    ctx.fillStyle = '#64748b';
    ctx.font = `bold ${10 * dpr}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('+1', ox - 6 * dpr, toScreenY(1) + 4 * dpr);
    ctx.fillText('−1', ox - 6 * dpr, toScreenY(-1) + 4 * dpr);

    // Ticks y rótulos en múltiplos de π/2
    const ticks = [
      { rad: -Math.PI * 2, label: '−2π' },
      { rad: -Math.PI * 1.5, label: '−3π/2' },
      { rad: -Math.PI, label: '−π' },
      { rad: -Math.PI * 0.5, label: '−π/2' },
      { rad: 0, label: '0' },
      { rad: Math.PI * 0.5, label: 'π/2' },
      { rad: Math.PI, label: 'π' },
      { rad: Math.PI * 1.5, label: '3π/2' },
      { rad: Math.PI * 2, label: '2π' }
    ];

    ctx.textAlign = 'center';
    ticks.forEach(t => {
      const sx = toScreenX(t.rad);
      if (sx < x0 + 15 * dpr || sx > x0 + w - 15 * dpr) return;

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.moveTo(sx, oy - 4 * dpr);
      ctx.lineTo(sx, oy + 4 * dpr);
      ctx.stroke();

      ctx.fillStyle = t.rad === 0 ? '#1e293b' : '#64748b';
      ctx.font = `${10 * dpr}px 'Space Grotesk', sans-serif`;
      ctx.fillText(t.label, sx, oy + 16 * dpr);
    });

    // Asíntotas verticales
    if (state.showAsymptotes) {
      let asymps = [];
      if (state.func === 'tan' || state.func === 'sec') {
        asymps = [-1.5 * Math.PI, -0.5 * Math.PI, 0.5 * Math.PI, 1.5 * Math.PI];
      } else if (state.func === 'csc' || state.func === 'cot') {
        asymps = [-2 * Math.PI, -Math.PI, 0, Math.PI, 2 * Math.PI];
      }

      asymps.forEach(rad => {
        const sx = toScreenX(rad);
        if (sx < x0 || sx > x0 + w) return;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.8 * dpr;
        ctx.setLineDash([6 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.moveTo(sx, y0 + 16 * dpr);
        ctx.lineTo(sx, y0 + h - 16 * dpr);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#dc2626';
        ctx.font = `bold ${8.5 * dpr}px monospace`;
        ctx.fillText('Asíntota ∞', sx, y0 + 24 * dpr);
      });
    }

    // Curva Recíproca (Si está activada)
    if (state.showReciprocal) {
      const rData = FUNC_DATA[fData.reciprocalId];
      drawCurve(x0, w, dpr, toScreenX, toScreenY, yMax, rData.calc, rData.color, true);
    }

    // Curva Principal
    drawCurve(x0, w, dpr, toScreenX, toScreenY, yMax, fData.calc, fData.color, false);

    // Ceros (Raíces sobre el eje X)
    if (state.showCriticalPoints) {
      let zeros = [];
      if (state.func === 'sen' || state.func === 'tan') zeros = [-2 * Math.PI, -Math.PI, 0, Math.PI, 2 * Math.PI];
      if (state.func === 'cos' || state.func === 'cot') zeros = [-1.5 * Math.PI, -0.5 * Math.PI, 0.5 * Math.PI, 1.5 * Math.PI];

      zeros.forEach(z => {
        const sx = toScreenX(z);
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(sx, oy, 4.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      });
    }

    // Punto activo en la curva con halo pulsante
    if (currentVal !== null && isFinite(currentVal) && Math.abs(currentVal) <= yMax * 1.5) {
      const activeX = toScreenX(angleRad);
      const activeY = toScreenY(currentVal);

      // Línea de referencia al eje X
      ctx.strokeStyle = fData.color;
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([3 * dpr, 3 * dpr]);
      ctx.beginPath();
      ctx.moveTo(activeX, oy);
      ctx.lineTo(activeX, activeY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Halo brillante
      const halo = (Math.sin(state.pulsePhase) * 3 + 10) * dpr;
      ctx.fillStyle = fData.glowColor || 'rgba(22, 163, 74, 0.35)';
      ctx.beginPath();
      ctx.arc(activeX, activeY, halo, 0, Math.PI * 2);
      ctx.fill();

      // Punto sólido
      ctx.fillStyle = fData.color;
      ctx.beginPath();
      ctx.arc(activeX, activeY, 5.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Tooltip informativo flotante
      const exactStr = getExactValue(state.func, state.angleDeg);
      const tooltipText = `θ = ${state.angleDeg.toFixed(0)}°  |  y = ${exactStr}`;

      ctx.font = `bold ${10 * dpr}px monospace`;
      const tw = ctx.measureText(tooltipText).width + 16 * dpr;
      const tx = Math.max(x0 + tw / 2 + 6 * dpr, Math.min(x0 + w - tw / 2 - 6 * dpr, activeX));
      const ty = activeY > oy ? activeY + 24 * dpr : activeY - 14 * dpr;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(tx - tw / 2, ty - 12 * dpr, tw, 22 * dpr, 5 * dpr);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(tooltipText, tx, ty + 3 * dpr);
    }

    // Leyenda de curvas en la esquina superior
    ctx.textAlign = 'left';
    ctx.font = `bold ${11 * dpr}px 'Space Grotesk', sans-serif`;

    ctx.fillStyle = fData.color;
    ctx.fillRect(x0 + 16 * dpr, y0 + 16 * dpr, 14 * dpr, 5 * dpr);
    ctx.fillText(`${fData.name}: ${fData.shortName}`, x0 + 36 * dpr, y0 + 22 * dpr);

    if (state.showReciprocal) {
      const rData = FUNC_DATA[fData.reciprocalId];
      ctx.fillStyle = rData.color;
      ctx.fillRect(x0 + 160 * dpr, y0 + 16 * dpr, 14 * dpr, 5 * dpr);
      ctx.fillText(`Recíproca: ${rData.shortName}`, x0 + 180 * dpr, y0 + 22 * dpr);
    }
  }

  // Trazado de curva matemática con prevención de discontinuidades
  function drawCurve(x0, w, dpr, toScreenX, toScreenY, yMax, calcFn, color, isDashed) {
    ctx.strokeStyle = color;
    ctx.lineWidth = (isDashed ? 2.2 : 3) * dpr;
    if (isDashed) {
      ctx.setLineDash([6 * dpr, 4 * dpr]);
    } else {
      ctx.setLineDash([]);
    }

    const steps = Math.floor(w * 1.6);
    const startRad = -Math.PI * 2.2;
    const endRad = Math.PI * 2.2;
    const stepRad = (endRad - startRad) / steps;

    let inPath = false;
    let prevY = null;

    ctx.beginPath();

    for (let i = 0; i <= steps; i++) {
      const rad = startRad + i * stepRad;
      const val = calcFn(rad);

      if (val === null || !isFinite(val) || Math.abs(val) > yMax * 2) {
        inPath = false;
        prevY = null;
        continue;
      }

      const sx = toScreenX(rad);
      const sy = toScreenY(val);

      if (prevY !== null && Math.abs(sy - prevY) > 180 * dpr) {
        inPath = false;
      }

      if (!inPath) {
        ctx.moveTo(sx, sy);
        inPath = true;
      } else {
        ctx.lineTo(sx, sy);
      }

      prevY = sy;
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Rayo láser de proyección entre el círculo y la curva
  function drawLaserProjection(circleWidth, h, dpr, angleRad, currentVal, fData, graphX0, graphWidth) {
    const cx = circleWidth / 2;
    const cy = h / 2;
    const r = Math.min(circleWidth * 0.38, h * 0.36);

    const px = cx + Math.cos(angleRad) * r;
    const py = cy - Math.sin(angleRad) * r;

    // Para Seno: Rayo horizontal de altura
    if (state.func === 'sen') {
      const ox = graphX0 + graphWidth / 2;
      const xMin = -Math.PI * 2.2;
      const xMax = Math.PI * 2.2;
      const xScale = (graphWidth - 40 * dpr) / (xMax - xMin);
      const activeX = ox + angleRad * xScale;

      ctx.strokeStyle = 'rgba(22, 163, 74, 0.6)';
      ctx.lineWidth = 1.8 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(activeX, py);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* ============================================
     ACTUALIZACIÓN COMPLETA DEL CUADRO INDICADOR
     ============================================ */
  function updateUI() {
    const fData = FUNC_DATA[state.func];
    const angleDeg = state.angleDeg;
    const angleRad = (angleDeg * Math.PI) / 180;
    const exactVal = getExactValue(state.func, angleDeg);
    const numVal = fData.calc(angleRad);
    const quadInfo = getQuadrantInfo(angleDeg);

    // 1. Selector de Pestañas
    document.querySelectorAll('.vis-trig-tab').forEach(tab => {
      const isActive = tab.dataset.func === state.func;
      tab.classList.toggle('vis-trig-tab--active', isActive);
      tab.style.borderColor = isActive ? fData.color : '';
      tab.style.background = isActive ? fData.color : '';
    });

    // 2. Fórmula en vivo con colores representativos
    const formulaEl = document.getElementById('trig-live-formula');
    if (formulaEl) {
      formulaEl.innerHTML = fData.htmlFormula;
      formulaEl.style.color = fData.colorDark || fData.color;
      formulaEl.style.background = fData.colorLight || '#f1f5f9';
      formulaEl.style.borderColor = fData.color;
    }

    // 3. Ángulo en Grados y Radianes
    const degReadout = document.getElementById('trig-deg-val');
    if (degReadout) degReadout.textContent = `${angleDeg.toFixed(1)}°`;

    const radReadout = document.getElementById('trig-rad-val');
    if (radReadout) radReadout.textContent = formatPiFraction(angleDeg);

    const angleSlider = document.getElementById('trig-angle-slider');
    if (angleSlider && Math.abs(parseFloat(angleSlider.value) - angleDeg) > 0.1) {
      angleSlider.value = angleDeg;
      angleSlider.style.accentColor = fData.color;
    }

    // 4. Valor Exacto y Decimal
    const exactEl = document.getElementById('trig-exact-val');
    if (exactEl) {
      exactEl.textContent = exactVal;
      exactEl.style.color = fData.colorDark || fData.color;
    }

    const decimalEl = document.getElementById('trig-decimal-val');
    if (decimalEl) {
      if (numVal === null || !isFinite(numVal)) {
        decimalEl.textContent = 'Indefinido (±∞)';
        decimalEl.style.color = '#dc2626';
      } else {
        decimalEl.textContent = `≈ ${numVal.toFixed(4)}`;
        decimalEl.style.color = '#1e293b';
      }
    }

    // 5. Desglose de Razón Geométrica
    const ratioFormulaEl = document.getElementById('trig-ratio-formula');
    if (ratioFormulaEl) {
      const s = Math.sin(angleRad).toFixed(3);
      const c = Math.cos(angleRad).toFixed(3);
      let breakText = '';

      if (state.func === 'sen') breakText = `sen(θ) = y/1 = <strong>${s} / 1 = ${s}</strong>`;
      else if (state.func === 'cos') breakText = `cos(θ) = x/1 = <strong>${c} / 1 = ${c}</strong>`;
      else if (state.func === 'tan') breakText = `tan(θ) = y/x = <strong>${s} / ${c}</strong>`;
      else if (state.func === 'csc') breakText = `csc(θ) = 1/y = <strong>1 / ${s}</strong>`;
      else if (state.func === 'sec') breakText = `sec(θ) = 1/x = <strong>1 / ${c}</strong>`;
      else if (state.func === 'cot') breakText = `cot(θ) = x/y = <strong>${c} / ${s}</strong>`;

      ratioFormulaEl.innerHTML = breakText;
    }

    // 6. Cuadrante y Signo
    const quadBadge = document.getElementById('trig-quadrant-badge');
    if (quadBadge) quadBadge.textContent = quadInfo.name;

    const signBadge = document.getElementById('trig-sign-badge');
    if (signBadge) {
      const sign = typeof quadInfo.q === 'string' ? fData.quadrantSigns[quadInfo.q] : '=';
      signBadge.textContent = sign === '+' ? 'Positivo (+)' : (sign === '−' ? 'Negativo (−)' : 'Sobre Eje (0 / ±1)');
      signBadge.className = `pill ${sign === '+' ? 'pill--green' : (sign === '−' ? 'pill--purple' : 'pill--neutral')}`;
    }

    // Mini tabla de signos de los 4 cuadrantes
    ['I', 'II', 'III', 'IV'].forEach(q => {
      const qEl = document.getElementById(`trig-q-sign-${q}`);
      if (qEl) {
        qEl.textContent = fData.quadrantSigns[q];
        const isCurrent = quadInfo.q === q;
        qEl.style.fontWeight = isCurrent ? 'bold' : 'normal';
        qEl.style.background = isCurrent ? fData.colorLight : 'transparent';
        qEl.style.color = isCurrent ? fData.colorDark : '#64748b';
      }
    });

    // 7. Brújula / Dial de Ángulo
    const dialNeedle = document.getElementById('trig-dial-needle');
    if (dialNeedle) {
      dialNeedle.style.transform = `rotate(${-angleDeg}deg)`;
      dialNeedle.style.borderColor = fData.color;
    }

    // 8. Ficha de Propiedades Matemáticas
    const domEl = document.getElementById('prop-domain');
    if (domEl) domEl.textContent = fData.domain;

    const ranEl = document.getElementById('prop-range');
    if (ranEl) ranEl.textContent = fData.range;

    const perEl = document.getElementById('prop-period');
    if (perEl) perEl.textContent = fData.period;

    const parEl = document.getElementById('prop-parity');
    if (parEl) parEl.textContent = fData.parity;

    const zerEl = document.getElementById('prop-zeros');
    if (zerEl) zerEl.textContent = fData.zeros;

    const asyEl = document.getElementById('prop-asymptotes');
    if (asyEl) asyEl.textContent = fData.asymptotes;

    // 9. Concepto y Explicación
    const conceptEl = document.getElementById('trig-concept-text');
    if (conceptEl) conceptEl.innerHTML = fData.concept;

    // 10. Comparación Recíproca en tiempo real
    const recipBox = document.getElementById('trig-reciprocal-box');
    const recipExplain = document.getElementById('trig-reciprocal-explain');
    if (recipBox && recipExplain) {
      const rData = FUNC_DATA[fData.reciprocalId];
      const rVal = getExactValue(fData.reciprocalId, angleDeg);

      recipExplain.innerHTML = `
        <strong>Relación con su función recíproca ${rData.name} (${rData.shortName}):</strong>
        <br><code>${fData.shortName} = ${exactVal}</code>  ⟺  <code>${rData.shortName} = ${rVal}</code>
        <br><span style="font-size:0.75rem;color:var(--purple-800);">Propiedad: ${fData.shortName} · ${rData.shortName} = 1</span>
      `;
    }

    // 11. Botón Play / Pause
    const playBtn = document.getElementById('trig-play-btn');
    if (playBtn) {
      playBtn.innerHTML = state.isPlaying ? '⏸️ Pausar animación' : '▶️ Animar rotación';
      playBtn.className = state.isPlaying ? 'canvas-tool-btn canvas-tool-btn--active' : 'canvas-tool-btn';
    }
  }

  /* ============================================
     LOOP DE ANIMACIÓN CONTINUO
     ============================================ */
  function animationLoop() {
    if (state.isPlaying) {
      state.angleDeg += state.animSpeed;
      if (state.angleDeg > 360) state.angleDeg -= 720;
      updateUI();
    }
    render();
    animFrameId = requestAnimationFrame(animationLoop);
  }

  /* ============================================
     EVENTOS E INTERACTIVIDAD
     ============================================ */
  function handleCanvasPointer(e) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (!clientX || !clientY) return;

    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr;

    const showCircle = state.showUnitCircle && canvas.width >= 540;
    const circleWidth = showCircle ? Math.min(canvas.width * 0.36, 270 * dpr) : 0;

    // Arrastre en el Círculo Unitario
    if (x <= circleWidth && showCircle) {
      const cx = circleWidth / 2;
      const cy = canvas.height / 2;
      const dx = x - cx;
      const dy = cy - y;
      let rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI;
      state.angleDeg = Math.round(deg);
      state.isPlaying = false;
      updateUI();
      render();
    }
    // Arrastre en la Gráfica Cartesiana
    else {
      const graphWidth = canvas.width - circleWidth;
      const ox = circleWidth + graphWidth / 2;
      const xMin = -Math.PI * 2.2;
      const xMax = Math.PI * 2.2;
      const xScale = (graphWidth - 40 * dpr) / (xMax - xMin);

      const rad = (x - ox) / xScale;
      let deg = (rad * 180) / Math.PI;
      deg = Math.max(-360, Math.min(360, deg));
      state.angleDeg = Math.round(deg);
      state.isPlaying = false;
      updateUI();
      render();
    }
  }

  function setupEvents() {
    // 1. Selector de Pestañas (6 funciones)
    document.querySelectorAll('.vis-trig-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const funcId = btn.dataset.func;
        if (FUNC_DATA[funcId]) {
          state.func = funcId;
          updateUI();
          render();
        }
      });
    });

    // 2. Slider de Ángulo
    const angleSlider = document.getElementById('trig-angle-slider');
    if (angleSlider) {
      angleSlider.addEventListener('input', (e) => {
        state.angleDeg = parseFloat(e.target.value);
        state.isPlaying = false;
        updateUI();
        render();
      });
    }

    // 3. Botones de Ángulos Notables
    document.querySelectorAll('.trig-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.angleDeg = parseFloat(btn.dataset.angle);
        state.isPlaying = false;
        updateUI();
        render();
      });
    });

    // 4. Paso a paso (−15°, +15°)
    const stepMinus = document.getElementById('trig-step-minus');
    if (stepMinus) {
      stepMinus.addEventListener('click', () => {
        state.angleDeg = Math.round((state.angleDeg - 15) / 15) * 15;
        if (state.angleDeg < -360) state.angleDeg += 720;
        state.isPlaying = false;
        updateUI();
        render();
      });
    }

    const stepPlus = document.getElementById('trig-step-plus');
    if (stepPlus) {
      stepPlus.addEventListener('click', () => {
        state.angleDeg = Math.round((state.angleDeg + 15) / 15) * 15;
        if (state.angleDeg > 360) state.angleDeg -= 720;
        state.isPlaying = false;
        updateUI();
        render();
      });
    }

    // 5. Botón Play/Pause Animación
    const playBtn = document.getElementById('trig-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        updateUI();
      });
    }

    // 6. Botón Reset Ángulo
    const resetBtn = document.getElementById('trig-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.angleDeg = 0;
        state.isPlaying = false;
        updateUI();
        render();
      });
    }

    // 7. Checkboxes de Capas Visibles
    const chkCircle = document.getElementById('chk-unit-circle');
    if (chkCircle) {
      chkCircle.addEventListener('change', (e) => {
        state.showUnitCircle = e.target.checked;
        render();
      });
    }

    const chkAsymp = document.getElementById('chk-asymptotes');
    if (chkAsymp) {
      chkAsymp.addEventListener('change', (e) => {
        state.showAsymptotes = e.target.checked;
        render();
      });
    }

    const chkCritical = document.getElementById('chk-critical');
    if (chkCritical) {
      chkCritical.addEventListener('change', (e) => {
        state.showCriticalPoints = e.target.checked;
        render();
      });
    }

    const chkRecip = document.getElementById('chk-reciprocal');
    if (chkRecip) {
      chkRecip.addEventListener('change', (e) => {
        state.showReciprocal = e.target.checked;
        const rBox = document.getElementById('trig-reciprocal-box');
        if (rBox) rBox.style.display = e.target.checked ? 'block' : 'none';
        render();
      });
    }

    // 8. Arrastre en Canvas (Mouse & Touch)
    let isDragging = false;

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleCanvasPointer(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) handleCanvasPointer(e);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('touchstart', (e) => {
      isDragging = true;
      handleCanvasPointer(e);
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (isDragging) handleCanvasPointer(e);
    });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    // 9. Resize responsivo
    window.addEventListener('resize', () => {
      resizeCanvas();
      render();
    });
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }

  /* ============================================
     INICIALIZACIÓN PÚBLICA
     ============================================ */
  function init(canvasId = 'vis-canvas') {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resizeCanvas();
    setupEvents();
    updateUI();
    render();

    if (!animFrameId) {
      animationLoop();
    }
  }

  return {
    init,
    setFunction: (f) => {
      if (FUNC_DATA[f]) {
        state.func = f;
        updateUI();
        render();
      }
    },
    setAngle: (deg) => {
      state.angleDeg = deg;
      updateUI();
      render();
    },
    togglePlay: () => {
      state.isPlaying = !state.isPlaying;
      updateUI();
    },
    reset: () => {
      state.angleDeg = 0;
      state.isPlaying = false;
      updateUI();
      render();
    }
  };
})();

// Auto-arranque
document.addEventListener('DOMContentLoaded', () => {
  TrigVisualizer.init('vis-canvas');
});
