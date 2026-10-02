-- =============================================
-- TEKO MATH — Script de Base de Datos
-- Ejecutar en phpMyAdmin o consola MySQL
-- =============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS teko_math
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE teko_math;

-- =============================================
-- TABLA: usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('estudiante', 'docente') NOT NULL DEFAULT 'estudiante',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: tareas (Misiones de Aprendizaje)
-- =============================================
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
  FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: materiales
-- =============================================
CREATE TABLE IF NOT EXISTS materiales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  docente_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  categoria VARCHAR(100) NOT NULL DEFAULT 'Trigonometría',
  tipo VARCHAR(50) NOT NULL DEFAULT 'Guía Teórica',
  descripcion TEXT,
  enlace VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: progreso_misiones
-- =============================================
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
  FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- USUARIOS DE PRUEBA
-- Contraseñas: todas son "1234" (hash bcrypt)
-- =============================================
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Estudiante Demo', 'estudiante@teko.com', '$2y$10$KvvxMV2gb5XoH/PJ3QG/1ubVQz2BHFMOkxpFTDpRJdEgBTXMBYMOC', 'estudiante'),
  ('Docente Demo', 'docente@teko.com', '$2y$10$KvvxMV2gb5XoH/PJ3QG/1ubVQz2BHFMOkxpFTDpRJdEgBTXMBYMOC', 'docente'),
  ('María García', 'maria@teko.com', '$2y$10$KvvxMV2gb5XoH/PJ3QG/1ubVQz2BHFMOkxpFTDpRJdEgBTXMBYMOC', 'estudiante'),
  ('Carlos López', 'carlos@teko.com', '$2y$10$KvvxMV2gb5XoH/PJ3QG/1ubVQz2BHFMOkxpFTDpRJdEgBTXMBYMOC', 'docente')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

