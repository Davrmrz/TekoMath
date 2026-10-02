<?php
/* ============================================
   TEKO MATH — API de Estudiantes (api_estudiantes.php)
   Listado de alumnos registrados para docentes
   ============================================ */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/database.php';

requireDocente();

$db = getDB();

try {
    $stmt = $db->query("
        SELECT id, nombre, email, created_at
        FROM usuarios
        WHERE rol = 'estudiante'
        ORDER BY nombre ASC
    ");
    $estudiantes = $stmt->fetchAll();
    echo json_encode(['success' => true, 'estudiantes' => $estudiantes]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al obtener lista de estudiantes']);
}
