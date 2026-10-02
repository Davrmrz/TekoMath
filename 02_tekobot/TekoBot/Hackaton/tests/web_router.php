<?php
// Test server only: php -S 127.0.0.1:8127 tests/web_router.php
// Uses a disposable SQLite database and disables paid/external AI calls.
require_once __DIR__.'/../config/database.php';
putenv('GEMINI_API_KEY=');
$file=sys_get_temp_dir().'/kyhyjey-stage2-test.sqlite';
$pdo=new PDO('sqlite:'.$file,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$ref=new ReflectionClass(Database::class);
$ref->getProperty('instance')->setValue(null,$pdo);
$ref->getProperty('driverUsed')->setValue(null,'sqlite');
if (!$pdo->query("SELECT name FROM sqlite_master WHERE name='learning_sessions'")->fetch()) $ref->getMethod('initSqliteTables')->invoke(null,$pdo);
return false;
