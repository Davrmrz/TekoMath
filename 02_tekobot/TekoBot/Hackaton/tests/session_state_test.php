<?php
require_once __DIR__ . '/../config/database.php';

function check(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

// Isolated database: never modifies the application's saved conversations.
$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$class = new ReflectionClass(Database::class);
$class->getProperty('instance')->setValue(null, $pdo);
$class->getProperty('driverUsed')->setValue(null, 'sqlite');
$class->getMethod('initSqliteTables')->invoke(null, $pdo);

$id = Database::getOrCreateSession('test_one', 1, 'jopara', 'ecuaciones');
check(Database::getOrCreateSession('test_one', 1) === $id, 'Retry must reuse session');
$state = Database::getTutorState($id, 1);
check($state['topic'] === 'ecuaciones', 'Topic must survive reopening');
check($state['mode'] === 'TOPIC_SELECTED', 'Initial mode');
$state['mode'] = 'QUESTION_MODE';
$state['lesson']['section_id'] = 'despeje';
$state['return_stack'][] = ['mode' => 'TEACHING_MODE', 'section_id' => 'despeje'];
$saved = Database::saveTutorState($id, 1, $state, 1);
check(Database::getTutorState($id, 1) === $saved, 'Interrupted lesson must persist');
try {
    Database::saveTutorState($id, 1, $state, 1);
    throw new LogicException('Stale update accepted');
} catch (RuntimeException $e) {}
$other = Database::getOrCreateSession('test_two', 1, 'es', 'trigonometria');
check(Database::getTutorState($other, 1)['mode'] === 'TOPIC_SELECTED', 'Sessions must be independent');
try {
    Database::getOrCreateSession('test_one', 2);
    throw new LogicException('Wrong student accepted');
} catch (RuntimeException $e) {}
Database::saveMessage($id, 1, 'user', 'Mi duda', null, null, null, 0, false, 'ecuaciones');
check(Database::getLastNMessages($id)[0]['message'] === 'Mi duda', 'History contract');
check(count(Database::getFullHistory($other)) === 0, 'History isolation');
Database::saveMessage($id, 1, 'assistant', 'Respuesta');
Database::saveMessage($id, 1, 'user', 'Última duda');
check(array_column(Database::getFullHistory($id, 2), 'message') === ['Respuesta', 'Última duda'], 'Restore latest messages in chronological order');
echo "PASS: session retry, ownership, migration, state persistence, revision conflict and history isolation\n";
