<?php
// api/upload_image.php - Endpoint para recepción y OCR de fotos de cuadernos
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../services/image_service.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['exercise_image'])) {
    $res = ImageService::processExerciseImage($_FILES['exercise_image']);
    echo json_encode($res, JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['success' => false, 'error' => 'No se recibió ninguna imagen válida.']);