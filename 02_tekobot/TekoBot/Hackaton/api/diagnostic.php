<?php
// api/diagnostic.php - Endpoint para gestionar Pre-Test y Post-Test diagnósticos
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../services/progress_service.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?? [];

    $studentId = (int)($data['student_id'] ?? 1);
    $testType = ($data['test_type'] === 'post_test') ? 'post_test' : 'pre_test';
    $correct = (int)($data['correct_answers'] ?? 0);
    $total = (int)($data['total_questions'] ?? 5);
    $duration = (int)($data['duration_seconds'] ?? 0);
    $details = $data['details'] ?? [];

    $result = ProgressService::saveDiagnostic($studentId, $testType, $correct, $total, $duration, $details);
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    exit;
}

// Preguntas fijas para el test diagnóstico
$questions = [
    [
        'id' => 1,
        'question' => '¿En qué cuadrante se encuentra el ángulo de 135°?',
        'options' => ['Primer Cuadrante (I)', 'Segundo Cuadrante (II)', 'Tercer Cuadrante (III)', 'Cuarto Cuadrante (IV)'],
        'correct_index' => 1,
        'subtopic' => 'cuadrantes'
    ],
    [
        'id' => 2,
        'question' => '¿Cuál es el signo del coseno en el segundo cuadrante?',
        'options' => ['Positivo (+)', 'Negativo (-)', 'Cero', 'Indefinido'],
        'correct_index' => 1,
        'subtopic' => 'sen_cos'
    ],
    [
        'id' => 3,
        'question' => '¿Cuál es el ángulo de referencia de 210°?',
        'options' => ['30°', '45°', '60°', '210°'],
        'correct_index' => 0,
        'subtopic' => 'angulos_notables'
    ],
    [
        'id' => 4,
        'question' => '¿Cuánto equivale π radianes en grados sexagesimales?',
        'options' => ['90°', '180°', '270°', '360°'],
        'correct_index' => 1,
        'subtopic' => 'angulos'
    ],
    [
        'id' => 5,
        'question' => 'En la función y = 3 sen(x), ¿cuál es su amplitud?',
        'options' => ['1', '2', '3', '2π'],
        'correct_index' => 2,
        'subtopic' => 'graficas'
    ]
];

echo json_encode([
    'success' => true,
    'questions' => $questions
], JSON_UNESCAPED_UNICODE);
