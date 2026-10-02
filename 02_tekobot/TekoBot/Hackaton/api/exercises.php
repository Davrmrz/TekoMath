<?php
// api/exercises.php - Retorna el banco de ejercicios de trigonometría
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = Database::getConnection();
    $subtopic = $_GET['subtopic'] ?? null;
    $difficulty = isset($_GET['difficulty']) ? (int)$_GET['difficulty'] : null;

    $sql = "SELECT * FROM exercises WHERE 1=1";
    $params = [];

    if ($subtopic) {
        $sql .= " AND subtopic = ?";
        $params[] = $subtopic;
    }
    if ($difficulty) {
        $sql .= " AND difficulty_level = ?";
        $params[] = $difficulty;
    }

    $sql .= " ORDER BY difficulty_level ASC, id ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $exercises = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'exercises' => $exercises
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
