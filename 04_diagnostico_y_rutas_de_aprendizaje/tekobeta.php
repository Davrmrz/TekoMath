<?php
/* ============================================
   TEKO MATH — TekoBeta (tekobeta.php)
   Laboratorio de Experiencias: Teko Live & Misiones de Aprendizaje
   ============================================ */
require_once __DIR__ . '/../01_sistema_principal_y_registro_offline/config/session.php';
require_once __DIR__ . '/../01_sistema_principal_y_registro_offline/config/database.php';
require_once __DIR__ . '/../01_sistema_principal_y_registro_offline/config/misiones_data.php';

// Proteger página — solo accesible para estudiantes autenticados
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
    $progresosMisiones = [];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="TEKO Math — TekoBeta: Laboratorio interactivo de Teko Live y Misiones de Aprendizaje.">
  <title>TEKO Math — TekoBeta 🧪</title>
  <link rel="stylesheet" href="../07_diseno_y_graficos/style.css?v=<?= time() ?>">
  <link rel="stylesheet" href="../07_diseno_y_graficos/dashboard.css?v=<?= time() ?>">
  <link rel="stylesheet" href="misiones.css?v=<?= time() ?>">
  <link rel="stylesheet" href="../06_teko_live/teko_live.css?v=<?= time() ?>">
  <link rel="icon" type="image/png" href="../02_tekobot/TekoBot/Hackaton/assets/images/tejuxi-face.png?v=20260926">
</head>
<body>

  <!-- ====== GRAPH PAPER BACKGROUND ====== -->
  <div class="graph-bg" aria-hidden="true"></div>

  <!-- ====== MATH DECORATIONS ====== -->
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
      <a href="../01_sistema_principal_y_registro_offline/dashboard.php" class="topnav__brand">
        <img class="topnav__mascot" src="../07_diseno_y_graficos/assets/images/logo-alumno.jpg" alt="Mascota de TEKO Math" width="52" height="52">
        <span class="topnav__logo-text">TEKO <span>Math</span></span>
      </a>

      <!-- Center: Nav Links -->
      <div class="topnav__links" id="nav-links">
        <a href="../01_sistema_principal_y_registro_offline/dashboard.php" class="topnav__link" data-section="inicio">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          Inicio
        </a>
        <a href="../03_teko_arcade/juego.php" class="topnav__link" data-section="juegos">
          🎮 TekoArcade
        </a>
        <a href="../02_tekobot/chat.php" class="topnav__link" data-section="agente">
          🤖 Tekobot
        </a>
        <a href="tekobeta.php" class="topnav__link topnav__link--active" data-section="beta">
          🧪 TekoBeta
        </a>
      </div>

      <!-- Right: User Menu -->
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
            <a href="../01_sistema_principal_y_registro_offline/dashboard.php" class="topnav__user-dropdown-link">
              🏠 Inicio Dashboard
            </a>
            <a href="../03_teko_arcade/juego.php" class="topnav__user-dropdown-link" style="color:#d97706;font-weight:700;">
              🎮 Zona de Juegos Arcade
            </a>
            <a href="../02_tekobot/chat.php" class="topnav__user-dropdown-link">
              🤖 Teko Bot
            </a>
            <a href="../01_sistema_principal_y_registro_offline/logout.php" class="topnav__user-dropdown-link topnav__user-dropdown-link--logout">
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
      <a href="../01_sistema_principal_y_registro_offline/dashboard.php" class="topnav__mobile-link" data-section="inicio">🏠 Inicio</a>
      <a href="../03_teko_arcade/juego.php" class="topnav__mobile-link" data-section="juegos">🎮 TekoArcade</a>
      <a href="../02_tekobot/chat.php" class="topnav__mobile-link" data-section="agente">🤖 Tekobot</a>
      <a href="tekobeta.php" class="topnav__mobile-link topnav__mobile-link--active" data-section="beta">🧪 TekoBeta</a>
      <div class="topnav__mobile-divider"></div>
      <a href="../01_sistema_principal_y_registro_offline/logout.php" class="topnav__mobile-link topnav__mobile-link--logout">🚪 Cerrar sesión</a>
    </div>
  </nav>

  <!-- ====== MAIN CONTENT ====== -->
  <main class="dashboard" id="dashboard">

    <!-- ====== HERO TEKOBETA ====== -->
    <section class="welcome anim-fade-up" style="background:linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%);border-color:var(--purple-300);">
      <div class="welcome__content">
        <div class="welcome__text">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span class="pill pill--purple" style="font-size:0.75rem;font-weight:800;">🧪 LABORATORIO TEKOBETA</span>
            <span class="pill pill--green" style="font-size:0.72rem;">Versión Experimental</span>
          </div>
          <h1 class="welcome__title" style="color:var(--purple-900);">
            ¡Bienvenido a <span class="welcome__name">TekoBeta</span>! ✨
          </h1>
          <p class="welcome__subtitle" style="color:var(--purple-800);max-width:680px;">
            Aquí encontrarás los módulos más dinámicos de la plataforma: <strong>Teko Live</strong> para competir en vivo en clase y las <strong>Misiones de Aprendizaje</strong> en 5 etapas interactivas.
          </p>
        </div>
      </div>
    </section>

    <!-- ====== SECCIÓN DE CLASE EN VIVO: TEKO LIVE (TIPO KAHOOT) ====== -->
    <section class="teko-live-hero-card anim-fade-up" id="seccion-teko-live-estudiante">
      <span class="teko-live-hero-card__badge">⚡ TEKO LIVE — SALA DE CLASE EN VIVO</span>
      <h2 class="teko-live-hero-card__title">
        🎮 ¿Tu profesor inició un Quiz en Vivo?
      </h2>
      <p class="teko-live-hero-card__desc">
        Ingresa el <strong>código PIN de 6 dígitos</strong> que aparece en la pantalla del profesor para unirte a la sala, responder en tiempo real y competir por el 1er lugar del podio 🏆.
      </p>

      <form id="form-teko-live-join" class="teko-live-join-form" onsubmit="return false;">
        <input 
          type="text" 
          id="teko-live-pin-input" 
          class="teko-live-pin-input" 
          placeholder="000000" 
          maxlength="6" 
          pattern="[0-9]{6}" 
          inputmode="numeric" 
          autocomplete="off" 
          required
        >
        <button type="submit" class="btn btn--primary btn--purple-solid btn--md" style="font-size:1rem;padding:10px 22px;white-space:nowrap;">
          🚀 ¡Entrar al Duelo!
        </button>
      </form>
    </section>

    <!-- ====== MISIONES DE APRENDIZAJE INTERACTIVAS ====== -->
    <section class="section anim-fade-up" id="tareas" aria-label="Misiones de aprendizaje asignadas">
      <div class="section__header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span class="pill pill--green" style="font-size:0.72rem;font-weight:800;">🚀 EXPERIENCIAS INTERACTIVAS</span>
            <span class="pill pill--purple" style="font-size:0.72rem;">5 Etapas Progresivas</span>
          </div>
          <h2 class="section__title">🚀 Misiones de Aprendizaje (<?= count($tareas) ?>)</h2>
          <p class="section__subtitle" style="font-size:0.88rem;color:var(--gray-600);margin-top:2px;">
            Desafíos visuales, conceptuales y prácticos para dominar cada tema paso a paso.
          </p>
        </div>
      </div>

      <?php if (empty($tareas)): ?>
        <div class="empty-state">
          <div class="empty-state__icon">🚀</div>
          <h3 class="empty-state__title">No hay misiones disponibles</h3>
          <p class="empty-state__desc">No tienes misiones de aprendizaje pendientes asignadas en este momento.</p>
        </div>
      <?php else: ?>
        <div class="teacher-grid">
          <?php foreach ($tareas as $t): ?>
            <?php
              $prog = $progresosMisiones[$t['id']] ?? null;
              $isCompletado = !empty($prog['completado']);
              $dominio = $prog ? (int)$prog['dominio_pct'] : 0;
            ?>
            <article class="mission-card anim-fade-up">
              <div>
                <div class="mission-card__header">
                  <span class="pill pill--purple" style="font-size:0.75rem;font-weight:800;">📚 <?= htmlspecialchars($t['tema']) ?></span>
                  <?php if ($isCompletado): ?>
                    <span class="pill pill--green" style="font-size:0.72rem;font-weight:800;border-width:1.5px;">
                      🏆 Dominio: <?= $dominio ?>%
                    </span>
                  <?php else: ?>
                    <span class="pill pill--blue" style="font-size:0.72rem;">
                      💯 <?= (int)$t['puntos'] ?> pts
                    </span>
                  <?php endif; ?>
                </div>

                <h3 class="mission-card__title"><?= htmlspecialchars($t['titulo']) ?></h3>
                <p class="mission-card__story"><?= htmlspecialchars($t['historia'] ?: ($t['instrucciones'] ?: 'Explora recursos visuales, descubre conceptos y resuelve desafíos matemáticos guiados.')) ?></p>

                <!-- Previsualización de las 5 Etapas -->
                <div class="mission-card__stages-preview">
                  <span class="mission-card__stage-dot" style="<?= $isCompletado ? 'background:var(--green-100);color:var(--green-800);border-color:var(--green-500);' : '' ?>">1. Explorá 👁️</span>
                  <span class="mission-card__stage-dot" style="<?= $isCompletado ? 'background:var(--green-100);color:var(--green-800);border-color:var(--green-500);' : '' ?>">2. Descubrí 💡</span>
                  <span class="mission-card__stage-dot" style="<?= $isCompletado ? 'background:var(--green-100);color:var(--green-800);border-color:var(--green-500);' : '' ?>">3. Resolvé 📐</span>
                  <span class="mission-card__stage-dot" style="<?= $isCompletado ? 'background:var(--green-100);color:var(--green-800);border-color:var(--green-500);' : '' ?>">4. Desafío ⚡</span>
                  <span class="mission-card__stage-dot" style="<?= $isCompletado ? 'background:var(--green-100);color:var(--green-800);border-color:var(--green-500);' : '' ?>">5. Final 🏆</span>
                </div>

                <div style="font-size:0.78rem;color:var(--gray-500);margin-bottom:8px;">
                  <span>⏳ Entrega: <strong><?= htmlspecialchars($t['fecha_entrega']) ?></strong></span>
                </div>
              </div>

              <div class="mission-card__footer">
                <span style="font-size:0.76rem;color:var(--gray-600);font-weight:600;">👨‍🏫 Prof. <?= htmlspecialchars($t['docente_nombre'] ?? 'Docente') ?></span>
                <button class="btn <?= $isCompletado ? 'btn--secondary' : 'btn--primary btn--green' ?> btn--sm" data-open-mision="<?= (int)$t['id'] ?>" style="gap:6px;">
                  <?= $isCompletado ? 'Ver Resultados / Repetir 🔄' : 'Iniciar Misión 🚀' ?>
                </button>
              </div>
            </article>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
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
  <script src="misiones.js?v=<?= time() ?>"></script>
  <script src="../06_teko_live/teko_live.js?v=<?= time() ?>"></script>
  <script>
    // Toggle dropdown de usuario
    const userBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('topnav__user-dropdown--open');
      });
      document.addEventListener('click', () => {
        userDropdown.classList.remove('topnav__user-dropdown--open');
      });
    }

    // Toggle menú móvil
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburgerBtn && mobileMenu) {
      hamburgerBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('topnav__mobile-menu--open');
      });
    }
  </script>
</body>
</html>
