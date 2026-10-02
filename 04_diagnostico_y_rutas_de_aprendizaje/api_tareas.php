<?php
/* ============================================
   TEKO MATH — API de Misiones y Tareas (api_tareas.php)
   Gestión de Misiones de Aprendizaje y progreso para docentes y estudiantes
   ============================================ */
header('Content-Type: application/json; charset=utf-8');
if (file_exists(__DIR__ . '/config/session.php')) {
    require_once __DIR__ . '/config/session.php';
    require_once __DIR__ . '/config/database.php';
    require_once __DIR__ . '/config/misiones_data.php';
} else {
    require_once __DIR__ . '/../01_sistema_principal_y_registro_offline/config/session.php';
    require_once __DIR__ . '/../01_sistema_principal_y_registro_offline/config/database.php';
    require_once __DIR__ . '/../01_sistema_principal_y_registro_offline/config/misiones_data.php';
}

requireLogin();

$user = getUser();
$db = getDB();
asegurarMisionesDemo($db, 2);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? null;

// ============================================
// GET: Consultas
// ============================================
if ($method === 'GET') {
    // 1. Obtener catálogo de plantillas de misiones para docentes
    if ($action === 'catalogo') {
        echo json_encode([
            'success' => true,
            'catalogo' => getMisionesCatalogo()
        ]);
        exit;
    }

    // 2. Obtener detalle completo de una misión específica
    if ($action === 'detalle') {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID de misión inválido']);
            exit;
        }

        try {
            $stmt = $db->prepare("
                SELECT t.*, u.nombre AS docente_nombre
                FROM tareas t
                LEFT JOIN usuarios u ON t.docente_id = u.id
                WHERE t.id = :id
            ");
            $stmt->execute([':id' => $id]);
            $tarea = $stmt->fetch();

            if (!$tarea) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Misión no encontrada']);
                exit;
            }

            // Parsear mision_data
            $misionData = null;
            if (!empty($tarea['mision_data'])) {
                $misionData = json_decode($tarea['mision_data'], true);
            }
            if (!$misionData) {
                // Fallback a plantilla default si no tenía data estructurada
                $misionData = getMisionPorId('trig_cuadrantes');
                $misionData['titulo'] = $tarea['titulo'];
            }

            // Obtener progreso del estudiante actual si aplica
            $progreso = null;
            if ($user['rol'] === 'estudiante') {
                $progStmt = $db->prepare("
                    SELECT * FROM progreso_misiones
                    WHERE tarea_id = :tid AND estudiante_id = :uid
                    ORDER BY id DESC LIMIT 1
                ");
                $progStmt->execute([':tid' => $id, ':uid' => $user['id']]);
                $progreso = $progStmt->fetch();
            }

            echo json_encode([
                'success' => true,
                'mision' => $tarea,
                'mision_data' => $misionData,
                'progreso' => $progreso
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al consultar misión: ' . $e->getMessage()]);
        }
        exit;
    }

    // 3. Reporte de misiones para docente
    if ($action === 'reporte_docente') {
        if ($user['rol'] !== 'docente') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Acceso denegado']);
            exit;
        }

        try {
            $stmt = $db->query("
                SELECT pm.*, t.titulo AS mision_titulo, t.tema AS mision_tema,
                       u.nombre AS estudiante_nombre, u.email AS estudiante_email
                FROM progreso_misiones pm
                JOIN tareas t ON pm.tarea_id = t.id
                JOIN usuarios u ON pm.estudiante_id = u.id
                ORDER BY pm.created_at DESC
                LIMIT 100
            ");
            $reportes = $stmt->fetchAll();

            echo json_encode(['success' => true, 'reportes' => $reportes]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al consultar reportes']);
        }
        exit;
    }

    // 4. Listado general de misiones / tareas
    try {
        $stmt = $db->query("
            SELECT t.id, t.docente_id, t.titulo, t.tema, t.tipo, t.historia,
                   t.fecha_entrega, t.puntos, t.instrucciones, t.mision_data, t.created_at,
                   u.nombre AS docente_nombre
            FROM tareas t
            LEFT JOIN usuarios u ON t.docente_id = u.id
            ORDER BY t.created_at DESC
        ");
        $tareas = $stmt->fetchAll();

        // Si es estudiante, anexar estado de completitud y dominio
        if ($user['rol'] === 'estudiante') {
            $misProgresosStmt = $db->prepare("
                SELECT tarea_id, dominio_pct, aciertos, errores, intentos, pistas_usadas, autocorrecciones, tiempo_segundos, conceptos_feedback, completado, created_at
                FROM progreso_misiones
                WHERE estudiante_id = :uid
            ");
            $misProgresosStmt->execute([':uid' => $user['id']]);
            $progresosMap = [];
            foreach ($misProgresosStmt->fetchAll() as $p) {
                $progresosMap[$p['tarea_id']] = $p;
            }

            foreach ($tareas as &$t) {
                if (isset($progresosMap[$t['id']])) {
                    $t['progreso_estudiante'] = $progresosMap[$t['id']];
                } else {
                    $t['progreso_estudiante'] = null;
                }
            }
        }

        echo json_encode(['success' => true, 'tareas' => $tareas]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al consultar tareas']);
    }
    exit;
}

// ============================================
// POST: Crear, Eliminar, Guardar Progreso
// ============================================
if ($method === 'POST') {
    // 1. Guardar progreso de una misión completada por estudiante
    if ($action === 'guardar_progreso_mision') {
        if ($user['rol'] !== 'estudiante') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo los estudiantes pueden registrar progreso de misiones']);
            exit;
        }

        $tareaId = (int)($_POST['tarea_id'] ?? 0);
        $dominioPct = (int)($_POST['dominio_pct'] ?? 0);
        $aciertos = (int)($_POST['aciertos'] ?? 0);
        $errores = (int)($_POST['errores'] ?? 0);
        $intentos = (int)($_POST['intentos'] ?? 0);
        $pistasUsadas = (int)($_POST['pistas_usadas'] ?? 0);
        $autocorrecciones = (int)($_POST['autocorrecciones'] ?? 0);
        $tiempoSegundos = (int)($_POST['tiempo_segundos'] ?? 0);
        $desafiosSuperados = (int)($_POST['desafios_superados'] ?? 0);
        $totalDesafios = (int)($_POST['total_desafios'] ?? 5);
        $conceptosFeedback = trim($_POST['conceptos_feedback'] ?? '{}');
        $detallesJson = trim($_POST['detalles_json'] ?? '{}');

        if ($tareaId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID de misión inválido']);
            exit;
        }

        try {
            // Verificar si ya existe registro para actualizarlo o insertar nuevo
            $checkStmt = $db->prepare("SELECT id FROM progreso_misiones WHERE tarea_id = :tid AND estudiante_id = :uid");
            $checkStmt->execute([':tid' => $tareaId, ':uid' => $user['id']]);
            $existente = $checkStmt->fetch();

            if ($existente) {
                $stmt = $db->prepare("
                    UPDATE progreso_misiones SET
                        dominio_pct = :dominio_pct,
                        aciertos = :aciertos,
                        errores = :errores,
                        intentos = :intentos,
                        pistas_usadas = :pistas_usadas,
                        autocorrecciones = :autocorrecciones,
                        tiempo_segundos = :tiempo_segundos,
                        desafios_superados = :desafios_superados,
                        total_desafios = :total_desafios,
                        conceptos_feedback = :conceptos_feedback,
                        detalles_json = :detalles_json,
                        completado = 1
                    WHERE id = :id
                ");
                $stmt->execute([
                    ':dominio_pct'        => $dominioPct,
                    ':aciertos'           => $aciertos,
                    ':errores'            => $errores,
                    ':intentos'           => $intentos,
                    ':pistas_usadas'      => $pistasUsadas,
                    ':autocorrecciones'   => $autocorrecciones,
                    ':tiempo_segundos'    => $tiempoSegundos,
                    ':desafios_superados' => $desafiosSuperados,
                    ':total_desafios'     => $totalDesafios,
                    ':conceptos_feedback' => $conceptosFeedback,
                    ':detalles_json'      => $detallesJson,
                    ':id'                 => $existente['id']
                ]);
                $regId = $existente['id'];
            } else {
                $stmt = $db->prepare("
                    INSERT INTO progreso_misiones 
                    (tarea_id, estudiante_id, dominio_pct, aciertos, errores, intentos, pistas_usadas, autocorrecciones, tiempo_segundos, desafios_superados, total_desafios, conceptos_feedback, detalles_json, completado)
                    VALUES 
                    (:tarea_id, :estudiante_id, :dominio_pct, :aciertos, :errores, :intentos, :pistas_usadas, :autocorrecciones, :tiempo_segundos, :desafios_superados, :total_desafios, :conceptos_feedback, :detalles_json, 1)
                ");
                $stmt->execute([
                    ':tarea_id'           => $tareaId,
                    ':estudiante_id'      => $user['id'],
                    ':dominio_pct'        => $dominioPct,
                    ':aciertos'           => $aciertos,
                    ':errores'            => $errores,
                    ':intentos'           => $intentos,
                    ':pistas_usadas'      => $pistasUsadas,
                    ':autocorrecciones'   => $autocorrecciones,
                    ':tiempo_segundos'    => $tiempoSegundos,
                    ':desafios_superados' => $desafiosSuperados,
                    ':total_desafios'     => $totalDesafios,
                    ':conceptos_feedback' => $conceptosFeedback,
                    ':detalles_json'      => $detallesJson
                ]);
                $regId = $db->lastInsertId();
            }

            echo json_encode([
                'success' => true,
                'message' => '¡Progreso de misión registrado exitosamente!',
                'id' => (int)$regId,
                'dominio_pct' => $dominioPct
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al guardar el progreso de la misión: ' . $e->getMessage()]);
        }
        exit;
    }

    // 2. Eliminar misión (solo docentes)
    if ($action === 'delete') {
        if ($user['rol'] !== 'docente') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo los docentes pueden eliminar misiones']);
            exit;
        }

        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID de misión inválido']);
            exit;
        }

        try {
            // Eliminar progresos asociados
            $db->prepare("DELETE FROM progreso_misiones WHERE tarea_id = :id")->execute([':id' => $id]);

            $stmt = $db->prepare("DELETE FROM tareas WHERE id = :id AND docente_id = :docente_id");
            $stmt->execute([':id' => $id, ':docente_id' => $user['id']]);
            
            if ($stmt->rowCount() === 0) {
                $stmt2 = $db->prepare("DELETE FROM tareas WHERE id = :id");
                $stmt2->execute([':id' => $id]);
            }

            echo json_encode(['success' => true, 'message' => 'Misión eliminada correctamente']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al eliminar la misión']);
        }
        exit;
    }

    // 3. Crear nueva Misión de Aprendizaje (solo docentes)
    if ($user['rol'] !== 'docente') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Solo los docentes pueden asignar misiones']);
        exit;
    }

    $templateKey = trim($_POST['template_key'] ?? '');
    $titulo = trim($_POST['titulo'] ?? '');
    $tema = trim($_POST['tema'] ?? 'Trigonometría');
    $fechaEntrega = trim($_POST['fecha_entrega'] ?? date('Y-m-d', strtotime('+14 days')));
    $puntos = (int)($_POST['puntos'] ?? 100);
    $historia = trim($_POST['historia'] ?? '');
    $instrucciones = trim($_POST['instrucciones'] ?? '');
    $misionDataJson = trim($_POST['mision_data_json'] ?? '');

    $catalogo = getMisionesCatalogo();
    $misionData = null;

    if (!empty($misionDataJson)) {
        // Misión y ejercicios personalizados enviados por la docente
        $customData = json_decode($misionDataJson, true);
        if ($customData && is_array($customData)) {
            $misionData = $customData;
            if (empty($titulo)) $titulo = $misionData['titulo'] ?? 'MISIÓN: Personalizada';
            if (empty($historia)) $historia = $misionData['historia'] ?? '';
            if (empty($instrucciones)) $instrucciones = $misionData['subtitulo'] ?? '';
            if (empty($tema)) $tema = $misionData['tema'] ?? 'Trigonometría';
        }
    }

    if (!$misionData) {
        if (!empty($templateKey) && isset($catalogo[$templateKey])) {
            $misionData = $catalogo[$templateKey];
            if (empty($titulo)) $titulo = $misionData['titulo'];
            if (empty($historia)) $historia = $misionData['historia'];
            if (empty($instrucciones)) $instrucciones = $misionData['subtitulo'];
            $tema = $misionData['tema'];
        } else {
            // Misión personalizada con base en el template default
            $base = $catalogo['trig_cuadrantes'];
            $base['titulo'] = $titulo ?: 'MISIÓN: Desafío Trigonométrico';
            $base['tema'] = $tema;
            $base['historia'] = $historia ?: 'Completa las 5 etapas interactivas para dominar el contenido matemático.';
            $base['subtitulo'] = $instrucciones ?: 'Explorá, descubrí, resolvé y supera los desafíos.';
            $misionData = $base;
        }
    }

    if (empty($titulo)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El título de la misión es obligatorio']);
        exit;
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO tareas (docente_id, titulo, tema, tipo, historia, fecha_entrega, puntos, instrucciones, mision_data)
            VALUES (:docente_id, :titulo, :tema, 'mision', :historia, :fecha_entrega, :puntos, :instrucciones, :mision_data)
        ");
        $stmt->execute([
            ':docente_id'     => $user['id'],
            ':titulo'         => $titulo,
            ':tema'           => $tema,
            ':historia'       => $historia,
            ':fecha_entrega'  => $fechaEntrega,
            ':puntos'         => $puntos,
            ':instrucciones'  => $instrucciones,
            ':mision_data'    => json_encode($misionData, JSON_UNESCAPED_UNICODE)
        ]);

        $newId = $db->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => '¡Misión de aprendizaje asignada exitosamente!',
            'tarea' => [
                'id' => (int)$newId,
                'docente_id' => $user['id'],
                'docente_nombre' => $user['nombre'],
                'titulo' => $titulo,
                'tema' => $tema,
                'tipo' => 'mision',
                'historia' => $historia,
                'fecha_entrega' => $fechaEntrega,
                'puntos' => $puntos,
                'instrucciones' => $instrucciones,
                'mision_data' => $misionData,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al guardar la misión en la base de datos: ' . $e->getMessage()]);
    }
    exit;
}
