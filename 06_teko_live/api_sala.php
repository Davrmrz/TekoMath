<?php
/* ============================================
   TEKO MATH — API de Salas de Clase en Vivo (api_sala.php)
   Juego interactivo multijugador tipo Kahoot en tiempo real
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
$action = $_GET['action'] ?? $_POST['action'] ?? null;

// ============================================
// BANCO DE PREGUNTAS PREDEFINIDAS PARA TEKO LIVE
// ============================================
function getLivePacks(): array {
    return [
        'pack_cuadrantes' => [
            'id' => 'pack_cuadrantes',
            'titulo' => '🧭 Torneo de Cuadrantes & Signos Trigonométricos',
            'tema' => 'Trigonometría',
            'tiempo_defecto' => 20,
            'preguntas' => [
                [
                    'enunciado' => '¿En qué cuadrante el Seno es POSITIVO (+) y el Coseno es NEGATIVO (−)?',
                    'concepto' => 'Cuadrantes',
                    'opciones' => [
                        ['texto' => 'Cuadrante II (90° a 180°)', 'es_correcta' => true],
                        ['texto' => 'Cuadrante I (0° a 90°)', 'es_correcta' => false],
                        ['texto' => 'Cuadrante III (180° a 270°)', 'es_correcta' => false],
                        ['texto' => 'Cuadrante IV (270° a 360°)', 'es_correcta' => false],
                    ],
                    'explicacion' => 'En el Cuadrante II, la coordenada Y (Seno) es positiva y la X (Coseno) es negativa.'
                ],
                [
                    'enunciado' => 'Si el ángulo θ = 240°, ¿cuál es el signo de la Tangente tan(θ)?',
                    'concepto' => 'Tangente',
                    'opciones' => [
                        ['texto' => 'Negativa (−)', 'es_correcta' => false],
                        ['texto' => 'Positiva (+)', 'es_correcta' => true],
                        ['texto' => 'Cero (0)', 'es_correcta' => false],
                        ['texto' => 'Indefinida', 'es_correcta' => false],
                    ],
                    'explicacion' => '240° está en el Cuadrante III donde tanto Sen como Cos son negativos: (−)/(−) = (+).'
                ],
                [
                    'enunciado' => '¿Cuál es el valor exacto de sen(90°) en la circunferencia unitaria?',
                    'concepto' => 'Valores Notables',
                    'opciones' => [
                        ['texto' => '0', 'es_correcta' => false],
                        ['texto' => '1/2', 'es_correcta' => false],
                        ['texto' => '1', 'es_correcta' => true],
                        ['texto' => '−1', 'es_correcta' => false],
                    ],
                    'explicacion' => 'A 90° la coordenada en el círculo unitario es (0, 1), por lo que sen(90°) = 1.'
                ],
                [
                    'enunciado' => '¿Qué regla mnemotécnica indica qué funciones son positivas en los 4 cuadrantes?',
                    'concepto' => 'Mnemotecnia',
                    'opciones' => [
                        ['texto' => 'TODOS - SIN - TA - COS', 'es_correcta' => true],
                        ['texto' => 'SOH - CAH - TOA', 'es_correcta' => false],
                        ['texto' => 'PITÁGORAS - 3 - 4 - 5', 'es_correcta' => false],
                        ['texto' => 'ALFA - BETA - GAMA', 'es_correcta' => false],
                    ],
                    'explicacion' => 'I: TODAS, II: SENO, III: TANGENTE, IV: COSENO.'
                ],
                [
                    'enunciado' => 'Si cos(θ) > 0 y tan(θ) < 0, ¿en qué cuadrante se encuentra el ángulo θ?',
                    'concepto' => 'Deducción',
                    'opciones' => [
                        ['texto' => 'Cuadrante I', 'es_correcta' => false],
                        ['texto' => 'Cuadrante II', 'es_correcta' => false],
                        ['texto' => 'Cuadrante III', 'es_correcta' => false],
                        ['texto' => 'Cuadrante IV', 'es_correcta' => true],
                    ],
                    'explicacion' => 'Coseno positivo y Tangente negativa ocurre únicamente en el Cuadrante IV.'
                ]
            ]
        ],
        'pack_reciprocas' => [
            'id' => 'pack_reciprocas',
            'titulo' => '🔄 Duelo de Razones Recíprocas & Identidades',
            'tema' => 'Trigonometría',
            'tiempo_defecto' => 20,
            'preguntas' => [
                [
                    'enunciado' => '¿Cuál es la razón trigonométrica recíproca del Seno sen(θ)?',
                    'concepto' => 'Recíprocas',
                    'opciones' => [
                        ['texto' => 'Cosecante csc(θ) = 1/sen(θ)', 'es_correcta' => true],
                        ['texto' => 'Secante sec(θ) = 1/cos(θ)', 'es_correcta' => false],
                        ['texto' => 'Cotangente cot(θ) = 1/tan(θ)', 'es_correcta' => false],
                        ['texto' => 'Coseno cos(θ)', 'es_correcta' => false],
                    ],
                    'explicacion' => 'La inversa multiplicativa del seno es la cosecante: csc(θ) = 1/sen(θ).'
                ],
                [
                    'enunciado' => 'Si cos(θ) = 1/2, ¿cuál es el valor de sec(θ)?',
                    'concepto' => 'Secante',
                    'opciones' => [
                        ['texto' => '1/4', 'es_correcta' => false],
                        ['texto' => '2', 'es_correcta' => true],
                        ['texto' => '√3/2', 'es_correcta' => false],
                        ['texto' => '−2', 'es_correcta' => false],
                    ],
                    'explicacion' => 'sec(θ) = 1 / cos(θ) = 1 / (1/2) = 2.'
                ],
                [
                    'enunciado' => 'Según la Identidad Fundamental, sen²(θ) + cos²(θ) es SIEMPRE igual a:',
                    'concepto' => 'Identidades',
                    'opciones' => [
                        ['texto' => '0', 'es_correcta' => false],
                        ['texto' => '2', 'es_correcta' => false],
                        ['texto' => '1', 'es_correcta' => true],
                        ['texto' => 'tan(θ)', 'es_correcta' => false],
                    ],
                    'explicacion' => 'Es la identidad fundamental derivada del Teorema de Pitágoras en el círculo unitario.'
                ],
                [
                    'enunciado' => '¿Cómo se define la Cotangente cot(θ) en términos de Seno y Coseno?',
                    'concepto' => 'Cotangente',
                    'opciones' => [
                        ['texto' => 'sen(θ) / cos(θ)', 'es_correcta' => false],
                        ['texto' => 'cos(θ) / sen(θ)', 'es_correcta' => true],
                        ['texto' => '1 / (sen(θ)·cos(θ))', 'es_correcta' => false],
                        ['texto' => 'sen(θ) + cos(θ)', 'es_correcta' => false],
                    ],
                    'explicacion' => 'cot(θ) = 1/tan(θ) = cos(θ)/sen(θ).'
                ]
            ]
        ],
        'pack_notables' => [
            'id' => 'pack_notables',
            'titulo' => '📐 Desafío Relámpago: Ángulos Notables (30°, 45°, 60°)',
            'tema' => 'Trigonometría',
            'tiempo_defecto' => 20,
            'preguntas' => [
                [
                    'enunciado' => '¿Cuál es el valor exacto de sen(30°)?',
                    'concepto' => 'Ángulos Notables',
                    'opciones' => [
                        ['texto' => '1/2', 'es_correcta' => true],
                        ['texto' => '√3/2', 'es_correcta' => false],
                        ['texto' => '√2/2', 'es_correcta' => false],
                        ['texto' => '1', 'es_correcta' => false],
                    ],
                    'explicacion' => 'sen(30°) = 1/2 = 0.5.'
                ],
                [
                    'enunciado' => '¿Cuál es el valor exacto de cos(45°)?',
                    'concepto' => 'Ángulos Notables',
                    'opciones' => [
                        ['texto' => '√2/2', 'es_correcta' => true],
                        ['texto' => '1/2', 'es_correcta' => false],
                        ['texto' => '√3/2', 'es_correcta' => false],
                        ['texto' => '0', 'es_correcta' => false],
                    ],
                    'explicacion' => 'A 45°, tanto el seno como el coseno valen exactamente √2/2.'
                ],
                [
                    'enunciado' => '¿Cuánto vale la Tangente de 45°: tan(45°)?',
                    'concepto' => 'Tangente Notable',
                    'opciones' => [
                        ['texto' => '0', 'es_correcta' => false],
                        ['texto' => '1', 'es_correcta' => true],
                        ['texto' => '√3', 'es_correcta' => false],
                        ['texto' => 'Indefinida', 'es_correcta' => false],
                    ],
                    'explicacion' => 'tan(45°) = sen(45°)/cos(45°) = (√2/2) / (√2/2) = 1.'
                ],
                [
                    'enunciado' => '¿Cuál es el valor de cos(60°)?',
                    'concepto' => 'Coseno Notable',
                    'opciones' => [
                        ['texto' => '1/2', 'es_correcta' => true],
                        ['texto' => '√3/2', 'es_correcta' => false],
                        ['texto' => '1', 'es_correcta' => false],
                        ['texto' => '0', 'es_correcta' => false],
                    ],
                    'explicacion' => 'cos(60°) = sen(30°) = 1/2.'
                ]
            ]
        ]
    ];
}

// Generador de PIN seguro y corto (6 dígitos)
function generarPinUnico(PDO $db): string {
    $intentos = 0;
    while ($intentos < 20) {
        $pin = (string)random_int(100000, 999999);
        $stmt = $db->prepare("SELECT id FROM salas_clase WHERE codigo_pin = :pin AND estado != 'cerrada' LIMIT 1");
        $stmt->execute([':pin' => $pin]);
        if (!$stmt->fetch()) {
            return $pin;
        }
        $intentos++;
    }
    return (string)time();
}

try {
    // ============================================
    // 1. OBTENER PACKS DISPONIBLES (Predeterminados + Creados por Docente)
    // ============================================
    if ($action === 'packs') {
        $packs = array_values(getLivePacks());

        // Obtener packs personalizados de la BD
        $customPacks = [];
        try {
            if ($user['rol'] === 'docente') {
                $pStmt = $db->prepare("SELECT * FROM packs_quiz WHERE docente_id = :uid ORDER BY id DESC");
                $pStmt->execute([':uid' => $user['id']]);
            } else {
                $pStmt = $db->query("SELECT * FROM packs_quiz ORDER BY id DESC LIMIT 50");
            }
            $rows = $pStmt->fetchAll();

            foreach ($rows as $r) {
                $pJson = json_decode($r['preguntas_json'] ?? '[]', true) ?: [];
                $customPacks[] = [
                    'id' => 'pack_custom_' . $r['id'],
                    'db_id' => (int)$r['id'],
                    'titulo' => '✨ ' . $r['titulo'],
                    'tema' => $r['tema'],
                    'tiempo_defecto' => (int)$r['tiempo_defecto'],
                    'es_personalizado' => true,
                    'total_preguntas' => count($pJson),
                    'preguntas' => $pJson
                ];
            }
        } catch (Exception $e) {}

        echo json_encode([
            'success' => true,
            'packs' => array_merge($packs, $customPacks),
            'packs_docente' => $customPacks
        ]);
        exit;
    }

    // ============================================
    // 1.1 CREAR NUEVO PACK DE PREGUNTAS (Docente)
    // ============================================
    if ($action === 'crear_pack') {
        if ($user['rol'] !== 'docente') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo los docentes pueden crear packs de preguntas']);
            exit;
        }

        $titulo = trim($_POST['titulo'] ?? '');
        $tema = trim($_POST['tema'] ?? 'Trigonometría');
        $tiempoDefecto = (int)($_POST['tiempo_defecto'] ?? 20);
        $preguntasJson = trim($_POST['preguntas_json'] ?? '[]');

        if (empty($titulo)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Por favor ingresa un título para el pack']);
            exit;
        }

        $preguntas = json_decode($preguntasJson, true);
        if (!is_array($preguntas) || count($preguntas) === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'El pack debe contener al menos 1 pregunta válida']);
            exit;
        }

        // Sanitizar y validar cada pregunta
        $preguntasValidadas = [];
        foreach ($preguntas as $idx => $p) {
            $enunciado = trim($p['enunciado'] ?? '');
            $concepto = trim($p['concepto'] ?? 'Trigonometría');
            $explicacion = trim($p['explicacion'] ?? '');
            $opciones = $p['opciones'] ?? [];

            if (empty($enunciado) || !is_array($opciones) || count($opciones) < 2) {
                continue;
            }

            $opcionesValidadas = [];
            $hayCorrecta = false;
            foreach ($opciones as $o) {
                $txt = trim($o['texto'] ?? '');
                $esCorr = !empty($o['es_correcta']);
                if ($esCorr) $hayCorrecta = true;
                $opcionesValidadas[] = [
                    'texto' => $txt,
                    'es_correcta' => $esCorr
                ];
            }

            // Si no marcó ninguna correcta, marcar la primera por defecto
            if (!$hayCorrecta && count($opcionesValidadas) > 0) {
                $opcionesValidadas[0]['es_correcta'] = true;
            }

            $preguntasValidadas[] = [
                'enunciado' => $enunciado,
                'concepto' => $concepto,
                'opciones' => $opcionesValidadas,
                'explicacion' => $explicacion
            ];
        }

        if (count($preguntasValidadas) === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No se encontraron preguntas con enunciados y opciones válidas']);
            exit;
        }

        $stmt = $db->prepare("
            INSERT INTO packs_quiz 
            (docente_id, titulo, tema, tiempo_defecto, preguntas_json)
            VALUES
            (:docente_id, :titulo, :tema, :tiempo_defecto, :preguntas_json)
        ");
        $stmt->execute([
            ':docente_id'     => $user['id'],
            ':titulo'         => $titulo,
            ':tema'           => $tema,
            ':tiempo_defecto' => $tiempoDefecto,
            ':preguntas_json' => json_encode($preguntasValidadas, JSON_UNESCAPED_UNICODE)
        ]);

        $packId = (int)$db->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => '¡Pack de preguntas guardado exitosamente!',
            'pack' => [
                'id' => 'pack_custom_' . $packId,
                'db_id' => $packId,
                'titulo' => '✨ ' . $titulo,
                'tema' => $tema,
                'tiempo_defecto' => $tiempoDefecto,
                'total_preguntas' => count($preguntasValidadas),
                'es_personalizado' => true
            ]
        ]);
        exit;
    }

    // ============================================
    // 1.2 ELIMINAR PACK DE PREGUNTAS (Docente)
    // ============================================
    if ($action === 'eliminar_pack') {
        if ($user['rol'] !== 'docente') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo los docentes pueden eliminar packs']);
            exit;
        }

        $rawId = trim($_POST['pack_id'] ?? '');
        $dbId = (int)str_replace('pack_custom_', '', $rawId);

        if ($dbId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID de pack inválido']);
            exit;
        }

        $stmt = $db->prepare("DELETE FROM packs_quiz WHERE id = :id AND docente_id = :uid");
        $stmt->execute([':id' => $dbId, ':uid' => $user['id']]);

        echo json_encode(['success' => true, 'message' => 'Pack eliminado correctamente']);
        exit;
    }

    // ============================================
    // 2. CREAR SALA EN VIVO (Docente)
    // ============================================
    if ($action === 'crear_sala') {
        if ($user['rol'] !== 'docente') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo los docentes pueden crear salas de clase en vivo']);
            exit;
        }

        $packId = trim($_POST['pack_id'] ?? 'pack_cuadrantes');
        $tiempoLimite = (int)($_POST['tiempo_limite'] ?? 20);
        if ($tiempoLimite < 10) $tiempoLimite = 10;
        if ($tiempoLimite > 60) $tiempoLimite = 60;

        $packs = getLivePacks();
        $preguntas = [];
        $titulo = 'Teko Live: Duelo Matemático';
        $tema = 'Trigonometría';

        if (str_starts_with($packId, 'pack_custom_')) {
            $customDbId = (int)str_replace('pack_custom_', '', $packId);
            $cStmt = $db->prepare("SELECT * FROM packs_quiz WHERE id = :id");
            $cStmt->execute([':id' => $customDbId]);
            $customRow = $cStmt->fetch();

            if ($customRow) {
                $titulo = $customRow['titulo'];
                $tema = $customRow['tema'];
                $tiempoLimite = (int)$customRow['tiempo_defecto'];
                $preguntas = json_decode($customRow['preguntas_json'] ?? '[]', true) ?: [];
            }
        } else if (isset($packs[$packId])) {
            $pack = $packs[$packId];
            $titulo = $pack['titulo'];
            $tema = $pack['tema'];
            $preguntas = $pack['preguntas'];
        } else {
            // Preguntas personalizadas si se enviaron directamente
            $customPreguntas = json_decode($_POST['preguntas_custom_json'] ?? '[]', true);
            if (!empty($customPreguntas) && is_array($customPreguntas)) {
                $preguntas = $customPreguntas;
                $titulo = trim($_POST['titulo'] ?? 'Teko Live Quiz Personalizado');
            } else {
                $pack = $packs['pack_cuadrantes'];
                $titulo = $pack['titulo'];
                $preguntas = $pack['preguntas'];
            }
        }

        $pin = generarPinUnico($db);

        $stmt = $db->prepare("
            INSERT INTO salas_clase 
            (codigo_pin, docente_id, titulo, tema, estado, pregunta_actual, tiempo_limite, timestamp_inicio_pregunta, preguntas_json, alumnos_json)
            VALUES
            (:pin, :docente_id, :titulo, :tema, 'lobby', 0, :tiempo, 0, :preguntas, '[]')
        ");
        $stmt->execute([
            ':pin'        => $pin,
            ':docente_id' => $user['id'],
            ':titulo'     => $titulo,
            ':tema'       => $tema,
            ':tiempo'     => $tiempoLimite,
            ':preguntas'  => json_encode($preguntas, JSON_UNESCAPED_UNICODE)
        ]);

        $salaId = (int)$db->lastInsertId();

        echo json_encode([
            'success' => true,
            'sala_id' => $salaId,
            'codigo_pin' => $pin,
            'titulo' => $titulo,
            'total_preguntas' => count($preguntas)
        ]);
        exit;
    }

    // ============================================
    // 3. UNIRSE A SALA CON PIN (Estudiante)
    // ============================================
    if ($action === 'unirse_sala') {
        $pin = trim($_POST['codigo_pin'] ?? $_GET['codigo_pin'] ?? '');
        $pin = preg_replace('/[^0-9]/', '', $pin);

        if (empty($pin)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Ingresa un código PIN válido']);
            exit;
        }

        $stmt = $db->prepare("SELECT * FROM salas_clase WHERE codigo_pin = :pin AND estado != 'cerrada' ORDER BY id DESC LIMIT 1");
        $stmt->execute([':pin' => $pin]);
        $sala = $stmt->fetch();

        if (!$sala) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'No se encontró ninguna sala activa con el PIN: ' . $pin]);
            exit;
        }

        $alumnos = json_decode($sala['alumnos_json'] ?? '[]', true) ?: [];

        // Verificar si el alumno ya estaba en la lista
        $encontrado = false;
        foreach ($alumnos as &$al) {
            if ($al['id'] === $user['id']) {
                $encontrado = true;
                $al['nombre'] = $user['nombre'];
                $al['avatar'] = $user['avatar'] ?? 'default';
                break;
            }
        }
        unset($al);

        if (!$encontrado) {
            $alumnos[] = [
                'id' => $user['id'],
                'nombre' => $user['nombre'],
                'avatar' => $user['avatar'] ?? 'default',
                'puntos' => 0,
                'racha' => 0,
                'respondio' => false,
                'ultima_respuesta' => null,
                'tiempo_respuesta' => 0,
                'es_correcta' => false,
                'puntos_ganados_ultimo' => 0
            ];

            $updateStmt = $db->prepare("UPDATE salas_clase SET alumnos_json = :alumnos WHERE id = :id");
            $updateStmt->execute([
                ':alumnos' => json_encode($alumnos, JSON_UNESCAPED_UNICODE),
                ':id' => $sala['id']
            ]);
        }

        echo json_encode([
            'success' => true,
            'sala_id' => (int)$sala['id'],
            'codigo_pin' => $sala['codigo_pin'],
            'titulo' => $sala['titulo'],
            'estado' => $sala['estado']
        ]);
        exit;
    }

    // ============================================
    // 4. CONSULTAR ESTADO EN TIEMPO REAL (Polling)
    // ============================================
    if ($action === 'estado') {
        $salaId = (int)($_GET['sala_id'] ?? $_POST['sala_id'] ?? 0);
        $pin = trim($_GET['codigo_pin'] ?? $_POST['codigo_pin'] ?? '');

        if ($salaId > 0) {
            $stmt = $db->prepare("SELECT s.*, u.nombre AS docente_nombre FROM salas_clase s LEFT JOIN usuarios u ON s.docente_id = u.id WHERE s.id = :id");
            $stmt->execute([':id' => $salaId]);
        } else if (!empty($pin)) {
            $stmt = $db->prepare("SELECT s.*, u.nombre AS docente_nombre FROM salas_clase s LEFT JOIN usuarios u ON s.docente_id = u.id WHERE s.codigo_pin = :pin ORDER BY s.id DESC LIMIT 1");
            $stmt->execute([':pin' => $pin]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID o PIN de sala requerido']);
            exit;
        }

        $sala = $stmt->fetch();
        if (!$sala) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Sala no encontrada']);
            exit;
        }

        $preguntas = json_decode($sala['preguntas_json'] ?? '[]', true) ?: [];
        $alumnos = json_decode($sala['alumnos_json'] ?? '[]', true) ?: [];
        $totalPreguntas = count($preguntas);
        $idx = (int)$sala['pregunta_actual'];

        // Calcular tiempo restante si está en pregunta
        $tiempoRestante = 0;
        $now = time();
        if ($sala['estado'] === 'en_pregunta') {
            $inicio = (int)$sala['timestamp_inicio_pregunta'];
            $limite = (int)$sala['tiempo_limite'];
            $transcurrido = $now - $inicio;
            $tiempoRestante = max(0, $limite - $transcurrido);

            // Auto-pasar a resultado si se agotó el tiempo
            if ($tiempoRestante <= 0 && $inicio > 0) {
                $db->prepare("UPDATE salas_clase SET estado = 'mostrando_resultado' WHERE id = :id")->execute([':id' => $sala['id']]);
                $sala['estado'] = 'mostrando_resultado';
            }
        }

        // Estadísticas de respuestas para la pregunta actual
        $statsRespuestas = [0 => 0, 1 => 0, 2 => 0, 3 => 0];
        $totalRespondieron = 0;
        foreach ($alumnos as $al) {
            if (!empty($al['respondio']) && isset($al['ultima_respuesta'])) {
                $optIdx = (int)$al['ultima_respuesta'];
                if (isset($statsRespuestas[$optIdx])) {
                    $statsRespuestas[$optIdx]++;
                }
                $totalRespondieron++;
            }
        }

        // Si todos los alumnos respondieron mientras está en pregunta, auto-avanzar a resultado
        if ($sala['estado'] === 'en_pregunta' && count($alumnos) > 0 && $totalRespondieron >= count($alumnos)) {
            $db->prepare("UPDATE salas_clase SET estado = 'mostrando_resultado' WHERE id = :id")->execute([':id' => $sala['id']]);
            $sala['estado'] = 'mostrando_resultado';
        }

        // Ordenar Leaderboard por Puntos DESC
        $leaderboard = $alumnos;
        usort($leaderboard, function($a, $b) {
            return ($b['puntos'] ?? 0) <=> ($a['puntos'] ?? 0);
        });

        // Encontrar datos del estudiante actual si es alumno
        $miEstado = null;
        if ($user['rol'] === 'estudiante') {
            foreach ($alumnos as $pos => $al) {
                if ($al['id'] === $user['id']) {
                    $miEstado = $al;
                    break;
                }
            }
            // Encontrar puesto en leaderboard
            if ($miEstado) {
                foreach ($leaderboard as $rank => $item) {
                    if ($item['id'] === $user['id']) {
                        $miEstado['puesto'] = $rank + 1;
                        break;
                    }
                }
            }
        }

        // Preparar datos de la pregunta actual
        $preguntaData = null;
        if (isset($preguntas[$idx])) {
            $rawP = $preguntas[$idx];
            $preguntaData = [
                'numero' => $idx + 1,
                'total' => $totalPreguntas,
                'enunciado' => $rawP['enunciado'] ?? '',
                'concepto' => $rawP['concepto'] ?? 'Trigonometría',
                'tiempo_limite' => (int)$sala['tiempo_limite'],
                'opciones' => []
            ];

            $esDocente = ($user['rol'] === 'docente');
            $mostrarCorrecta = ($sala['estado'] === 'mostrando_resultado' || $sala['estado'] === 'podio_final' || $esDocente);

            foreach ($rawP['opciones'] as $oIdx => $opt) {
                $preguntaData['opciones'][] = [
                    'indice' => $oIdx,
                    'texto' => $opt['texto'],
                    'es_correcta' => $mostrarCorrecta ? (bool)($opt['es_correcta'] ?? false) : null
                ];
            }

            if ($mostrarCorrecta) {
                $preguntaData['explicacion'] = $rawP['explicacion'] ?? '';
            }
        }

        echo json_encode([
            'success' => true,
            'sala' => [
                'id' => (int)$sala['id'],
                'codigo_pin' => $sala['codigo_pin'],
                'titulo' => $sala['titulo'],
                'tema' => $sala['tema'],
                'estado' => $sala['estado'],
                'pregunta_actual' => $idx,
                'total_preguntas' => $totalPreguntas,
                'tiempo_restante' => $tiempoRestante,
                'tiempo_limite' => (int)$sala['tiempo_limite'],
                'docente_nombre' => $sala['docente_nombre'] ?? 'Docente'
            ],
            'pregunta' => $preguntaData,
            'alumnos_count' => count($alumnos),
            'alumnos' => $alumnos,
            'leaderboard' => array_slice($leaderboard, 0, 5),
            'podio_final' => array_slice($leaderboard, 0, 3),
            'stats_respuestas' => $statsRespuestas,
            'total_respondieron' => $totalRespondieron,
            'mi_estado' => $miEstado
        ]);
        exit;
    }

    // ============================================
    // 5. INICIAR / SIGUIENTE PREGUNTA (Docente)
    // ============================================
    if ($action === 'iniciar_juego' || $action === 'siguiente_pregunta') {
        if ($user['rol'] !== 'docente') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Acceso denegado']);
            exit;
        }

        $salaId = (int)($_POST['sala_id'] ?? 0);
        $stmt = $db->prepare("SELECT * FROM salas_clase WHERE id = :id");
        $stmt->execute([':id' => $salaId]);
        $sala = $stmt->fetch();

        if (!$sala) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Sala no encontrada']);
            exit;
        }

        $preguntas = json_decode($sala['preguntas_json'] ?? '[]', true) ?: [];
        $totalPreguntas = count($preguntas);
        $alumnos = json_decode($sala['alumnos_json'] ?? '[]', true) ?: [];

        // Resetear banderas de respuesta de los alumnos para la nueva pregunta
        foreach ($alumnos as &$al) {
            $al['respondio'] = false;
            $al['ultima_respuesta'] = null;
            $al['tiempo_respuesta'] = 0;
            $al['es_correcta'] = false;
            $al['puntos_ganados_ultimo'] = 0;
        }
        unset($al);

        $nuevaPregunta = 0;
        if ($action === 'siguiente_pregunta') {
            $nuevaPregunta = (int)$sala['pregunta_actual'] + 1;
        }

        if ($nuevaPregunta >= $totalPreguntas) {
            // Ya no hay más preguntas -> Podio Final
            $db->prepare("
                UPDATE salas_clase SET
                    estado = 'podio_final',
                    alumnos_json = :alumnos
                WHERE id = :id
            ")->execute([
                ':alumnos' => json_encode($alumnos, JSON_UNESCAPED_UNICODE),
                ':id' => $salaId
            ]);

            echo json_encode(['success' => true, 'estado' => 'podio_final']);
            exit;
        }

        $db->prepare("
            UPDATE salas_clase SET
                estado = 'en_pregunta',
                pregunta_actual = :p_idx,
                timestamp_inicio_pregunta = :ts,
                alumnos_json = :alumnos
            WHERE id = :id
        ")->execute([
            ':p_idx'   => $nuevaPregunta,
            ':ts'      => time(),
            ':alumnos' => json_encode($alumnos, JSON_UNESCAPED_UNICODE),
            ':id'      => $salaId
        ]);

        echo json_encode([
            'success' => true,
            'estado' => 'en_pregunta',
            'pregunta_actual' => $nuevaPregunta
        ]);
        exit;
    }

    // ============================================
    // 6. REVELAR RESPUESTAS / PAUSAR (Docente)
    // ============================================
    if ($action === 'revelar_resultado') {
        if ($user['rol'] !== 'docente') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Acceso denegado']);
            exit;
        }

        $salaId = (int)($_POST['sala_id'] ?? 0);
        $db->prepare("UPDATE salas_clase SET estado = 'mostrando_resultado' WHERE id = :id")->execute([':id' => $salaId]);

        echo json_encode(['success' => true, 'estado' => 'mostrando_resultado']);
        exit;
    }

    // ============================================
    // 7. ENVIAR RESPUESTA (Estudiante)
    // ============================================
    if ($action === 'responder') {
        if ($user['rol'] !== 'estudiante') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo estudiantes pueden responder preguntas']);
            exit;
        }

        $salaId = (int)($_POST['sala_id'] ?? 0);
        $opcionIdx = (int)($_POST['opcion_idx'] ?? -1);
        $preguntaIdx = (int)($_POST['pregunta_idx'] ?? -1);

        $stmt = $db->prepare("SELECT * FROM salas_clase WHERE id = :id");
        $stmt->execute([':id' => $salaId]);
        $sala = $stmt->fetch();

        if (!$sala || $sala['estado'] !== 'en_pregunta') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'El tiempo de respuesta ha terminado o la pregunta no está activa']);
            exit;
        }

        if ((int)$sala['pregunta_actual'] !== $preguntaIdx) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Pregunta no sincronizada']);
            exit;
        }

        $preguntas = json_decode($sala['preguntas_json'] ?? '[]', true) ?: [];
        $preguntaActual = $preguntas[$preguntaIdx] ?? null;
        if (!$preguntaActual) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Pregunta inválida']);
            exit;
        }

        // Verificar si la opción es correcta
        $esCorrecta = false;
        if (isset($preguntaActual['opciones'][$opcionIdx])) {
            $esCorrecta = (bool)($preguntaActual['opciones'][$opcionIdx]['es_correcta'] ?? false);
        }

        // Calcular puntaje por velocidad
        $now = time();
        $inicio = (int)$sala['timestamp_inicio_pregunta'];
        $limite = (int)$sala['tiempo_limite'];
        $tiempoTranscurrido = max(0.1, $now - $inicio);
        $tiempoRestante = max(0, $limite - $tiempoTranscurrido);

        $puntosGanados = 0;
        $alumnos = json_decode($sala['alumnos_json'] ?? '[]', true) ?: [];

        foreach ($alumnos as &$al) {
            if ($al['id'] === $user['id']) {
                if (!empty($al['respondio'])) {
                    // Ya había respondido
                    echo json_encode(['success' => true, 'mensaje' => 'Ya enviaste tu respuesta para esta pregunta']);
                    exit;
                }

                $al['respondio'] = true;
                $al['ultima_respuesta'] = $opcionIdx;
                $al['tiempo_respuesta'] = round($tiempoTranscurrido, 2);
                $al['es_correcta'] = $esCorrecta;

                if ($esCorrecta) {
                    $al['racha'] = ($al['racha'] ?? 0) + 1;
                    // Fórmula Kahoot: Base 500 + hasta 500 por velocidad + bono racha (hasta +200)
                    $speedRatio = min(1.0, $tiempoRestante / max(1, $limite));
                    $puntosVelocidad = round(500 * $speedRatio);
                    $bonoRacha = min(200, ($al['racha'] - 1) * 50);
                    $puntosGanados = 500 + $puntosVelocidad + $bonoRacha;
                } else {
                    $al['racha'] = 0;
                    $puntosGanados = 0;
                }

                $al['puntos'] = ($al['puntos'] ?? 0) + $puntosGanados;
                $al['puntos_ganados_ultimo'] = $puntosGanados;
                break;
            }
        }
        unset($al);

        // Guardar actualización en BD
        $updateStmt = $db->prepare("UPDATE salas_clase SET alumnos_json = :alumnos WHERE id = :id");
        $updateStmt->execute([
            ':alumnos' => json_encode($alumnos, JSON_UNESCAPED_UNICODE),
            ':id' => $salaId
        ]);

        echo json_encode([
            'success' => true,
            'es_correcta' => $esCorrecta,
            'puntos_ganados' => $puntosGanados
        ]);
        exit;
    }

    // ============================================
    // 8. FINALIZAR / CERRAR SALA (Docente)
    // ============================================
    if ($action === 'cerrar_sala') {
        if ($user['rol'] !== 'docente') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Acceso denegado']);
            exit;
        }

        $salaId = (int)($_POST['sala_id'] ?? 0);
        $db->prepare("UPDATE salas_clase SET estado = 'cerrada' WHERE id = :id")->execute([':id' => $salaId]);

        echo json_encode(['success' => true, 'mensaje' => 'Sala finalizada correctamente']);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Acción no reconocida']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error en el servidor: ' . $e->getMessage()]);
}
