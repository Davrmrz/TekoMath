<?php
class CurriculumService {
    public static function all(): array {
        static $data;
        return $data ??= json_decode(file_get_contents(__DIR__ . '/../database/curriculum.json'), true, 512, JSON_THROW_ON_ERROR);
    }

    public static function unit(string $topic): ?array {
        foreach (self::all()['units'] as $unit) if ($unit['key'] === $topic) return $unit;
        return null;
    }

    public static function lesson(string $topic, string $subtopic): ?array {
        foreach ((self::unit($topic)['subtopics'] ?? []) as $lesson) if ($lesson['id'] === $subtopic) return $lesson;
        return null;
    }
}
