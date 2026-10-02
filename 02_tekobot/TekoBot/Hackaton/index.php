<?php
// index.php - Punto de entrada principal de TekoBot
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

// Inicializar conexión / base de datos de manera silenciosa y resiliente
try {
    $pdo = Database::getConnection();
} catch (Exception $e) {
    // Si ocurre un error, la app seguirá funcionando en modo frontend/offline
}

// Renderizar Vistas
// Both entry points share the same accessible UI and module order.
readfile(__DIR__ . '/index.html');
