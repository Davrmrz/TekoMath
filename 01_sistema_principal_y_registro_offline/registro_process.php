<?php
/* ============================================
   TEKO MATH — Procesamiento de Registro
   Crea nuevos usuarios en MySQL
   ============================================ */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/session.php';

// Solo aceptar peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: registro.php');
    exit;
}

// Recoger datos del formulario
$nombre           = trim($_POST['nombre'] ?? '');
$email            = trim($_POST['email'] ?? '');
$password         = $_POST['password'] ?? '';
$password_confirm = $_POST['password_confirm'] ?? '';
$rol              = $_POST['rol'] ?? 'estudiante';

// Validaciones
$errors = [];

if (empty($nombre) || mb_strlen($nombre) < 2) {
    $errors[] = 'Ingresa tu nombre completo (mínimo 2 caracteres).';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Ingresa un correo electrónico válido.';
}

if (empty($password) || mb_strlen($password) < 4) {
    $errors[] = 'La contraseña debe tener al menos 4 caracteres.';
}

if ($password !== $password_confirm) {
    $errors[] = 'Las contraseñas no coinciden.';
}

if (!in_array($rol, ['estudiante', 'docente'])) {
    $rol = 'estudiante';
}

// Si hay errores de validación local
if (!empty($errors)) {
    $_SESSION['reg_error']  = implode(' ', $errors);
    $_SESSION['reg_nombre'] = $nombre;
    $_SESSION['reg_email']  = $email;
    $_SESSION['reg_rol']    = $rol;
    header('Location: registro.php');
    exit;
}

try {
    $db = getDB();

    // Comprobar si el correo ya existe
    $stmt = $db->prepare("SELECT id FROM usuarios WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        $_SESSION['reg_error']  = 'Este correo ya se encuentra registrado. Intenta iniciar sesión.';
        $_SESSION['reg_nombre'] = $nombre;
        $_SESSION['reg_email']  = $email;
        $_SESSION['reg_rol']    = $rol;
        header('Location: registro.php');
        exit;
    }

    // Hashear la contraseña con bcrypt
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // Insertar nuevo usuario
    $insertStmt = $db->prepare("
        INSERT INTO usuarios (nombre, email, password, rol)
        VALUES (:nombre, :email, :password, :rol)
    ");
    $insertStmt->execute([
        ':nombre'   => $nombre,
        ':email'    => $email,
        ':password' => $hashedPassword,
        ':rol'      => $rol
    ]);

    $newUserId = $db->lastInsertId();

    // Obtener datos del usuario recién registrado
    $userStmt = $db->prepare("SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = :id LIMIT 1");
    $userStmt->execute([':id' => $newUserId]);
    $newUser = $userStmt->fetch();

    if ($newUser) {
        // Iniciar sesión automáticamente
        loginUser($newUser);
        if ($newUser['rol'] === 'docente') {
            header('Location: docente.php');
        } else {
            header('Location: dashboard.php');
        }
        exit;
    } else {
        $_SESSION['login_success'] = '¡Registro exitoso! Ya puedes iniciar sesión.';
        header('Location: index.php');
        exit;
    }

} catch (Exception $e) {
    $_SESSION['reg_error']  = 'Error al procesar el registro: ' . htmlspecialchars($e->getMessage());
    $_SESSION['reg_nombre'] = $nombre;
    $_SESSION['reg_email']  = $email;
    $_SESSION['reg_rol']    = $rol;
    header('Location: registro.php');
    exit;
}
