<?php
// services/progress_service.php - Gestión de métricas pedagógicas, maestría y diagnósticos
require_once __DIR__ . '/../config/database.php';

class ProgressService {

    /**
     * Registra una interacción en el log pedagógico
     */
    public static function logInteraction(int $studentId, int $sessionId, ?int $exerciseId, ?string $subtopic, string $userMsg, string $aiResponse, ?string $errorType, int $hintLevel, bool $isCorrect, int $responseTime = 0): void {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("
                INSERT INTO interaction_logs 
                (session_id, exercise_id, subtopic, user_message, ai_response_jopara, detected_error_type, hint_level_given, is_correct, response_time_seconds)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $sessionId, $exerciseId, $subtopic, $userMsg, $aiResponse, $errorType, $hintLevel, $isCorrect ? 1 : 0, $responseTime
            ]);

            // Actualizar maestría del estudiante
            if ($subtopic) {
                self::updateStudentProgress($studentId, $subtopic, $isCorrect, $hintLevel, $errorType !== null);
            }
        } catch (Exception $e) {
            error_log("Error logging interaction: " . $e->getMessage());
        }
    }

    /**
     * Actualiza la tabla student_progress calculando la maestría ponderada
     */
    public static function updateStudentProgress(int $studentId, string $subtopic, bool $isCorrect, int $hintLevel, bool $hasError): void {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM student_progress WHERE student_id = ? AND subtopic = ?");
        $stmt->execute([$studentId, $subtopic]);
        $row = $stmt->fetch();

        $totalAttempts = ($row['total_attempts'] ?? 0) + 1;
        $correctDirect = ($row['correct_direct'] ?? 0) + ($isCorrect && $hintLevel === 0 ? 1 : 0);
        $correctWithHints = ($row['correct_with_hints'] ?? 0) + ($isCorrect && $hintLevel > 0 ? 1 : 0);
        $totalErrors = ($row['total_errors'] ?? 0) + ($hasError ? 1 : 0);

        // Cálculo de Maestría Ponderada:
        // Directo = 1.0, Con pista leve = 0.7, Con pista alta = 0.4
        $points = ($correctDirect * 100.0) + ($correctWithHints * 65.0);
        $mastery = min(100.0, round($points / max(1, $totalAttempts), 1));

        if ($row) {
            $update = $pdo->prepare("
                UPDATE student_progress 
                SET mastery_percentage = ?, total_attempts = ?, correct_direct = ?, correct_with_hints = ?, total_errors = ?
                WHERE student_id = ? AND subtopic = ?
            ");
            $update->execute([$mastery, $totalAttempts, $correctDirect, $correctWithHints, $totalErrors, $studentId, $subtopic]);
        } else {
            $insert = $pdo->prepare("
                INSERT INTO student_progress (student_id, subtopic, mastery_percentage, total_attempts, correct_direct, correct_with_hints, total_errors)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $insert->execute([$studentId, $subtopic, $mastery, $totalAttempts, $correctDirect, $correctWithHints, $totalErrors]);
        }
    }

    /**
     * Obtiene el resumen de progreso general del estudiante por subtemas
     */
    public static function getStudentOverview(int $studentId = 1): array {
        $pdo = Database::getConnection();

        $subtopics = [
            'angulos' => ['title' => 'Concepto de Ángulos', 'default' => 0.0],
            'cuadrantes' => ['title' => 'Plano y Cuadrantes', 'default' => 0.0],
            'sen_cos' => ['title' => 'Seno, Coseno y Signos', 'default' => 0.0],
            'angulos_notables' => ['title' => 'Ángulos Notables y Ref.', 'default' => 0.0],
            'graficas' => ['title' => 'Gráficas, Amplitud y Período', 'default' => 0.0]
        ];

        $stmt = $pdo->prepare("SELECT * FROM student_progress WHERE student_id = ?");
        $stmt->execute([$studentId]);
        $rows = $stmt->fetchAll();
        $dbData = [];
        foreach ($rows as $r) {
            $dbData[$r['subtopic']] = $r;
        }

        $result = [];
        $totalSum = 0;
        foreach ($subtopics as $key => $meta) {
            $pct = isset($dbData[$key]) ? (float)$dbData[$key]['mastery_percentage'] : $meta['default'];
            $result[$key] = [
                'subtopic' => $key,
                'title' => $meta['title'],
                'mastery_percentage' => $pct,
                'total_attempts' => $dbData[$key]['total_attempts'] ?? 0,
                'total_errors' => $dbData[$key]['total_errors'] ?? 0
            ];
            $totalSum += $pct;
        }

        $globalMastery = round($totalSum / count($subtopics), 1);

        // Obtener última evaluación diagnóstica
        $stmtTest = $pdo->prepare("SELECT test_type, score, correct_answers, total_questions, completed_at FROM diagnostic_tests WHERE student_id = ? ORDER BY id DESC LIMIT 2");
        $stmtTest->execute([$studentId]);
        $diagnostics = $stmtTest->fetchAll();

        return [
            'student_id' => $studentId,
            'global_mastery' => $globalMastery,
            'subtopics' => array_values($result),
            'diagnostics' => $diagnostics
        ];
    }

    /**
     * Guarda el resultado de un Pre-Test o Post-Test
     */
    public static function saveDiagnostic(int $studentId, string $testType, int $correct, int $total, int $duration, array $details): array {
        $pdo = Database::getConnection();
        $score = round(($correct / max(1, $total)) * 100.0, 1);

        $stmt = $pdo->prepare("
            INSERT INTO diagnostic_tests (student_id, test_type, score, total_questions, correct_answers, duration_seconds, details_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $studentId, $testType, $score, $total, $correct, $duration, json_encode($details, JSON_UNESCAPED_UNICODE)
        ]);

        return [
            'success' => true,
            'test_type' => $testType,
            'score' => $score,
            'correct' => $correct,
            'total' => $total
        ];
    }
}
