<?php
/* ============================================
   TEKO MATH — Procesamiento del Login
   Recibe POST del formulario y autentica
   ============================================ */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/session.php';

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}

// Recoger datos del formulario
$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$rol      = $_POST['rol'] ?? 'estudiante';

// Validación básica
$errors = [];

if (empty($email)) {
    $errors[] = 'Ingresa tu correo electrónico o usuario.';
}

if (empty($password)) {
    $errors[] = 'Ingresa tu contraseña.';
}

if (!in_array($rol, ['estudiante', 'docente'])) {
    $rol = 'estudiante';
}

// Si hay errores, regresar al login
if (!empty($errors)) {
    $_SESSION['login_error'] = implode(' ', $errors);
    $_SESSION['login_email'] = $email;
    $_SESSION['login_rol']   = $rol;
    header('Location: index.php');
    exit;
}

// Buscar usuario en la base de datos por email o nombre de usuario
try {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM usuarios WHERE email = :email OR nombre = :nombre LIMIT 1");
    $stmt->execute([
        ':email'  => $email,
        ':nombre' => $email,
    ]);
    $user = $stmt->fetch();
} catch (Exception $e) {
    $_SESSION['login_error'] = 'Error del servidor. Intenta de nuevo.';
    $_SESSION['login_email'] = $email;
    $_SESSION['login_rol']   = $rol;
    header('Location: index.php');
    exit;
}

// Verificar que el usuario existe y la contraseña es correcta
if (!$user || !password_verify($password, $user['password'])) {
    $_SESSION['login_error'] = 'Correo, usuario o contraseña incorrectos.';
    $_SESSION['login_email'] = $email;
    $_SESSION['login_rol']   = $rol;
    header('Location: index.php');
    exit;
}

// ¡Login exitoso! Guardar sesión con su rol real registrado en la BD
loginUser($user);

// Redirigir según el rol guardado en la base de datos
if ($user['rol'] === 'docente') {
    header('Location: docente.php');
} else {
    header('Location: dashboard.php');
}
exit;
