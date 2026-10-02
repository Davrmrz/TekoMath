-- Datos Iniciales / Semilla para Kyhyje'ỹ IA
USE `kyhyjey_db`;

-- Insertar estudiante demo por defecto
INSERT INTO `students` (`id`, `name`, `school_grade`, `preferred_language`)
VALUES (1, 'Mitãrusu / Mitãkuña', '1er Curso Media', 'jopara')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Insertar Ejercicios Graduados de Trigonometría (Primer Curso)
INSERT INTO `exercises` 
(`id`, `topic`, `subtopic`, `difficulty_level`, `statement_jopara`, `statement_es`, `formula_latex`, `visual_type`, `initial_angle`, `expected_value`, `hint_level_0`, `hint_level_1`, `hint_level_2`, `hint_level_3`, `hint_level_4`)
VALUES
(1, 'trigonometria', 'cuadrantes', 1, 
'¿Mba\'e cuadrante-pe piko oĩ el ángulo de 120°?', 
'¿En qué cuadrante se encuentra el ángulo de 120°?', 
'\\theta = 120^\\circ', 'unit_circle', 120, 'II',
'Ñanemandu\'ami: el plano cartesiano tiene 4 cuadrantes ordenados en sentido antihorario.',
'¿Entre qué ángulos límite está 120°? Fijate si está entre 0°-90°, 90°-180°, 180°-270° o 270°-360°.',
'120° es mayor que 90° y menor que 180°. Mirá el gráfico.',
'El cuadrante entre 90° y 180° es el segundo cuadrante (Cuadrante II).',
'Como 120° está entre 90° y 180°, pertenece al Segundo Cuadrante (II).'),

(2, 'trigonometria', 'angulos_notables', 2, 
'Encontrá el ángulo de referencia de 150°. Jahecha cuánto le falta para llegar a 180°.', 
'Encuentra el ángulo de referencia de 150°.', 
'\\theta_{ref} = 180^\\circ - 150^\\circ', 'unit_circle', 150, '30°',
'El ángulo de referencia es el ángulo agudo positivo formado con el eje X.',
'Para el segundo cuadrante, la fórmula es: \\theta_{ref} = 180^\\circ - \\theta.',
'Restemos a 180° nuestro ángulo: 180° - 150°.',
'180° menos 150° nos da un ángulo notable conocido del primer cuadrante.',
'El ángulo de referencia es exactamente 30°.'),

(3, 'trigonometria', 'sen_cos', 3, 
'Determiná el valor exacto de sen(150°). Eñatende porã en el signo del segundo cuadrante.', 
'Determina el valor de sen(150°).', 
'\\text{sen}(150^\\circ) = \\text{sen}(180^\\circ - 30^\\circ) = +\\text{sen}(30^\\circ)', 'unit_circle', 150, '1/2',
'Recordá: sen(\\theta) corresponde a la coordenada Y en la circunferencia unitaria.',
'150° está en el segundo cuadrante (II). ¿La coordenada Y es positiva o negativa ahí?',
'En el segundo cuadrante, Y es positiva (+), por lo que sen(150°) = +sen(30°).',
'El seno de 30° es un valor notable fundamental: 1/2.',
'sen(150°) = 1/2 (positivo).'),

(4, 'trigonometria', 'sen_cos', 3, 
'¿Cuánto es cos(240°)? Jahecha primero mba\'e cuadrante-pe oĩ ha mba\'e signo oreko X.', 
'Calcula el valor de cos(240°).', 
'\\cos(240^\\circ) = -\\cos(60^\\circ)', 'unit_circle', 240, '-1/2',
'Recordá: cos(\\theta) corresponde a la coordenada X en la circunferencia unitaria.',
'240° oĩ tercer cuadrante-pe (entre 180° y 270°). ¿En el tercer cuadrante X es positiva o negativa?',
'En el tercer cuadrante, X es negativa (-). Su ángulo de referencia es 240° - 180° = 60°.',
'Sabemos que cos(60°) = 1/2. Ahora aplicá el signo del tercer cuadrante.',
'cos(240°) = -cos(60°) = -1/2.'),

(5, 'trigonometria', 'graficas', 4, 
'Observá la función y = 2sen(x). ¿Mba\'épa la amplitud de esta onda?', 
'Determina la amplitud de la función y = 2sen(x).', 
'y = A \\cdot \\text{sen}(Bx) \\implies A = 2', 'function_graph', 0, '2',
'La amplitud es el valor absoluto del número que multiplica al seno: |A|.',
'Fijate en la altura máxima que alcanza la onda en el gráfico.',
'En la fórmula y = A sen(x), el coeficiente A indica qué tan alto sube la cresta.',
'Como la función es y = 2sen(x), el valor de A es 2.',
'La amplitud es 2 (la onda oscila entre -2 y +2).')
ON DUPLICATE KEY UPDATE `statement_jopara` = VALUES(`statement_jopara`);
