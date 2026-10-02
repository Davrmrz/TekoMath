<?php
/* ============================================
   TEKO MATH — Conexión a Base de Datos
   Config para XAMPP (localhost)
   ============================================ */

// Datos de conexión XAMPP por defecto
define('DB_HOST', 'localhost');
define('DB_NAME', 'teko_math');
define('DB_USER', 'root');
define('DB_PASS', '');        // XAMPP no tiene contraseña por defecto
define('DB_CHARSET', 'utf8mb4');

/**
 * Obtiene una conexión PDO a la base de datos.
 * @return PDO
 */
function getDB(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

            // Auto-crear tablas requeridas si no existen (ejecución individual y segura)
            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS usuarios (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      nombre VARCHAR(100) NOT NULL,
                      email VARCHAR(150) NOT NULL UNIQUE,
                      password VARCHAR(255) NOT NULL,
                      rol ENUM('estudiante', 'docente') NOT NULL DEFAULT 'estudiante',
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
                // Insertar usuarios demo si está vacía
                $checkUsers = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
                if ($checkUsers == 0) {
                    $pass = password_hash('1234', PASSWORD_BCRYPT);
                    $pdo->exec("
                        INSERT INTO usuarios (nombre, email, password, rol) VALUES
                        ('Estudiante Demo', 'estudiante@teko.com', '$pass', 'estudiante'),
                        ('Docente Demo', 'docente@teko.com', '$pass', 'docente'),
                        ('María García', 'maria@teko.com', '$pass', 'estudiante'),
                        ('Carlos López', 'carlos@teko.com', '$pass', 'docente');
                    ");
                }
            } catch (Exception $e) {}

            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS tareas (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      docente_id INT NOT NULL,
                      titulo VARCHAR(200) NOT NULL,
                      tema VARCHAR(100) NOT NULL DEFAULT 'Trigonometría',
                      tipo VARCHAR(50) NOT NULL DEFAULT 'mision',
                      historia TEXT,
                      fecha_entrega DATE NOT NULL,
                      puntos INT DEFAULT 100,
                      instrucciones TEXT,
                      mision_data LONGTEXT,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      INDEX (docente_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            } catch (Exception $e) {}

            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS materiales (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      docente_id INT NOT NULL,
                      titulo VARCHAR(200) NOT NULL,
                      categoria VARCHAR(100) NOT NULL DEFAULT 'Trigonometría',
                      tipo VARCHAR(50) NOT NULL DEFAULT 'Guía Teórica',
                      descripcion TEXT,
                      enlace VARCHAR(500) DEFAULT NULL,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      INDEX (docente_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            } catch (Exception $e) {}

            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS progreso_quizzes (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      estudiante_id INT NOT NULL,
                      tema VARCHAR(100) NOT NULL,
                      dificultad VARCHAR(20) NOT NULL DEFAULT 'facil',
                      aciertos INT NOT NULL DEFAULT 0,
                      total_preguntas INT NOT NULL DEFAULT 5,
                      porcentaje INT NOT NULL DEFAULT 0,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      INDEX (estudiante_id),
                      INDEX (created_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            } catch (Exception $e) {}

            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS progreso_misiones (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      tarea_id INT NOT NULL,
                      estudiante_id INT NOT NULL,
                      dominio_pct INT NOT NULL DEFAULT 0,
                      aciertos INT NOT NULL DEFAULT 0,
                      errores INT NOT NULL DEFAULT 0,
                      intentos INT NOT NULL DEFAULT 0,
                      pistas_usadas INT NOT NULL DEFAULT 0,
                      autocorrecciones INT NOT NULL DEFAULT 0,
                      tiempo_segundos INT NOT NULL DEFAULT 0,
                      desafios_superados INT NOT NULL DEFAULT 0,
                      total_desafios INT NOT NULL DEFAULT 5,
                      conceptos_feedback TEXT,
                      detalles_json LONGTEXT,
                      completado TINYINT(1) NOT NULL DEFAULT 1,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                      INDEX (tarea_id),
                      INDEX (estudiante_id),
                      INDEX (created_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            } catch (Exception $e) {}

            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS salas_clase (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      codigo_pin VARCHAR(10) NOT NULL UNIQUE,
                      docente_id INT NOT NULL,
                      titulo VARCHAR(200) NOT NULL,
                      tema VARCHAR(100) NOT NULL DEFAULT 'Trigonometría',
                      estado VARCHAR(30) NOT NULL DEFAULT 'lobby',
                      pregunta_actual INT NOT NULL DEFAULT 0,
                      tiempo_limite INT NOT NULL DEFAULT 20,
                      timestamp_inicio_pregunta BIGINT DEFAULT 0,
                      preguntas_json LONGTEXT,
                      alumnos_json LONGTEXT,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                      INDEX (codigo_pin),
                      INDEX (docente_id),
                      INDEX (estado)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            } catch (Exception $e) {}

            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS packs_quiz (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      docente_id INT NOT NULL,
                      titulo VARCHAR(200) NOT NULL,
                      tema VARCHAR(100) NOT NULL DEFAULT 'Trigonometría',
                      tiempo_defecto INT NOT NULL DEFAULT 20,
                      preguntas_json LONGTEXT NOT NULL,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                      INDEX (docente_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            } catch (Exception $e) {}

            // Migration check: agregar columnas a tareas si ya existía la tabla vieja
            try {
                $colsStmt = $pdo->query("SHOW COLUMNS FROM tareas LIKE 'mision_data'");
                if ($colsStmt && $colsStmt->rowCount() === 0) {
                    $pdo->exec("ALTER TABLE tareas ADD COLUMN tipo VARCHAR(50) NOT NULL DEFAULT 'mision' AFTER tema");
                    $pdo->exec("ALTER TABLE tareas ADD COLUMN historia TEXT AFTER tipo");
                    $pdo->exec("ALTER TABLE tareas ADD COLUMN mision_data LONGTEXT AFTER instrucciones");
                }
            } catch (Exception $ignored) {}
        } catch (PDOException $e) {
            // En producción nunca muestres el error real
            die("Error de conexión a la base de datos. Verifica que XAMPP esté corriendo y que la base de datos 'teko_math' exista.");
        }
    }

    return $pdo;
}
