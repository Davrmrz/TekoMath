<?php
// api/chat.php - Endpoint con memoria persistente, gestión de sesiones y multi-tema MEC
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../services/ai_service.php';
require_once __DIR__ . '/../services/pedagogy_service.php';
require_once __DIR__ . '/../services/progress_service.php';
require_once __DIR__ . '/../config/database.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?? [];

$userMessage = trim($data['message'] ?? '');
$studentId = (int)($data['student_id'] ?? 1);
$sessionUuid = $data['session_uuid'] ?? 'default-session';
$language = TutorLanguage::normalize($data['language'] ?? 'jopara');
$context = $data['context'] ?? [];
$startMs = microtime(true);

if (empty($userMessage)) {
    echo json_encode([
        'success' => false,
        'error' => 'El mensaje no puede estar vacío.'
    ]);
    exit;
}

try {
    // Sessions are created only after choosing a unit/subtopic.
    $lookup = Database::getConnection()->prepare('SELECT id FROM learning_sessions WHERE session_uuid = ? AND student_id = ?');
    $lookup->execute([$sessionUuid, $studentId]);
    $sessionId = (int)$lookup->fetchColumn();
    if (!$sessionId) throw new InvalidArgumentException('Seleccioná una unidad y un subtema para iniciar la conversación.');

    $session = Database::getSession($sessionId, $studentId);
    $tutorState = Database::getTutorState($sessionId, $studentId);
    $context['current_topic'] = $session['current_topic'];
    $context['tutor_state'] = $tutorState;
    $context['language'] = $language;
    $chatHistory = Database::getLastNMessages($sessionId, 12);

    if (CurriculumService::lesson($tutorState['topic'], $tutorState['subtopic'])) {
        if ($userMessage === '__init__') {
            echo json_encode(['success'=>true, 'session_id'=>$sessionId, 'tutor_state'=>$tutorState,
                'history'=>Database::getFullHistory($sessionId),
                'response'=>$tutorState['last_response'] ?? PedagogyService::response($tutorState)], JSON_UNESCAPED_UNICODE);
            exit;
        }
        if (isset($data['revision']) && (int)$data['revision'] !== $tutorState['revision']) {
            http_response_code(409);
            echo json_encode(['success'=>false, 'error'=>'La conversación cambió. Recuperamos el último punto.', 'tutor_state'=>$tutorState], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $tutorState['language'] = $language;
        $next = PedagogyService::transition($tutorState, $userMessage, $data['action'] ?? '');
        $next = AIService::interpretWorkshop($next);
        unset($next['last_response']);
        $response = AIService::renderLesson($userMessage, $next, $chatHistory, PedagogyService::response($next));
        // No self-referencing state in the persisted response.
        unset($response['pedagogical_state']);
        $next['last_response'] = $response;
        $pdo = Database::getConnection();
        $pdo->beginTransaction();
        try {
            $next = Database::saveTutorState($sessionId, $studentId, $next, $tutorState['revision']);
            $pdo->prepare('UPDATE learning_sessions SET language_used = ? WHERE id = ? AND student_id = ?')->execute([$language,$sessionId,$studentId]);
            Database::saveMessage($sessionId, $studentId, 'user', $userMessage, null, null, null, 0, false, $next['topic'], $next['subtopic']);
            Database::saveMessage($sessionId, $studentId, 'assistant', $response['tutor_message_jopara'], $response['formula_display']['latex'], json_encode($response['visual_action']), null, 0, false, $next['topic'], $next['subtopic']);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
        // Teaching, examples, questions and self-reports are not scored attempts.
        echo json_encode(['success'=>true, 'session_id'=>$sessionId, 'response'=>$response, 'tutor_state'=>$next], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Si es un mensaje especial de inicialización
    if ($userMessage === '__init__') {
        $history = Database::getFullHistory($sessionId, 50);
        echo json_encode([
            'success' => true,
            'session_id' => $sessionId,
            'tutor_state' => $tutorState,
            'history' => $history
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. Guardar el mensaje del estudiante en la memoria (chat_history)
    Database::saveMessage(
        $sessionId,
        $studentId,
        'user',
        $userMessage,
        null, null, null, 0, false,
        $context['current_topic'] ?? 'trigonometria',
        ''
    );

    // 3. Cargar el historial reciente real de la BD para la memoria contextual de la IA
    $context['history'] = $chatHistory;


    // 4. Procesar interacción con el motor de IA / Fallback Jopara
    $aiResponse = AIService::processInteraction($userMessage, $context);

    // 5. Guardar la respuesta del tutor en la memoria (chat_history)
    $pedagogical = $aiResponse['pedagogical_state'] ?? [];
    $subtopic = $pedagogical['subtopic'] ?? 'sen_cos';
    $errorType = $pedagogical['detected_error_type'] ?? null;
    $hintLevel = (int)($pedagogical['hint_level'] ?? 0);
    $isCorrect = (bool)(($pedagogical['student_state'] ?? '') === 'correct' || ($pedagogical['is_step_complete'] ?? false));
    $exerciseId = $context['current_exercise']['id'] ?? null;
    $responseTimeMs = (int)((microtime(true) - $startMs) * 1000);

    Database::saveMessage(
        $sessionId,
        $studentId,
        'assistant',
        $aiResponse['tutor_message_jopara'] ?? '',
        $aiResponse['formula_display']['latex'] ?? null,
        json_encode($aiResponse['visual_action'] ?? null),
        $errorType,
        $hintLevel,
        $isCorrect,
        $context['current_topic'] ?? 'trigonometria',
        $subtopic,
        $responseTimeMs
    );

    // 6. Registrar en el log de progreso y métricas
    ProgressService::logInteraction(
        $studentId,
        $sessionId,
        $exerciseId,
        $subtopic,
        $userMessage,
        $aiResponse['tutor_message_jopara'] ?? '',
        $errorType,
        $hintLevel,
        $isCorrect,
        $responseTimeMs
    );

    // 7. Obtener resumen de progreso actualizado
    $progressOverview = ProgressService::getStudentOverview($studentId);

    echo json_encode([
        'success' => true,
        'session_id' => $sessionId,
        'response' => $aiResponse,
        'tutor_state' => $tutorState,
        'updated_progress' => $progressOverview
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error procesando la solicitud: ' . $e->getMessage()
    ]);
}
