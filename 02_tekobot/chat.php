<?php
/* ============================================
   TEKO MATH — Tutor IA TekoBot (chat.php)
   Integración del Tutor IA de Matemáticas
   ============================================ */
require_once __DIR__ . '/../01_sistema_principal_y_registro_offline/config/session.php';

// Proteger página — accesible para cualquier usuario autenticado (estudiante o docente)
requireLogin();

$user = getUser();
$nombre = htmlspecialchars($user['nombre']);
$inicialNombre = mb_strtoupper(mb_substr($user['nombre'], 0, 1));
$rol = $user['rol'];

$isDocente = ($rol === 'docente');
$homeUrl = $isDocente ? '../01_sistema_principal_y_registro_offline/docente.php' : '../01_sistema_principal_y_registro_offline/dashboard.php';
$homeLabel = $isDocente ? 'Panel Docente (🧪 Experimental)' : 'Escritorio';
$rolBadge = $isDocente ? '👨‍🏫 Docente (🧪 Experimental)' : '🎒 Estudiante';
$badgeClass = $isDocente ? 'pill--purple' : 'pill--green';
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="TEKO Math — Teko Bot: Tutor Inteligente de Matemáticas. Resuelve dudas, comprende conceptos paso a paso y practica con simuladores visuales.">
  <title>TEKO Math — Teko Bot</title>
  <link rel="stylesheet" href="../07_diseno_y_graficos/style.css?v=<?= time() ?>">
  <link rel="stylesheet" href="../07_diseno_y_graficos/dashboard.css?v=<?= time() ?>">
  <link rel="stylesheet" href="chat.css?v=<?= time() ?>">
  <link rel="icon" type="image/png" href="TekoBot/Hackaton/assets/images/tejuxi-face.png?v=20260926">
</head>
<body class="tekobot-page-body">

  <!-- ====== TOP NAVIGATION ====== -->
  <nav class="topnav topnav--tekobot" id="topnav">
    <div class="topnav__inner">
      <!-- Left: Logo -->
      <a href="<?= $homeUrl ?>" class="topnav__brand">
        <img class="topnav__mascot" src="../07_diseno_y_graficos/assets/images/logo-<?= $isDocente ? 'docente' : 'alumno' ?>.jpg" alt="Mascota de TEKO Math para el <?= $isDocente ? 'docente' : 'alumno' ?>" width="52" height="52">
        <span class="topnav__logo-text">TEKO <span>Math</span></span>
      </a>

      <!-- Center: Title Badge -->
      <div class="tekobot-header-badge">
        <span class="tekobot-badge-pill">
          <span class="tekobot-online-dot"></span>
          🤖 Teko Bot
        </span>
        <span class="tekobot-sub-pill hidden-mobile">Plan MEC & Jopara</span>
      </div>

      <!-- Right: User & Actions -->
      <div class="topnav__user">
        <a href="<?= $homeUrl ?>" class="btn btn--secondary btn--sm tekobot-back-btn">
          <span>← Volver al <?= $homeLabel ?></span>
        </a>


        <div class="topnav__user-menu-wrapper" style="position:relative;">
          <button class="topnav__avatar" id="user-menu-btn" aria-label="Menú de usuario" title="<?= $nombre ?>" style="<?= $isDocente ? 'background:var(--purple-600);' : '' ?>">
            <span class="topnav__avatar-letter"><?= $inicialNombre ?></span>
          </button>

          <div class="topnav__user-dropdown" id="user-dropdown">
            <div class="topnav__user-dropdown-header">
              <span class="topnav__user-dropdown-name"><?= $nombre ?></span>
              <span class="topnav__user-dropdown-role <?= $badgeClass ?>"><?= $rolBadge ?></span>
            </div>
            <a href="<?= $homeUrl ?>" class="topnav__user-dropdown-link">
              📊 Volver al <?= $homeLabel ?>
            </a>
            <a href="../01_sistema_principal_y_registro_offline/logout.php" class="topnav__user-dropdown-link topnav__user-dropdown-link--logout">
              🚪 Cerrar sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- ====== TEKOBOT APP CONTAINER ====== -->
  <main class="tekobot-frame-container">
    <iframe 
      id="tekobot-iframe"
      src="TekoBot/Hackaton/index.php" 
      class="tekobot-iframe" 
      title="TekoBot — Tutor Inteligente de Matemáticas"
      allow="fullscreen; clipboard-write; microphone; camera; display-capture"
      loading="eager"
    ></iframe>
  </main>

  <script src="../05_jopamath/jopamath_i18n.js?v=<?= time() ?>"></script>
  <script>
    // Toggle dropdown de usuario
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('topnav__user-dropdown--open');
      });
      document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.remove('topnav__user-dropdown--open');
        }
      });
    }
  </script>
</body>
</html>
