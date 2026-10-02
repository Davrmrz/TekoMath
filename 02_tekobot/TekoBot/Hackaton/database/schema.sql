-- =====================================================================
-- KYHYJE'Ỹ IA — Esquema de Base de Datos para Producción Web
-- Tutor Matemático en Guaraní Jopara — Plan MEC 1er Año Paraguay
-- MySQL / MariaDB (utf8mb4)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `kyhyjey_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `kyhyjey_db`;

-- ---------------------------------------------------------------
-- 1. Estudiantes / Usuarios
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
    `id`                 INT AUTO_INCREMENT PRIMARY KEY,
    `name`               VARCHAR(120) NOT NULL DEFAULT 'Temimbo''e',
    `email`              VARCHAR(180) NULL UNIQUE,
    `school`             VARCHAR(150) NULL,
    `grade`              VARCHAR(60)  NOT NULL DEFAULT '1er Curso Media',
    `preferred_language` ENUM('jopara','es_py','es') NOT NULL DEFAULT 'jopara',
    `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_login`         TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 2. Sesiones de Aprendizaje
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_sessions` (
    `id`                  INT AUTO_INCREMENT PRIMARY KEY,
    `session_uuid`        VARCHAR(36) NOT NULL UNIQUE,
    `student_id`          INT NOT NULL,
    `language_used`       ENUM('jopara','es_py','es') NOT NULL DEFAULT 'jopara',
    `current_topic`       VARCHAR(60) NOT NULL DEFAULT 'trigonometria',
    `total_interactions`  INT NOT NULL DEFAULT 0,
    `started_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ended_at`            TIMESTAMP NULL,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    INDEX idx_uuid (`session_uuid`),
    INDEX idx_student (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 3. Historial de Chat / Memoria de la IA
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_history` (
    `id`                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    `session_id`         INT NOT NULL,
    `student_id`         INT NOT NULL,
    `role`               ENUM('user','assistant') NOT NULL,
    `message`            TEXT NOT NULL,
    `formula_latex`      TEXT NULL,
    `visual_action_json` TEXT NULL,
    `detected_error_type` VARCHAR(60) NULL,
    `hint_level`         TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_correct`         TINYINT(1) NOT NULL DEFAULT 0,
    `topic`              VARCHAR(60) NULL,
    `subtopic`           VARCHAR(60) NULL,
    `response_time_ms`   INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`)  REFERENCES `learning_sessions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_id`)  REFERENCES `students`(`id`) ON DELETE CASCADE,
    INDEX idx_session_role (`session_id`, `role`),
    INDEX idx_student_date (`student_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 4. Currículo MEC — Unidades Temáticas del 1er Año
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `curriculum_topics` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `unit_number`      TINYINT UNSIGNED NOT NULL,
    `topic_key`        VARCHAR(60) NOT NULL UNIQUE,
    `topic_name_es`    VARCHAR(150) NOT NULL,
    `topic_name_jopara` VARCHAR(200) NOT NULL,
    `subtopics_json`   JSON NOT NULL,
    `curriculum_year`  TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `is_core`          TINYINT(1) NOT NULL DEFAULT 0,
    `color_hex`        VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    `icon`             VARCHAR(8) NOT NULL DEFAULT '📚',
    `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_unit (`unit_number`),
    INDEX idx_year  (`curriculum_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 5. Banco de Ejercicios (Todos los temas del MEC)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exercises` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `topic`            VARCHAR(60) NOT NULL,
    `subtopic`         VARCHAR(60) NOT NULL,
    `unit_number`      TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `difficulty_level` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `statement_jopara` TEXT NOT NULL,
    `statement_es`     TEXT NOT NULL,
    `formula_latex`    VARCHAR(500) NULL,
    `visual_type`      ENUM('unit_circle','function_graph','triangle','number_line','venn','cartesian','table','none') NOT NULL DEFAULT 'none',
    `initial_angle`    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `expected_value`   VARCHAR(150) NOT NULL,
    `hint_level_0`     TEXT NULL,
    `hint_level_1`     TEXT NULL,
    `hint_level_2`     TEXT NULL,
    `hint_level_3`     TEXT NULL,
    `hint_level_4`     TEXT NULL,
    `quick_options_json` JSON NULL,
    `curriculum_ref`   VARCHAR(120) NULL,
    `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_topic_sub (`topic`, `subtopic`),
    INDEX idx_difficulty (`difficulty_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 6. Progreso del Estudiante por Tema y Subtema
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_progress` (
    `id`                  INT AUTO_INCREMENT PRIMARY KEY,
    `student_id`          INT NOT NULL,
    `topic`               VARCHAR(60) NOT NULL,
    `subtopic`            VARCHAR(60) NOT NULL,
    `mastery_percentage`  DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `total_attempts`      INT UNSIGNED NOT NULL DEFAULT 0,
    `correct_direct`      INT UNSIGNED NOT NULL DEFAULT 0,
    `correct_with_hints`  INT UNSIGNED NOT NULL DEFAULT 0,
    `total_errors`        INT UNSIGNED NOT NULL DEFAULT 0,
    `last_updated`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_topic_sub (`student_id`, `topic`, `subtopic`),
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 7. Evaluaciones Diagnósticas Pre/Post por Tema
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `diagnostic_tests` (
    `id`              INT AUTO_INCREMENT PRIMARY KEY,
    `student_id`      INT NOT NULL,
    `session_id`      INT NULL,
    `test_type`       ENUM('pre_test','post_test') NOT NULL,
    `topic`           VARCHAR(60) NOT NULL DEFAULT 'trigonometria',
    `score`           DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `total_questions` TINYINT UNSIGNED NOT NULL DEFAULT 5,
    `correct_answers` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `duration_seconds` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `details_json`    JSON NULL,
    `completed_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    INDEX idx_student_topic (`student_id`, `topic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DATOS DEL CURRÍCULO MEC — 1ER AÑO EDUCACIÓN MEDIA PARAGUAY
-- =====================================================================
INSERT INTO `curriculum_topics`
  (`unit_number`,`topic_key`,`topic_name_es`,`topic_name_jopara`,`subtopics_json`,`curriculum_year`,`is_core`,`color_hex`,`icon`)
VALUES
(1,'numeros_reales','Números Reales y sus Propiedades','Papapy Reáles ha omba''e mba''éichagua',
 JSON_ARRAY('Conjuntos numéricos','Números naturales','Números enteros','Números racionales','Números irracionales','Recta real','Valor absoluto','Operaciones y propiedades'),
 1,0,'#6366f1','🔢'),
(2,'conjuntos','Conjuntos y Operaciones','Peteĩva ha imba''e joja',
 JSON_ARRAY('Definición de conjunto','Notaciones','Subconjuntos','Unión e intersección','Diferencia y complemento','Diagramas de Venn','Producto cartesiano'),
 1,0,'#8b5cf6','🔵'),
(3,'funciones','Funciones y sus Representaciones','Función ha imba''e rekáva',
 JSON_ARRAY('Relaciones y funciones','Dominio y recorrido','Representaciones','Función identidad','Función constante','Función a trozos','Composición'),
 1,0,'#ec4899','📈'),
(4,'funciones_lineales','Funciones Lineales y Cuadráticas','Función lineal ha cuadrática',
 JSON_ARRAY('Función lineal','Pendiente e intercepto','Función afín','Función cuadrática','Parábola','Vértice y eje de simetría','Forma canónica'),
 1,0,'#f59e0b','📉'),
(5,'ecuaciones','Ecuaciones e Inecuaciones','Ecuación ha inecuación',
 JSON_ARRAY('Ecuaciones de primer grado','Ecuaciones de segundo grado','Fórmula general','Sistemas de ecuaciones','Inecuaciones lineales','Valor absoluto en ecuaciones'),
 1,0,'#10b981','🟰'),
(6,'geometria','Geometría Analítica y Plano Cartesiano','Geometría analítica ha plano cartesiano',
 JSON_ARRAY('Plano cartesiano','Distancia entre puntos','Punto medio','Recta en el plano','Pendiente','Ecuación de la recta','Círculo','Cónicas básicas'),
 1,0,'#14b8a6','📐'),
(7,'trigonometria','Trigonometría y Funciones Trigonométricas','Trigonometría ha función trigonométrica',
 JSON_ARRAY('Concepto de ángulo','Grados y radianes','Razones trigonométricas','Seno coseno tangente','Circunferencia trigonométrica','Cuadrantes y signos','Ángulos notables','Función seno','Función coseno','Función tangente','Amplitud y período','Transformaciones','Identidades básicas'),
 1,1,'#2563eb','📏'),
(8,'estadistica','Estadística Descriptiva','Estadística descriptiva',
 JSON_ARRAY('Datos y variables','Tablas de frecuencia','Gráficos estadísticos','Media aritmética','Mediana y moda','Rango y desviación','Cuartiles','Interpretación de datos'),
 1,0,'#f97316','📊')
ON DUPLICATE KEY UPDATE `topic_name_es` = VALUES(`topic_name_es`);

INSERT INTO `students` (`id`, `name`, `grade`, `preferred_language`)
VALUES (1, 'Temimbo\'e Demo', '1er Curso Media', 'jopara')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
