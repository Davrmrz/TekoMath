<?php
// config/database.php - Conexión PDO con gestión de historial, memoria y fallback SQLite
require_once __DIR__ . '/env.php';
require_once __DIR__ . '/../services/tutor_state.php';

class Database {
    private static bool $stateTableReady = false;
    private static ?PDO $instance = null;
    private static string $driverUsed = 'mysql';

    public static function getConnection(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $driver = env('DB_DRIVER', 'mysql');
        $host   = env('DB_HOST', '127.0.0.1');
        $db     = env('DB_NAME', 'kyhyjey_db');
        $user   = env('DB_USER', 'root');
        $pass   = env('DB_PASS', '');

        if ($driver === 'mysql') {
            try {
                $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ];
                self::$instance = new PDO($dsn, $user, $pass, $options);
                self::$driverUsed = 'mysql';
                return self::$instance;
            } catch (PDOException $e) {
                try {
                    $dsnRoot = "mysql:host={$host};charset=utf8mb4";
                    $tempPdo = new PDO($dsnRoot, $user, $pass);
                    $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `{$db}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                    $tempPdo = null;

                    self::$instance = new PDO("mysql:host={$host};dbname={$db};charset=utf8mb4", $user, $pass, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]);
                    self::runSchemaFile(self::$instance);
                    self::$driverUsed = 'mysql';
                    return self::$instance;
                } catch (Exception $ex) {
                    return self::connectSqlite();
                }
            }
        } else {
            return self::connectSqlite();
        }
    }

    private static function connectSqlite(): PDO {
        $sqlitePath = __DIR__ . '/../database/kyhyjey.sqlite';
        $needsInit = !file_exists($sqlitePath);
        
        self::$instance = new PDO("sqlite:" . $sqlitePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        self::$driverUsed = 'sqlite';

        if ($needsInit) {
            self::initSqliteTables(self::$instance);
        }

        return self::$instance;
    }

    public static function getDriverUsed(): string {
        return self::$driverUsed;
    }

    // ── GESTIÓN DE SESIONES Y MEMORIA DE CHAT ──────────────────────

    public static function getOrCreateSession(string $uuid, int $studentId, string $lang = 'jopara', string $topic = 'trigonometria'): int {
        if (!preg_match('/^[a-zA-Z0-9_-]{1,36}$/', $uuid) || $studentId < 1) {
            throw new InvalidArgumentException('Identificador inválido.');
        }
        $pdo = self::getConnection();
        $stmt = $pdo->prepare("SELECT id, student_id FROM learning_sessions WHERE session_uuid = ?");
        $stmt->execute([$uuid]);
        $row = $stmt->fetch();
        if ($row) {
            if ((int)$row['student_id'] !== $studentId) throw new RuntimeException('Conversación no disponible.');
            return (int)$row['id'];
        }

        $stmtIns = $pdo->prepare("INSERT INTO learning_sessions (session_uuid, student_id, language_used, current_topic) VALUES (?, ?, ?, ?)");
        try {
            $stmtIns->execute([$uuid, $studentId, $lang, $topic]);
        } catch (PDOException $e) {
            $stmt->execute([$uuid]);
            $row = $stmt->fetch();
            if ($row && (int)$row['student_id'] === $studentId) return (int)$row['id'];
            throw $e;
        }
        return (int)$pdo->lastInsertId();
    }

    public static function getSession(int $id, int $studentId): array {
        $stmt = self::getConnection()->prepare('SELECT * FROM learning_sessions WHERE id = ? AND student_id = ?');
        $stmt->execute([$id, $studentId]);
        $row = $stmt->fetch();
        if (!$row) throw new RuntimeException('Conversación no disponible.');
        return $row;
    }

    public static function getTutorState(int $id, int $studentId, string $subtopic = ''): array {
        $session = self::getSession($id, $studentId);
        $pdo = self::getConnection();
        // Additive migration for new and existing MySQL/SQLite installations.
        if (!self::$stateTableReady) {
        $pdo->exec('CREATE TABLE IF NOT EXISTS tutor_session_states (
            session_id INTEGER PRIMARY KEY, state_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1
        )');
        self::$stateTableReady = true;
        }
        $insert = self::getDriverUsed() === 'sqlite' ? 'INSERT OR IGNORE' : 'INSERT IGNORE';
        $stmt = $pdo->prepare("$insert INTO tutor_session_states (session_id, state_json) VALUES (?, ?)");
        $stmt->execute([$id, json_encode(TutorState::initial($session['current_topic'], $subtopic), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
        $stmt = $pdo->prepare('SELECT state_json FROM tutor_session_states WHERE session_id = ?');
        $stmt->execute([$id]);
        $state = json_decode($stmt->fetchColumn(), true, 512, JSON_THROW_ON_ERROR);
        if (($state['schema_version'] ?? 1) < 2 && CurriculumService::unit($session['current_topic'])) {
            $revision = $state['revision'];
            $state = TutorState::initial($session['current_topic']);
            $state['revision'] = $revision + 1;
            $update = $pdo->prepare('UPDATE tutor_session_states SET state_json = ?, revision = ? WHERE session_id = ? AND revision = ?');
            $update->execute([json_encode($state, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $state['revision'], $id, $revision]);
            if ($update->rowCount() !== 1) return self::getTutorState($id, $studentId);
        }
        return $state;
    }

    public static function saveTutorState(int $id, int $studentId, array $state, int $expectedRevision): array {
        $current = self::getTutorState($id, $studentId);
        if (($state['topic'] ?? null) !== $current['topic'] || !in_array($state['mode'] ?? '', TutorState::MODES, true)) {
            throw new InvalidArgumentException('Estado pedagógico inválido.');
        }
        $state['revision'] = $expectedRevision + 1;
        $stmt = self::getConnection()->prepare('UPDATE tutor_session_states SET state_json = ?, revision = ? WHERE session_id = ? AND revision = ?');
        $stmt->execute([json_encode($state, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $state['revision'], $id, $expectedRevision]);
        if ($stmt->rowCount() !== 1) throw new RuntimeException('La conversación cambió; volvé a cargarla.');
        return $state;
    }

    public static function saveMessage(
        int $sessionId, 
        int $studentId, 
        string $role, 
        string $message, 
        ?string $formulaLatex = null, 
        ?string $visualActionJson = null, 
        ?string $errorType = null, 
        int $hintLevel = 0, 
        bool $isCorrect = false, 
        string $topic = 'trigonometria', 
        string $subtopic = '', 
        int $responseTimeMs = 0
    ): void {
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->prepare("
                INSERT INTO chat_history 
                (session_id, student_id, role, message, formula_latex, visual_action_json, detected_error_type, hint_level, is_correct, topic, subtopic, response_time_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $sessionId, $studentId, $role, $message, $formulaLatex, $visualActionJson, $errorType, $hintLevel, $isCorrect ? 1 : 0, $topic, $subtopic, $responseTimeMs
            ]);

            // Actualizar total de interacciones de la sesión
            $upd = $pdo->prepare("UPDATE learning_sessions SET total_interactions = total_interactions + 1 WHERE id = ?");
            $upd->execute([$sessionId]);
        } catch (Exception $e) {
            error_log("Error guardando mensaje en chat_history: " . $e->getMessage());
            if (self::getConnection()->inTransaction()) throw $e;
        }
    }

    public static function getLastNMessages(int $sessionId, int $limit = 12): array {
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->prepare("
                SELECT role, message, formula_latex, topic, subtopic, created_at 
                FROM chat_history 
                WHERE session_id = ? 
                ORDER BY id DESC LIMIT ?
            ");
            $stmt->execute([$sessionId, $limit]);
            $rows = $stmt->fetchAll();
            return array_reverse($rows);
        } catch (Exception $e) {
            return [];
        }
    }

    public static function getFullHistory(int $sessionId, int $limit = 50): array {
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->prepare("
                SELECT role, message, formula_latex, visual_action_json, detected_error_type, hint_level, is_correct, topic, subtopic, created_at 
                FROM chat_history 
                WHERE session_id = ? 
                ORDER BY id DESC LIMIT ?
            ");
            $stmt->execute([$sessionId, $limit]);
            return array_reverse($stmt->fetchAll());
        } catch (Exception $e) {
            return [];
        }
    }

    private static function runSchemaFile(PDO $pdo): void {
        $file = __DIR__ . '/../database/schema.sql';
        if (file_exists($file)) {
            $sql = file_get_contents($file);
            $statements = array_filter(array_map('trim', explode(';', $sql)));
            foreach ($statements as $stmt) {
                if (!empty($stmt)) {
                    try { $pdo->exec($stmt); } catch (Exception $e) {}
                }
            }
        }
    }

    private static function initSqliteTables(PDO $pdo): void {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL DEFAULT 'Temimbo''e',
                email TEXT NULL UNIQUE,
                school TEXT NULL,
                grade TEXT NOT NULL DEFAULT '1er Curso Media',
                preferred_language TEXT NOT NULL DEFAULT 'jopara',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME NULL
            );
            CREATE TABLE IF NOT EXISTS learning_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_uuid TEXT NOT NULL UNIQUE,
                student_id INTEGER NOT NULL,
                language_used TEXT NOT NULL DEFAULT 'jopara',
                current_topic TEXT NOT NULL DEFAULT 'trigonometria',
                total_interactions INTEGER NOT NULL DEFAULT 0,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ended_at DATETIME NULL
            );
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user','assistant')),
                message TEXT NOT NULL,
                formula_latex TEXT NULL,
                visual_action_json TEXT NULL,
                detected_error_type TEXT NULL,
                hint_level INTEGER NOT NULL DEFAULT 0,
                is_correct INTEGER NOT NULL DEFAULT 0,
                topic TEXT NULL,
                subtopic TEXT NULL,
                response_time_ms INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS curriculum_topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_number INTEGER NOT NULL,
                topic_key TEXT NOT NULL UNIQUE,
                topic_name_es TEXT NOT NULL,
                topic_name_jopara TEXT NOT NULL,
                subtopics_json TEXT NOT NULL,
                curriculum_year INTEGER NOT NULL DEFAULT 1,
                is_core INTEGER NOT NULL DEFAULT 0,
                color_hex TEXT NOT NULL DEFAULT '#3b82f6',
                icon TEXT NOT NULL DEFAULT '📚'
            );
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                subtopic TEXT NOT NULL,
                unit_number INTEGER NOT NULL DEFAULT 1,
                difficulty_level INTEGER NOT NULL DEFAULT 1,
                statement_jopara TEXT NOT NULL,
                statement_es TEXT NOT NULL,
                formula_latex TEXT NULL,
                visual_type TEXT NOT NULL DEFAULT 'none',
                initial_angle INTEGER NOT NULL DEFAULT 0,
                expected_value TEXT NOT NULL,
                hint_level_0 TEXT NULL, hint_level_1 TEXT NULL,
                hint_level_2 TEXT NULL, hint_level_3 TEXT NULL, hint_level_4 TEXT NULL,
                quick_options_json TEXT NULL,
                curriculum_ref TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS student_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                topic TEXT NOT NULL,
                subtopic TEXT NOT NULL,
                mastery_percentage REAL NOT NULL DEFAULT 0.0,
                total_attempts INTEGER NOT NULL DEFAULT 0,
                correct_direct INTEGER NOT NULL DEFAULT 0,
                correct_with_hints INTEGER NOT NULL DEFAULT 0,
                total_errors INTEGER NOT NULL DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, topic, subtopic)
            );
            CREATE TABLE IF NOT EXISTS diagnostic_tests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                session_id INTEGER NULL,
                test_type TEXT NOT NULL,
                topic TEXT NOT NULL DEFAULT 'trigonometria',
                score REAL NOT NULL DEFAULT 0.0,
                total_questions INTEGER NOT NULL DEFAULT 5,
                correct_answers INTEGER NOT NULL DEFAULT 0,
                duration_seconds INTEGER NOT NULL DEFAULT 0,
                details_json TEXT NULL,
                completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            INSERT OR IGNORE INTO students (id, name, grade, preferred_language) VALUES (1, 'Temimbo''e Demo', '1er Curso Media', 'jopara');
        ");
    }
}
