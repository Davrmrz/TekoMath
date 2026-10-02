<?php
// api/history.php - Endpoint para obtener el historial completo de una sesión
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';

$sessionId = isset($_GET['session_id']) ? (int)$_GET['session_id'] : 0;
$sessionUuid = $_GET['session_uuid'] ?? null;
$studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 1;
$limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 50;

try {
    if (!$sessionId && $sessionUuid) {
        $stmt = Database::getConnection()->prepare('SELECT id FROM learning_sessions WHERE session_uuid = ? AND student_id = ?');
        $stmt->execute([$sessionUuid, $studentId]);
        $sessionId = (int)$stmt->fetchColumn();
    }

    if (!$sessionId) {
        echo json_encode([
            'success' => true,
            'history' => [],
            'session_id' => null
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $session = Database::getSession($sessionId, $studentId);
    $state = Database::getTutorState($sessionId, $studentId);
    $history = Database::getFullHistory($sessionId, $limit);

    echo json_encode([
        'success' => true,
        'session_id' => $sessionId,
        'tutor_state' => $state,
        'topic' => $session['current_topic'],
        'language' => $session['language_used'],
        'history' => $history
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
