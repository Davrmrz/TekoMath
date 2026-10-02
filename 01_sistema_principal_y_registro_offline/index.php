<?php
/* ============================================
   TEKO MATH — Página de Login (index.php)
   ============================================ */
require_once __DIR__ . '/config/session.php';

// Si ya está logueado, redirigir al dashboard
redirectIfLoggedIn();

// Recuperar error flash y datos previos
$loginError   = $_SESSION['login_error']   ?? '';
$loginSuccess = $_SESSION['login_success'] ?? '';
$loginEmail   = $_SESSION['login_email']   ?? '';
$loginRol     = $_SESSION['login_rol']     ?? 'estudiante';

// Limpiar flash data
unset($_SESSION['login_error'], $_SESSION['login_success'], $_SESSION['login_email'], $_SESSION['login_rol']);
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="TEKO Math — Plataforma educativa de Matemáticas. Aprende, practica y domina las matemáticas con herramientas interactivas.">
  <title>TEKO Math — Iniciar sesión</title>
  <link rel="stylesheet" href="../07_diseno_y_graficos/style.css">
  <link rel="icon" type="image/png" href="../02_tekobot/TekoBot/Hackaton/assets/images/tejuxi-face.png?v=20260926">
</head>
<body>

  <!-- ====== GRAPH PAPER BACKGROUND ====== -->
  <div class="graph-bg" aria-hidden="true"></div>

  <!-- ====== MATH DECORATIONS ====== -->
  <div class="math-decorations" aria-hidden="true">
    <span class="math-deco math-deco--1">∫</span>
    <span class="math-deco math-deco--2">π</span>
    <span class="math-deco math-deco--3">Σ</span>
    <span class="math-deco math-deco--4">∞</span>
    <span class="math-deco math-deco--5">Δ</span>
    <span class="math-deco math-deco--6">θ</span>
    <span class="math-deco math-deco--7">√</span>

    <!-- SVG Sine Wave -->
    <svg class="math-wave" viewBox="0 0 600 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 40 C50 10, 100 10, 150 40 S250 70, 300 40 S400 10, 450 40 S550 70, 600 40" 
            stroke="#0f5132" stroke-width="2.5" fill="none"/>
    </svg>

    <!-- Axis lines -->
    <div class="math-axis"></div>

    <!-- SVG Parabola -->
    <svg class="math-parabola" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 110 Q90 -20 170 110" stroke="#4a1880" stroke-width="2.5" fill="none"/>
    </svg>
  </div>

  <!-- ====== FLOATING SHAPES ====== -->
  <div class="math-float math-float--circle-green" aria-hidden="true"></div>
  <div class="math-float math-float--square-purple" aria-hidden="true"></div>
  <div class="math-float math-float--triangle" aria-hidden="true"></div>
  <div class="math-float math-float--plus" aria-hidden="true">+</div>
  <div class="math-float math-float--equals" aria-hidden="true">=</div>

  <!-- ====== LOGIN PAGE ====== -->
  <main class="login-page" id="login-page">

    <!-- Brand -->
    <header class="brand anim-fade-up">
      <div class="brand__logo">
        <!-- Logo Icon -->
        <img class="brand__icon brand__icon--mascot" id="brand-icon" src="../07_diseno_y_graficos/assets/images/logo-login.jpg" alt="Mascota de TEKO Math" width="56" height="56">
        <h1 class="brand__name">TEKO <span>Math</span></h1>
      </div>
      <p class="brand__tagline">
        Tu plataforma para aprender Matemáticas
      </p>
      <br>
      <span class="brand__tagline-highlight">📐 Practica · Aprende · Domina</span>
    </header>

    <!-- Login Card -->
    <section class="login-card anim-scale-in" aria-label="Formulario de inicio de sesión">

      <h2 class="login-card__title">Iniciar sesión</h2>

      <?php if ($loginSuccess): ?>
        <div class="login-success" id="login-success">
          <span class="login-error__icon">🎉</span>
          <span class="login-error__text"><?= htmlspecialchars($loginSuccess) ?></span>
        </div>
      <?php endif; ?>

      <?php if ($loginError): ?>
        <div class="login-error" id="login-error">
          <span class="login-error__icon">⚠️</span>
          <span class="login-error__text"><?= htmlspecialchars($loginError) ?></span>
        </div>
      <?php endif; ?>

      <!-- Role Selector -->
      <div class="role-selector" id="role-selector" data-active="<?= $loginRol === 'docente' ? 'teacher' : 'student' ?>" role="radiogroup" aria-label="Tipo de usuario">
        <div class="role-selector__slider"></div>
        <button 
          type="button"
          class="role-selector__option role-selector__option--student <?= $loginRol !== 'docente' ? 'role-selector__option--active' : '' ?>" 
          id="role-student"
          role="radio"
          aria-checked="<?= $loginRol !== 'docente' ? 'true' : 'false' ?>"
          tabindex="<?= $loginRol !== 'docente' ? '0' : '-1' ?>"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
          </svg>
          Estudiante
        </button>
        <button 
          type="button"
          class="role-selector__option role-selector__option--teacher <?= $loginRol === 'docente' ? 'role-selector__option--active' : '' ?>" 
          id="role-teacher"
          role="radio"
          aria-checked="<?= $loginRol === 'docente' ? 'true' : 'false' ?>"
          tabindex="<?= $loginRol === 'docente' ? '0' : '-1' ?>"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
          </svg>
          Docente (🧪 Experimental)
        </button>
      </div>

      <!-- Form — POST a auth.php -->
      <form id="login-form" action="auth.php" method="POST" autocomplete="off">
        <!-- Hidden field para el rol -->
        <input type="hidden" name="rol" id="rol-input" value="<?= $loginRol === 'docente' ? 'docente' : 'estudiante' ?>">

        <div class="form-group anim-fade-up-delay-1">
          <label class="form-label" for="email">Correo electrónico o usuario</label>
          <input 
            class="form-input <?= $loginRol === 'docente' ? 'purple-focus' : '' ?>" 
            type="text" 
            id="email" 
            name="email"
            placeholder="nombre@correo.com"
            autocomplete="username"
            value="<?= htmlspecialchars($loginEmail) ?>"
            required
          >
        </div>

        <div class="form-group anim-fade-up-delay-2">
          <label class="form-label" for="password">Contraseña</label>
          <input 
            class="form-input <?= $loginRol === 'docente' ? 'purple-focus' : '' ?>" 
            type="password" 
            id="password" 
            name="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          >
        </div>

        <div class="anim-fade-up-delay-3">
          <button type="submit" class="btn btn--primary <?= $loginRol === 'docente' ? 'btn--purple' : '' ?>" id="login-btn">
            Iniciar sesión
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </button>
        </div>
      </form>

      <!-- Switch to Register -->
      <div class="auth-switch anim-fade-up-delay-3">
        <span>¿No tienes una cuenta?</span>
        <a href="registro.php" class="auth-switch__link <?= $loginRol === 'docente' ? 'purple-link' : '' ?>" id="register-switch-link">
          Regístrate gratis aquí →
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="login-footer anim-fade-up-delay-3">
      <p class="login-footer__text">TEKO Math © 2026 — Plataforma educativa</p>
    </footer>

  </main>

  <script src="../05_jopamath/jopamath_i18n.js?v=<?= time() ?>"></script>
  <script src="script.js"></script>
</body>
</html>
