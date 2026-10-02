<?php
/* ============================================
   TEKO MATH — Página de Registro (registro.php)
   ============================================ */
require_once __DIR__ . '/config/session.php';

// Si ya está logueado, redirigir al dashboard
redirectIfLoggedIn();

// Recuperar flash data si hubo error
$regError  = $_SESSION['reg_error']  ?? '';
$regNombre = $_SESSION['reg_nombre'] ?? '';
$regEmail  = $_SESSION['reg_email']  ?? '';
$regRol    = $_SESSION['reg_rol']    ?? 'estudiante';

// Limpiar flash data
unset($_SESSION['reg_error'], $_SESSION['reg_nombre'], $_SESSION['reg_email'], $_SESSION['reg_rol']);
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Crea tu cuenta en TEKO Math. Únete a la comunidad de aprendizaje interactivo de matemáticas.">
  <title>TEKO Math — Crear cuenta</title>
  <link rel="stylesheet" href="../07_diseno_y_graficos/style.css?v=20260926-logos">
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

  <!-- ====== REGISTRO PAGE ====== -->
  <main class="login-page" id="registro-page">

    <!-- Brand Header -->
    <header class="brand anim-fade-up">
      <div class="brand__logo">
        <a href="index.php" style="display:inline-flex; align-items:center; gap:var(--space-sm); text-decoration:none; color:inherit;">
          <img class="brand__icon brand__icon--mascot" id="brand-icon" src="../07_diseno_y_graficos/assets/images/logo-login.jpg" alt="Mascota de TEKO Math" width="56" height="56">
          <h1 class="brand__name">TEKO <span>Math</span></h1>
        </a>
      </div>
      <p class="brand__tagline">
        Comienza hoy tu aventura matemática
      </p>
      <br>
      <span class="brand__tagline-highlight">🚀 Registro rápido y gratuito</span>
    </header>

    <!-- Registration Card -->
    <section class="login-card anim-scale-in" aria-label="Formulario de registro">

      <h2 class="login-card__title">Crear nueva cuenta</h2>

      <?php if ($regError): ?>
        <div class="login-error" id="reg-error">
          <span class="login-error__icon">⚠️</span>
          <span class="login-error__text"><?= htmlspecialchars($regError) ?></span>
        </div>
      <?php endif; ?>

      <!-- Role Selector -->
      <div class="role-selector" id="role-selector" data-active="<?= $regRol === 'docente' ? 'teacher' : 'student' ?>" role="radiogroup" aria-label="Tipo de usuario">
        <div class="role-selector__slider"></div>
        <button 
          type="button"
          class="role-selector__option role-selector__option--student <?= $regRol !== 'docente' ? 'role-selector__option--active' : '' ?>" 
          id="role-student"
          role="radio"
          aria-checked="<?= $regRol !== 'docente' ? 'true' : 'false' ?>"
          tabindex="<?= $regRol !== 'docente' ? '0' : '-1' ?>"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
          </svg>
          Estudiante
        </button>
        <button 
          type="button"
          class="role-selector__option role-selector__option--teacher <?= $regRol === 'docente' ? 'role-selector__option--active' : '' ?>" 
          id="role-teacher"
          role="radio"
          aria-checked="<?= $regRol === 'docente' ? 'true' : 'false' ?>"
          tabindex="<?= $regRol === 'docente' ? '0' : '-1' ?>"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
          </svg>
          Docente (🧪 Experimental)
        </button>
      </div>

      <!-- Registration Form -->
      <form id="registro-form" action="registro_process.php" method="POST" autocomplete="off">
        <input type="hidden" name="rol" id="rol-input" value="<?= $regRol === 'docente' ? 'docente' : 'estudiante' ?>">

        <div class="form-group anim-fade-up-delay-1">
          <label class="form-label" for="nombre">Nombre completo</label>
          <input 
            class="form-input <?= $regRol === 'docente' ? 'purple-focus' : '' ?>" 
            type="text" 
            id="nombre" 
            name="nombre"
            placeholder="Ej: Laura Pérez"
            value="<?= htmlspecialchars($regNombre) ?>"
            required
          >
        </div>

        <div class="form-group anim-fade-up-delay-1">
          <label class="form-label" for="email">Correo electrónico</label>
          <input 
            class="form-input <?= $regRol === 'docente' ? 'purple-focus' : '' ?>" 
            type="email" 
            id="email" 
            name="email"
            placeholder="nombre@correo.com"
            value="<?= htmlspecialchars($regEmail) ?>"
            required
          >
        </div>

        <div class="form-group anim-fade-up-delay-2">
          <label class="form-label" for="password">Contraseña</label>
          <input 
            class="form-input <?= $regRol === 'docente' ? 'purple-focus' : '' ?>" 
            type="password" 
            id="password" 
            name="password"
            placeholder="Mínimo 4 caracteres"
            required
          >
        </div>

        <div class="form-group anim-fade-up-delay-2">
          <label class="form-label" for="password_confirm">Confirmar contraseña</label>
          <input 
            class="form-input <?= $regRol === 'docente' ? 'purple-focus' : '' ?>" 
            type="password" 
            id="password_confirm" 
            name="password_confirm"
            placeholder="Repite tu contraseña"
            required
          >
        </div>

        <div class="anim-fade-up-delay-3">
          <button type="submit" class="btn btn--primary <?= $regRol === 'docente' ? 'btn--purple' : '' ?>" id="registro-btn">
            Registrarme en TEKO Math
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </button>
        </div>
      </form>

      <!-- Switch to Login -->
      <div class="auth-switch anim-fade-up-delay-3">
        <span>¿Ya tienes una cuenta?</span>
        <a href="index.php" class="auth-switch__link <?= $regRol === 'docente' ? 'purple-link' : '' ?>" id="login-switch-link">
          Inicia sesión aquí →
        </a>
      </div>

    </section>

    <!-- Footer -->
    <footer class="login-footer anim-fade-up-delay-3">
      <p class="login-footer__text">TEKO Math © 2026 — Plataforma educativa</p>
    </footer>

  </main>

  <script src="script.js"></script>
  <script src="../05_jopamath/jopamath_i18n.js?v=<?= time() ?>"></script>
</body>
</html>
