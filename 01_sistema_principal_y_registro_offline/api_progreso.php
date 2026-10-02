<?php
/* ============================================
   TEKO MATH — API de Progreso de Quizzes (api_progreso.php)
   Registra y consulta el avance de los estudiantes en quizzes
   ============================================ */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/database.php';

requireLogin();

$user = getUser();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET: Obtener historial o reporte de progreso
if ($method === 'GET') {
    try {
        if ($user['rol'] === 'docente') {
            // Obtener progreso detallado de todos los estudiantes para el docente
            $stmt = $db->query("
                SELECT p.*, u.nombre AS estudiante_nombre, u.email AS estudiante_email
                FROM progreso_quizzes p
                JOIN usuarios u ON p.estudiante_id = u.id
                ORDER BY p.created_at DESC
                LIMIT 50
            ");
            $progresos = $stmt->fetchAll();

            // Estadísticas resumidas por estudiante
            $resumenStmt = $db->query("
                SELECT 
                    u.id, u.nombre, u.email,
                    COUNT(p.id) AS total_quizzes,
                    COALESCE(ROUND(AVG(p.porcentaje)), 0) AS promedio_score,
                    MAX(p.created_at) AS ultima_practica
                FROM usuarios u
                LEFT JOIN progreso_quizzes p ON u.id = p.estudiante_id
                WHERE u.rol = 'estudiante'
                GROUP BY u.id, u.nombre, u.email
                ORDER BY promedio_score DESC, total_quizzes DESC
            ");
            $resumenEstudiantes = $resumenStmt->fetchAll();

            echo json_encode([
                'success' => true,
                'progresos' => $progresos,
                'resumen' => $resumenEstudiantes
            ]);
        } else {
            // Estudiante consulta su propio historial
            $stmt = $db->prepare("
                SELECT *
                FROM progreso_quizzes
                WHERE estudiante_id = :uid
                ORDER BY created_at DESC
                LIMIT 20
            ");
            $stmt->execute([':uid' => $user['id']]);
            $misProgresos = $stmt->fetchAll();

            echo json_encode(['success' => true, 'progresos' => $misProgresos]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al consultar progreso']);
    }
    exit;
}

// POST: Registrar quiz completado por un estudiante
if ($method === 'POST') {
    $tema = trim($_POST['tema'] ?? 'Trigonometría');
    $dificultad = trim($_POST['dificultad'] ?? 'facil');
    $aciertos = (int)($_POST['aciertos'] ?? 0);
    $total = (int)($_POST['total_preguntas'] ?? 5);
    $porcentaje = $total > 0 ? (int)round(($aciertos / $total) * 100) : 0;

    try {
        $stmt = $db->prepare("
            INSERT INTO progreso_quizzes (estudiante_id, tema, dificultad, aciertos, total_preguntas, porcentaje)
            VALUES (:uid, :tema, :dificultad, :aciertos, :total, :porcentaje)
        ");
        $stmt->execute([
            ':uid'         => $user['id'],
            ':tema'        => $tema,
            ':dificultad'  => $dificultad,
            ':aciertos'    => $aciertos,
            ':total'       => $total,
            ':porcentaje'  => $porcentaje
        ]);

        $newId = $db->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Progreso guardado exitosamente',
            'id' => (int)$newId,
            'porcentaje' => $porcentaje
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al guardar el progreso']);
    }
    exit;
}
