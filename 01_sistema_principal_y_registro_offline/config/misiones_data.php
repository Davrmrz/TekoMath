<?php
/* ============================================
   TEKO MATH — Catálogo de Misiones de Aprendizaje
   Enfoque estricto: Seno, Coseno, Tangente y sus Inversas/Recíprocas
   (Cosecante, Secante, Cotangente)
   (misiones_data.php)
   ============================================ */

/**
 * Devuelve el listado de misiones predefinidas enriquecidas
 */
function getMisionesCatalogo(): array {
    return [
        // ============================================================
        // MISIÓN 1: Seno, Coseno, Tangente y Cuadrantes
        // ============================================================
        'trig_cuadrantes' => [
            'id_template' => 'trig_cuadrantes',
            'titulo' => 'MISIÓN: El cuadrante perdido',
            'tema' => 'Trigonometría',
            'subtitulo' => 'Restaura las coordenadas de los radares explorando la circunferencia unitaria y los signos de seno, coseno y tangente en los 4 cuadrantes.',
            'puntos' => 100,
            'insignia' => '🧭 Cartógrafo del Círculo Unitario',
            'conceptos' => ['Seno', 'Coseno', 'Tangente'],
            'historia' => 'Una anomalía en el plano cartesiano ha alterado las lecturas de los satélites escolares. Explora los cuatro cuadrantes de la circunferencia unitaria, domina los signos y valores del seno, coseno y tangente, y restablece las coordenadas correctas para completar la misión.',
            'etapas' => [
                [
                    'tipo' => 'explora',
                    'numero' => 1,
                    'badge' => '1. EXPLORÁ',
                    'titulo' => 'Exploración: La Circunferencia Unitaria y los Signos',
                    'instruccion' => 'Interactúa con el dial de la circunferencia unitaria. Gira el ángulo a través de los cuadrantes I, II, III y IV para observar en tiempo real las proyecciones en X (coseno en morado), Y (seno en verde) y la razón tangente (sen/cos), así como el signo (+ / -) de cada una.',
                    'visual_tipo' => 'circulo_unitario',
                    'objetivo_texto' => 'Gira el dial y observa cómo la proyección horizontal (coseno) y la vertical (seno) determinan el signo de la tangente.',
                    'angulo_default' => 120
                ],
                [
                    'tipo' => 'descubri',
                    'numero' => 2,
                    'badge' => '2. DESCUBRÍ',
                    'titulo' => 'Descubrimiento: Signos de Coseno y Seno en Cuadrantes',
                    'concepto' => 'Coseno',
                    'pregunta' => 'Al observar el ángulo de 120° en la circunferencia unitaria, ¿por qué su coseno es negativo (−) mientras que su seno es positivo (+)?',
                    'opciones' => [
                        [
                            'id' => 'opt_a',
                            'texto' => 'Porque 120° está en el Cuadrante II: la coordenada X se proyecta a la izquierda del origen (negativa) y la Y hacia arriba (positiva).',
                            'es_correcta' => true,
                            'feedback_positivo' => '¡Exacto! 🎯 En el Cuadrante II (90° a 180°), la proyección horizontal X (coseno) apunta a la izquierda (−) y la proyección vertical Y (seno) apunta hacia arriba (+).'
                        ],
                        [
                            'id' => 'opt_b',
                            'texto' => 'Porque todos los ángulos mayores a 90° tienen coseno negativo y seno negativo.',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Hmm... revisemos esto 👀 En el Cuadrante II el seno sigue siendo POSITIVO (+) porque el punto se encuentra por encima del eje horizontal. Observá la altura de 120° en el círculo.'
                        ],
                        [
                            'id' => 'opt_c',
                            'texto' => 'Porque el radio de la circunferencia unitaria se vuelve negativo en el segundo cuadrante.',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Cuidado con la definición 📐 La longitud del radio (hipotenusa) siempre es positiva (r = 1). Lo que cambia de signo es la coordenada horizontal X según el lado del origen.'
                        ],
                        [
                            'id' => 'opt_d',
                            'texto' => 'Porque el coseno solo es positivo en 0° y 90°.',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Pensemos un momento 🤔 Recuerda que en el Cuadrante I (0° a 90°) y Cuadrante IV (270° a 360°), la coordenada X es positiva a la derecha, por lo que cos(θ) es positivo (+).'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: Recuerda que cos(θ) representa la coordenada horizontal X del punto en el círculo unitario.',
                        'Nivel 2: 120° se ubica entre 90° y 180° (Cuadrante II). Observa hacia qué lado del eje X queda el punto respecto al centro.'
                    ]
                ],
                [
                    'tipo' => 'resolve',
                    'numero' => 3,
                    'badge' => '3. RESOLVÉ',
                    'titulo' => 'Resolución Guiada: Cálculo Exacto de cos(120°)',
                    'concepto' => 'Coseno',
                    'enunciado' => 'Calcula el valor exacto de cos(120°) paso a paso utilizando su ángulo de referencia respecto al eje X horizontal.',
                    'pasos' => [
                        [
                            'paso_num' => 1,
                            'titulo_paso' => 'Paso 1: Ángulo de Referencia',
                            'instruccion' => 'Para un ángulo θ = 120° en el Cuadrante II, calcula el ángulo agudo de referencia con el eje horizontal: α = 180° − 120°',
                            'opciones' => [
                                ['id' => 'p1_a', 'texto' => 'α = 60°', 'es_correcta' => true, 'feedback' => '¡Correcto! 180° − 120° = 60°.'],
                                ['id' => 'p1_b', 'texto' => 'α = 30°', 'es_correcta' => false, 'feedback_diagnostico' => 'Revisa la resta con el eje horizontal: 180° − 120° = 60°, no 30°.'],
                                ['id' => 'p1_c', 'texto' => 'α = 45°', 'es_correcta' => false, 'feedback_diagnostico' => 'Calcula la diferencia exacta: 180° − 120° = ?']
                            ]
                        ],
                        [
                            'paso_num' => 2,
                            'titulo_paso' => 'Paso 2: Valor Notable Base',
                            'instruccion' => '¿Cuál es el valor trigonométrico notable de cos(60°)?',
                            'opciones' => [
                                ['id' => 'p2_a', 'texto' => 'cos(60°) = 1/2', 'es_correcta' => true, 'feedback' => '¡Muy bien! El coseno de 60° es 1/2 (0.5).'],
                                ['id' => 'p2_b', 'texto' => 'cos(60°) = √3 / 2', 'es_correcta' => false, 'feedback_diagnostico' => 'Atención 👀 √3/2 corresponde a sen(60°) o cos(30°). Recuerda que cos(60°) = 1/2.'],
                                ['id' => 'p2_c', 'texto' => 'cos(60°) = √2 / 2', 'es_correcta' => false, 'feedback_diagnostico' => 'Ese es el valor de 45°. Para 60°, el cateto adyacente mide 1/2.']
                            ]
                        ],
                        [
                            'paso_num' => 3,
                            'titulo_paso' => 'Paso 3: Aplicar Signo del Cuadrante II',
                            'instruccion' => 'Sabiendo que 120° está en el Cuadrante II (donde X < 0), ¿cuál es el resultado final de cos(120°)?',
                            'opciones' => [
                                ['id' => 'p3_a', 'texto' => 'cos(120°) = −1/2', 'es_correcta' => true, 'feedback' => '¡Excelente resolución paso a paso! cos(120°) = −cos(60°) = −1/2.'],
                                ['id' => 'p3_b', 'texto' => 'cos(120°) = +1/2', 'es_correcta' => false, 'feedback_diagnostico' => 'Recuerda que en el Cuadrante II el coseno es negativo debido a que la coordenada X es negativa.']
                            ]
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: En el Cuadrante II, el ángulo de referencia siempre se mide respecto a 180°: α = 180° − θ.',
                        'Nivel 2: El valor absoluto de cos(120°) es igual a cos(60°) = 1/2, pero con signo negativo (−) por estar en el Cuadrante II.'
                    ]
                ],
                [
                    'tipo' => 'desafio',
                    'numero' => 4,
                    'badge' => '4. DESAFÍO',
                    'titulo' => 'Desafío de Análisis: Deducción de Cuadrante y Signo de Tangente',
                    'concepto' => 'Tangente',
                    'pregunta' => 'El radar de Teko detecta una señal en un ángulo θ desconocido. Los sensores registran que tan(θ) < 0 (negativa) y cos(θ) > 0 (positivo). ¿En qué cuadrante se encuentra θ y qué signo tiene sen(θ)?',
                    'opciones' => [
                        [
                            'id' => 'des_a',
                            'texto' => 'Cuadrante IV, y sen(θ) es negativo (−).',
                            'es_correcta' => true,
                            'feedback_positivo' => '¡Brillante deducción! 🌟 Como cos(θ) > 0 (eje X positivo) y tan(θ) = sen(θ)/cos(θ) < 0, necesariamente sen(θ) < 0 (eje Y negativo), lo que corresponde al Cuadrante IV.'
                        ],
                        [
                            'id' => 'des_b',
                            'texto' => 'Cuadrante II, y sen(θ) es positivo (+).',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Hmm... analicemos con calma 🔍 En el Cuadrante II el coseno es negativo (X < 0), pero la condición del problema indica que cos(θ) > 0. ¿En qué cuadrantes el coseno es positivo?'
                        ],
                        [
                            'id' => 'des_c',
                            'texto' => 'Cuadrante III, y sen(θ) es negativo (−).',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Revisa los signos de la tangente 🧭 En el Cuadrante III tanto seno como coseno son negativos, por lo que tan(θ) = (−)/(−) = POSITIVA (+). Pero el radar dice tan(θ) < 0.'
                        ],
                        [
                            'id' => 'des_d',
                            'texto' => 'Cuadrante I, y sen(θ) es positivo (+).',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'En el Cuadrante I todas las funciones son positivas (+), pero el problema indica que la tangente es menor que cero (negativa).'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: Recuerda la relación fundamental: tan(θ) = sen(θ) / cos(θ).',
                        'Nivel 2: Si el cociente es negativo (−) y el denominador cos(θ) es positivo (+), ¿qué signo debe tener el numerador sen(θ)?'
                    ]
                ],
                [
                    'tipo' => 'desafio_final',
                    'numero' => 5,
                    'badge' => '5. DESAFÍO FINAL',
                    'titulo' => 'Desafío Final: Restauración del Cuadrante Perdido',
                    'concepto' => 'Seno',
                    'pregunta' => 'Para restaurar definitivamente el radar, determina qué ángulo θ en el intervalo [0°, 360°] cumple simultáneamente:\n\n1) sen(θ) = −1/2\n2) cos(θ) < 0',
                    'opciones' => [
                        [
                            'id' => 'fin_a',
                            'texto' => 'θ = 210° (Cuadrante III: 180° + 30°)',
                            'es_correcta' => true,
                            'feedback_positivo' => '🏆 ¡MISIÓN COMPLETADA CON ÉXITO! sen(θ) < 0 y cos(θ) < 0 ubican el ángulo en el Cuadrante III. El ángulo de referencia cuyo seno es 1/2 es 30°. Por tanto, θ = 180° + 30° = 210°. ¡Has restaurado el cuadrante perdido!'
                        ],
                        [
                            'id' => 'fin_b',
                            'texto' => 'θ = 330° (Cuadrante IV: 360° − 30°)',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Casi 👀 En 330° el seno sí vale −1/2, ¡pero en el Cuadrante IV el coseno es positivo (+)! La condición 2 exige cos(θ) < 0. ¿En qué otro cuadrante el seno y el coseno son ambos negativos?'
                        ],
                        [
                            'id' => 'fin_c',
                            'texto' => 'θ = 150° (Cuadrante II: 180° − 30°)',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Revisemos el seno 🔍 En 150° (Cuadrante II), sen(150°) = +1/2 (positivo), pero la condición pide sen(θ) = −1/2.'
                        ],
                        [
                            'id' => 'fin_d',
                            'texto' => 'θ = 240° (Cuadrante III: 180° + 60°)',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'El cuadrante es el correcto (III), pero para 240° el ángulo de referencia es 60°, donde sen(60°) = √3/2, no 1/2. ¿Cuál ángulo tiene sen(α) = 1/2?'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: sen(θ) < 0 (abajo) y cos(θ) < 0 (izquierda) señala al Cuadrante III (180° a 270°).',
                        'Nivel 2: El ángulo de referencia cuyo seno vale 1/2 es α = 30°. En el Cuadrante III, calcula 180° + α.'
                    ]
                ]
            ]
        ],

        // ============================================================
        // MISIÓN 2: Las Inversas / Recíprocas (Cosecante, Secante, Cotangente)
        // ============================================================
        'trig_reciprocas' => [
            'id_template' => 'trig_reciprocas',
            'titulo' => 'MISIÓN: El espejo de las recíprocas',
            'tema' => 'Trigonometría',
            'subtitulo' => 'Domina las 3 funciones recíprocas: Cosecante csc(θ) = 1/sen(θ), Secante sec(θ) = 1/cos(θ) y Cotangente cot(θ) = 1/tan(θ).',
            'puntos' => 100,
            'insignia' => '🔄 Maestro de las Razones Recíprocas',
            'conceptos' => ['Cosecante', 'Secante', 'Cotangente'],
            'historia' => 'Los telescopios de la estación orbital operan con lentes reflexivas basadas en las funciones trigonométricas inversas/recíprocas. Para enfocar la imagen astronómica, debes calcular los valores exactos de secante, cosecante y cotangente, y determinar sus signos en cada cuadrante.',
            'etapas' => [
                [
                    'tipo' => 'explora',
                    'numero' => 1,
                    'badge' => '1. EXPLORÁ',
                    'titulo' => 'Exploración: Identidades Recíprocas y Comportamiento',
                    'instruccion' => 'Observa la relación directa entre las funciones fundamentales y sus inversas multiplicativas: sen(θ) · csc(θ) = 1, cos(θ) · sec(θ) = 1 y tan(θ) · cot(θ) = 1. Nota cómo el signo de la recíproca SIEMPRE coincide con el de su función directa asociada.',
                    'visual_tipo' => 'circulo_unitario',
                    'objetivo_texto' => 'Comprueba que sec(θ) tiene el mismo signo que cos(θ), y csc(θ) el mismo signo que sen(θ).',
                    'angulo_default' => 60
                ],
                [
                    'tipo' => 'descubri',
                    'numero' => 2,
                    'badge' => '2. DESCUBRÍ',
                    'titulo' => 'Descubrimiento: La Razón Recíproca de Coseno',
                    'concepto' => 'Secante',
                    'pregunta' => 'Si cos(θ) = −1/2 en el Cuadrante II, ¿cuál es el valor exacto de la secante sec(θ)?',
                    'opciones' => [
                        [
                            'id' => 'rec_d1_a',
                            'texto' => 'sec(θ) = −2 (porque sec(θ) = 1 / cos(θ) = 1 / (−1/2) = −2)',
                            'es_correcta' => true,
                            'feedback_positivo' => '¡Exacto! 🎯 La secante es el inverso multiplicativo del coseno: 1 / (−1/2) = −2. Conserva exactamente el signo negativo (−).'
                        ],
                        [
                            'id' => 'rec_d1_b',
                            'texto' => 'sec(θ) = +2 (porque la secante siempre es positiva en todos los cuadrantes)',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Cuidado con los signos 👀 La secante NO siempre es positiva. Al ser sec(θ) = 1/cos(θ), tiene exactamente el mismo signo que el coseno. Si cos(θ) < 0, entonces sec(θ) < 0.'
                        ],
                        [
                            'id' => 'rec_d1_c',
                            'texto' => 'sec(θ) = −1/2 (porque no cambia al invertir)',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Recuerda invertir la fracción 📐 El inverso multiplicativo de 1/2 es 2/1 = 2.'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: Recuerda la definición de secante: sec(θ) = 1 / cos(θ).',
                        'Nivel 2: Invertir una fracción a/b da como resultado b/a, manteniendo su signo.'
                    ]
                ],
                [
                    'tipo' => 'resolve',
                    'numero' => 3,
                    'badge' => '3. RESOLVÉ',
                    'titulo' => 'Resolución: Cálculo Paso a Paso de csc(210°)',
                    'concepto' => 'Cosecante',
                    'enunciado' => 'Calcula el valor exacto de la cosecante csc(210°) paso a paso utilizando la función seno.',
                    'pasos' => [
                        [
                            'paso_num' => 1,
                            'titulo_paso' => 'Paso 1: Identificar sen(210°) en el Cuadrante III',
                            'instruccion' => 'Para θ = 210° (ángulo de referencia α = 30° en Cuadrante III), ¿cuánto vale sen(210°)?',
                            'opciones' => [
                                ['id' => 'csc_p1_a', 'texto' => 'sen(210°) = −1/2', 'es_correcta' => true, 'feedback' => '¡Correcto! En Q-III el seno es negativo: sen(210°) = −sen(30°) = −1/2.'],
                                ['id' => 'csc_p1_b', 'texto' => 'sen(210°) = +1/2', 'es_correcta' => false, 'feedback_diagnostico' => 'En el Cuadrante III (180° a 270°), la proyección vertical Y está por debajo del origen (−).'],
                                ['id' => 'csc_p1_c', 'texto' => 'sen(210°) = −√3/2', 'es_correcta' => false, 'feedback_diagnostico' => 'El ángulo de referencia es 210° − 180° = 30°, y sen(30°) = 1/2.']
                            ]
                        ],
                        [
                            'paso_num' => 2,
                            'titulo_paso' => 'Paso 2: Aplicar la identidad recíproca csc(θ) = 1 / sen(θ)',
                            'instruccion' => 'Calcula csc(210°) = 1 / (−1/2):',
                            'opciones' => [
                                ['id' => 'csc_p2_a', 'texto' => 'csc(210°) = −2', 'es_correcta' => true, 'feedback' => '¡Muy bien! 1 / (−1/2) = −2.'],
                                ['id' => 'csc_p2_b', 'texto' => 'csc(210°) = −√2', 'es_correcta' => false, 'feedback_diagnostico' => 'Divide 1 entre 1/2, lo cual resulta en 2, manteniendo el signo negativo.']
                            ]
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: La cosecante es la recíproca del seno: csc(θ) = 1 / sen(θ).',
                        'Nivel 2: Primero halla sen(210°) y luego invierte su valor.'
                    ]
                ],
                [
                    'tipo' => 'desafio',
                    'numero' => 4,
                    'badge' => '4. DESAFÍO',
                    'titulo' => 'Desafío: Signos y Valores de la Cotangente cot(θ)',
                    'concepto' => 'Cotangente',
                    'pregunta' => 'Si tan(θ) = −1/√3 y el ángulo θ pertenece al Cuadrante IV, ¿cuál es el valor de cot(θ) y qué signo tiene?',
                    'opciones' => [
                        [
                            'id' => 'cot_des_a',
                            'texto' => 'cot(θ) = −√3 (negativa)',
                            'es_correcta' => true,
                            'feedback_positivo' => '¡Brillante! 🌟 cot(θ) = 1 / tan(θ) = 1 / (−1/√3) = −√3. En el Cuadrante IV tanto la tangente como la cotangente son negativas (−).'
                        ],
                        [
                            'id' => 'cot_des_b',
                            'texto' => 'cot(θ) = +√3 (positiva)',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'En el Cuadrante IV, X es positiva pero Y es negativa, por lo que cot(θ) = X/Y = (+)/(−) = NEGATIVA (−).'
                        ],
                        [
                            'id' => 'cot_des_c',
                            'texto' => 'cot(θ) = −1/3',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'El inverso de 1/√3 es √3/1 = √3.'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: cot(θ) = 1 / tan(θ) = cos(θ) / sen(θ).',
                        'Nivel 2: Invertir la fracción −1/√3 produce −√3.'
                    ]
                ],
                [
                    'tipo' => 'desafio_final',
                    'numero' => 5,
                    'badge' => '5. DESAFÍO FINAL',
                    'titulo' => 'Desafío Final: Calibración de las 6 Razones',
                    'concepto' => 'Cosecante',
                    'pregunta' => 'Para sincronizar el telescopio, simplifica la siguiente expresión trigonométrica:\n\nE = [sen(θ) · csc(θ)] + [cos(θ) · sec(θ)] + [tan(θ) · cot(θ)]\n\n¿Cuál es el valor constante de E para cualquier ángulo donde las funciones estén definidas?',
                    'opciones' => [
                        [
                            'id' => 'rec_fin_a',
                            'texto' => 'E = 3 (porque cada par recíproco multiplica exactamente 1: 1 + 1 + 1 = 3)',
                            'es_correcta' => true,
                            'feedback_positivo' => '🏆 ¡MISIÓN CUMPLIDA! Por las identidades recíprocas fundamentales: sen·csc = 1, cos·sec = 1 y tan·cot = 1. Así: 1 + 1 + 1 = 3. ¡Telescopio calibrado con éxito!'
                        ],
                        [
                            'id' => 'rec_fin_b',
                            'texto' => 'E = 0',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Recuerda que las razones recíprocas no se cancelan a cero al multiplicarse, sino que dan 1 (ej. 2 · 1/2 = 1).'
                        ],
                        [
                            'id' => 'rec_fin_c',
                            'texto' => 'E = 1',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Cada uno de los 3 sumandos vale 1. Suma 1 + 1 + 1.'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: Aplica las identidades: sen(θ)·csc(θ) = 1, cos(θ)·sec(θ) = 1, tan(θ)·cot(θ) = 1.',
                        'Nivel 2: Suma los 3 resultados unitarios.'
                    ]
                ]
            ]
        ],

        // ============================================================
        // MISIÓN 3: Gráficas de Seno, Coseno y Tangente
        // ============================================================
        'trig_ondas' => [
            'id_template' => 'trig_ondas',
            'titulo' => 'MISIÓN: La órbita de las ondas periódicas',
            'tema' => 'Trigonometría',
            'subtitulo' => 'Sincroniza la frecuencia, período y amplitud de funciones senoidales, cosenoidales y tangenciales.',
            'puntos' => 100,
            'insignia' => '📡 Operador de Ondas Senoidales',
            'conceptos' => ['Seno', 'Coseno', 'Tangente'],
            'historia' => 'Un satélite en órbita terrestre emite pulsos de telemetría modulados en funciones periódicas de seno y coseno. Calibra la amplitud y el período de las curvas para estabilizar la señal de recepción.',
            'etapas' => [
                [
                    'tipo' => 'explora',
                    'numero' => 1,
                    'badge' => '1. EXPLORÁ',
                    'titulo' => 'Exploración: Parámetros de la Función y = A · sen(Bx)',
                    'instruccion' => 'Observa cómo varía la altura máxima (amplitud |A|) y la longitud de un ciclo completo (período T = 2π/B) al interactuar con los parámetros de la curva senoidal.',
                    'visual_tipo' => 'circulo_unitario',
                    'objetivo_texto' => 'Prueba alterar el ángulo para ver cómo se genera la gráfica del seno y coseno a partir de la circunferencia unitaria.',
                    'angulo_default' => 90
                ],
                [
                    'tipo' => 'descubri',
                    'numero' => 2,
                    'badge' => '2. DESCUBRÍ',
                    'titulo' => 'Descubrimiento: Amplitud de Curvas Trigonométricas',
                    'concepto' => 'Seno',
                    'pregunta' => 'Si modificamos la función de y = sen(x) a y = 3·sen(x), ¿qué propiedad de la gráfica cambia?',
                    'opciones' => [
                        [
                            'id' => 'onda_d1_a',
                            'texto' => 'La amplitud aumenta a 3: la onda sube hasta +3 y baja hasta −3, pero el período sigue siendo 2π.',
                            'es_correcta' => true,
                            'feedback_positivo' => '¡Exacto! 🌊 El factor que multiplica a la función modifica su amplitud vertical sin alterar la longitud horizontal del ciclo.'
                        ],
                        [
                            'id' => 'onda_d1_b',
                            'texto' => 'La onda se comprime horizontalmente completando 3 ciclos en 2π.',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Cuidado 🧐 El número 3 está multiplicando afuera de la función: 3·sen(x). Para comprimir horizontalmente el 3 debería estar adentro del argumento: sen(3x).'
                        ],
                        [
                            'id' => 'onda_d1_c',
                            'texto' => 'La gráfica se desplaza 3 unidades hacia la derecha en el eje X.',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Un desplazamiento horizontal requiere restar dentro del argumento, ej. sen(x − 3). Multiplicar por 3 escala verticalmente la gráfica.'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: El valor absoluto |A| en y = A·sen(Bx) determina el rango: [−A, +A].',
                        'Nivel 2: Si A = 3, el valor máximo alcanzado es +3 y el mínimo es −3.'
                    ]
                ],
                [
                    'tipo' => 'resolve',
                    'numero' => 3,
                    'badge' => '3. RESOLVÉ',
                    'titulo' => 'Resolución: Período de y = 2·sen(4x)',
                    'concepto' => 'Seno',
                    'enunciado' => 'Determina el período exacto de la onda y = 2·sen(4x) paso a paso.',
                    'pasos' => [
                        [
                            'paso_num' => 1,
                            'titulo_paso' => 'Paso 1: Identificar el coeficiente angular B',
                            'instruccion' => 'En la forma general y = A·sen(Bx), ¿cuál es el valor de B?',
                            'opciones' => [
                                ['id' => 'res_onda_p1', 'texto' => 'B = 4', 'es_correcta' => true, 'feedback' => '¡Correcto! El coeficiente dentro del argumento es B = 4.'],
                                ['id' => 'res_onda_p1_bad', 'texto' => 'B = 2', 'es_correcta' => false, 'feedback_diagnostico' => 'El número 2 es la amplitud A. El factor que multiplica a x es B = 4.']
                            ]
                        ],
                        [
                            'paso_num' => 2,
                            'titulo_paso' => 'Paso 2: Aplicar fórmula del período T = 2π / B',
                            'instruccion' => 'Calcula T = 2π / 4 simplificando la fracción:',
                            'opciones' => [
                                ['id' => 'res_onda_p2', 'texto' => 'T = π/2 (90°)', 'es_correcta' => true, 'feedback' => '¡Muy bien! 2π / 4 = π/2.'],
                                ['id' => 'res_onda_p2_bad', 'texto' => 'T = 8π', 'es_correcta' => false, 'feedback_diagnostico' => 'Recuerda que la fórmula divide por B: 2π / 4 = π/2, no multiplica.']
                            ]
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: La fórmula del período para funciones senoidales estándar es T = 2π / B.',
                        'Nivel 2: Simplifica la fracción 2/4 dividiendo numerador y denominador por 2.'
                    ]
                ],
                [
                    'tipo' => 'desafio',
                    'numero' => 4,
                    'badge' => '4. DESAFÍO',
                    'titulo' => 'Desafío: Ceros de la Función Coseno',
                    'concepto' => 'Coseno',
                    'pregunta' => '¿Para cuáles de los siguientes ángulos en [0°, 360°] se anula la función y = cos(x), es decir, cos(x) = 0?',
                    'opciones' => [
                        [
                            'id' => 'des_onda_a',
                            'texto' => 'En 90° (π/2) y 270° (3π/2).',
                            'es_correcta' => true,
                            'feedback_positivo' => '¡Excelente! 🎯 En la circunferencia unitaria, el coseno es la coordenada horizontal X. El punto corta el eje vertical Y en 90° y 270°, donde X = 0.'
                        ],
                        [
                            'id' => 'des_onda_b',
                            'texto' => 'En 0° y 180°.',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'En 0° cos(0°) = 1, y en 180° cos(180°) = −1. Los ángulos 0° y 180° son ceros del SENO, no del coseno.'
                        ],
                        [
                            'id' => 'des_onda_c',
                            'texto' => 'En 45° y 225°.',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'En 45° cos(45°) = √2/2 ≠ 0. Observa dónde la gráfica cartesiana del coseno corta el eje horizontal.'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: El coseno representa la coordenada X. Busca los ángulos donde X = 0 (sobre el eje vertical Y).',
                        'Nivel 2: Los polos superior (arriba) e inferior (abajo) corresponden a 90° y 270°.'
                    ]
                ],
                [
                    'tipo' => 'desafio_final',
                    'numero' => 5,
                    'badge' => '5. DESAFÍO FINAL',
                    'titulo' => 'Desafío Final: Sintonía de Frecuencia Orbital',
                    'concepto' => 'Tangente',
                    'pregunta' => 'Para evitar interferencias, se requiere una onda con amplitud A = 5 y que complete exactamente 2 ciclos completos en el intervalo [0, 2π]. ¿Cuál es la ecuación de la señal?',
                    'opciones' => [
                        [
                            'id' => 'fin_onda_a',
                            'texto' => 'y = 5 · sen(2x)',
                            'es_correcta' => true,
                            'feedback_positivo' => '🏆 ¡MISIÓN CUMPLIDA! Amplitud 5 (A = 5) y 2 ciclos completos en 2π (frecuencia B = 2, período T = π). ¡Señal sincronizada con éxito!'
                        ],
                        [
                            'id' => 'fin_onda_b',
                            'texto' => 'y = 2 · sen(5x)',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Aquí la amplitud sería 2 y completaría 5 ciclos. El enunciado pide amplitud 5 y 2 ciclos.'
                        ],
                        [
                            'id' => 'fin_onda_c',
                            'texto' => 'y = 5 · sen(x/2)',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Con B = 1/2 el período sería T = 4π, completando solo medio ciclo en 2π.'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: El número que multiplica al frente es la amplitud: A = 5.',
                        'Nivel 2: El número B dentro de sen(Bx) indica directamente cuántos ciclos completos ocurren en 2π.'
                    ]
                ]
            ]
        ],

        // ============================================================
        // MISIÓN 4: Las 6 Razones Trigonométricas en Triángulos
        // ============================================================
        'trig_triangulo' => [
            'id_template' => 'trig_triangulo',
            'titulo' => 'MISIÓN: El enigma del triángulo y las 6 razones',
            'tema' => 'Trigonometría',
            'subtitulo' => 'Aplica seno, coseno, tangente, cosecante, secante y cotangente para reconstruir las medidas exactas de una estructura oculta.',
            'puntos' => 100,
            'insignia' => '📐 Maestro de las 6 Razones Trigonométricas',
            'conceptos' => ['Seno', 'Coseno', 'Tangente'],
            'historia' => 'Unos exploradores hallaron las ruinas de un monumento en forma de rampa geométrica. Conociendo el ángulo de elevación de 30° y la longitud de la base adyacente de 10√3 metros, calcula las 6 razones trigonométricas (sen, cos, tan, csc, sec, cot) y determina la altura y la hipotenusa.',
            'etapas' => [
                [
                    'tipo' => 'explora',
                    'numero' => 1,
                    'badge' => '1. EXPLORÁ',
                    'titulo' => 'Exploración: Triángulo Rectángulo y las 6 Razones',
                    'instruccion' => 'Observa cómo se relacionan el cateto opuesto (O), el cateto adyacente (A) y la hipotenusa (H) respecto al ángulo agudo θ. Recuerda: sen=O/H, cos=A/H, tan=O/A, csc=H/O, sec=H/A y cot=A/O.',
                    'visual_tipo' => 'circulo_unitario',
                    'objetivo_texto' => 'Visualiza la relación entre los catetos y las razones trigonométricas directas y recíprocas.',
                    'angulo_default' => 30
                ],
                [
                    'tipo' => 'descubri',
                    'numero' => 2,
                    'badge' => '2. DESCUBRÍ',
                    'titulo' => 'Descubrimiento: Selección de la Razón Adecuada',
                    'concepto' => 'Tangente',
                    'pregunta' => 'Si conoces el Cateto Adyacente y necesitas hallar el Cateto Opuesto para un ángulo θ dado, ¿cuál es la razón trigonométrica más directa para usar?',
                    'opciones' => [
                        [
                            'id' => 'tri_d1_a',
                            'texto' => 'Tangente: tan(θ) = Cateto Opuesto / Cateto Adyacente',
                            'es_correcta' => true,
                            'feedback_positivo' => '¡Exacto! 🎯 La tangente relaciona directamente el cateto opuesto con el adyacente sin requerir conocer previamente la hipotenusa.'
                        ],
                        [
                            'id' => 'tri_d1_b',
                            'texto' => 'Seno: sen(θ) = Cateto Opuesto / Hipotenusa',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'El seno requiere la hipotenusa, pero en este caso solo conoces el cateto adyacente y buscas el opuesto. ¿Qué razón relaciona opuesto y adyacente?'
                        ],
                        [
                            'id' => 'tri_d1_c',
                            'texto' => 'Coseno: cos(θ) = Cateto Adyacente / Hipotenusa',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'El coseno relaciona el adyacente con la hipotenusa, pero no involucra al cateto opuesto.'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: Recuerda el mnemónico SOH - CAH - TOA.',
                        'Nivel 2: TOA = Tangente es Opuesto sobre Adyacente.'
                    ]
                ],
                [
                    'tipo' => 'resolve',
                    'numero' => 3,
                    'badge' => '3. RESOLVÉ',
                    'titulo' => 'Resolución: Cálculo de la Altura con tan(30°)',
                    'concepto' => 'Tangente',
                    'enunciado' => 'Sabiendo que el cateto adyacente mide 10√3 m y el ángulo es 30°, calcula la altura (cateto opuesto) paso a paso.',
                    'pasos' => [
                        [
                            'paso_num' => 1,
                            'titulo_paso' => 'Paso 1: Valor notable de tan(30°)',
                            'instruccion' => '¿Cuál es el valor exacto de tan(30°)?',
                            'opciones' => [
                                ['id' => 'res_tri_p1', 'texto' => 'tan(30°) = 1 / √3 (o √3 / 3)', 'es_correcta' => true, 'feedback' => '¡Correcto! tan(30°) = sen(30°)/cos(30°) = (1/2)/(√3/2) = 1/√3.'],
                                ['id' => 'res_tri_p1_bad', 'texto' => 'tan(30°) = √3', 'es_correcta' => false, 'feedback_diagnostico' => '√3 corresponde a tan(60°). Para 30° es 1/√3.']
                            ]
                        ],
                        [
                            'paso_num' => 2,
                            'titulo_paso' => 'Paso 2: Despejar y calcular la altura h',
                            'instruccion' => 'h = Adyacente · tan(30°) = 10√3 · (1 / √3)',
                            'opciones' => [
                                ['id' => 'res_tri_p2', 'texto' => 'h = 10 metros', 'es_correcta' => true, 'feedback' => '¡Brillante! Las raíces de 3 se cancelan: 10√3 / √3 = 10 m.'],
                                ['id' => 'res_tri_p2_bad', 'texto' => 'h = 30 metros', 'es_correcta' => false, 'feedback_diagnostico' => 'Observa que √3 en el numerador y √3 en el denominador se simplifican a 1.']
                            ]
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: Sustituye tan(30°) = 1/√3 en la ecuación h = Base · tan(30°).',
                        'Nivel 2: Multiplica 10√3 por 1/√3.'
                    ]
                ],
                [
                    'tipo' => 'desafio',
                    'numero' => 4,
                    'badge' => '4. DESAFÍO',
                    'titulo' => 'Desafío: Cálculo de la Hipotenusa y Cosecante',
                    'concepto' => 'Seno',
                    'pregunta' => 'Conociendo que el cateto opuesto (altura) mide 10 m y sen(30°) = 1/2, ¿cuánto mide la hipotenusa H y cuál es el valor de csc(30°)?',
                    'opciones' => [
                        [
                            'id' => 'des_tri_a',
                            'texto' => 'H = 20 metros y csc(30°) = 2',
                            'es_correcta' => true,
                            'feedback_positivo' => '¡Excelente! 🌟 H = Opuesto / sen(30°) = 10 / (1/2) = 20 metros. Y por definición recíproca, csc(30°) = 1 / sen(30°) = 2.'
                        ],
                        [
                            'id' => 'des_tri_b',
                            'texto' => 'H = 15 metros y csc(30°) = 1/2',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Despeja la hipotenusa: si 1/2 = 10 / H, entonces H = 10 / (1/2) = 20 m. Además, la cosecante es el inverso: 1/(1/2) = 2.'
                        ],
                        [
                            'id' => 'des_tri_c',
                            'texto' => 'H = 10√2 metros y csc(30°) = √2',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Ese valor corresponde al ángulo de 45°. Para 30°, sen(30°) = 1/2 y csc(30°) = 2.'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: sen(θ) = Opuesto / Hipotenusa ➔ Hipotenusa = Opuesto / sen(θ).',
                        'Nivel 2: csc(θ) = 1 / sen(θ) = 1 / (1/2) = 2.'
                    ]
                ],
                [
                    'tipo' => 'desafio_final',
                    'numero' => 5,
                    'badge' => '5. DESAFÍO FINAL',
                    'titulo' => 'Desafío Final: Identidad Pitagórica Fundamental',
                    'concepto' => 'Coseno',
                    'pregunta' => 'Para validar las mediciones de la estructura, comprueba la identidad pitagórica fundamental:\n\nsen²(30°) + cos²(30°) = (1/2)² + (√3/2)² = 1/4 + 3/4 = 4/4 = 1\n\n¿Qué relación se cumple también al dividir toda la ecuación por cos²(θ)?',
                    'opciones' => [
                        [
                            'id' => 'fin_tri_a',
                            'texto' => '1 + tan²(θ) = sec²(θ) (la identidad pitagórica para la secante)',
                            'es_correcta' => true,
                            'feedback_positivo' => '🏆 ¡MISIÓN COMPLETADA! sen²(θ)/cos²(θ) + cos²(θ)/cos²(θ) = 1/cos²(θ) ➔ tan²(θ) + 1 = sec²(θ). ¡Has dominado las relaciones directas y recíprocas de la trigonometría!'
                        ],
                        [
                            'id' => 'fin_tri_b',
                            'texto' => '1 + cot²(θ) = sen²(θ)',
                            'es_correcta' => false,
                            'feedback_diagnostico' => 'Al dividir por cos²(θ), el lado derecho 1/cos²(θ) produce sec²(θ), no sen²(θ).'
                        ]
                    ],
                    'pistas' => [
                        'Nivel 1: Recuerda que sen(θ)/cos(θ) = tan(θ) y 1/cos(θ) = sec(θ).',
                        'Nivel 2: Al elevar al cuadrado cada término obtienes tan²(θ) + 1 = sec²(θ).'
                    ]
                ]
            ]
        ]
    ];
}

/**
 * Obtiene una misión por su ID o retorna la primera si no se encuentra
 */
function getMisionPorId(string $idTemplate): array {
    $catalogo = getMisionesCatalogo();
    return $catalogo[$idTemplate] ?? $catalogo['trig_cuadrantes'];
}

/**
 * Asegura que existan misiones demo en la base de datos si la tabla tareas está vacía
 */
function asegurarMisionesDemo(PDO $db, int $docenteId = 2): void {
    try {
        $count = $db->query("SELECT COUNT(*) FROM tareas")->fetchColumn();
        if ($count == 0) {
            $catalogo = getMisionesCatalogo();
            $stmt = $db->prepare("
                INSERT INTO tareas (docente_id, titulo, tema, tipo, historia, fecha_entrega, puntos, instrucciones, mision_data)
                VALUES (:docente_id, :titulo, :tema, 'mision', :historia, :fecha_entrega, :puntos, :instrucciones, :mision_data)
            ");
            
            $fechaEntrega = date('Y-m-d', strtotime('+14 days'));
            foreach ($catalogo as $m) {
                $stmt->execute([
                    ':docente_id'    => $docenteId,
                    ':titulo'        => $m['titulo'],
                    ':tema'          => $m['tema'],
                    ':historia'      => $m['historia'],
                    ':fecha_entrega' => $fechaEntrega,
                    ':puntos'        => $m['puntos'],
                    ':instrucciones' => $m['subtitulo'],
                    ':mision_data'   => json_encode($m, JSON_UNESCAPED_UNICODE)
                ]);
            }
        }
    } catch (Exception $e) {
        // Silencioso si falla
    }
}
