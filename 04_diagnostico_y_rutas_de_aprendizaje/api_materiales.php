<?php
/* ============================================
   TEKO MATH — API de Materiales (api_materiales.php)
   Gestión de recursos y contenidos de clase
   ============================================ */
header('Content-Type: application/json; charset=utf-8');
if (file_exists(__DIR__ . '/config/session.php')) {
    require_once __DIR__ . '/config/session.php';
    require_once __DIR__ . '/config/database.php';
} else {
    require_once __DIR__ . '/../01_sistema_principal_y_registro_offline/config/session.php';
    require_once __DIR__ . '/../01_sistema_principal_y_registro_offline/config/database.php';
}

requireLogin();

$user = getUser();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Handle action parameter for DELETE via POST if needed
$action = $_GET['action'] ?? $_POST['action'] ?? null;

// GET: Obtener todos los materiales
if ($method === 'GET') {
    try {
        $stmt = $db->query("
            SELECT m.id, m.docente_id, m.titulo, m.categoria, m.tipo, m.descripcion, m.enlace, m.created_at,
                   u.nombre AS docente_nombre
            FROM materiales m
            LEFT JOIN usuarios u ON m.docente_id = u.id
            ORDER BY m.created_at DESC
        ");
        $materiales = $stmt->fetchAll();
        echo json_encode(['success' => true, 'materiales' => $materiales]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al consultar materiales']);
    }
    exit;
}

// POST: Crear o eliminar material
if ($method === 'POST') {
    // Eliminar material
    if ($action === 'delete') {
        if ($user['rol'] !== 'docente') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo los docentes pueden eliminar materiales']);
            exit;
        }

        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID de material inválido']);
            exit;
        }

        try {
            $stmt = $db->prepare("DELETE FROM materiales WHERE id = :id AND docente_id = :docente_id");
            $stmt->execute([':id' => $id, ':docente_id' => $user['id']]);

            if ($stmt->rowCount() === 0) {
                $stmt2 = $db->prepare("DELETE FROM materiales WHERE id = :id");
                $stmt2->execute([':id' => $id]);
            }

            echo json_encode(['success' => true, 'message' => 'Material eliminado correctamente']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al eliminar el material']);
        }
        exit;
    }

    // Crear nuevo material
    if ($user['rol'] !== 'docente') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Solo los docentes pueden publicar materiales']);
        exit;
    }

    $titulo = trim($_POST['titulo'] ?? '');
    $categoria = trim($_POST['categoria'] ?? 'Trigonometría');
    $tipo = trim($_POST['tipo'] ?? 'Guía Teórica');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $enlace = trim($_POST['enlace'] ?? '');

    if (empty($titulo)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El título del material es obligatorio']);
        exit;
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO materiales (docente_id, titulo, categoria, tipo, descripcion, enlace)
            VALUES (:docente_id, :titulo, :categoria, :tipo, :descripcion, :enlace)
        ");
        $stmt->execute([
            ':docente_id'   => $user['id'],
            ':titulo'       => $titulo,
            ':categoria'    => $categoria,
            ':tipo'         => $tipo,
            ':descripcion'  => $descripcion,
            ':enlace'       => $enlace ?: null
        ]);

        $newId = $db->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Material publicado exitosamente',
            'material' => [
                'id' => (int)$newId,
                'docente_id' => $user['id'],
                'docente_nombre' => $user['nombre'],
                'titulo' => $titulo,
                'categoria' => $categoria,
                'tipo' => $tipo,
                'descripcion' => $descripcion,
                'enlace' => $enlace ?: null,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al guardar el material en la base de datos']);
    }
    exit;
}
