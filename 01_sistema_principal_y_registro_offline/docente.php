<?php
/* ============================================
   TEKO MATH — Dashboard del Docente (docente.php)
   Gestión pedagógica, asignación de tareas y visualizador de clase
   ============================================ */
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/misiones_data.php';

// Proteger página — solo accesible para docentes
requireDocente();

$user = getUser();
$nombre = htmlspecialchars($user['nombre']);
$inicialNombre = mb_strtoupper(mb_substr($user['nombre'], 0, 1));
$rol = $user['rol'];

$db = getDB();
asegurarMisionesDemo($db, $user['id']);

// Obtener tareas y misiones
$tareasStmt = $db->query("
    SELECT t.*, u.nombre AS docente_nombre
    FROM tareas t
    LEFT JOIN usuarios u ON t.docente_id = u.id
    ORDER BY t.created_at DESC
");
$tareas = $tareasStmt->fetchAll();

// Obtener estudiantes registrados con su progreso acumulado
$estudiantes = [];
try {
    $estudiantesStmt = $db->query("
        SELECT 
            u.id, u.nombre, u.email, u.created_at,
            COUNT(DISTINCT p.id) AS total_quizzes,
            COUNT(DISTINCT pm.id) AS total_misiones,
            COALESCE(ROUND(AVG(pm.dominio_pct)), 0) AS promedio_misiones,
            COALESCE(ROUND(AVG(p.porcentaje)), 0) AS promedio_score,
            MAX(pm.created_at) AS ultima_mision
        FROM usuarios u
        LEFT JOIN progreso_quizzes p ON u.id = p.estudiante_id
        LEFT JOIN progreso_misiones pm ON u.id = pm.estudiante_id
        WHERE u.rol = 'estudiante'
        GROUP BY u.id, u.nombre, u.email, u.created_at
        ORDER BY u.nombre ASC
    ");
    $estudiantes = $estudiantesStmt->fetchAll();
} catch (Exception $e) {
    $estudiantes = [];
}

// Obtener reportes detallados de misiones completadas por estudiantes
$progresosMisionesDocente = [];
try {
    $progresosMisionesDocenteStmt = $db->query("
        SELECT pm.*, t.titulo AS mision_titulo, t.tema AS mision_tema,
               u.nombre AS estudiante_nombre, u.email AS estudiante_email
        FROM progreso_misiones pm
        JOIN tareas t ON pm.tarea_id = t.id
        JOIN usuarios u ON pm.estudiante_id = u.id
        ORDER BY pm.created_at DESC
        LIMIT 50
    ");
    $progresosMisionesDocente = $progresosMisionesDocenteStmt->fetchAll();
} catch (Exception $e) {
    $progresosMisionesDocente = [];
}

// Obtener los últimos quizzes completados por cualquier estudiante
$ultimosQuizzesStmt = $db->query("
    SELECT p.*, u.nombre AS estudiante_nombre, u.email AS estudiante_email
    FROM progreso_quizzes p
    JOIN usuarios u ON p.estudiante_id = u.id
    ORDER BY p.created_at DESC
    LIMIT 20
");
$ultimosQuizzes = $ultimosQuizzesStmt->fetchAll();

$catalogoMisiones = getMisionesCatalogo();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="TEKO Math — Panel Docente. Gestiona misiones de aprendizaje y visualizadores interactivos para tus alumnos.">
  <title>TEKO Math — Panel Docente</title>
  <link rel="stylesheet" href="../07_diseno_y_graficos/style.css?v=<?= time() ?>">
  <link rel="stylesheet" href="../07_diseno_y_graficos/dashboard.css?v=<?= time() ?>">
  <link rel="stylesheet" href="../07_diseno_y_graficos/visualizer.css?v=<?= time() ?>">
  <link rel="stylesheet" href="../07_diseno_y_graficos/docente.css?v=<?= time() ?>">
  <link rel="stylesheet" href="../04_diagnostico_y_rutas_de_aprendizaje/misiones.css?v=<?= time() ?>">
  <link rel="stylesheet" href="../06_teko_live/teko_live.css?v=<?= time() ?>">
  <link rel="icon" type="image/png" href="../02_tekobot/TekoBot/Hackaton/assets/images/tejuxi-face.png?v=20260926">
</head>
<body>

  <!-- ====== GRAPH PAPER BACKGROUND ====== -->
  <div class="graph-bg" aria-hidden="true"></div>

  <!-- ====== MATH DECORATIONS ====== -->
  <div class="math-decorations" aria-hidden="true">
    <span class="math-deco math-deco--1" style="color:#7c3aed;">∫</span>
    <span class="math-deco math-deco--4" style="color:#7c3aed;">∞</span>
    <span class="math-deco math-deco--6" style="color:#1e8e3e;">θ</span>
    <svg class="math-wave" viewBox="0 0 600 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 40 C50 10, 100 10, 150 40 S250 70, 300 40 S400 10, 450 40 S550 70, 600 40" 
            stroke="#5b21b6" stroke-width="2.5" fill="none"/>
    </svg>
  </div>

  <!-- ====== TOP NAVIGATION ====== -->
  <nav class="topnav" id="topnav">
    <div class="topnav__inner">
      <!-- Left: Logo con distintivo Docente -->
      <a href="docente.php" class="topnav__brand">
        <img class="topnav__mascot" src="../07_diseno_y_graficos/assets/images/logo-docente.jpg" alt="Mascota de TEKO Math para el docente" width="52" height="52">
        <span class="topnav__logo-text">TEKO <span style="color:var(--purple-600);">Docente</span></span>
        <span class="pill pill--purple" style="font-size:0.68rem;padding:2px 8px;margin-left:4px;vertical-align:middle;">🧪 Experimental</span>
      </a>

      <!-- Center: Nav Links -->
      <div class="topnav__links" id="nav-links">
        <a href="docente.php" class="topnav__link topnav__link--active" data-section="inicio">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          Inicio
        </a>

        <a href="#estudiantes" class="topnav__link" data-section="estudiantes">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          Estudiantes & Diagnósticos
        </a>

      </div>

      <!-- Right: User Menu -->
      <div class="topnav__user">

        <div class="topnav__user-menu-wrapper">
          <button class="topnav__avatar" id="user-menu-btn" aria-label="Menú de usuario" title="<?= $nombre ?>" style="background:var(--purple-600);">
            <span class="topnav__avatar-letter"><?= $inicialNombre ?></span>
          </button>
          <!-- Dropdown -->
          <div class="topnav__user-dropdown" id="user-dropdown">
            <div class="topnav__user-dropdown-header">
              <strong>Prof. <?= $nombre ?></strong>
              <span class="pill pill--purple" style="font-size:0.65rem;padding:2px 8px;">👨‍🏫 Docente · 🧪 Experimental</span>
            </div>
            <a href="../02_tekobot/chat.php" class="topnav__user-dropdown-link">
              🤖 Teko Bot
            </a>
            <a href="logout.php" class="topnav__user-dropdown-link topnav__user-dropdown-link--logout">
              🚪 Cerrar sesión
            </a>
          </div>
        </div>
        <!-- Mobile hamburger -->
        <button class="topnav__hamburger" id="hamburger-btn" aria-label="Abrir menú">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <div class="topnav__mobile-menu" id="mobile-menu">
      <div class="topnav__mobile-user">
        <strong>Prof. <?= $nombre ?></strong>
        <span class="pill pill--purple" style="font-size:0.65rem;padding:2px 8px;">👨‍🏫 Docente · 🧪 Experimental</span>
      </div>
      <div class="topnav__mobile-divider"></div>
      <a href="docente.php" class="topnav__mobile-link topnav__mobile-link--active">🏠 Inicio Docente</a>
      <a href="../02_tekobot/chat.php" class="topnav__mobile-link">🤖 Teko Bot</a>
      <a href="#tareas" class="topnav__mobile-link">🚀 Misiones de Aprendizaje</a>
      <a href="#simulador-section" class="topnav__mobile-link">📐 Visualizador de Clase</a>
      <a href="#estudiantes" class="topnav__mobile-link">👥 Estudiantes & Diagnósticos</a>
      <div class="topnav__mobile-divider"></div>
      <a href="logout.php" class="topnav__mobile-link topnav__mobile-link--logout">🚪 Cerrar sesión</a>
    </div>
  </nav>

  <!-- ====== MAIN TEACHER CONTAINER ====== -->
  <main class="dashboard" id="dashboard">

    <!-- ====== EXPERIMENTAL NOTICE BANNER ====== -->
    <div class="anim-fade-up" style="background:#faf5ff;border:2.5px dashed #9333ea;border-radius:var(--radius-xl);padding:12px 18px;margin-bottom:var(--space-lg);display:flex;align-items:center;gap:14px;box-shadow:4px 4px 0 #9333ea;">
      <div style="font-size:1.6rem;background:#f3e8ff;border:2px solid #9333ea;border-radius:10px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        🧪
      </div>
      <div>
        <div style="font-family:var(--font-display);font-size:0.95rem;font-weight:900;color:#581c87;margin-bottom:2px;">
          Panel Docente — Módulo en Fase Experimental & Pedagógica
        </div>
        <p style="font-size:0.84rem;color:#6b21a8;margin:0;line-height:1.4;">
          Las herramientas de asignación de misiones, diagnósticos conceptuales, visualizador de clase y salas Teko Live están en fase experimental activa para validación en aula.
        </p>
      </div>
    </div>

    <!-- ====== TEACHER HERO BANNER ====== -->
    <section class="teacher-welcome anim-fade-up">
      <span class="teacher-welcome__badge">🧪 Módulo de Gestión Pedagógica (Fase Experimental)</span>
      <h1 class="teacher-welcome__title">¡Hola, Prof. <span class="teacher-welcome__name"><?= $nombre ?></span>!</h1>
      <p class="teacher-welcome__subtitle">
        Diseña misiones de aprendizaje interactivas y progresivas, monitorea los niveles de dominio y consulta los diagnósticos conceptuales de tus alumnos.
      </p>
      <div class="teacher-welcome__actions">
        <button class="btn btn--primary btn--purple-solid btn--md" data-open-modal="task">
          <span>🚀 Asignar Nueva Misión</span>
        </button>
        <a href="#simulador-section" class="btn btn--secondary btn--md">
          <span>📐 Visualizador en Modo Clase</span>
        </a>
      </div>
    </section>

    <!-- ====== SECCIÓN DE CLASE EN VIVO: TEKO LIVE (TIPO KAHOOT) ====== -->
    <section class="teko-live-hero-card anim-fade-up" id="seccion-teko-live">
      <span class="teko-live-hero-card__badge">⚡ MODO CLASE EN VIVO — TIPO KAHOOT</span>
      <h2 class="teko-live-hero-card__title">
        🎮 Teko Live Arena: Quiz Multijugador en Tiempo Real
      </h2>
      <p class="teko-live-hero-card__desc">
        Proyecta la pantalla en el aula o videollamada. Genera un <strong>código PIN</strong> para que tus alumnos compitan desde sus teléfonos o computadoras con velocidad, rachas de fuego 🔥 y podio de campeones 🏆.
      </p>

      <div style="display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;background:#ffffff;border:2px solid #1a1a1a;border-radius:var(--radius-lg);padding:14px 18px;box-shadow:3px 3px 0 #1a1a1a;">
        <div style="flex:1;min-width:260px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <label class="form-label" for="live-pack-select" style="margin-bottom:0;font-weight:800;color:var(--purple-900);">Selecciona el Paquete de Preguntas:</label>
            <button type="button" class="btn btn--secondary btn--sm" id="btn-open-create-pack-modal" style="font-size:0.75rem;padding:3px 8px;background:#fdf4ff;border-color:#c084fc;color:#7e22ce;">
              ➕ Crear Mi Pack de Preguntas
            </button>
          </div>
          <select id="live-pack-select" class="form-input purple-focus" style="cursor:pointer;font-weight:700;font-size:0.9rem;">
            <option value="pack_cuadrantes" selected>🧭 Torneo de Cuadrantes & Signos Trigonométricos (5 Preguntas)</option>
            <option value="pack_reciprocas">🔄 Duelo de Razones Recíprocas & Identidades (4 Preguntas)</option>
            <option value="pack_notables">📐 Desafío Relámpago: Ángulos Notables 30°, 45°, 60° (4 Preguntas)</option>
          </select>
        </div>

        <button type="button" class="btn btn--primary btn--purple-solid btn--md" id="btn-open-create-live" style="white-space:nowrap;font-size:0.95rem;padding:10px 22px;">
          ⚡ ¡Crear Sala en Vivo & PIN!
        </button>
      </div>
    </section>

    <!-- ====== GESTIÓN DE MISIONES DE APRENDIZAJE ====== -->
    <section class="section anim-fade-up" id="tareas" aria-label="Misiones asignadas">
      <div class="teacher-section-header">
        <div class="teacher-section-header__title-group">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
            <span class="pill pill--green" style="font-size:0.72rem;font-weight:800;">🚀 EXPERIENCIAS PEDAGÓGICAS</span>
            <span class="pill pill--purple" style="font-size:0.72rem;">5 Etapas Interactivas</span>
          </div>
          <h2 class="section__title">🚀 Misiones de Aprendizaje Asignadas (<?= count($tareas) ?>)</h2>
          <p class="section__subtitle" style="font-size:0.88rem;color:var(--gray-600);margin:0;">
            Experiencias estructuradas en 5 etapas: Explorá, Descubrí, Resolvé, Desafío y Desafío Final.
          </p>
        </div>
        <button class="btn btn--primary btn--purple-solid btn--sm" data-open-modal="task">
          ➕ Asignar Nueva Misión
        </button>
      </div>

      <!-- Estado Vacío (se oculta si ya existen misiones) -->
      <div class="empty-state <?= !empty($tareas) ? 'is-hidden' : '' ?>" id="tasks-empty-state" style="<?= !empty($tareas) ? 'display:none !important;' : '' ?>">
        <div class="empty-state__icon">🚀</div>
        <h3 class="empty-state__title">No hay misiones asignadas todavía</h3>
        <p class="empty-state__desc">Crea experiencias interactivas y progresivas para que tus alumnos aprendan paso a paso.</p>
        <button class="btn btn--primary btn--purple-solid btn--sm" data-open-modal="task" style="margin-top:8px;">
          ➕ Asignar Primera Misión
        </button>
      </div>

      <!-- Listado Dinámico de Misiones -->
      <div class="teacher-grid" id="teacher-tasks-list">
        <?php foreach ($tareas as $t): ?>
          <article class="mission-card anim-fade-up" id="task-card-<?= (int)$t['id'] ?>">
            <div>
              <div class="mission-card__header">
                <span class="pill pill--purple" style="font-size:0.75rem;font-weight:800;">📚 <?= htmlspecialchars($t['tema']) ?></span>
                <span class="pill pill--green" style="font-size:0.7rem;">💯 <?= (int)$t['puntos'] ?> pts</span>
              </div>
              <h3 class="mission-card__title"><?= htmlspecialchars($t['titulo']) ?></h3>
              <p class="mission-card__story"><?= htmlspecialchars($t['historia'] ?: ($t['instrucciones'] ?: 'Experiencia interactiva guiada en 5 etapas.')) ?></p>
              
              <div class="mission-card__stages-preview">
                <span class="mission-card__stage-dot">1. Explorá 👁️</span>
                <span class="mission-card__stage-dot">2. Descubrí 💡</span>
                <span class="mission-card__stage-dot">3. Resolvé 📐</span>
                <span class="mission-card__stage-dot">4. Desafío ⚡</span>
                <span class="mission-card__stage-dot">5. Final 🏆</span>
              </div>

              <div style="font-size:0.78rem;color:var(--gray-500);margin-bottom:8px;">
                <span>⏳ Vence: <strong><?= htmlspecialchars($t['fecha_entrega']) ?></strong></span>
              </div>
            </div>
            <div class="mission-card__footer">
              <span style="font-size:0.76rem;color:var(--gray-500);font-weight:600;">👨‍🏫 Prof. <?= htmlspecialchars($t['docente_nombre'] ?? $nombre) ?></span>
              <button class="btn btn--secondary btn--sm btn-delete-task" data-id="<?= (int)$t['id'] ?>" style="color:#dc2626;border-color:#fca5a5;padding:4px 10px;">
                Eliminar 🗑️
              </button>
            </div>
          </article>
        <?php endforeach; ?>
      </div>
    </section>

    <!-- ====== VISUALIZADOR DE FUNCIONES TRIGONOMÉTRICAS (MODO CLASE) ====== -->
    <section class="visualizer-container anim-fade-up" id="simulador-section" aria-label="Visualizador didáctico trigonométrico">
      
      <!-- Visualizer Header -->
      <div class="visualizer-header">
        <div class="visualizer-header__info">
          <div class="visualizer-header__icon" style="background:var(--purple-600);">📐</div>
          <div>
            <h2 class="visualizer-header__title">Visualizador Trigonométrico · Modo Clase</h2>
            <p class="visualizer-header__subtitle">
              Proyecta y explica el comportamiento de las 6 funciones trigonométricas con círculo unitario y valores exactos.
            </p>
          </div>
        </div>
        <span class="pill pill--purple" style="font-size:0.75rem;">Herramienta de Proyección</span>
      </div>

      <!-- Selector de las 6 Funciones Trigonométricas -->
      <div class="visualizer-topic-tabs">
        <button class="vis-trig-tab vis-trig-tab--active" data-func="sen">📈 Seno · sen(θ)</button>
        <button class="vis-trig-tab" data-func="cos">📉 Coseno · cos(θ)</button>
        <button class="vis-trig-tab" data-func="tan">⚡ Tangente · tan(θ)</button>
        <button class="vis-trig-tab" data-func="csc">🔄 Cosecante · csc(θ)</button>
        <button class="vis-trig-tab" data-func="sec">📐 Secante · sec(θ)</button>
        <button class="vis-trig-tab" data-func="cot">📏 Cotangente · cot(θ)</button>
      </div>

      <!-- Workbench Layout (Canvas Dual + Panel de Controles) -->
      <div class="visualizer-workbench">
        
        <!-- Left: Canvas Dual (Círculo Unitario + Gráfica Cartesiana) -->
        <div class="visualizer-canvas-wrapper">
          <canvas id="vis-canvas" class="visualizer-canvas"></canvas>

          <!-- Floating Canvas Tools -->
          <div class="canvas-floating-tools">
            <button class="canvas-tool-btn" id="trig-play-btn">
              ▶️ Animar rotación
            </button>
            <button class="canvas-tool-btn" id="trig-reset-btn">
              🔄 Ángulo a 0°
            </button>
            <span class="pill pill--neutral" style="font-size:0.7rem;background:rgba(255,255,255,0.92);border:1px solid var(--gray-300);">
              🔍 Rango: [−2π, +2π]
            </span>
          </div>
        </div>

        <!-- Right: Inspector de Parámetros y Propiedades Matemáticas -->
        <div class="visualizer-controls-panel">
          
          <!-- 1. Tarjeta de Ángulo Interactivo y Fórmula -->
          <div class="trig-card">
            <div class="trig-card__header">
              <span class="trig-card__title">Función & Ángulo θ</span>
              <span class="pill pill--purple" style="font-size:0.68rem;padding:2px 6px;">Interactivo</span>
            </div>
            
            <div class="trig-formula-box" id="trig-live-formula">
              y = <strong>sen(θ)</strong>
            </div>

            <!-- Readouts de Ángulo -->
            <div class="trig-angle-readouts">
              <div class="trig-readout-item">
                <span>Grados (°)</span>
                <strong id="trig-deg-val">45.0°</strong>
              </div>
              <div class="trig-readout-item">
                <span>Radianes (rad)</span>
                <strong id="trig-rad-val">π/4 rad</strong>
              </div>
            </div>

            <!-- Slider de Ángulo con Botones de Paso -->
            <div class="trig-slider-container">
              <button class="trig-step-btn" id="trig-step-minus" title="Restar 15°">−15°</button>
              <div class="trig-slider-wrapper" style="flex:1;margin-bottom:0;">
                <input type="range" class="trig-slider" id="trig-angle-slider" min="-360" max="360" step="0.5" value="45">
              </div>
              <button class="trig-step-btn" id="trig-step-plus" title="Sumar 15°">+15°</button>
            </div>

            <!-- Presets de Ángulos Notables -->
            <div class="trig-presets-grid" style="margin-top:10px;">
              <button class="trig-preset-btn" data-angle="0">0°</button>
              <button class="trig-preset-btn" data-angle="30">30° (π/6)</button>
              <button class="trig-preset-btn" data-angle="45">45° (π/4)</button>
              <button class="trig-preset-btn" data-angle="60">60° (π/3)</button>
              <button class="trig-preset-btn" data-angle="90">90° (π/2)</button>
              <button class="trig-preset-btn" data-angle="180">180° (π)</button>
              <button class="trig-preset-btn" data-angle="270">270° (3π/2)</button>
              <button class="trig-preset-btn" data-angle="360">360° (2π)</button>
            </div>
          </div>

          <!-- 2. Valores Importantes, Razón Geométrica y Signo -->
          <div class="trig-card">
            <div class="trig-card__header">
              <span class="trig-card__title">Valor Matemático & Razón</span>
              <span id="trig-sign-badge" class="pill pill--green" style="font-size:0.68rem;padding:2px 6px;">Positivo (+)</span>
            </div>

            <div class="trig-values-grid">
              <div class="trig-val-box">
                <span>Valor Exacto</span>
                <strong id="trig-exact-val">√2 / 2</strong>
              </div>
              <div class="trig-val-box" style="background:var(--purple-50);border-color:var(--purple-200);">
                <span style="color:var(--purple-800);">Aprox. Decimal</span>
                <strong id="trig-decimal-val" style="color:var(--purple-900);">≈ 0.7071</strong>
              </div>
            </div>

            <!-- Desglose de Razón Geométrica -->
            <div class="trig-ratio-badge" id="trig-ratio-formula">
              sen(θ) = y/1 = <strong>0.707 / 1 = 0.707</strong>
            </div>

            <div class="trig-quadrant-row" style="margin-top:8px;">
              <span style="font-size:0.78rem;font-weight:700;color:var(--gray-600);" id="trig-quadrant-badge">Cuadrante I (0° – 90°)</span>
            </div>

            <!-- Mini tabla de signos por cuadrante -->
            <div class="trig-quadrant-table">
              <div class="trig-q-col">
                <small>Q-I</small>
                <span id="trig-q-sign-I">+</span>
              </div>
              <div class="trig-q-col">
                <small>Q-II</small>
                <span id="trig-q-sign-II">+</span>
              </div>
              <div class="trig-q-col">
                <small>Q-III</small>
                <span id="trig-q-sign-III">−</span>
              </div>
              <div class="trig-q-col">
                <small>Q-IV</small>
                <span id="trig-q-sign-IV">−</span>
              </div>
            </div>
          </div>

          <!-- 3. Comparación con Función Recíproca -->
          <div class="trig-card">
            <div class="trig-card__header">
              <span class="trig-card__title">Comparación Recíproca</span>
            </div>
            
            <label class="trig-toggle-item" style="margin-bottom:8px;">
              <input type="checkbox" id="chk-reciprocal">
              <span>Comparar con función recíproca en la gráfica</span>
            </label>

            <div class="trig-reciprocal-card" id="trig-reciprocal-box" style="display:none;">
              <p id="trig-reciprocal-explain" style="margin:0;">
                Relación recíproca con <strong>Cosecante (csc)</strong>:
                <br><code>sen(θ) × csc(θ) = 1</code>
              </p>
            </div>
          </div>

          <!-- 4. Dominio, Rango, Período y Discontinuidades -->
          <div class="trig-card">
            <div class="trig-card__header">
              <span class="trig-card__title">Propiedades Matemáticas</span>
            </div>

            <div class="trig-props-list">
              <div class="trig-prop-row">
                <span class="trig-prop-label">Dominio:</span>
                <span class="trig-prop-val" id="prop-domain">ℝ (todos los reales)</span>
              </div>
              <div class="trig-prop-row">
                <span class="trig-prop-label">Rango:</span>
                <span class="trig-prop-val" id="prop-range">[-1, 1]</span>
              </div>
              <div class="trig-prop-row">
                <span class="trig-prop-label">Período (T):</span>
                <span class="trig-prop-val" id="prop-period">2π (360°)</span>
              </div>
              <div class="trig-prop-row">
                <span class="trig-prop-label">Paridad:</span>
                <span class="trig-prop-val" id="prop-parity">Impar: sen(−θ) = −sen(θ)</span>
              </div>
              <div class="trig-prop-row">
                <span class="trig-prop-label">Ceros:</span>
                <span class="trig-prop-val" id="prop-zeros">θ = kπ</span>
              </div>
              <div class="trig-prop-row">
                <span class="trig-prop-label">Asíntotas:</span>
                <span class="trig-prop-val" id="prop-asymptotes">No tiene</span>
              </div>
            </div>
          </div>

          <!-- 5. Capas Visibles -->
          <div class="trig-card">
            <div class="trig-card__header">
              <span class="trig-card__title">Opciones Visibles</span>
            </div>

            <div class="trig-toggles-list">
              <label class="trig-toggle-item">
                <input type="checkbox" id="chk-unit-circle" checked>
                <span>Mostrar Círculo Unitario (R = 1)</span>
              </label>
              <label class="trig-toggle-item">
                <input type="checkbox" id="chk-asymptotes" checked>
                <span>Mostrar Asíntotas y Discontinuidades</span>
              </label>
              <label class="trig-toggle-item">
                <input type="checkbox" id="chk-critical" checked>
                <span>Mostrar Ceros y Puntos de Corte</span>
              </label>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ====== MIS ESTUDIANTES & PROGRESO ACADÉMICO ====== -->
    <section class="section anim-fade-up" id="estudiantes" aria-label="Mis estudiantes y progreso">
      <div class="teacher-section-header">
        <div class="teacher-section-header__title-group">
          <h2 class="section__title">👥 Mis Estudiantes & Rendimiento (<?= count($estudiantes) ?>)</h2>
          <p class="section__subtitle" style="font-size:0.88rem;color:var(--gray-600);margin:0;">
            Seguimiento de alumnos registrados y sus estadísticas de quizzes y prácticas realizadas.
          </p>
        </div>
      </div>

      <?php if (empty($estudiantes)): ?>
        <div class="empty-state">
          <div class="empty-state__icon">👥</div>
          <h3 class="empty-state__title">No hay estudiantes registrados todavía</h3>
          <p class="empty-state__desc">Cuando tus estudiantes se registren con su cuenta en TEKO Math, aparecerán automáticamente en esta lista.</p>
        </div>
      <?php else: ?>
        <div class="student-grid" id="students-list">
          <?php foreach ($estudiantes as $est): ?>
            <?php 
              $initEst = mb_strtoupper(mb_substr($est['nombre'], 0, 1)); 
              $fechaReg = !empty($est['created_at']) ? date('d/m/Y', strtotime($est['created_at'])) : date('d/m/Y');
              $numQuizzes = (int)$est['total_quizzes'];
              $promedio = (int)$est['promedio_score'];
            ?>
            <div class="student-card anim-fade-up">
              <div class="student-avatar"><?= $initEst ?></div>
              <div class="student-info">
                <h4 class="student-name"><?= htmlspecialchars($est['nombre']) ?></h4>
                <p class="student-email"><?= htmlspecialchars($est['email']) ?></p>
                <div class="student-meta">
                  <span class="pill pill--green" style="font-size:0.65rem;padding:2px 8px;">Activo</span>
                  <span>📅 Reg: <?= $fechaReg ?></span>
                </div>
                <div class="student-stats-row">
                  <span class="pill pill--purple" style="font-size:0.7rem;padding:2px 8px;" title="Total de misiones completadas">
                    🚀 <?= (int)($s['total_misiones'] ?? 0) ?> misiones
                  </span>
                  <span class="pill <?= ($s['promedio_misiones'] ?? 0) >= 70 ? 'pill--green' : (($s['promedio_misiones'] ?? 0) > 0 ? 'pill--yellow' : 'pill--neutral') ?>" style="font-size:0.7rem;padding:2px 8px;" title="Promedio de dominio en misiones">
                    📈 <?= (int)($s['promedio_misiones'] ?? 0) ?>% dominio
                  </span>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <!-- ====== MONITOREO PEDAGÓGICO DE MISIONES DE APRENDIZAJE ====== -->
      <div class="teacher-section-header" style="margin-top:36px;">
        <div class="teacher-section-header__title-group">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
            <span class="pill pill--green" style="font-size:0.72rem;font-weight:800;">📊 ANALÍTICA DETALLADA</span>
            <span class="pill pill--purple" style="font-size:0.72rem;">Diagnóstico Conceptual</span>
          </div>
          <h3 class="section__title" style="font-size:1.35rem;">🚀 Misiones de Aprendizaje Completadas por Estudiantes</h3>
          <p class="section__subtitle" style="font-size:0.86rem;color:var(--gray-600);margin:0;">
            Monitorea el porcentaje de dominio, conceptos dominados/en práctica, pistas usadas y autocorrecciones en tiempo real.
          </p>
        </div>
      </div>

      <?php if (empty($progresosMisionesDocente)): ?>
        <div class="empty-state">
          <div class="empty-state__icon">🚀</div>
          <h3 class="empty-state__title">Aún no hay entregas de misiones registradas</h3>
          <p class="empty-state__desc">Cuando los estudiantes completen las 5 etapas de una misión, aquí se mostrará su nivel de dominio, autocorrecciones y diagnóstico por concepto.</p>
        </div>
      <?php else: ?>
        <div class="activity-table-wrap anim-fade-up">
          <table class="activity-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Misión Asignada</th>
                <th>Nivel de Dominio</th>
                <th>Diagnóstico por Conceptos</th>
                <th>Métricas Clave</th>
                <th>Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($progresosMisionesDocente as $pm): ?>
                <?php
                  $dom = (int)$pm['dominio_pct'];
                  $domColor = $dom >= 80 ? '#166534' : ($dom >= 60 ? '#854d0e' : '#991b1b');
                  $domBg = $dom >= 80 ? '#dcfce7' : ($dom >= 60 ? '#fef9c3' : '#fee2e2');

                  $conceptosMap = json_decode($pm['conceptos_feedback'] ?? '{}', true) ?: [];
                  $mins = floor($pm['tiempo_segundos'] / 60);
                  $secs = $pm['tiempo_segundos'] % 60;
                  $tiempoFmt = $mins > 0 ? "{$mins}m {$secs}s" : "{$secs}s";
                ?>
                <tr>
                  <td>
                    <strong><?= htmlspecialchars($pm['estudiante_nombre']) ?></strong>
                    <div style="font-size:0.75rem;color:var(--gray-500);"><?= htmlspecialchars($pm['estudiante_email']) ?></div>
                  </td>
                  <td>
                    <span class="pill pill--purple" style="font-size:0.75rem;display:inline-block;margin-bottom:2px;">
                      📚 <?= htmlspecialchars($pm['mision_tema']) ?>
                    </span>
                    <div style="font-weight:700;font-size:0.85rem;color:var(--ink);">
                      <?= htmlspecialchars($pm['mision_titulo']) ?>
                    </div>
                  </td>
                  <td>
                    <span style="background:<?= $domBg ?>;color:<?= $domColor ?>;padding:4px 10px;border-radius:12px;font-weight:900;font-size:0.92rem;border:1.5px solid <?= $domColor ?>;display:inline-block;">
                      <?= $dom ?>% Dominio
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                      <?php if (!empty($conceptosMap)): ?>
                        <?php foreach ($conceptosMap as $conc => $est): ?>
                          <?php $isDom = $est === 'Dominado'; ?>
                          <span style="font-size:0.74rem;font-weight:700;color:<?= $isDom ? '#166534' : '#854d0e' ?>;">
                            <?= $isDom ? '🟢' : '🟡' ?> <?= htmlspecialchars($conc) ?>: <em><?= htmlspecialchars($est) ?></em>
                          </span>
                        <?php endforeach; ?>
                      <?php else: ?>
                        <span style="font-size:0.74rem;color:var(--gray-500);">Evaluación general</span>
                      <?php endif; ?>
                    </div>
                  </td>
                  <td>
                    <div style="font-size:0.76rem;color:var(--gray-700);line-height:1.4;">
                      <div>🎯 <strong><?= $pm['desafios_superados'] ?>/<?= $pm['total_desafios'] ?></strong> desafíos</div>
                      <div>🔄 <strong><?= $pm['autocorrecciones'] ?></strong> autocorrecciones</div>
                      <div>💡 <strong><?= $pm['pistas_usadas'] ?></strong> pistas</div>
                      <div>⏱️ <strong><?= $tiempoFmt ?></strong></div>
                    </div>
                  </td>
                  <td style="color:var(--gray-500);font-size:0.8rem;">
                    <?= date('d/m/Y H:i', strtotime($pm['created_at'])) ?>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>

      <!-- Historial de Actividad de Quizzes Recientes -->
      <div class="teacher-section-header" style="margin-top:36px;">
        <div class="teacher-section-header__title-group">
          <h3 class="section__title" style="font-size:1.25rem;">📊 Quizzes Rápidos y Prácticas Libres</h3>
          <p class="section__subtitle" style="font-size:0.86rem;color:var(--gray-600);margin:0;">
            Resultados de las evaluaciones rápidas realizadas de manera autónoma por los alumnos.
          </p>
        </div>
      </div>

      <?php if (empty($ultimosQuizzes)): ?>
        <div class="empty-state">
          <div class="empty-state__icon">📊</div>
          <h3 class="empty-state__title">Aún no hay prácticas de repaso registradas</h3>
          <p class="empty-state__desc">Cuando los estudiantes completen quizzes de práctica rápida, sus resultados se mostrarán aquí.</p>
        </div>
      <?php else: ?>
        <div class="activity-table-wrap anim-fade-up">
          <table class="activity-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Tema Practicado</th>
                <th>Dificultad</th>
                <th>Puntaje</th>
                <th>Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($ultimosQuizzes as $q): ?>
                <?php
                  $diffBadge = '🟢 Fácil';
                  if ($q['dificultad'] === 'medio') $diffBadge = '🟡 Medio';
                  else if ($q['dificultad'] === 'dificil') $diffBadge = '🔴 Desafío';
                  $scoreColor = $q['porcentaje'] >= 80 ? '#166534' : ($q['porcentaje'] >= 50 ? '#854d0e' : '#991b1b');
                  $scoreBg = $q['porcentaje'] >= 80 ? '#dcfce7' : ($q['porcentaje'] >= 50 ? '#fef9c3' : '#fee2e2');
                ?>
                <tr>
                  <td>
                    <strong><?= htmlspecialchars($q['estudiante_nombre']) ?></strong>
                    <div style="font-size:0.75rem;color:var(--gray-500);"><?= htmlspecialchars($q['estudiante_email']) ?></div>
                  </td>
                  <td>
                    <span class="pill pill--purple" style="font-size:0.75rem;">📚 <?= htmlspecialchars($q['tema']) ?></span>
                  </td>
                  <td>
                    <span style="font-size:0.8rem;font-weight:700;"><?= $diffBadge ?></span>
                  </td>
                  <td>
                    <span style="background:<?= $scoreBg ?>;color:<?= $scoreColor ?>;padding:3px 8px;border-radius:12px;font-weight:800;font-size:0.8rem;border:1px solid <?= $scoreColor ?>;">
                      <?= $q['aciertos'] ?> / <?= $q['total_preguntas'] ?> (<?= $q['porcentaje'] ?>%)
                    </span>
                  </td>
                  <td style="color:var(--gray-500);font-size:0.8rem;">
                    <?= date('d/m/Y H:i', strtotime($q['created_at'])) ?>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>

    </section>

  </main>

  <!-- ====== MODAL: ASIGNAR / CREAR MISIÓN Y EJERCICIOS ====== -->
  <div class="teacher-modal-backdrop" id="modal-task" role="dialog" aria-modal="true">
    <div class="teacher-modal" style="max-width:760px;">
      <button class="teacher-modal__close" aria-label="Cerrar modal">&times;</button>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span class="pill pill--green" style="font-size:0.72rem;font-weight:800;">🚀 EXPERIENCIA EDUCATIVA</span>
        <span class="pill pill--purple" style="font-size:0.72rem;font-weight:700;">5 Etapas Interactivas</span>
      </div>
      <h3 class="teacher-modal__title">✍️ Creador de Misiones y Ejercicios</h3>
      <p class="teacher-modal__subtitle">Diseña tus propios ejercicios didácticos, desafíos pedagógicos y preguntas interactivas paso a paso para tus estudiantes.</p>

      <form id="form-create-task">
        
        <!-- CREADOR DE MISIÓN Y EJERCICIOS PERSONALIZADOS -->
        <div class="modal-tab-content" id="tab-content-custom">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:0.85rem;font-weight:700;color:var(--purple-700);">Configura los ejercicios y desafíos de la misión:</span>
            <button type="button" class="btn btn--secondary btn--sm" id="btn-load-sample-exercises" style="background:#fef3c7;border-color:#b45309;color:#92400e;font-size:0.75rem;padding:3px 8px;">
              🎲 Cargar Ejercicios de Ejemplo
            </button>
          </div>

          <!-- Acordeón de Etapas -->
          <div class="custom-stages-accordion">
            
            <!-- Etapa 2: Ejercicio Conceptual Descubrí -->
            <div class="custom-stage-box">
              <div class="custom-stage-box__header">
                <span class="pill pill--purple" style="font-size:0.72rem;">Etapa 2: DESCUBRÍ (Ejercicio Conceptual)</span>
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <label class="form-label" for="cust-q2-prompt">Pregunta / Enunciado del Ejercicio</label>
                <input type="text" id="cust-q2-prompt" class="form-input purple-focus" value="Al observar el ángulo de 120° en la circunferencia unitaria, ¿por qué su coseno es negativo (−) mientras que su seno es positivo (+)?">
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <label class="form-label" for="cust-q2-concept">Concepto Evaluado</label>
                <select id="cust-q2-concept" class="form-input purple-focus" style="cursor:pointer;">
                  <option value="Coseno" selected>Coseno</option>
                  <option value="Seno">Seno</option>
                  <option value="Tangente">Tangente</option>
                  <option value="Cotangente">Cotangente</option>
                  <option value="Secante">Secante</option>
                  <option value="Cosecante">Cosecante</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <label class="form-label">Opciones de Respuesta (Marca la Correcta)</label>
                <div class="custom-options-builder">
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q2_correct" value="0" checked title="Opción Correcta">
                    <input type="text" id="cust-q2-opt-0" class="form-input" value="Porque 120° está en el Cuadrante II: la coordenada X es negativa y la Y es positiva.">
                  </div>
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q2_correct" value="1" title="Opción Correcta">
                    <input type="text" id="cust-q2-opt-1" class="form-input" value="Porque todos los ángulos mayores a 90° tienen coseno negativo y seno negativo.">
                  </div>
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q2_correct" value="2" title="Opción Correcta">
                    <input type="text" id="cust-q2-opt-2" class="form-input" value="Porque el radio de la circunferencia se vuelve negativo en el segundo cuadrante.">
                  </div>
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q2_correct" value="3" title="Opción Correcta">
                    <input type="text" id="cust-q2-opt-3" class="form-input" value="Porque el coseno solo es positivo en 0° y 90°.">
                  </div>
                </div>
              </div>
            </div>

            <!-- Etapa 4: Desafío de Análisis -->
            <div class="custom-stage-box">
              <div class="custom-stage-box__header">
                <span class="pill pill--green" style="font-size:0.72rem;">Etapa 4: DESAFÍO (Ejercicio de Análisis y Deducción)</span>
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <label class="form-label" for="cust-q4-prompt">Enunciado del Desafío</label>
                <textarea id="cust-q4-prompt" class="form-input purple-focus" rows="2">El radar de Teko detecta un ángulo θ desconocido con tan(θ) < 0 (negativa) y cos(θ) > 0 (positivo). ¿En qué cuadrante se encuentra θ y qué signo tiene sen(θ)?</textarea>
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <label class="form-label" for="cust-q4-concept">Concepto Evaluado</label>
                <select id="cust-q4-concept" class="form-input purple-focus" style="cursor:pointer;">
                  <option value="Tangente" selected>Tangente</option>
                  <option value="Seno">Seno</option>
                  <option value="Coseno">Coseno</option>
                  <option value="Cotangente">Cotangente</option>
                  <option value="Secante">Secante</option>
                  <option value="Cosecante">Cosecante</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <label class="form-label">Opciones del Desafío (Marca la Correcta)</label>
                <div class="custom-options-builder">
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q4_correct" value="0" checked title="Opción Correcta">
                    <input type="text" id="cust-q4-opt-0" class="form-input" value="Cuadrante IV, y sen(θ) es negativo (−).">
                  </div>
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q4_correct" value="1" title="Opción Correcta">
                    <input type="text" id="cust-q4-opt-1" class="form-input" value="Cuadrante II, y sen(θ) es positivo (+).">
                  </div>
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q4_correct" value="2" title="Opción Correcta">
                    <input type="text" id="cust-q4-opt-2" class="form-input" value="Cuadrante III, y sen(θ) es negativo (−).">
                  </div>
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q4_correct" value="3" title="Opción Correcta">
                    <input type="text" id="cust-q4-opt-3" class="form-input" value="Cuadrante I, y sen(θ) es positivo (+).">
                  </div>
                </div>
              </div>
            </div>

            <!-- Etapa 5: Desafío Final -->
            <div class="custom-stage-box">
              <div class="custom-stage-box__header">
                <span class="pill pill--red" style="font-size:0.72rem;">Etapa 5: DESAFÍO FINAL (Prueba Maestra)</span>
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <label class="form-label" for="cust-q5-prompt">Enunciado del Desafío Final</label>
                <textarea id="cust-q5-prompt" class="form-input purple-focus" rows="2">Para restaurar las coordenadas finales, si sen(θ) = −1/2 y θ está en el Cuadrante III, ¿cuál es el valor exacto de cos(θ) y tan(θ)?</textarea>
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <div class="custom-options-builder">
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q5_correct" value="0" checked title="Opción Correcta">
                    <input type="text" id="cust-q5-opt-0" class="form-input" value="cos(θ) = −√3/2 y tan(θ) = +√3/3">
                  </div>
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q5_correct" value="1" title="Opción Correcta">
                    <input type="text" id="cust-q5-opt-1" class="form-input" value="cos(θ) = +√3/2 y tan(θ) = −√3/3">
                  </div>
                  <div class="custom-opt-row">
                    <input type="radio" name="cust_q5_correct" value="2" title="Opción Correcta">
                    <input type="text" id="cust-q5-opt-2" class="form-input" value="cos(θ) = −1/2 y tan(θ) = +1">
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- CAMPOS GENERALES DE LA MISIÓN -->
        <div style="background:#f8fafc;border:2px solid #1a1a1a;border-radius:var(--radius-lg);padding:14px;margin:16px 0;box-shadow:3px 3px 0 #1a1a1a;">
          <h4 style="font-family:var(--font-display);font-size:0.95rem;font-weight:800;margin:0 0 10px 0;color:var(--ink);">📋 Datos de la Tarea Escolar</h4>
          
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label" for="task-title">Título de la Misión</label>
            <input type="text" id="task-title" class="form-input purple-focus" value="MISIÓN: El cuadrante perdido" required>
          </div>

          <div class="teacher-grid-2col" style="margin-bottom:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="task-category">Materia / Tema</label>
              <select id="task-category" class="form-input purple-focus" style="cursor:pointer;">
                <option value="Trigonometría" selected>Trigonometría</option>
                <option value="Álgebra">Álgebra</option>
                <option value="Geometría">Geometría</option>
                <option value="Cálculo">Cálculo</option>
                <option value="Aritmética">Aritmética</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="task-points">Puntaje / Puntos</label>
              <input type="number" id="task-points" class="form-input purple-focus" value="100" min="10" max="100">
            </div>
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label" for="task-due">Fecha Límite de Entrega</label>
            <input type="date" id="task-due" class="form-input purple-focus" value="<?= date('Y-m-d', strtotime('+14 days')) ?>" required>
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label" for="task-lore">Historia de la Misión (Lore didáctico)</label>
            <input type="text" id="task-lore" class="form-input purple-focus" value="Una anomalía en el plano cartesiano ha invertido los signos trigonométricos. Explora la circunferencia unitaria y restaura las coordenadas.">
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="task-desc">Indicaciones o Subtítulo Pedagógico</label>
            <textarea id="task-desc" class="form-input purple-focus" rows="2" placeholder="Explica brevemente los objetivos de la misión...">Restaura las coordenadas de los radares explorando la circunferencia unitaria y los signos en los 4 cuadrantes.</textarea>
          </div>
        </div>

        <div class="teacher-modal-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-close-modal>Cancelar</button>
          <button type="submit" class="btn btn--primary btn--purple-solid btn--sm" id="btn-submit-task">
            🚀 Asignar Misión & Ejercicios
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- ====== MODAL: CREAR PACK DE PREGUNTAS PERSONALIZADO (TEKO LIVE) ====== -->
  <div class="teacher-modal-backdrop" id="modal-create-pack" role="dialog" aria-modal="true">
    <div class="teacher-modal" style="max-width:780px;">
      <button class="teacher-modal__close" aria-label="Cerrar modal">&times;</button>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span class="pill pill--purple" style="font-size:0.72rem;font-weight:800;">⚡ TEKO LIVE ARENA</span>
        <span class="pill pill--green" style="font-size:0.72rem;font-weight:700;">Quiz Multijugador</span>
      </div>
      <h3 class="teacher-modal__title">📦 Creador de Pack de Preguntas</h3>
      <p class="teacher-modal__subtitle">Diseña tus propias preguntas con las 4 formas Kahoot (🔺 🔷 🟡 🟩), define el tiempo límite y úsalo en tus clases en vivo.</p>

      <form id="form-create-custom-pack">
        <div style="background:#f8fafc;border:2px solid #1a1a1a;border-radius:var(--radius-lg);padding:14px;margin-bottom:16px;box-shadow:3px 3px 0 #1a1a1a;">
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label" for="pack-title">Título del Pack de Preguntas</label>
            <input type="text" id="pack-title" class="form-input purple-focus" placeholder="Ej: Duelo de Signos en Cuadrantes & Razones Notables" required>
          </div>

          <div class="teacher-grid-2col" style="margin-bottom:0;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="pack-theme">Tema / Materia</label>
              <select id="pack-theme" class="form-input purple-focus" style="cursor:pointer;">
                <option value="Trigonometría" selected>Trigonometría</option>
                <option value="Álgebra">Álgebra</option>
                <option value="Geometría">Geometría</option>
                <option value="Cálculo">Cálculo</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="pack-time-select">Tiempo por Pregunta</label>
              <select id="pack-time-select" class="form-input purple-focus" style="cursor:pointer;">
                <option value="15">15 Segundos (Ultrarrápido)</option>
                <option value="20" selected>20 Segundos (Recomendado)</option>
                <option value="30">30 Segundos (Intermedio)</option>
                <option value="45">45 Segundos (Análisis profundo)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Encabezado de Preguntas y Controles -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <span style="font-size:0.9rem;font-weight:800;color:var(--purple-800);">
            📝 Preguntas del Pack (<span id="pack-questions-count">1</span>):
          </span>
          <div style="display:flex;gap:8px;">
            <button type="button" class="btn btn--secondary btn--sm" id="btn-load-sample-pack" style="background:#fef3c7;border-color:#b45309;color:#92400e;font-size:0.75rem;padding:4px 10px;">
              🎲 Cargar Preguntas de Ejemplo
            </button>
            <button type="button" class="btn btn--primary btn--purple-solid btn--sm" id="btn-add-pack-question" style="font-size:0.75rem;padding:4px 10px;">
              ➕ Añadir Pregunta
            </button>
          </div>
        </div>

        <!-- Contenedor dinámico de preguntas -->
        <div id="pack-questions-container" class="custom-stages-accordion" style="max-height:360px;"></div>

        <div class="teacher-modal-actions" style="margin-top:16px;">
          <button type="button" class="btn btn--secondary btn--sm" data-close-modal>Cancelar</button>
          <button type="submit" class="btn btn--primary btn--purple-solid btn--sm" id="btn-save-pack-submit">
            💾 Guardar Pack de Preguntas
          </button>
        </div>
      </form>
    </div>
  </div>

  <script src="../05_jopamath/jopamath_i18n.js?v=<?= time() ?>"></script>
  <script src="../07_diseno_y_graficos/visualizer.js?v=<?= time() ?>"></script>
  <script src="docente.js?v=<?= time() ?>"></script>
  <script src="../06_teko_live/teko_live.js?v=<?= time() ?>"></script>
  <script>
    try {
      localStorage.setItem('teko_user_nombre', <?= json_encode($nombre) ?>);
      localStorage.setItem('teko_user_rol', <?= json_encode($rol) ?>);
    } catch(e) {}
  </script>
</body>
</html>
