<?php
/* ============================================
   TEKO MATH — Manejo de Sesiones
   ============================================ */

// Iniciar sesión si no está activa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Verifica si el usuario está logueado.
 * @return bool
 */
function isLoggedIn(): bool {
    return isset($_SESSION['user_id']);
}

/**
 * Obtiene los datos del usuario logueado.
 * @return array|null
 */
function getUser(): ?array {
    if (!isLoggedIn()) {
        return null;
    }

    return [
        'id'     => $_SESSION['user_id'],
        'nombre' => $_SESSION['user_nombre'],
        'email'  => $_SESSION['user_email'],
        'rol'    => $_SESSION['user_rol'],
    ];
}

function getLoginUrl(): string {
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    if (strpos($script, '01_sistema_principal_y_registro_offline') !== false) {
        return 'index.php';
    }
    return '../01_sistema_principal_y_registro_offline/index.php';
}

function getDashboardUrl(): string {
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    if (strpos($script, '01_sistema_principal_y_registro_offline') !== false) {
        return 'dashboard.php';
    }
    return '../01_sistema_principal_y_registro_offline/dashboard.php';
}

function getDocenteUrl(): string {
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    if (strpos($script, '01_sistema_principal_y_registro_offline') !== false) {
        return 'docente.php';
    }
    return '../01_sistema_principal_y_registro_offline/docente.php';
}

/**
 * Redirige si el usuario NO está logueado.
 * Úsalo al inicio de páginas protegidas.
 */
function requireLogin(): void {
    if (!isLoggedIn()) {
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        if (strpos($script, 'api_') !== false) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'No autorizado']);
            exit;
        }
        header('Location: ' . getLoginUrl());
        exit;
    }
}

/**
 * Exige rol de docente.
 */
function requireDocente(): void {
    requireLogin();
    $user = getUser();
    if ($user['rol'] !== 'docente') {
        header('Location: ' . getDashboardUrl());
        exit;
    }
}

/**
 * Exige rol de estudiante.
 */
function requireEstudiante(): void {
    requireLogin();
    $user = getUser();
    if ($user['rol'] !== 'estudiante') {
        header('Location: ' . getDocenteUrl());
        exit;
    }
}

/**
 * Redirige si el usuario YA está logueado según su rol.
 * Úsalo en la página de login para evitar doble sesión.
 */
function redirectIfLoggedIn(): void {
    if (isLoggedIn()) {
        $user = getUser();
        if ($user['rol'] === 'docente') {
            header('Location: ' . getDocenteUrl());
        } else {
            header('Location: ' . getDashboardUrl());
        }
        exit;
    }
}

/**
 * Guarda los datos del usuario en la sesión.
 */
function loginUser(array $user): void {
    $_SESSION['user_id']     = $user['id'];
    $_SESSION['user_nombre'] = $user['nombre'];
    $_SESSION['user_email']  = $user['email'];
    $_SESSION['user_rol']    = $user['rol'];
}

/**
 * Cierra la sesión del usuario.
 */
function logoutUser(): void {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}
