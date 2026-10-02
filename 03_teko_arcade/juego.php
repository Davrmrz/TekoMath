<?php
/* ============================================
   TEKO MATH — TEKO Arcade (juego.php)
   Integración de TEKOARCADE con soporte completo
   ============================================ */
require_once __DIR__ . '/../01_sistema_principal_y_registro_offline/config/session.php';

// Proteger página — accesible para cualquier usuario autenticado
requireLogin();

$user = getUser();
$nombre = htmlspecialchars($user['nombre']);
$inicialNombre = mb_strtoupper(mb_substr($user['nombre'], 0, 1));
$rol = $user['rol'];
$isDocente = ($rol === 'docente');
$backUrl = $isDocente ? '../01_sistema_principal_y_registro_offline/docente.php' : '../01_sistema_principal_y_registro_offline/dashboard.php';
$homeLabel = $isDocente ? 'Panel Docente (🧪 Experimental)' : 'Escritorio';
$rolBadge = $isDocente ? '👨‍🏫 Docente (🧪 Experimental)' : '🎒 Estudiante';
$badgeClass = $isDocente ? 'pill--purple' : 'pill--green';
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="TEKO Math — TEKO Arcade: Juegos y Desafíos Matemáticos Gamificados.">
  <title>TEKO Math — TEKO Arcade 🎮</title>
  <link rel="stylesheet" href="../07_diseno_y_graficos/style.css?v=<?= time() ?>">
  <link rel="stylesheet" href="../07_diseno_y_graficos/dashboard.css?v=<?= time() ?>">
  <link rel="stylesheet" href="juego.css?v=<?= time() ?>">
  <link rel="icon" type="image/png" href="../02_tekobot/TekoBot/Hackaton/assets/images/tejuxi-face.png?v=20260926">
</head>
<body class="arcade-page-body">

  <!-- ====== TOP NAVIGATION ====== -->
  <nav class="topnav topnav--arcade" id="topnav">
    <div class="topnav__inner">
      <!-- Left: Brand -->
      <a href="<?= $backUrl ?>" class="topnav__brand">
        <div class="topnav__icon" style="background:#f59e0b;color:#1a1a1a;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;border:2px solid #000;box-shadow:2px 2px 0 #000;">
          <span style="font-size:1.15rem;">🎮</span>
        </div>
        <span class="topnav__logo-text">TEKO <span style="color:#d97706;">Arcade</span></span>
      </a>

      <!-- Center: Badge -->
      <div class="arcade-header-badge">
        <span class="arcade-badge-pill">
          ⚡ Desafíos Gamificados
        </span>
      </div>

      <!-- Right: User Menu & Navigation -->
      <div class="topnav__user">
        <a href="<?= $backUrl ?>" class="btn btn--secondary btn--sm" style="font-weight:700;font-size:0.82rem;gap:6px;">
          ← Volver al <?= $homeLabel ?>
        </a>

        <!-- User Dropdown Menu -->
        <div class="topnav__user-menu-wrapper" style="position:relative;">
          <button class="topnav__avatar" id="user-menu-btn" aria-label="Menú de usuario" title="<?= $nombre ?>" style="background:<?= $isDocente ? 'var(--purple-600)' : '#f59e0b' ?>;">
            <span class="topnav__avatar-letter"><?= $inicialNombre ?></span>
          </button>

          <div class="topnav__user-dropdown" id="user-dropdown">
            <div class="topnav__user-dropdown-header">
              <span class="topnav__user-dropdown-name"><?= $nombre ?></span>
              <span class="topnav__user-dropdown-role <?= $badgeClass ?>"><?= $rolBadge ?></span>
            </div>
            <a href="<?= $backUrl ?>" class="topnav__user-dropdown-link">
              📊 Volver al <?= $homeLabel ?>
            </a>
            <a href="../02_tekobot/chat.php" class="topnav__user-dropdown-link">
              🤖 TekoBot
            </a>
            <a href="../04_diagnostico_y_rutas_de_aprendizaje/tekobeta.php" class="topnav__user-dropdown-link">
              🧪 TekoBeta
            </a>
            <a href="../01_sistema_principal_y_registro_offline/logout.php" class="topnav__user-dropdown-link topnav__user-dropdown-link--logout">
              🚪 Cerrar sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- ====== TEKOARCADE APPLICATION CONTAINER ====== -->
  <main class="arcade-frame-container">
    <iframe 
      id="arcade-iframe"
      src="TEKOARCADE/JUEGOS/dist/index.html?user=<?= urlencode($nombre) ?>&role=<?= urlencode($rol) ?>&_v=<?= time() ?>" 
      class="arcade-iframe" 
      title="TEKO Arcade — Juegos Matemáticos"
      allow="fullscreen; clipboard-write; gamepad"
      loading="eager"
    ></iframe>
  </main>

  <script src="../05_jopamath/jopamath_i18n.js?v=<?= time() ?>"></script>
  <script>
    // Sincronizar perfil con localStorage para TEKO Arcade
    try {
      localStorage.setItem('teko_user_nombre', <?= json_encode($nombre) ?>);
      localStorage.setItem('teko_user_rol', <?= json_encode($rol) ?>);
    } catch(e) {}

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
