<?php
/* ============================================
   TEKO MATH — Dashboard del Estudiante
   ============================================ */
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/misiones_data.php';

// Proteger página — solo accesible para estudiantes (docentes van a docente.php)
requireEstudiante();

$user = getUser();
$nombre = htmlspecialchars($user['nombre']);
$inicialNombre = mb_strtoupper(mb_substr($user['nombre'], 0, 1));
$rol = $user['rol'];

$db = getDB();
asegurarMisionesDemo($db, 2);

// Obtener tareas y misiones activas asignadas por docentes
$tareasStmt = $db->query("
    SELECT t.*, u.nombre AS docente_nombre
    FROM tareas t
    LEFT JOIN usuarios u ON t.docente_id = u.id
    ORDER BY t.created_at DESC
");
$tareas = $tareasStmt->fetchAll();

// Obtener progreso de misiones del estudiante
$progresosMisiones = [];
try {
    $progresosMisionesStmt = $db->prepare("
        SELECT tarea_id, dominio_pct, aciertos, errores, intentos, pistas_usadas, autocorrecciones, tiempo_segundos, conceptos_feedback, completado, created_at
        FROM progreso_misiones
        WHERE estudiante_id = :uid
    ");
    $progresosMisionesStmt->execute([':uid' => $user['id']]);
    foreach ($progresosMisionesStmt->fetchAll() as $pm) {
        $progresosMisiones[$pm['tarea_id']] = $pm;
    }
} catch (Exception $e) {
    // Si aún se estaba migrando la tabla
    $progresosMisiones = [];
}

// Obtener mis quizzes de práctica recientes
$misQuizzesStmt = $db->prepare("
    SELECT *
    FROM progreso_quizzes
    WHERE estudiante_id = :uid
    ORDER BY created_at DESC
    LIMIT 6
");
$misQuizzesStmt->execute([':uid' => $user['id']]);
$misQuizzes = $misQuizzesStmt->fetchAll();

// Obtener temas únicos cargados por los profesores
$temasStmt = $db->query("
    SELECT DISTINCT tema AS nombre_tema FROM tareas WHERE tema IS NOT NULL AND tema != ''
    UNION
    SELECT DISTINCT categoria AS nombre_tema FROM materiales WHERE categoria IS NOT NULL AND categoria != ''
");
$temasCargados = $temasStmt->fetchAll(PDO::FETCH_COLUMN);

// Temas base sugeridos
$temasSugeridos = [
    ['nombre' => 'Trigonometría', 'icono' => '📐', 'docente' => false],
    ['nombre' => 'Sumas y restas', 'icono' => '➕', 'docente' => false],
    ['nombre' => 'Multiplicación', 'icono' => '✖️', 'docente' => false],
    ['nombre' => 'Fracciones', 'icono' => '📊', 'docente' => false],
    ['nombre' => 'Ángulos', 'icono' => '📐', 'docente' => false],
    ['nombre' => 'Gráficas', 'icono' => '📈', 'docente' => false],
    ['nombre' => 'Potencias', 'icono' => '🔢', 'docente' => false]
];

$temasFinales = [];
foreach ($temasCargados as $tc) {
    if (!empty(trim($tc))) {
        $temasFinales[] = ['nombre' => trim($tc), 'icono' => '📚', 'docente' => true];
    }
}
foreach ($temasSugeridos as $ts) {
    $existe = false;
    foreach ($temasFinales as $tf) {
        if (mb_strtolower($tf['nombre']) === mb_strtolower($ts['nombre'])) {
            $existe = true;
            break;
        }
    }
    if (!$existe) {
        $temasFinales[] = $ts;
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="TEKO Math — Dashboard del estudiante. Accede a tus cursos, practica y mide tu progreso.">
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

  <!-- ====== MATH DECORATIONS (lighter on dashboard) ====== -->
  <div class="math-decorations" aria-hidden="true">
    <span class="math-deco math-deco--1">∫</span>
    <span class="math-deco math-deco--4">∞</span>
    <span class="math-deco math-deco--6">θ</span>
    <svg class="math-wave" viewBox="0 0 600 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 40 C50 10, 100 10, 150 40 S250 70, 300 40 S400 10, 450 40 S550 70, 600 40" 
            stroke="#0f5132" stroke-width="2.5" fill="none"/>
    </svg>
  </div>

  <!-- ====== TOP NAVIGATION ====== -->
  <nav class="topnav" id="topnav">
    <div class="topnav__inner">
      <!-- Left: Logo -->
      <a href="dashboard.php" class="topnav__brand">
        <img class="topnav__mascot" src="../07_diseno_y_graficos/assets/images/logo-alumno.jpg" alt="Mascota de TEKO Math para el alumno" width="52" height="52">
        <span class="topnav__logo-text">TEKO <span>Math</span></span>
      </a>

      <!-- Center: Nav Links (desktop) -->
      <div class="topnav__links" id="nav-links">
        <a href="dashboard.php" class="topnav__link topnav__link--active" data-section="inicio">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          Inicio
        </a>
        <a href="../03_teko_arcade/juego.php" class="topnav__link" data-section="juegos">
          🎮 TekoArcade
        </a>
        <a href="../02_tekobot/chat.php" class="topnav__link" data-section="agente">
          🤖 Tekobot
        </a>
        <a href="../04_diagnostico_y_rutas_de_aprendizaje/tekobeta.php" class="topnav__link" data-section="beta">
          🧪 TekoBeta
        </a>
      </div>

      <!-- Right: User -->
      <div class="topnav__user">
        <div class="topnav__user-menu-wrapper">
          <button class="topnav__avatar" id="user-menu-btn" aria-label="Menú de usuario" title="<?= $nombre ?>">
            <span class="topnav__avatar-letter"><?= $inicialNombre ?></span>
          </button>
          <!-- User dropdown -->
          <div class="topnav__user-dropdown" id="user-dropdown">
            <div class="topnav__user-dropdown-header">
              <strong><?= $nombre ?></strong>
              <span class="pill pill--green" style="font-size:0.65rem;padding:2px 8px;"><?= ucfirst($rol) ?></span>
            </div>
            <a href="../04_diagnostico_y_rutas_de_aprendizaje/tekobeta.php" class="topnav__user-dropdown-link" style="color:var(--purple-700);font-weight:700;">
              🧪 TekoBeta (Live & Misiones)
            </a>
            <a href="../03_teko_arcade/juego.php" class="topnav__user-dropdown-link" style="color:#d97706;font-weight:700;">
              🎮 Zona de Juegos Arcade
            </a>
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

    <!-- Mobile nav dropdown -->
    <div class="topnav__mobile-menu" id="mobile-menu">
      <div class="topnav__mobile-user">
        <strong><?= $nombre ?></strong>
        <span class="pill pill--purple" style="font-size:0.65rem;padding:2px 8px;"><?= ucfirst($rol) ?></span>
      </div>
      <div class="topnav__mobile-divider"></div>
      <a href="dashboard.php" class="topnav__mobile-link topnav__mobile-link--active" data-section="inicio">🏠 Inicio</a>
      <a href="../03_teko_arcade/juego.php" class="topnav__mobile-link" data-section="juegos">🎮 TekoArcade</a>
      <a href="../02_tekobot/chat.php" class="topnav__mobile-link" data-section="agente">🤖 Tekobot</a>
      <a href="../04_diagnostico_y_rutas_de_aprendizaje/tekobeta.php" class="topnav__mobile-link" data-section="beta">🧪 TekoBeta</a>
      <div class="topnav__mobile-divider"></div>
      <a href="logout.php" class="topnav__mobile-link topnav__mobile-link--logout">🚪 Cerrar sesión</a>
    </div>
  </nav>

  <!-- ====== MAIN CONTENT ====== -->
  <main class="dashboard" id="dashboard">

    <!-- ====== WELCOME SECTION ====== -->
    <section class="welcome anim-fade-up">
      <div class="welcome__content">
        <div class="welcome__text">
          <span class="pill pill--purple">📐 <?= ucfirst($rol) ?></span>
          <h1 class="welcome__title">¡Hola, <span class="welcome__name"><?= $nombre ?></span>!</h1>
          <p class="welcome__subtitle">Bienvenido a tu espacio de aprendizaje interactivo. Practicá con el visualizador matemático, desafíate en TekoArcade o ingresa a TekoBeta.</p>
          <div class="welcome__actions">
            <a href="../04_diagnostico_y_rutas_de_aprendizaje/tekobeta.php" class="btn btn--primary btn--purple btn--md">
              🧪 TekoBeta (Live & Misiones)
            </a>
            <a href="../03_teko_arcade/juego.php" class="btn btn--secondary btn--md" style="background:#fef3c7;border-color:#b45309;color:#92400e;font-weight:700;">
              🎮 TekoArcade
            </a>
            <a href="../02_tekobot/chat.php" class="btn btn--primary btn--green btn--md" id="btn-chat-agente">
              <span class="pulse-dot pulse-dot--white"></span>
              Consultar a Teko Bot
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ====== SECCIÓN DEDICADA: PREVISUALIZACIÓN DE TEKOBOT (DEBAJO DE BIENVENIDA) ====== -->
    <section class="tekobot-preview-section anim-fade-up" aria-label="Tutor IA TekoBot">
      
      <!-- Lado Izquierdo: Información y Acceso Directo -->
      <div class="tekobot-preview-section__info">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span class="pill pill--purple" style="font-size:0.75rem;font-weight:800;">🤖 TUTOR INTELIGENTE IA</span>
            <span class="pill pill--green" style="font-size:0.72rem;">Bilingüe · Jopara & ES</span>
          </div>
          <h2 style="font-family:var(--font-display);font-size:1.8rem;font-weight:800;color:var(--purple-700);line-height:1.2;margin-bottom:8px;">
            TekoBot
          </h2>
          <p style="font-size:0.92rem;color:var(--gray-700);line-height:1.5;margin-bottom:14px;">
            ¿Tenés dudas con una fórmula o ejercicio? TekoBot te explica paso a paso, te brinda pistas pedagógicas y conecta teoría con gráficos visuales.
          </p>

          <div style="display:flex;flex-direction:column;gap:6px;font-size:0.85rem;color:var(--gray-700);margin-bottom:16px;">
            <div>✨ <strong>Explicaciones guiadas:</strong> Sin dar la respuesta directa, te enseña a razonar.</div>
            <div>🇵🇾 <strong>Guaraní Jopara:</strong> Comprende y responde en tu idioma cotidiano.</div>
            <div>📐 <strong>Currículo MEC:</strong> Alineado al 1er Curso de Educación Media.</div>
          </div>
        </div>

        <a href="../02_tekobot/chat.php" class="btn btn--primary btn--purple btn--md" style="align-self:flex-start;gap:8px;">
          🚀 Abrir Tutor TekoBot Completo
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
        </a>
      </div>

      <!-- Lado Derecho: Ventana Interactiva de Previsualización -->
      <div class="tekobot-preview-section__interactive">
        <div class="welcome-chat__header">
          <div class="welcome-chat__agent-info">
            <span class="pulse-dot"></span>
            <img src="../02_tekobot/TekoBot/Hackaton/assets/images/tejuxi-face.png" alt="TekoBot" width="24" height="24" style="border-radius:50%;vertical-align:middle;">
            <span>🤖 TekoBot · Vista Previa en Vivo</span>
          </div>
          <a href="../02_tekobot/chat.php" class="welcome-chat__expand-link" title="Abrir tutor a pantalla completa">
            Pantalla completa ↗
          </a>
        </div>

        <div class="welcome-chat__messages" id="welcome-chat-messages" style="height:220px;">
          <!-- Mensaje de bienvenida de TekoBot -->
          <div class="welcome-chat__msg welcome-chat__msg--bot">
            <span class="welcome-chat__msg-avatar">🤖</span>
            <div class="welcome-chat__msg-bubble">
              ¡Hola <strong><?= $nombre ?></strong>! Soy <strong>TekoBot</strong>, tu tutor de matemática. ¿Tenés dudas sobre trigonometría o querés que te explique una fórmula en Jopara? 📐✨
            </div>
          </div>

          <!-- Pregunta de ejemplo del estudiante -->
          <div class="welcome-chat__msg welcome-chat__msg--user">
            <div class="welcome-chat__msg-bubble">
              ¿Qué es el Coseno de forma simple?
            </div>
          </div>

          <!-- Respuesta explicativa de TekoBot -->
          <div class="welcome-chat__msg welcome-chat__msg--bot">
            <span class="welcome-chat__msg-avatar">🤖</span>
            <div class="welcome-chat__msg-bubble">
              Coseno ha'e <strong>x / hipotenusa</strong>. En el círculo unitario es la distancia horizontal: <code>cos(θ) = x/1</code>. ¡Probá el simulador interactivo abajo! 👇
            </div>
          </div>
        </div>

        <!-- Sugerencias rápidas de consulta -->
        <div class="welcome-chat__chips">
          <a href="../02_tekobot/chat.php" class="welcome-chat__chip">📐 ¿Cómo calcular Seno?</a>
          <a href="../02_tekobot/chat.php" class="welcome-chat__chip">💡 Explicación sencilla</a>
          <a href="../02_tekobot/chat.php" class="welcome-chat__chip">🇵🇾 Mba'éichapa oiko?</a>
        </div>

        <!-- Barra de consulta rápida hacia el chat -->
        <div class="welcome-chat__input-bar">
          <form class="welcome-chat__form" action="../02_tekobot/chat.php" method="GET">
            <input 
              type="text" 
              class="welcome-chat__input" 
              placeholder="Escribí tu pregunta para TekoBot..." 
              autocomplete="off"
              onfocus="location.href='../02_tekobot/chat.php'"
            >
            <a href="../02_tekobot/chat.php" class="btn btn--primary btn--purple btn--sm" style="padding:7px 14px;font-size:0.85rem;white-space:nowrap;gap:4px;">
              Preguntar ➔
            </a>
          </form>
        </div>
      </div>
    </section>

    <!-- ====== SECCIÓN DEDICADA: PREVISUALIZACIÓN DE TEKO ARCADE ====== -->
    <section class="tekoarcade-preview-section anim-fade-up" id="tekoarcade-section" aria-label="Zona de Juegos TEKO Arcade">
      <!-- Header -->
      <div class="tekoarcade-preview-header">
        <div class="tekoarcade-preview-header__info">
          <div class="tekoarcade-preview-header__icon">🎮</div>
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span class="pill pill--green" style="font-size:0.72rem;font-weight:800;">⚡ ARCADE GAMIFICADO</span>
              <span class="pill pill--purple" style="font-size:0.7rem;">+XP & Desafíos</span>
            </div>
            <h2 class="tekoarcade-preview-header__title">TEKO Arcade — Juegos & Desafíos Matemáticos</h2>
            <p class="tekoarcade-preview-header__subtitle">
              Practicá trigonometría jugando: construí triángulos, sincronizá ondas, lanzá vectores y subí de nivel.
            </p>
          </div>
        </div>
        <div class="tekoarcade-preview-header__actions">
          <a href="../03_teko_arcade/juego.php" class="btn btn--secondary btn--md" style="background:#f59e0b;color:#1a1a1a;border-color:#1a1a1a;font-weight:800;gap:6px;box-shadow:3px 3px 0 #1a1a1a;">
            🚀 Jugar en Pantalla Completa ↗
          </a>
        </div>
      </div>

      <!-- Quick Navigation Toolbar -->
      <div class="tekoarcade-preview-nav-bar">
        <div class="tekoarcade-preview-tabs" id="tekoarcade-tabs">
          <button type="button" class="tekoarcade-preview-tab-btn tekoarcade-preview-tab-btn--active" data-route="#/">
            🏠 Inicio
          </button>
          <button type="button" class="tekoarcade-preview-tab-btn" data-route="#/mapa">
            🗺️ Mapa de Aprendizaje
          </button>
          <button type="button" class="tekoarcade-preview-tab-btn" data-route="#/misiones">
            🎯 Misiones & Retos
          </button>
          <button type="button" class="tekoarcade-preview-tab-btn" data-route="#/progreso">
            📈 Mi Progreso & Estadísticas
          </button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-family:var(--font-mono);font-size:0.72rem;color:#94a3b8;">● VISTA PREVIA INTERACTIVA</span>
          <a href="../03_teko_arcade/juego.php" class="tekoarcade-preview-tab-btn" style="background:#3b82f6;color:#ffffff;border-color:#1d4ed8;" title="Abrir página dedicada">
            Abrir Arcade ↗
          </a>
        </div>
      </div>

      <!-- Iframe Container -->
      <div class="tekoarcade-preview-frame-wrap">
        <iframe 
          id="dashboard-arcade-iframe"
          src="../03_teko_arcade/TEKOARCADE/JUEGOS/dist/index.html?user=<?= urlencode($nombre) ?>&role=<?= urlencode($rol) ?>&_v=<?= time() ?>" 
          class="tekoarcade-preview-iframe" 
          title="Vista Previa de TEKO Arcade"
          allow="fullscreen; clipboard-write; gamepad"
          loading="lazy"
        ></iframe>
      </div>

      <!-- Quick Launch Games Footer -->
      <div class="tekoarcade-preview-footer">
        <div style="font-family:var(--font-display);font-size:0.85rem;font-weight:800;color:#1a1a1a;display:flex;align-items:center;gap:6px;">
          <span>🎯 Acceso Rápido a Juegos:</span>
        </div>
        <div class="tekoarcade-games-pills">
          <button type="button" class="tekoarcade-game-pill" data-game-route="#/tema/sin">
            <span>🔺</span> <strong>Triangle Forge</strong> <small style="color:#16a34a;">(Seno)</small>
          </button>
          <button type="button" class="tekoarcade-game-pill" data-game-route="#/tema/cos">
            <span>〰️</span> <strong>Signal Sync</strong> <small style="color:#2563eb;">(Coseno)</small>
          </button>
          <button type="button" class="tekoarcade-game-pill" data-game-route="#/tema/tan">
            <span>↗️</span> <strong>Vector Launch</strong> <small style="color:#d97706;">(Tangente)</small>
          </button>
          <button type="button" class="tekoarcade-game-pill" data-game-route="#/tema/csc">
            <span>◫</span> <strong>Pair Matrix</strong> <small style="color:#7c3aed;">(Cosecante)</small>
          </button>
          <button type="button" class="tekoarcade-game-pill" data-game-route="#/tema/sec">
            <span>⚡</span> <strong>Ratio Rush</strong> <small style="color:#db2777;">(Secante)</small>
          </button>
          <button type="button" class="tekoarcade-game-pill" data-game-route="#/tema/cot">
            <span>📈</span> <strong>Graph Lab</strong> <small style="color:#059669;">(Cotangente)</small>
          </button>
        </div>
      </div>
    </section>

    <!-- ====== VISUALIZADOR DE FUNCIONES TRIGONOMÉTRICAS ====== -->
    <section class="visualizer-container anim-fade-up" id="simulador-section" aria-label="Visualizador de funciones trigonométricas">
      
      <!-- Visualizer Header -->
      <div class="visualizer-header">
        <div class="visualizer-header__info">
          <div class="visualizer-header__icon">📐</div>
          <div>
            <h2 class="visualizer-header__title">Visualizador de Funciones Trigonométricas</h2>
            <p class="visualizer-header__subtitle">
              Explora el comportamiento, círculo unitario, asíntotas, valores exactos y relaciones recíprocas en tiempo real.
            </p>
          </div>
        </div>
        <span class="pill pill--green" style="font-size:0.75rem;">6 Funciones Trigonométricas</span>
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
              ▶️ Animar ángulo
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

            <!-- Readouts de Ángulo y Dial -->
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

            <!-- Slider de Ángulo con Botones de Paso a Paso -->
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

            <!-- Mini tabla de signos por cuadrante con Dial -->
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
              <span class="trig-card__title">Propiedades de la Función</span>
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

          <!-- 5. Concepto Educativo y Capas Visibles -->
          <div class="trig-card">
            <div class="trig-card__header">
              <span class="trig-card__title">Concepto & Capas Visibles</span>
            </div>

            <p style="font-size:0.8rem;color:var(--gray-700);line-height:1.45;margin-bottom:10px;" id="trig-concept-text">
              El <strong>Seno</strong> representa la coordenada vertical (altura) del punto en la circunferencia unitaria: <em>y = sen(θ)</em>.
            </p>

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

    <!-- ====== FLOATING AI AGENT BUTTON ====== -->
    <a href="../02_tekobot/chat.php" class="agent-fab" id="agent-fab" aria-label="Abrir Teko Bot">
      <span class="pulse-dot pulse-dot--white"></span>
      <span class="agent-fab__icon">🤖</span>
      <span class="agent-fab__text">Teko Bot</span>
      <span class="agent-fab__badge">En línea</span>
    </a>

  </main>

  <script src="../05_jopamath/jopamath_i18n.js?v=<?= time() ?>"></script>
  <script src="../07_diseno_y_graficos/visualizer.js?v=<?= time() ?>"></script>
  <script src="dashboard.js?v=<?= time() ?>"></script>
  <script>
    try {
      localStorage.setItem('teko_user_nombre', <?= json_encode($nombre) ?>);
      localStorage.setItem('teko_user_rol', <?= json_encode($rol) ?>);
    } catch(e) {}
  </script>
</body>
</html>
