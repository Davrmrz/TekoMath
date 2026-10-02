<?php
require_once __DIR__ . '/curriculum_service.php';
// Versioned server-owned pedagogical contract.
class TutorState {
    public const MODES = ['TOPIC_SELECTED', 'TEACHING_MODE', 'EXAMPLE_MODE',
        'QUESTION_MODE', 'CHECK_UNDERSTANDING', 'READY_CHECK', 'PRACTICE_MODE',
        'REMEDIATION_MODE', 'REVIEW_MODE', 'COMPLETED'];

    public static function initial(string $topic, string $subtopic = ''): array {
        $unit = CurriculumService::unit($topic);
        if ($unit && $subtopic === '') $subtopic = $unit['subtopics'][0]['id'];
        $lesson = CurriculumService::lesson($topic, $subtopic);
        return [
            'schema_version' => 2, 'topic' => $topic, 'subtopic' => $subtopic,
            'unit_id' => $unit['id'] ?? null,
            'mode' => 'TOPIC_SELECTED',
            'lesson' => ['section_id' => $lesson['sections'][0]['id'] ?? null, 'step' => 0, 'variant' => 0, 'completed_sections' => []],
            'return_stack' => [], 'active_exercise_id' => null,
            'hint_level' => 0, 'assistance_level' => 3, 'difficulty_level' => 1,
            'error_counts' => [], 'recent_evidence' => [],
            'remediation_target' => null, 'revision' => 1
        ];
    }
}
