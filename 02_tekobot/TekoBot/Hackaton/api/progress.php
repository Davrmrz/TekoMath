<?php
// api/progress.php - Endpoint para consultar el progreso y las métricas del estudiante
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../services/progress_service.php';

$studentId = (int)($_GET['student_id'] ?? 1);

try {
    $data = ProgressService::getStudentOverview($studentId);
    echo json_encode([
        'success' => true,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
