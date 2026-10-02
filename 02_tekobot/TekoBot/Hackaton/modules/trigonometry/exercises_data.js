// modules/trigonometry/exercises_data.js
// Banco completo de ejercicios locales para TODOS los temas del Currículo MEC 1er Año

const OFFLINE_EXERCISES = [
    // ── UNIDAD 1: NÚMEROS REALES ─────────────────────────────────────
    {
        id: 101,
        topic: 'numeros_reales',
        subtopic: 'conjuntos_numericos',
        difficulty_level: 1,
        statement_jopara: "¿Mba'épa ha'e un número irracional en los números reales?",
        statement_es: "¿Cuál es la definición principal de un número irracional?",
        formula_latex: "\\mathbb{R} = \\mathbb{Q} \\cup \\mathbb{I}",
        visual_type: "none",
        initial_angle: 0,
        expected_value: "no se puede escribir como fraccion",
        hint_level_0: "Recordá los conjuntos numéricos: Naturales, Enteros, Racionales e Irracionales.",
        hint_level_1: "Un número racional sí se puede escribir como fracción p/q.",
        hint_level_2: "Un número irracional tiene decimales infinitos no periódicos como π o √2.",
        hint_level_3: "Por lo tanto, un irracional no se puede expresar como una fracción exacta.",
        hint_level_4: "Definición: No se puede expresar como fracción de dos números enteros.",
        hints: [
            "Recordá los conjuntos numéricos: Naturales, Enteros, Racionales e Irracionales.",
            "Un número racional sí se puede escribir como fracción p/q.",
            "Un número irracional tiene decimales infinitos no periódicos como π o √2.",
            "Por lo tanto, un irracional no se puede expresar como una fracción exacta.",
            "Definición: No se puede expresar como fracción de dos números enteros."
        ],
        quick_options: ["No se puede escribir como fracción", "Es siempre un entero negativo", "Se puede escribir como fracción de enteros"]
    },

    // ── UNIDAD 2: CONJUNTOS Y OPERACIONES ────────────────────────────
    {
        id: 201,
        topic: 'conjuntos',
        subtopic: 'union_interseccion',
        difficulty_level: 1,
        statement_jopara: "Si A = {1, 2, 3} ha B = {2, 3, 4}, ¿mba'épa la intersección A ∩ B?",
        statement_es: "Dados A = {1, 2, 3} y B = {2, 3, 4}, ¿cuál es la intersección A ∩ B?",
        formula_latex: "A \\cap B = \\{x \\mid x \\in A \\text{ y } x \\in B\\}",
        visual_type: "none",
        initial_angle: 0,
        expected_value: "{2, 3}",
        hint_level_0: "La intersección (∩) representa los elementos que están en AMBOS conjuntos al mismo tiempo.",
        hint_level_1: "Mirá los elementos compartidos entre {1, 2, 3} y {2, 3, 4}.",
        hint_level: 2,
        hint_level_2: "El 2 está en A y en B. El 3 está en A y en B.",
        hint_level_3: "Los elementos repetidos comunes son el 2 y el 3.",
        hint_level_4: "La intersección es {2, 3}.",
        hints: [
            "La intersección (∩) representa los elementos que están en AMBOS conjuntos al mismo tiempo.",
            "Mirá los elementos compartidos entre {1, 2, 3} y {2, 3, 4}.",
            "El 2 está en A y en B. El 3 está en A y en B.",
            "Los elementos repetidos comunes son el 2 y el 3.",
            "La intersección es {2, 3}."
        ],
        quick_options: ["{2, 3}", "{1, 2, 3, 4}", "{1, 4}"]
    },

    // ── UNIDAD 3: FUNCIONES ──────────────────────────────────────────
    {
        id: 301,
        topic: 'funciones',
        subtopic: 'dominio_recorrido',
        difficulty_level: 2,
        statement_jopara: "¿Mba'épa el dominio de la función f(x) = 1/x?",
        statement_es: "¿Cuál es el dominio de la función f(x) = 1/x?",
        formula_latex: "f(x) = \\frac{1}{x} \\implies D_f = \\mathbb{R} \\setminus \\{0\\}",
        visual_type: "function_graph",
        initial_angle: 0,
        expected_value: "todos los reales excepto cero",
        hints: [
            "El dominio es el conjunto de todos los valores de x donde la función existe.",
            "Recordá que en matemáticas no se puede dividir entre 0.",
            "Si x = 0, tendríamos 1/0, lo cual es indefinido.",
            "Por lo tanto, x puede tomar cualquier valor real EXCEPTO el cero.",
            "El dominio son Todos los números reales excepto cero."
        ],
        quick_options: ["Todos los reales excepto cero", "Todos los números reales", "Solo números positivos"]
    },

    // ── UNIDAD 4: FUNCIONES LINEALES Y CUADRÁTICAS ───────────────────
    {
        id: 401,
        topic: 'funciones_lineales',
        subtopic: 'pendiente_lineal',
        difficulty_level: 1,
        statement_jopara: "Dada la función lineal y = 3x + 2, ¿cuál es su pendiente m?",
        statement_es: "Dada la función y = 3x + 2, determina el valor de la pendiente m.",
        formula_latex: "y = mx + b \\implies m = 3",
        visual_type: "function_graph",
        initial_angle: 0,
        expected_value: "3",
        hints: [
            "En la forma y = mx + b, la letra m representa la pendiente.",
            "La pendiente m es el coeficiente numérico que multiplica a x.",
            "En y = 3x + 2, el número delante de la x es 3.",
            "Por lo tanto, m = 3.",
            "La pendiente es 3."
        ],
        quick_options: ["3", "2", "3x"]
    },

    // ── UNIDAD 5: ECUACIONES E INECUACIONES ─────────────────────────
    {
        id: 501,
        topic: 'ecuaciones',
        subtopic: 'primer_grado',
        difficulty_level: 2,
        statement_jopara: "Resolvemos la ecuación: 2x + 6 = 14. ¿Mba'épa el valor de x?",
        statement_es: "Resuelve la ecuación 2x + 6 = 14.",
        formula_latex: "2x + 6 = 14 \\implies 2x = 8 \\implies x = 4",
        visual_type: "none",
        initial_angle: 0,
        expected_value: "4",
        hints: [
            "Para despejar x, primero pasamos el +6 restando al otro lado.",
            "2x = 14 - 6",
            "2x = 8",
            "Ahora dividimos 8 entre 2: x = 8 / 2.",
            "x = 4."
        ],
        quick_options: ["x = 4", "x = 5", "x = 10"]
    },

    // ── UNIDAD 6: GEOMETRÍA ANALÍTICA ────────────────────────────────
    {
        id: 601,
        topic: 'geometria',
        subtopic: 'distancia_puntos',
        difficulty_level: 2,
        statement_jopara: "¿Mba'épa la distancia entre los puntos P1(0,0) ha P2(3,4)?",
        statement_es: "Calcula la distancia entre el origen (0,0) y el punto (3,4).",
        formula_latex: "d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} = \\sqrt{3^2 + 4^2} = 5",
        visual_type: "none",
        initial_angle: 0,
        expected_value: "5",
        hints: [
            "Usamos el Teorema de Pitágoras o la fórmula de distancia entre dos puntos.",
            "d = √( (3 - 0)² + (4 - 0)² )",
            "d = √( 3² + 4² ) = √( 9 + 16 )",
            "d = √25",
            "La distancia es 5."
        ],
        quick_options: ["5", "7", "25"]
    },

    // ── UNIDAD 7: TRIGONOMETRÍA (NÚCLEO) ─────────────────────────────
    {
        id: 1,
        topic: 'trigonometria',
        subtopic: 'cuadrantes',
        difficulty_level: 1,
        statement_jopara: "¿Mba'e cuadrante-pe piko oĩ el ángulo de 120°?",
        statement_es: "¿En qué cuadrante se encuentra el ángulo de 120°?",
        formula_latex: "\\theta = 120^\\circ",
        visual_type: "unit_circle",
        initial_angle: 120,
        expected_value: "II",
        hints: [
            "Ñanemandu'ami: el plano cartesiano tiene 4 cuadrantes en sentido antihorario.",
            "¿Entre qué ángulos límite está 120°? (0°-90°, 90°-180°, 180°-270°, 270°-360°)",
            "120° es mayor a 90° y menor a 180°.",
            "El cuadrante entre 90° y 180° es el segundo cuadrante (Cuadrante II).",
            "120° pertenece al Segundo Cuadrante (II)."
        ],
        quick_options: ["Segundo cuadrante (II)", "Primer cuadrante (I)", "Tercer cuadrante (III)", "Cuarto cuadrante (IV)"]
    },
    {
        id: 2,
        topic: 'trigonometria',
        subtopic: 'angulos_notables',
        difficulty_level: 2,
        statement_jopara: "Encontrá el ángulo de referencia de 150°. Jahecha cuánto le falta para llegar a 180°.",
        statement_es: "Encuentra el ángulo de referencia de 150°.",
        formula_latex: "\\theta_{ref} = 180^\\circ - 150^\\circ",
        visual_type: "unit_circle",
        initial_angle: 150,
        expected_value: "30",
        hints: [
            "El ángulo de referencia es el ángulo agudo positivo formado con el eje horizontal X.",
            "En el segundo cuadrante, la fórmula es: θ_ref = 180° - θ.",
            "Restemos: 180° - 150°.",
            "180° - 150° nos da un ángulo notable fundamental.",
            "El ángulo de referencia es 30°."
        ],
        quick_options: ["30°", "45°", "60°", "90°"]
    },
    {
        id: 3,
        topic: 'trigonometria',
        subtopic: 'sen_cos',
        difficulty_level: 3,
        statement_jopara: "Determiná el valor exacto de sen(150°). Eñatende porã en el signo del segundo cuadrante.",
        statement_es: "Determina el valor de sen(150°).",
        formula_latex: "\\text{sen}(150^\\circ) = +\\text{sen}(30^\\circ)",
        visual_type: "unit_circle",
        initial_angle: 150,
        expected_value: "1/2",
        hints: [
            "sen(θ) corresponde a la coordenada Y en la circunferencia unitaria.",
            "150° está en el segundo cuadrante (II). ¿La coordenada Y es positiva o negativa?",
            "En el segundo cuadrante, Y es positiva (+), por lo que sen(150°) = +sen(30°).",
            "El seno de 30° es exactamente 1/2.",
            "sen(150°) = 1/2 (positivo)."
        ],
        quick_options: ["1/2", "-1/2", "√3/2", "-√3/2"]
    },

    // ── UNIDAD 8: ESTADÍSTICA DESCRIPTIVA ────────────────────────────
    {
        id: 801,
        topic: 'estadistica',
        subtopic: 'media_aritmetica',
        difficulty_level: 2,
        statement_jopara: "¿Mba'épa la media aritmética (promedio) de los datos: 2, 4, 6, 8, 10?",
        statement_es: "Calcula la media aritmética del conjunto de datos: 2, 4, 6, 8, 10.",
        formula_latex: "\\bar{x} = \\frac{\\sum x_i}{n} = \\frac{2+4+6+8+10}{5} = 6",
        visual_type: "none",
        initial_angle: 0,
        expected_value: "6",
        hints: [
            "La media aritmética es la suma de todos los valores dividida entre la cantidad total de datos.",
            "Primero sumamos: 2 + 4 + 6 + 8 + 10 = 30.",
            "Contamos la cantidad de datos: hay 5 números en total.",
            "Dividimos la suma entre 5: 30 / 5 = 6.",
            "La media es 6."
        ],
        quick_options: ["6", "5", "30"]
    }
];
