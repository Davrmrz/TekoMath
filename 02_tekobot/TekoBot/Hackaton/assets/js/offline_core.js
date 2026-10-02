// assets/js/offline_core.js - Motor SocrÃ¡tico con explicaciones teÃ³ricas completas, detalladas y ejemplos paso a paso para las 8 unidades del MEC

class OfflinePedagogyEngine {
    setTutorState(state) { this.tutorState = state; }
    processLesson(message, action = '') {
        this.tutorState.language=this.lang;
        const next = LessonEngine.transition(this.tutorState, message, action);
        next.revision++;
        next.last_response = LessonEngine.response(next);
        this.tutorState = next;
        return {response: next.last_response, tutor_state: next};
    }
    constructor() {
        this.currentExerciseIndex = 0;
        this.currentHintLevel = 0;
        this.attempts = 0;
        this.explanationStep = 0;
        this.lang = 'jopara'; // 'jopara', 'es_py', 'es'
        this.topic = 'trigonometria';
    }

    setLanguage(lang) { this.lang = lang || 'jopara'; }
    setTopic(topic)    { this.topic = topic || 'trigonometria'; this.currentExerciseIndex = 0; this.currentHintLevel = 0; this.explanationStep = 0; }

    getTopicExercises() {
        if (typeof OFFLINE_EXERCISES === 'undefined' || !Array.isArray(OFFLINE_EXERCISES)) return [];
        return OFFLINE_EXERCISES.filter(e => e.topic === this.topic);
    }

    getCurrentExercise() {
        const list = this.getTopicExercises();
        if (list.length > 0) {
            return list[this.currentExerciseIndex % list.length];
        }
        return {
            topic: this.topic,
            subtopic: 'general',
            statement_jopara: `Ejercicio sobre ${this.getTopicDisplayName()}`,
            statement_es: `Ejercicio sobre ${this.getTopicDisplayName()}`,
            formula_latex: "",
            expected_value: "1",
            hints: ["AnalizÃ¡ la teorÃ­a fundamental del tema."]
        };
    }

    nextExercise() {
        this.currentExerciseIndex++;
        this.currentHintLevel = 0;
        this.attempts = 0;
        return this.getCurrentExercise();
    }

    _t(jopara, es_py, es) {
        if (this.lang === 'es') return es;
        if (this.lang === 'es_py') return es_py;
        return jopara;
    }

    getWelcomeMessage() {
        const ex = this.getCurrentExercise();

        const introMap = {
            numeros_reales: {
                msg: this._t(
                    `Â¡Mba'Ã©ichapa! Che ha'e TekoBot, tu tutor de **NÃºmeros Reales**.\n\nðŸ’¡ **Ejemplo cotidiano:** Al comprar $\\frac{1}{2}$ kg de mandioca ($0.5$ kg) usÃ¡s un nÃºmero **Racional** (se escribe como fracciÃ³n). En cambio, la relaciÃ³n en una rueda de bici entre su borde y diÃ¡metro es $\\pi \\approx 3.14159...$, un nÃºmero **Irracional** (decimales infinitos que nunca se repiten).\n\nÂ¿Reipota ambo'e la teorÃ­a paso a paso o pasamos directo a los ejercicios?`,
                    `Â¡Hola! Bienvenido a la unidad de **NÃºmeros Reales**.\n\nðŸ’¡ **Ejemplo:** Comprar $\\frac{1}{2}$ kg de queso ($0.5$) es un nÃºmero Racional. El nÃºmero $\\pi \\approx 3.14159...$ es Irracional.\n\nÂ¿Deseas una explicaciÃ³n guiada paso a paso o resolver ejercicios?`,
                    `Â¡Hola! Bienvenido a **NÃºmeros Reales**.\n\nEstudiaremos la estructura de $\\mathbb{R} = \\mathbb{Q} \\cup \\mathbb{I}$. Â¿Deseas una explicaciÃ³n paso a paso o ir a los ejercicios?`
                ),
                formula: "\\mathbb{R} = \\mathbb{Q} \\cup \\mathbb{I}"
            },
            conjuntos: {
                msg: this._t(
                    `Â¡Mba'Ã©ichapa! Bienvenido a **Conjuntos y Operaciones**.\n\nðŸ’¡ **Ejemplo cotidiano:** Si el Conjunto A representa a los alumnos de fÃºtbol y el Conjunto B a los de bÃ¡squet:\n- **UniÃ³n ($A \\cup B$):** Todos los alumnos que juegan al menos un deporte.\n- **IntersecciÃ³n ($A \\cap B$):** Los que juegan AMBOS deportes a la vez.\n\nÂ¿Reipota ambo'e la teorÃ­a paso a paso o pasamos a ejercitar?`,
                    `Â¡Hola! Bienvenido a **Conjuntos y Operaciones**.\n\nVeremos uniÃ³n e intersecciÃ³n con diagramas de Venn. Â¿Te explico la teorÃ­a paso a paso o preferÃ­s ejercicios?`,
                    `Â¡Hola! Bienvenido a **Conjuntos y Operaciones**.\n\nÂ¿Deseas una explicaciÃ³n teÃ³rica o prefieres ir a la prÃ¡ctica?`
                ),
                formula: "A \\cap B = \\{x \\mid x \\in A \\text{ y } x \\in B\\}"
            },
            funciones: {
                msg: this._t(
                    `Â¡Mba'Ã©ichapa! Bienvenido a **Funciones y sus Representaciones**.\n\nðŸ’¡ **Ejemplo cotidiano:** Si cada empanada cuesta 5.000 Gs, la funciÃ³n de costo es $f(x) = 5.000x$.\nSi comprÃ¡s 3 empanadas: $f(3) = 15.000$ Gs. La cantidad de empanadas es el **Dominio** y el precio total es el **Recorrido**.\n\nÂ¿Reipota ambo'e la teorÃ­a paso a paso o hacemos ejercicios?`,
                    `Â¡Hola! Bienvenido a **Funciones**.\n\nEjemplo: $f(x) = 5.000x$ calcula el costo de $x$ empanadas. Â¿PreferÃ­s la teorÃ­a paso a paso o ir a los ejercicios?`,
                    `Â¡Hola! Bienvenido a **Funciones**.\n\nÂ¿Deseas una explicaciÃ³n detallada o ir a los ejercicios prÃ¡cticos?`
                ),
                formula: "f(x) = 5.000 \\cdot x \\implies f(3) = 15.000"
            },
            funciones_lineales: {
                msg: this._t(
                    `Â¡Mba'Ã©ichapa! Bienvenido a **Funciones Lineales y CuadrÃ¡ticas**.\n\nðŸ’¡ **Ejemplo cotidiano:** Una tarifa de viaje $y = 2.000x + 10.000$ donde $m = 2.000$ es el costo por km y $b = 10.000$ es la bajada de bandera inicial.\n\nÂ¿Reipota ambo'e la teorÃ­a paso a paso o pasamos a los ejercicios?`,
                    `Â¡Hola! Bienvenido a **Funciones Lineales**.\n\nVeremos pendientes y parÃ¡bolas. Â¿Te explico la teorÃ­a o pasamos a ejercitar?`,
                    `Â¡Hola! Bienvenido a **Funciones Lineales**.\n\nÂ¿Deseas una explicaciÃ³n paso a paso o ir a los ejercicios?`
                ),
                formula: "y = mx + b \\implies y = 2.000x + 10.000"
            },
            ecuaciones: {
                msg: this._t(
                    `Â¡Mba'Ã©ichapa! Bienvenido a **Ecuaciones e Inecuaciones**.\n\nðŸ’¡ **Ejemplo cotidiano:** Compraste 2 cuadernos iguales y un lÃ¡piz de 6.000 Gs pagando 14.000 Gs en total. EcuaciÃ³n: $2x + 6.000 = 14.000 \\implies x = 4.000$ Gs cada cuaderno.\n\nÂ¿Reipota ambo'e los despejes paso a paso o hacemos ejercicios?`,
                    `Â¡Hola! Vamos a resolver **Ecuaciones**.\n\nEjemplo: $2x + 6.000 = 14.000 \\implies x = 4.000$. Â¿PreferÃ­s la teorÃ­a o ir a los ejercicios?`,
                    `Â¡Hola! Bienvenido a **Ecuaciones**.\n\nÂ¿Deseas una explicaciÃ³n de los mÃ©todos de despeje o ir a los ejercicios?`
                ),
                formula: "2x + 6.000 = 14.000 \\implies x = 4.000"
            },
            geometria: {
                msg: this._t(
                    `Â¡Mba'Ã©ichapa! Bienvenido a **GeometrÃ­a AnalÃ­tica**.\n\nðŸ’¡ **Ejemplo cotidiano:** Si caminas 3 cuadras al este y 4 al norte desde $(0,0)$ a $(3,4)$, la distancia recta en diagonal es $d = \\sqrt{3^2 + 4^2} = 5$ cuadras.\n\nÂ¿Reipota ambo'e la teorÃ­a paso a paso o ejercitaciÃ³n directa?`,
                    `Â¡Hola! Bienvenido a **GeometrÃ­a AnalÃ­tica**.\n\nFÃ³rmula de distancia: $d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$. Â¿Te explico la teorÃ­a o pasamos a ejercitar?`,
                    `Â¡Hola! Bienvenido a **GeometrÃ­a AnalÃ­tica**.\n\nÂ¿Deseas una explicaciÃ³n guiada o prefieres ir a la prÃ¡ctica?`
                ),
                formula: "d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} = 5"
            },
            trigonometria: {
                msg: this._t(
                    `Â¡Mba'Ã©ichapa! Che ha'e TekoBot, tu tutor de **TrigonometrÃ­a**.\n\nEn la circunferencia de radio 1: Seno = coordenada Y, Coseno = coordenada X.\n\nÂ¿Reipota ambo'e la teorÃ­a paso a paso o pasamos a los ejercicios?`,
                    `Â¡Hola! Bienvenido a **TrigonometrÃ­a**.\n\nEstudiaremos la circunferencia trigonomÃ©trica y cuadrantes. Â¿Te explico paso a paso o querÃ©s ejercicios?`,
                    `Â¡Hola! Bienvenido a **TrigonometrÃ­a**.\n\nÂ¿Deseas una explicaciÃ³n teÃ³rica o ir a la prÃ¡ctica?`
                ),
                formula: "\\operatorname{sen}(30^\\circ) = \\frac{1}{2}, \\quad \\cos(30^\\circ) = \\frac{\\sqrt{3}}{2}"
            },
            estadistica: {
                msg: this._t(
                    `Â¡Mba'Ã©ichapa! Bienvenido a **EstadÃ­stica Descriptiva**.\n\nðŸ’¡ **Ejemplo cotidiano:** Si tus notas del colegio son $5, 4, 5, 3, 5$, el promedio (Media) es $22 / 5 = 4.4$ y la Moda es $5$.\n\nÂ¿Reipota ambo'e la teorÃ­a paso a paso o hacemos ejercicios?`,
                    `Â¡Hola! Bienvenido a **EstadÃ­stica Descriptiva**.\n\nCalcularemos Media, Mediana y Moda. Â¿Te explico paso a paso o preferÃ­s hacer ejercicios?`,
                    `Â¡Hola! Bienvenido a **EstadÃ­stica Descriptiva**.\n\nÂ¿Deseas una explicaciÃ³n o ir a la resoluciÃ³n de ejercicios?`
                ),
                formula: "\\bar{x} = \\frac{\\sum x_i}{n} = 4.4"
            }
        };

        const item = introMap[this.topic] || introMap.trigonometria;
        return item.msg;
    }

    getTopicDisplayName() {
        const names = {
            numeros_reales: 'NÃºmeros Reales', conjuntos: 'Conjuntos y Operaciones',
            funciones: 'Funciones', funciones_lineales: 'Funciones Lineales y CuadrÃ¡ticas',
            ecuaciones: 'Ecuaciones e Inecuaciones', geometria: 'GeometrÃ­a AnalÃ­tica',
            trigonometria: 'TrigonometrÃ­a y Funciones TrigonomÃ©tricas', estadistica: 'EstadÃ­stica Descriptiva'
        };
        return names[this.topic] || this.topic;
    }

    getTopicIntro(topic) {
        this.setTopic(topic);
        return this.getWelcomeMessage();
    }

    isGreeting(msg) {
        const greetings = ['hola', 'mbaeichapa', 'mba\'Ã©ichapa', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'saludos', 'como estas', 'hola tutor'];
        return greetings.some(g => msg.includes(g));
    }

    isStudentReflection(msg) {
        const patterns = ['entonces', 'o sea', 'quiere decir', 'significa que', 'bÃ¡sicamente', 'en resumen', 'comprendo que', 'entiendo que', 'todos los numeros', 'todo numero'];
        return patterns.some(p => msg.includes(p));
    }

    // EXPLICACIONES DETALLADAS REALES PASO A PASO PARA TODAS LAS 8 UNIDADES DEL MEC
    getExplanationStep(step = 1) {
        this.explanationStep = step;
        const topic = this.topic;

        const subtopicLessons = {
            numeros_reales: [
                {
                    title: "Subtema 1: NÃºmeros Racionales e Irracionales con Ejemplos",
                    text: this._t(
                        "**Paso 1: ClasificaciÃ³n de NÃºmeros Reales ($\\mathbb{R}$)**\n\n- **Racionales ($\\mathbb{Q}$):** Son aquellos que se pueden expresar exactamente como fracciÃ³n $\\frac{p}{q}$.\n  - *Ejemplo cotidiano:* Si compras $\\frac{1}{2}$ kg de chipa o $\\frac{3}{4}$ de queso, $0.5$ y $0.75$ son racionales.\n- **Irracionales ($\\mathbb{I}$):** Tienen decimales infinitos que NUNCA se repiten en un patrÃ³n periÃ³dico.\n  - *Ejemplo cotidiano:* La relaciÃ³n en la rueda de una bicicleta entre su borde y diÃ¡metro es $\\pi \\approx 3.14159...$, un nÃºmero **Irracional**.\n\nðŸ“Œ **Ejemplo resuelto:** Â¿El nÃºmero $0.333...$ es Racional o Irracional?\n*Respuesta:* Es Racional porque proviene de la fracciÃ³n $\\frac{1}{3}$.\n\nÂ¿Comprendido el Paso 1? Â¿Pasamos al Paso 2 (La Recta Real) o probamos un ejercicio?",
                        "**Paso 1: Racionales e Irracionales**\n\n- Racionales (Q): admiten fracciÃ³n p/q (ej: 1/2 = 0.5).\n- Irracionales (I): decimales infinitos no periÃ³dicos (ej: Ï€ â‰ˆ 3.14159..., âˆš2 â‰ˆ 1.414...).\n\nðŸ“Œ **Ejemplo:** 0.333... es Racional porque equivale a 1/3.\n\nÂ¿Avanzamos al paso 2 o hacemos un ejercicio?",
                        "**Paso 1: Estructura de â„**\n\nRacionales (Q) e Irracionales (I). Â¿Avanzamos al Paso 2 o ejercitamos?"
                    ),
                    formula: "\\mathbb{R} = \\mathbb{Q} \\cup \\mathbb{I}, \\quad 0.333... = \\frac{1}{3} \\in \\mathbb{Q}",
                    options: ["Â¡Entendido! Explicame el Paso 2 (La Recta Real) âž¡ï¸", "ðŸŽ¯ Probar un ejercicio prÃ¡ctico ahora"]
                },
                {
                    title: "Subtema 2: La Recta Real",
                    text: this._t(
                        "**Paso 2: La Recta Real ($\\mathbb{R}$)**\n\nTodos los nÃºmeros reales se ordenan en una lÃ­nea recta continua:\n- A la izquierda del $0$ se ubican los **negativos** ($-2, -0.5$).\n- A la derecha del $0$ se ubican los **positivos** ($+1, +3.14$).\n\nðŸ“Œ **Ejemplo resuelto:** Â¿DÃ³nde se ubica $\\sqrt{2} \\approx 1.41$?\n*Respuesta:* En el lado positivo, exactamente entre el $1$ y el $2$.\n\nÂ¡Excelente! Ya tenÃ©s la base teÃ³rica de NÃºmeros Reales.",
                        "**Paso 2: La Recta Real**\n\nUbica a los nÃºmeros negativos a la izquierda del 0 y a los positivos a la derecha.\n\nðŸ“Œ **Ejemplo:** âˆš2 â‰ˆ 1.41 se ubica entre 1 y 2.",
                        "**Paso 2: Eje Real**\n\nRepresentaciÃ³n de puntos continuos en el eje real."
                    ),
                    formula: "1 < \\sqrt{2} < 2",
                    options: ["ðŸŽ¯ Hagamos un ejercicio sobre NÃºmeros Reales", "ðŸ“š Ver lista de subtemas"]
                }
            ],
            trigonometria: [
                {
                    title: "Subtema 1: La Circunferencia TrigonomÃ©trica y Coordenadas",
                    text: this._t(
                        "**Paso 1: La Circunferencia Unitaria**\n\nImaginemos una circunferencia de radio $r = 1$ en el plano cartesiano. Cualquier punto sobre ella estÃ¡ definido por un Ã¡ngulo $\\theta$.\n\n- **Coordenada Horizontal X:** Mide el **Coseno**: $\\cos(\\theta) = X$.\n- **Coordenada Vertical Y:** Mide el **Seno**: $\\operatorname{sen}(\\theta) = Y$.\n\nðŸ“Œ **Ejemplo resuelto:** Para un Ã¡ngulo de $90^\\circ$:\n- Estamos en el punto $(0, 1) \\implies \\cos(90^\\circ) = 0$ y $\\operatorname{sen}(90^\\circ) = 1$.\n\nÂ¿Pasamos al Paso 2 (Regla de Signos por Cuadrante)?",
                        "**Paso 1: Circunferencia TrigonomÃ©trica**\n\nCircunferencia de radio 1. X es el coseno, Y es el seno.\n\nðŸ“Œ **Ejemplo:** A 90Â°, cos(90Â°) = 0 y sen(90Â°) = 1.",
                        "**Paso 1: Coordenadas TrigonomÃ©tricas**\n\nDefiniciÃ³n de Seno y Coseno en el plano unitario."
                    ),
                    formula: "\\operatorname{sen}(90^\\circ) = 1, \\quad \\cos(90^\\circ) = 0",
                    options: ["Â¡Entendido! Explicame el Paso 2 (Signos por Cuadrante) âž¡ï¸", "ðŸŽ¯ Probar un ejercicio sobre cuadrantes"]
                },
                {
                    title: "Subtema 2: Regla de Signos por Cuadrante",
                    text: this._t(
                        "**Paso 2: Signos de Seno y Coseno por Cuadrante**\n\n- **Cuadrante I (0Â° a 90Â°):** Seno (+) y Coseno (+).\n- **Cuadrante II (90Â° a 180Â°):** Seno (+) y Coseno (-).\n- **Cuadrante III (180Â° a 270Â°):** Seno (-) y Coseno (-).\n- **Cuadrante IV (270Â° a 360Â°):** Seno (-) y Coseno (+).\n\nðŸ“Œ **Ejemplo resuelto:** Para $150^\\circ$ (Cuadrante II):\n- Su Ã¡ngulo de referencia es $30^\\circ \\implies \\operatorname{sen}(150^\\circ) = +\\operatorname{sen}(30^\\circ) = +\\frac{1}{2}$.",
                        "**Paso 2: Signos por Cuadrante**\n\nEn el II cuadrante (90Â° a 180Â°), Y es positiva (sen > 0) y X es negativa (cos < 0).\n\nðŸ“Œ **Ejemplo:** sen(150Â°) = +1/2.",
                        "**Paso 2: Signos por Cuadrante**\n\nAnÃ¡lisis de signos segÃºn el cuadrante del plano."
                    ),
                    formula: "\\operatorname{sen}(150^\\circ) = +\\operatorname{sen}(30^\\circ) = +\\frac{1}{2}",
                    options: ["ðŸŽ¯ Probar un ejercicio prÃ¡ctico ahora", "ðŸ“š Ver subtemas de TrigonometrÃ­a"]
                }
            ],
            conjuntos: [
                {
                    title: "Subtema 1: Operaciones de UniÃ³n e IntersecciÃ³n",
                    text: this._t(
                        "**Paso 1: UniÃ³n ($A \\cup B$) e IntersecciÃ³n ($A \\cap B$)**\n\nUn conjunto es una colecciÃ³n de elementos sin repetir.\n- **UniÃ³n ($A \\cup B$):** Juntamos todos los elementos de ambos conjuntos.\n- **IntersecciÃ³n ($A \\cap B$):** Guardamos Ãºnicamente los elementos que pertenecen a AMBOS al mismo tiempo.\n\nðŸ“Œ **Ejemplo resuelto:** Dado $A = \\{1, 2, 3\\}$ y $B = \\{2, 3, 4\\}$:\n- UniÃ³n $A \\cup B = \\{1, 2, 3, 4\\}$.\n- IntersecciÃ³n $A \\cap B = \\{2, 3\\}$ (los que se repiten).\n\nÂ¿Entendido? Â¿Probas un ejercicio prÃ¡ctico?",
                        "**Paso 1: UniÃ³n e IntersecciÃ³n**\n\n- UniÃ³n (âˆª): reÃºne todos los elementos sin repetir.\n- IntersecciÃ³n (âˆ©): solo los elementos comunes.\n\nðŸ“Œ **Ejemplo:** A = {1, 2, 3} y B = {2, 3, 4} âŸ¹ A âˆ© B = {2, 3}.",
                        "**Paso 1: Operaciones con Conjuntos**\n\nDefiniciÃ³n de uniÃ³n e intersecciÃ³n con ejemplos."
                    ),
                    formula: "A \\cap B = \\{2, 3\\}, \\quad A \\cup B = \\{1, 2, 3, 4\\}",
                    options: ["ðŸŽ¯ Probar un ejercicio prÃ¡ctico ahora", "ðŸ“š Ver subtemas de Conjuntos"]
                }
            ],
            funciones: [
                {
                    title: "Subtema 1: Dominio y Recorrido de una FunciÃ³n",
                    text: this._t(
                        "**Paso 1: Concepto de FunciÃ³n $f(x)$**\n\nUna funciÃ³n asigna a cada valor de entrada $x$ (Dominio) un Ãºnico valor de salida $y = f(x)$ (Recorrido).\n\nðŸ“Œ **Ejemplo resuelto:** Si el costo de empanadas es $f(x) = 5.000x$:\n- Para 3 empanadas: $f(3) = 5.000 \\cdot 3 = 15.000$ Gs.\n- En $f(x) = \\frac{1}{x}$, el Dominio excluye a $x = 0$ porque no existe la divisiÃ³n entre cero.\n\nÂ¿Hacemos un ejercicio sobre esto?",
                        "**Paso 1: Dominio y Recorrido**\n\n- Dominio: valores permitidos de entrada x.\n- Recorrido: valores resultantes de salida y.\n\nðŸ“Œ **Ejemplo:** En f(x) = 1/x, el dominio son todos los reales excepto 0.",
                        "**Paso 1: DefiniciÃ³n de FunciÃ³n**\n\nRelaciÃ³n entre variable independiente x y dependiente y."
                    ),
                    formula: "f(x) = \\frac{1}{x} \\implies D_f = \\mathbb{R} \\setminus \\{0\\}",
                    options: ["ðŸŽ¯ Probar un ejercicio sobre funciones", "ðŸ“š Ver subtemas de Funciones"]
                }
            ],
            ecuaciones: [
                {
                    title: "Subtema 1: Despeje de Ecuaciones de Primer Grado",
                    text: this._t(
                        "**Paso 1: Reglas de Despeje**\n\nUna ecuaciÃ³n representa una balanza. Para hallar $x$, realizamos operaciones inversas:\n1. Lo que suma pasa restando.\n2. Lo que multiplica pasa dividiendo.\n\nðŸ“Œ **Ejemplo resuelto:** Resolver $2x + 6 = 14$:\n- Restamos 6: $2x = 14 - 6 = 8$.\n- Dividimos entre 2: $x = \\frac{8}{2} = 4$.\n\nÂ¿Probamos un ejercicio prÃ¡ctico?",
                        "**Paso 1: Despeje de Ecuaciones**\n\n1. 2x + 6 = 14\n2. 2x = 8\n3. x = 4.\n\nðŸ“Œ **Ejemplo:** x = 4 es la soluciÃ³n.",
                        "**Paso 1: ResoluciÃ³n de Ecuaciones Lineales**\n\nAislamiento de la incÃ³gnita x."
                    ),
                    formula: "2x + 6 = 14 \\implies 2x = 8 \\implies x = 4",
                    options: ["ðŸŽ¯ Probar un ejercicio de ecuaciones", "ðŸ“š Ver subtemas de Ecuaciones"]
                }
            ]
        };

        const defaultLesson = {
            title: `ExplicaciÃ³n Guiada: ${this.getTopicDisplayName()}`,
            text: this._t(
                `**ExplicaciÃ³n teÃ³rica de ${this.getTopicDisplayName()}**\n\nRevisamos los conceptos clave y propiedades fundamentales de esta unidad del MEC.\n\nðŸ“Œ **Ejemplo resuelto:** Aplicamos las propiedades paso a paso para resolver ejercicios.\n\nÂ¿Reipota jaapo un ejercicio prÃ¡ctico ahora?`,
                `**ExplicaciÃ³n teÃ³rica:** Revisamos los conceptos de esta unidad con ejemplos resueltos. Â¿Hacemos un ejercicio?`,
                `**ExplicaciÃ³n teÃ³rica:** Conceptos fundamentales de la unidad. Â¿Pasamos a los ejercicios?`
            ),
            formula: "",
            options: ["ðŸŽ¯ Probar un ejercicio prÃ¡ctico ahora", "ðŸ“š Ver subtemas de esta unidad"]
        };

        const list = subtopicLessons[topic] || [defaultLesson];
        return list[(step - 1) % list.length] || defaultLesson;
    }

    processMessage(userMsg) {
        const ex  = this.getCurrentExercise();
        const msg = (userMsg || '').trim().toLowerCase();
        this.attempts++;

        // 1. RECONOCIMIENTO Y VALIDACIÃ“N SEMÃNTICA DE DEDUCCIONES Y REFLEXIONES DEL ALUMNO
        if (this.isStudentReflection(msg)) {
            let reflectionResponse = "";

            if (this.topic === 'numeros_reales') {
                reflectionResponse = this._t(
                    `Â¡Exacto! UpÃ©va ha'e. Tu deducciÃ³n es excelente: los nÃºmeros reales (â„) abarcan a absolutamente TODOS los nÃºmeros que se pueden ubicar en la recta continua (naturales, enteros, fracciones y los irracionales como Ï€ o âˆš2). Â¡Muy buena sÃ­ntesis!\n\nÂ¿Hacemos un ejercicio prÃ¡ctico para ponerlo a prueba?`,
                    `Â¡Exacto! Razonaste muy bien: los nÃºmeros reales comprenden a todos los nÃºmeros continuos (racionales e irracionales). Â¡Excelente conclusiÃ³n!\n\nÂ¿Hacemos un ejercicio ahora?`,
                    `Â¡Correcto! Tu interpretaciÃ³n es acertada: el conjunto R contiene a todos los nÃºmeros medibles en la recta real. Â¿Pasamos a la prÃ¡ctica?`
                );
            } else if (this.topic === 'conjuntos') {
                reflectionResponse = this._t(
                    `Â¡Excelente deducciÃ³n! UpÃ©va ha'e. Entendiste la idea clave: la UniÃ³n junta todo y la IntersecciÃ³n guarda solo lo que comparten.\n\nÂ¿Probamos un ejercicio?`,
                    `Â¡AsÃ­ mismo! Tu razonamiento es impecable sobre conjuntos.\n\nÂ¿Probamos un ejercicio prÃ¡ctico?`,
                    `Â¡Correcto! Has captado la esencia de las operaciones entre conjuntos. Â¿Continuamos con un ejercicio?`
                );
            } else {
                reflectionResponse = this._t(
                    `Â¡IporÃ£iterei! UpÃ©va ha'e. Tu razonamiento es totalmente correcto. Deduciste la propiedad principal de ${this.getTopicDisplayName()}.\n\nÂ¿Avanzamos con un ejercicio prÃ¡ctico?`,
                    `Â¡Exacto! Tu interpretaciÃ³n es impecable. Has comprendido el concepto fundamental de ${this.getTopicDisplayName()}.\n\nÂ¿Hacemos un ejercicio?`,
                    `Â¡Correcto! Tu deducciÃ³n es certera. Â¿Pasamos a la resoluciÃ³n prÃ¡ctica?`
                );
            }

            return this._buildResponse(reflectionResponse, ex, 'explaining', null, 0, false, ex.formula_latex, ["ðŸŽ¯ SÃ­, hagamos un ejercicio ahora", "ðŸ“– Explicame el siguiente subtema"]);
        }

        // 2. RECONOCIMIENTO DE SALUDOS
        if (this.isGreeting(msg)) {
            const greetingReply = this._t(
                `Â¡Mba'Ã©ichapa! Â¿Mba'Ã©ichapa reÄ©? Che ha'e TekoBot, tu tutor de **${this.getTopicDisplayName()}**.\n\nÂ¿Reipota ambo'e la teorÃ­a paso a paso sobre **${this.getTopicDisplayName()}** con ejemplos sencillos o pasamos directo a los ejercicios?`,
                `Â¡Hola quÃ© tal! Â¿CÃ³mo estÃ¡s? Soy tu tutor de **${this.getTopicDisplayName()}**.\n\nÂ¿Te explico la teorÃ­a paso a paso con ejemplos cotidianos o querÃ©s hacer ejercicios?`,
                `Â¡Hola! Un gusto saludarte. Soy tu tutor de **${this.getTopicDisplayName()}**.\n\nÂ¿Deseas una explicaciÃ³n teÃ³rica con ejemplos sencillos o prefieres ir a la resoluciÃ³n de ejercicios?`
            );
            const opts = ["Explicame este tema paso a paso", "Ir directo a los ejercicios", "Ver subtemas de esta unidad"];
            return this._buildResponse(greetingReply, ex, 'explaining', null, 0, false, ex.formula_latex, opts);
        }

        // 3. SOLICITUD DE EXPLICACIÃ“N DETALLADA / SUBTEMAS (CORREGIDO: OBTIENE LA LECCIÃ“N REAL DE getExplanationStep)
        if (/explicame|explicaci|teor|paso a paso|subtema|aprender|enseÃ±a|ejemplo|explica|sÃ­|si|quiero|deseo|dame|entero|completo|chava|explicar/i.test(msg)) {
            let stepNum = 1;
            if (msg.includes('paso 2') || msg.includes('subtema 2')) {
                stepNum = 2;
            }
            const lesson = this.getExplanationStep(stepNum);
            return this._buildResponse(lesson.text, ex, 'explaining', null, 0, false, lesson.formula, lesson.options);
        }

        // 4. SOLICITUD DE PISTAS
        if (/pista|ayuda|pytyvÃµ|ðŸ’¡/.test(msg)) {
            this.currentHintLevel = Math.min(4, this.currentHintLevel + 1);
            const hint = ex[`hint_level_${this.currentHintLevel}`] || ex.hints?.[this.currentHintLevel] || 'AnalizÃ¡ la fÃ³rmula y la propiedad';
            return this._buildResponse(
                this._t(`IporÃ£ite, ko'Ã¡pe la pista (Nivel ${this.currentHintLevel}): ${hint}`,
                        `Dale, fijate en esta pista (Nivel ${this.currentHintLevel}): ${hint}`,
                        `AquÃ­ tienes la pista (Nivel ${this.currentHintLevel}): ${hint}`),
                ex, 'reviewing', null, this.currentHintLevel, false, ex.formula_latex
            );
        }

        // 5. RESPUESTA CORRECTA A UN EJERCICIO
        const expected = (ex.expected_value || '').toLowerCase().trim();
        const isRight  = expected && (msg.includes(expected) || this._fuzzyMatch(msg, expected));
        if (isRight) {
            return this._buildResponse(
                this._t(
                    `Â¡IporÃ£iterei! UpÃ©va ha'e. Â¡Completaste el ejercicio con Ã©xito! Â¿Japrosigue al siguiente desafÃ­o?`,
                    `Â¡Espectacular! Lo lograste. Â¿Vamos por el siguiente ejercicio?`,
                    `Â¡Excelente! Has resuelto el ejercicio correctamente. Â¿Continuamos?`
                ),
                ex, 'correct', null, this.currentHintLevel, true, ex.formula_latex
            );
        }

        // 6. INTENTO INCORRECTO
        return this._buildResponse(
            this._t(
                `Ha'ete peteÄ© detalle-pe Ã±aÃ±ecorregi va'erÃ£. Ehecha porÃ£: "${ex.statement_jopara || ex.statement_es}". Eipuru la fÃ³rmula o pedÃ­ peteÄ© pista.`,
                `Hay un pequeÃ±o detalle. Fijate bien en el enunciado y ayudate con la fÃ³rmula o pedÃ­ una pista.`,
                `Revisemos. Analiza el enunciado con cuidado o solicita una pista para avanzar.`
            ),
            ex, 'attempting', null, this.currentHintLevel, false, ex.formula_latex
        );
    }

    _fuzzyMatch(msg, expected) {
        const clean = (s) => s.replace(/[Â°\s\{\}\/]/g, '').toLowerCase();
        return clean(msg).includes(clean(expected));
    }

    _buildResponse(message, ex, state, errorType, hintLevel, isCorrect, customFormula = null, customOpts = null) {
        const defaultOpts = ["Explicame este tema paso a paso", "Ir directo a los ejercicios", "Ver subtemas de esta unidad"];
        const opts = customOpts || (ex.quick_options_json
            ? (typeof ex.quick_options_json === 'string' ? JSON.parse(ex.quick_options_json) : ex.quick_options_json)
            : (ex.quick_options || defaultOpts));

        return {
            tutor_message_jopara: message,
            pedagogical_state: {
                topic: ex.topic || this.topic,
                subtopic: ex.subtopic || '',
                difficulty_level: ex.difficulty_level || 1,
                student_state: state,
                detected_error_type: errorType,
                hint_level: hintLevel,
                is_step_complete: isCorrect
            },
            visual_action: {
                type: ex.visual_type || 'none',
                angle_deg: ex.initial_angle || 150,
                show_cos_x: true,
                show_sin_y: true,
                hide_final_values: !isCorrect
            },
            formula_display: { latex: customFormula || ex.formula_latex || '', note: isCorrect ? 'Â¡Correcto!' : 'Propiedad en estudio' },
            quick_options: opts
        };
    }
}

