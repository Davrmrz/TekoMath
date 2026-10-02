/**
 * ============================================================================
 * TEKO MATH — JOPAMATH v2 Translation Engine (jopamath_i18n.js)
 * Motor de Traducción Pedagógica a Guaraní Jopara basado en JOPAMATH_v2 & MEC
 * ============================================================================
 */

(function () {
  'use strict';

  // Almacén completo de traducciones Jopara basadas en JOPAMATH_v2 & MEC
  const JOPAMATH_DICTIONARY = {
    // Top Navigation & General
    "TEKO Math": "TEKO Math",
    "TEKO Docente": "TEKO Mbo'ehára",
    "TEKO Arcade": "TEKO Arcade",
    "TEKO Arcade 🎮": "TEKO Arcade 🎮",
    "Inicio": "Ñepyrũha",
    "Inicio Docente": "Mbo'ehára Ñepyrũha",
    "Volver al Escritorio": "Ejevy ne Rendápe",
    "Volver al Panel Docente": "Ejevy Mbo'ehára Rendápe",
    "Panel Docente": "Mbo'ehára Renda",
    "Escritorio": "Ne Renda (Escritorio)",
    "Cursos": "Mbo'esyrykuéra",
    "Recursos": "Tembiporukuéra",
    "Mis Recursos": "Che Tembiporu",
    "Zona de Juegos": "Ñembosarái Renda 🎮",
    "Zona de Juegos Arcade": "Ñembosarái Renda Arcade 🎮",
    "Juegos": "Ñembosarái",
    "Jugar": "Eñembosarái",
    "Tutor IA": "Teko Bot 🤖",
    "Teko Bot": "Teko Bot 🤖",
    "TekoBot": "TekoBot 🤖",
    "TekoBeta": "TekoBeta 🧪",
    "TekoBeta (Live & Misiones)": "🧪 TekoBeta (Live & Misiones)",
    "TekoArcade": "🎮 TekoArcade",
    "Cerrar sesión": "Esẽ ko'águi 🚪",
    "Estudiante": "Temimbo'e 🎒",
    "Docente": "Mbo'ehára 👨‍🏫",
    "Prof.": "Mbo'ehára",
    "En línea": "Oĩva ko'ápe",
    "Desafíos Gamificados": "⚡ Desafíos Gamificados",
    "ARCADE GAMIFICADO": "⚡ ARCADE GAMIFICADO",
    "+XP & Desafíos": "🏆 +XP & Mba'apo",
    "+XP & Retos Diarios": "🏆 +XP & Mba'apo",
    "MODO VISTA PREVIA": "● VISTA PREVIA",
    "VISTA PREVIA INTERACTIVA": "● VISTA PREVIA INTERACTIVA",
    "Abrir Arcade ↗": "Eike Arcade-pe ↗",
    "Jugar en Pantalla Completa ↗": "🚀 Eñembosarái Tuichavévape ↗",
    "Acceso Rápido a Juegos:": "🎯 Ñembosarái Pya'e:",
    "TEKO Arcade — Juegos & Desafíos Matemáticos": "TEKO Arcade — Ñembosarái & Desafíos Matemática rehegua",
    "Practicá trigonometría jugando: construí triángulos, sincronizá ondas, lanzá vectores y subí de nivel.": "Eñembokatupyry trigonometría-pe reñembosaráivo: emoheñói triángulos, embojoaju ondas, emondo vectores ha ehupi nde nivel.",

    // Dashboard Hero & Welcome
    "¡Hola,": "¡Maitei,",
    "Bienvenido a tu espacio de aprendizaje interactivo. Practicá con el visualizador matemático, desafíate en TekoArcade o ingresa a TekoBeta.":
      "Tereguahẽ porãite ne rembiapo rendápe. Eporandu Teko Bot-pe, eñembokatupyry visualizador ndive ha eñembosarái TekoArcade-pe!",
    "Bienvenido a tu espacio de aprendizaje. Consulta dudas con tu tutor inteligente o utiliza las herramientas interactivas.":
      "Tereguahẽ porãite ne rembiapo rendápe. Eporandu Teko Bot-pe térã eipuru tembiporu interactivo!",
    "Bienvenido a tu espacio de aprendizaje. Consulta dudas con Teko Bot o utiliza las herramientas interactivas.":
      "Tereguahẽ porãite ne rembiapo rendápe. Eporandu Teko Bot-pe térã eipuru tembiporu interactivo!",
    "Consultar a Teko Bot": "Eporandu Teko Bot-pe",
    "Chatear con el Agente de IA": "Eñe'ẽ Teko Bot ndive",

    // TekoBot Dedicated Preview
    "TUTOR INTELIGENTE IA": "🤖 TUTOR INTELIGENTE IA",
    "Bilingüe · Jopara & ES": "Mokoĩ Ñe'ẽme · Jopara & ES",
    "¿Tenés dudas con una fórmula o ejercicio? TekoBot te explica paso a paso, te brinda pistas pedagógicas y conecta teoría con gráficos visuales.":
      "¿Nde rehechapa dudas peteĩ fórmula rehe? TekoBot omyesakã ndéve mbeguekatu, ome'ẽ pistas ha ohechauka gráficos visuales.",
    "Explicaciones guiadas:": "Omyesakã mbeguekatúpe:",
    "Sin dar la respuesta directa, te enseña a razonar.": "Nome'ẽi respuesta directa, nderehechauka mba'éichapa repensáta.",
    "Guaraní Jopara:": "Guaraní Jopara:",
    "Comprende y responde en tu idioma cotidiano.": "Oikũmby ha ombohovái ne ñe'ẽteépe.",
    "Currículo MEC:": "MEC Mbo'epy:",
    "Alineado al 1er Curso de Educación Media.": "Oĩva 1er Curso Educación Media-pe g̃uarã.",
    "Abrir Tutor TekoBot Completo": "🚀 Eike Tutor TekoBot Tuichavévape",
    "TekoBot · Vista Previa en Vivo": "🤖 TekoBot · Vista Previa Ko'ág̃a",
    "Pantalla completa ↗": "Pantalla completa ↗",
    "Escribí tu pregunta para TekoBot...": "Ehai ne porandu TekoBot-pe g̃uarã...",
    "Preguntar ➔": "Eporandu ➔",
    "¿Cómo calcular Seno?": "📐 Mba'éichapa ojejapo Seno?",
    "Explicación sencilla": "💡 Myesakã hasy'ỹva",
    "¿Qué es el Coseno de forma simple?": "¿Mba'épa Coseno hasy'ỹme?",
    "Mba'éichapa oiko?": "Mba'éichapa oiko?",

    // Visualizador de Funciones Trigonométricas
    "Visualizador de Funciones Trigonométricas": "Ta'ãngarenda Funciones Trigonométricas rehegua 📐",
    "Explora el comportamiento, círculo unitario, asíntotas, valores exactos y relaciones recíprocas en tiempo real.":
      "Ehecha mba'éichapa omba'apo círculo unitario, asíntotas, valores exactos ha relaciones recíprocas ko'ág̃aite.",
    "6 Funciones Trigonométricas": "6 Funciones Trigonométricas",
    "📈 Seno · sen(θ)": "📈 Seno · sen(θ)",
    "📉 Coseno · cos(θ)": "📉 Coseno · cos(θ)",
    "⚡ Tangente · tan(θ)": "⚡ Tangente · tan(θ)",
    "🔄 Cosecante · csc(θ)": "🔄 Cosecante · csc(θ)",
    "📐 Secante · sec(θ)": "📐 Secante · sec(θ)",
    "📏 Cotangente · cot(θ)": "📏 Cotangente · cot(θ)",
    "Animar ángulo": "▶️ Emyasãi ángulo",
    "Ángulo a 0°": "🔄 Ángulo 0°-pe",
    "Función & Ángulo θ": "Función & Ángulo θ",
    "Interactivo": "Interactivo ⚡",
    "Grados (°)": "Grados (°)",
    "Radianes (rad)": "Radianes (rad)",
    "Valor Matemático & Razón": "Valor Matemático & Razón",
    "Positivo (+)": "Positivo (+)",
    "Negativo (−)": "Negativo (−)",
    "Valor Exacto": "Valor Exacto",
    "Aprox. Decimal": "Decimal Aprox.",
    "Cuadrante I (0° – 90°)": "Cuadrante I (0° – 90°)",
    "Cuadrante II (90° – 180°)": "Cuadrante II (90° – 180°)",
    "Cuadrante III (180° – 270°)": "Cuadrante III (180° – 270°)",
    "Cuadrante IV (270° – 360°)": "Cuadrante IV (270° – 360°)",
    "Comparación Recíproca": "Comparación Recíproca",
    "Comparar con función recíproca en la gráfica": "Embojoja función recíproca ndive gráfico-pe",
    "Propiedades de la Función": "Propiedades Función rehegua",
    "Dominio:": "Dominio:",
    "Rango:": "Rango:",
    "Período (T):": "Período (T):",
    "Paridad:": "Paridad:",
    "Ceros:": "Ceros:",
    "Asíntotas:": "Asíntotas:",
    "Concepto & Capas Visibles": "Concepto & Capas Ojehecháva",
    "Mostrar Círculo Unitario (R = 1)": "Ehechauka Círculo Unitario (R = 1)",
    "Mostrar Asíntotas y Discontinuidades": "Ehechauka Asíntotas ha Discontinuidades",
    "Mostrar Ceros y Puntos de Corte": "Ehechauka Ceros ha Puntos de Corte",

    // TEKO Arcade / Juegos
    "Mapa": "Mba'erechaha (Mapa)",
    "Mapa de Aprendizaje": "Mbo'epy Rape (Mapa)",
    "Misiones": "Mba'apokuéra (Misiones)",
    "Misiones & Retos": "Misiones & Retos 🎯",
    "Progreso": "Ñemotenonde (Progreso)",
    "Mi Progreso & Estadísticas": "Che Progreso & Estadísticas 📈",
    "Mi tarea": "Che Rembiapo",
    "Mi Tarea": "Che Rembiapo",
    "Triangle Forge": "Triangle Forge 🔺",
    "Signal Sync": "Signal Sync 〰️",
    "Vector Launch": "Vector Launch ↗️",
    "Pair Matrix": "Pair Matrix ◫",
    "Ratio Rush": "Ratio Rush ⚡",
    "Graph Lab": "Graph Lab 📈",
    "Seno": "Seno",
    "Coseno": "Coseno",
    "Tangente": "Tangente",
    "Cosecante": "Cosecante",
    "Secante": "Secante",
    "Cotangente": "Cotangente",
    "Construye triángulos y ajusta razones con precisión.": "Emoheñói triángulos ha emyatyrõ razones porãite.",
    "Relaciona señales y valores trigonométricos.": "Embojoaju señales ha valores trigonométricos.",
    "Lanza vectores en función de ángulos y componentes.": "Emondo vectores ángulo ha componentes reheve.",
    "Conecta pares recíprocos y expresiones equivalentes.": "Embojoaju pares recíprocos ha expresiones joja.",
    "Resuelve retos de rapidez con proporciones trigonométricas.": "Ehesa'ỹijo pya'e proporciones trigonométricas.",
    "Explora gráficas y patrones de funciones trigonométricas.": "Ehecha gráficos ha funciones trigonométricas patrones.",
    "Tu ruta de práctica": "Ne rape eñembokatupyry hag̃ua",
    "Retos calculados a partir de tus partidas y respuestas locales.": "Desafíos oñembosako'íva ne rembiapo ha ne mbohovái reheve.",
    "Activas": "Oikóva ko'ág̃a",
    "Completadas": "Omohu'ãmava",
    "XP por reclamar": "XP oñehupyty hag̃ua",
    "Todas": "Opavave",
    "En curso": "Oikóva",
    "Para reclamar": "Reclamar hag̃ua",
    "Reclamadas": "Reclamadava",
    "Reclamar XP": "Ehupyty XP ⚡",
    "Recompensa reclamada": "Recompensa rehupytýma",
    "Objetivo cumplido": "Objetivo omohu'ãma",
    "Progreso guardado": "Progreso oñeñongatúma",
    "Siguiente objetivo": "Objetivo upe riregua",
    "Practicar": "Eñembokatupyry ➔",
    "Regla local": "Mba'eapopyre Regla",
    "Objetivo": "Mba'épa jajapóta (Objetivo)",
    "Avance": "Avance",
    "Preparar desafío": "Embosa'i Desafío",
    "Selecciona dificultad": "Eiporavo dificultad",
    "Modo de práctica": "Modo de práctica",
    "Ronda": "Ronda",
    "Racha": "Racha",
    "Tiempo restante": "Ára hembýva",
    "Comprobar": "Ehecha oĩ porãpa",
    "Ver solución": "Ehecha mba'éichapa oiko",
    "Volver al mapa": "Ejevy Mapa-pe",

    // Docente Hero & Actions
    "Módulo de Gestión Pedagógica": "Mbo'epy Ñangareko Renda",
    "¡Hola, Prof.": "¡Maitei, Mbo'ehára",
    "Diseña misiones de aprendizaje interactivas y progresivas, monitorea los niveles de dominio y consulta los diagnósticos conceptuales de tus alumnos.":
      "Emoheñói misiones ne remimbo'ekuérape g̃uarã, ehecha mba'éichapa oho hesekuéra ha eikuaa diagnósticos conceptuales.",
    "Asignar Nueva Misión": "🚀 Emoĩ Misión Pyahu",
    "Publicar Material de Clase": "📁 Emoguahẽ Material Mbo'epýpe",
    "Visualizador en Modo Clase": "📐 Ta'ãngarenda Mbo'eha Kotýpe",
    "Misiones de Aprendizaje": "Mba'apo & Misiones 🚀",
    "Materiales de Clase": "Aranduka & Materiales 📚",
    "Materiales": "Materiales 📚",
    "Visualizador de Clase": "Ta'ãngarenda Mbo'epýpe 📐",
    "Visualizador Gráfico": "Ta'ãngarenda Gráfico 📈",
    "Visualizador": "Ta'ãngarenda 📈",
    "Estudiantes & Diagnósticos": "Temimbo'ekuéra & Diagnóstico 👥",
    "Diagnósticos y Rendimiento": "Diagnósticos ha Rendimiento",
    "Estudiantes Registrados": "Temimbo'ekuéra Oñembokuatiáva",

    // Teko Live (Kahoot style)
    "CLASE EN VIVO · TEKO LIVE": "MBO'EHAKOTÝPE · TEKO LIVE ⚡",
    "¡Participa en el Quiz de la Clase!": "¡Eike Quiz Mbo'eha Kotýpegua!",
    "Ingresa el código PIN de 6 dígitos que compartió tu profesor para competir en tiempo real con tus compañeros.":
      "Emoĩ PIN 6 papapyguigua ome'ẽva ndéve ne mbo'ehára eñembosarái hag̃ua ne irũnguéra ndive.",
    "Ingresa PIN (ej. 482910)": "Emoĩ PIN ko'ápe...",
    "Unirme a la Sala": "Eike Salápe ⚡",
    "¿Eres profesor? Puedes": "¿Nde ha'e mbo'ehára? Ikatu",
    "iniciar una nueva sala en vivo aquí": "emoñepyrũ peteĩ sala pyahu ko'ápe",
    "CONTROL DE CLASE EN VIVO": "MBO'EPY ÑANGAREKO KO'ÁG̃A ⚡",
    "Lanza cuestionarios interactivos multijugador con ranking de puntajes en pantalla gigante para tus alumnos.":
      "Emoñepyrũ quiz interactivo ne remimbo'ekuérape g̃uarã ranking en vivo ndive.",
    "Iniciar Nueva Sala en Vivo": "🚀 Emoñepyrũ Sala Pyahu",
    "Crear Sala de Clase en Vivo": "Emoñepyrũ Sala Teko Live",
    "Selecciona el paquete de preguntas que responderán tus alumnos:": "Eiporavo paquete de preguntas ne remimbo'ekuérape g̃uarã:",
    "Tiempo por pregunta (segundos):": "Ára porandu peteĩteĩme (segundos):",
    "Crear y Abrir Sala": "Emoheñói ha Eike Salápe 🚀",
    "Packs de Preguntas Teko Live": "Paquetes de Preguntas Teko Live",
    "Agregar Pack de Preguntas": "➕ Emoĩ Pack Pyahu",

    // Misiones y Práctica
    "Misiones Asignadas": "Mba'apokuéra Asignados",
    "Misiones Interactivas de Clase": "Misiones Interactivas Mbo'epýpe",
    "Etapas de Aprendizaje": "Pehendu & Pejapo",
    "Dominio Actual": "Katuapyre",
    "Continuar Misión": "Emba'apo Jey",
    "Iniciar Misión": "Eñepyrũ Misión",
    "Ver Diagnóstico": "Ehecha Diagnóstico",
    "Misión Completada": "Mba'apo Omohu'ãma! 🎉",
    "¡Misión Completada con Éxito!": "¡Misión Omohu'ã Porãite! 🎉",
    "Práctica Rápida": "Ñembokatupyry Pya'e",
    "Pon a prueba tus conocimientos con ejercicios de opción múltiple clasificados por nivel de dificultad.":
      "Ehecha mba'épa reikuaa porandukuéra reheve, nivel de dificultad rupive.",
    "Iniciar Desafío": "Eñepyrũ Desafío ⚡",
    "Ver mis respuestas": "Ehecha mbohovái",
    "Reintentar": "Eha'ã Jey 🔄",
    "Siguiente Pregunta": "Upe riregua 👉",
    "Finalizar Quiz": "Emohu'ã Quiz 🏁",
    "Puntaje": "Puntos",
    "Aciertos": "Mba'e porã",
    "Tiempo": "Ára",
    "Nivel de Dificultad": "Dificultad",
    "Fácil": "Hasy'ỹva (Fácil)",
    "Medio": "Mbytegua (Medio)",
    "Difícil": "Hasy (Difícil)",

    // Flashcards & Conceptos 3D
    "Conceptos & Fórmulas Clave": "Conceptos & Fórmulas Clave 🎴",
    "Tarjetas interactivas 3D con definiciones, fórmulas y signos por cuadrante. Haz clic para girar.":
      "Tarjetas interactivas 3D definiciones ha fórmulas ndive. Epoko hese ombojere hag̃ua.",
    "Voltear Tarjeta": "Embojere Tarjeta 🔄",
    "Tarjeta": "Tarjeta",
    "Signos por Cuadrante": "Signos Cuadrante rupive",
    "Ver gráfica en simulador": "Ehecha gráfico simulador-pe",

    // Modales & Formularios
    "Asignar Nueva Misión de Aprendizaje": "Emoĩ Misión de Aprendizaje Pyahu",
    "Título de la misión:": "Misión réra:",
    "Tema matemático:": "Materia / Tema:",
    "Misión pedagógica interactiva (con etapas):": "Misión interactiva (etapas reheve):",
    "Descripción / Instrucciones para el alumno:": "Mba'éichapa ojapóta (Instrucciones):",
    "Guardar y Asignar Misión": "Eñongatu ha Emoĩ Misión 🚀",
    "Cancelar": "Emboty",
    "Cerrar": "Emboty",
    "Guardar": "Eñongatu",
    "Crear": "Emoheñói",

    // Login & Register
    "Tu plataforma para aprender Matemáticas": "Ne rendag̃ua eikuaa ha ehesa'ỹijo hag̃ua Matemática",
    "Practica · Aprende · Domina": "📐 Eñembokatupyry · Eikuaa · Edomina",
    "Iniciar sesión": "Eike ne Kuatiápe",
    "Correo electrónico": "Ñanduti veve (Email)",
    "Contraseña": "Ñe'ẽñemi (Contraseña)",
    "Ingresar a la Plataforma": "Eike Platafórmape 🚀",
    "¿No tienes una cuenta?": "¿Ne'ĩra piko reñembokuatia?",
    "Crear cuenta": "Reñembokuatia ko'ápe",
    "Registrarse": "Reñembokuatia",
    "Nombre completo": "Téra ha terajoapy (Nombre completo)",
    "Soy Estudiante": "Che ha'e Temimbo'e",
    "Soy Docente": "Che ha'e Mbo'ehára",
    '¿Deseas salir de la misión actual? El avance de esta sesión no se guardará.': '¿Resẽsépa ko mba’apógui? Ko sesión-pe rejapo va’ekue noñeñongatumo’ãi.',
    'No se pudo cargar la misión.': 'Ndaikatúi ojepe’a ko mba’apo.',
    'Error de conexión al cargar la misión.': 'Oĩ jejavy conexión-pe ojepe’ávo ko mba’apo.',
    'Una anomalía en el plano cartesiano ha alterado las lecturas de los satélites escolares. Explora los cuatro cuadrantes de la circunferencia unitaria, domina los signos y valores del seno, coseno y tangente, y restablece las coordenadas correctas para completar la misión.': 'Peteĩ anomalía plano cartesiano-pe omoambue umi satélites escolares lectura. Ehesa’ỹijo umi cuatro cuadrantes circunferencia unitaria rehegua, eikuaa porã seno, coseno ha tangente signos ha valores, ha emyatyrõ coordenadas remohu’ã hag̃ua ko mba’apo.',
    'Los telescopios de la estación orbital operan con lentes reflexivas basadas en las funciones trigonométricas inversas/recíprocas. Para enfocar la imagen astronómica, debes calcular los valores exactos de secante, cosecante y cotangente, y determinar sus signos en cada cuadrante.': 'Umi telescopios estación orbital-pe oipuru lentes reflexivas umi funciones trigonométricas inversas/recíprocas rehegua. Rehecha porã hag̃ua imagen astronómica, eheka secante, cosecante ha cotangente valores exactos ha mba’e signo oguereko peteĩteĩ cuadrante-pe.',
    'Un satélite en órbita terrestre emite pulsos de telemetría modulados en funciones periódicas de seno y coseno. Calibra la amplitud y el período de las curvas para estabilizar la señal de recepción.': 'Peteĩ satélite órbita terrestre-pe omondo pulsos de telemetría umi funciones periódicas seno ha coseno rupive. Emohenda curvas amplitud ha período oñemohenda porã hag̃ua señal reñohẽva.',
    'Unos exploradores hallaron las ruinas de un monumento en forma de rampa geométrica. Conociendo el ángulo de elevación de 30° y la longitud de la base adyacente de 10√3 metros, calcula las 6 razones trigonométricas (sen, cos, tan, csc, sec, cot) y determina la altura y la hipotenusa.': 'Umi exploradores ojuhu peteĩ monumento tuja rampa geométrica-icha. Reikuaáma ángulo de elevación ha’eha 30° ha base adyacente ipukuha 10√3 metros. Ecalcula umi 6 razones trigonométricas (sen, cos, tan, csc, sec, cot) ha eheka altura ha hipotenusa.',
    'El radar de Teko detecta una señal en un ángulo θ desconocido. Los sensores registran que tan(θ) < 0 (negativa) y cos(θ) > 0 (positivo). ¿En qué cuadrante se encuentra θ y qué signo tiene sen(θ)?': 'Teko radar ojuhu peteĩ señal peteĩ ángulo θ jaikuaa’ỹvape. Umi sensores ohechauka tan(θ) < 0 (negativa) ha cos(θ) > 0 (positivo). ¿Mba’e cuadrante-pe oĩ θ ha mba’e signo oguereko sen(θ)?',
    'Al observar el ángulo de 120° en la circunferencia unitaria, ¿por qué su coseno es negativo (−) mientras que su seno es positivo (+)?': 'Ehecha ángulo 120° circunferencia unitaria-pe: ¿mba’érepa coseno ha’e negativo (−) ha seno katu positivo (+)?',
    'Si cos(θ) = −1/2 en el Cuadrante II, ¿cuál es el valor exacto de la secante sec(θ)?': 'Oĩramo cos(θ) = −1/2 Cuadrante II-pe, ¿mboýpa valor exacto secante sec(θ) rehegua?',
    'Si tan(θ) = −1/√3 y el ángulo θ pertenece al Cuadrante IV, ¿cuál es el valor de cot(θ) y qué signo tiene?': 'Oĩramo tan(θ) = −1/√3 ha ángulo θ Cuadrante IV-pe, ¿mboýpa cot(θ) ha mba’e signo oguereko?',
    'Si modificamos la función de y = sen(x) a y = 3·sen(x), ¿qué propiedad de la gráfica cambia?': 'Ñamoambue ramo función y = sen(x) ko y = 3·sen(x)-pe, ¿mba’e propiedad gráfico rehegua oñemoambue?',
    '¿Para cuáles de los siguientes ángulos en [0°, 360°] se anula la función y = cos(x), es decir, cos(x) = 0?': '¿Mba’e ángulos ko’ãva apytépe, intervalo [0°, 360°]-pe, ojapo función y = cos(x) ha’e hag̃ua cero, he’iséva cos(x) = 0?',
    'Para evitar interferencias, se requiere una onda con amplitud A = 5 y que complete exactamente 2 ciclos completos en el intervalo [0, 2π]. ¿Cuál es la ecuación de la señal?': 'Ani hag̃ua oĩ interferencias, ñaikotevẽ peteĩ onda amplitud A = 5 reheve ha omohu’ãva exactamente 2 ciclos intervalo [0, 2π]-pe. ¿Mba’épa pe señal ecuación?',
    'Conociendo que el cateto opuesto (altura) mide 10 m y sen(30°) = 1/2, ¿cuánto mide la hipotenusa H y cuál es el valor de csc(30°)?': 'Jaikuaáma cateto opuesto (altura) omediha 10 m ha sen(30°) = 1/2. ¿Mboýpa omedi hipotenusa H ha mboýpa csc(30°)?',
    '¿Qué relación se cumple también al dividir toda la ecuación por cos²(θ)?': '¿Mba’e relación piko oñekumpli avei ñadividi ramo ecuación tuichakue cos²(θ) rupive?',
    '¿Cuál es el valor constante de E para cualquier ángulo donde las funciones estén definidas?': '¿Mboýpa E valor constante oimeraẽ ángulo-pe umi funciones oĩhápe definidas?',
    'MISIÓN DE APRENDIZAJE': 'MBA’APO ÑAIKUMBY HAG̃UA',
    'MISIÓN: El cuadrante perdido': 'MBA’APO: Cuadrante okañýva',
    'MISIÓN: El espejo de las recíprocas': 'MBA’APO: Recíprocas jehechaha',
    'MISIÓN: La órbita de las ondas periódicas': 'MBA’APO: Ondas periódicas órbita',
    'MISIÓN: El enigma del triángulo y las 6 razones': 'MBA’APO: Triángulo ha umi 6 razones ñemimby',
    'EXPLORÁ': 'EHESA’ỸIJO', 'DESCUBRÍ': 'EJOKUAA', 'RESOLVÉ': 'EJAPO',
    'DESAFÍO': 'EÑEHA’Ã', 'FINAL': 'PAHA',
    'Exploración:': 'Ehesa’ỹijo:', 'Descubrimiento:': 'Eikuaa:',
    'Resolución Guiada:': 'Jajapo oñondive:', 'Resolución:': 'Jajapo:',
    'Desafío de Análisis:': 'Ehesa’ỹijo ha eñeha’ã:', 'Desafío Final:': 'Ñeha’ã paha:', 'Desafío:': 'Eñeha’ã:',
    'Continuar Etapa': 'Jaha ambue etápape', 'Laboratorio Interactivo': 'Laboratorio ñamba’apo hag̃ua',
    'Cuadrante Actual': 'Cuadrante ko’ág̃agua', 'Cerrar Misión': 'Emboty mba’apo',
    'Pedir una pista a Teko': 'Ejerure Teko-pe peteĩ pista', 'Salir': 'Esẽ',
    'aciertos': 'mbohovái oĩ porãva', 'autocorrecciones': 'ñemyatyrõ', 'pistas': 'pistas nepytyvõ hag̃ua',
    'Aciertos en la misión': 'Mbohovái oĩ porãva ko mba’apópe',
    'Autocorrecciones tras error': 'Ñemyatyrõ jejavy rire', 'Pistas solicitadas': 'Pistas rejerure va’ekue',
    'Nivel de Dominio Alcanzado': 'Mba’épa reikuaáma',
    'Diagnóstico Conceptual de Aprendizaje:': 'Mba’éichapa reikũmby umi conceptos:',
    'Desafíos Superados': 'Ñeha’ã remohu’ãva', 'Autocorrecciones': 'Ñemyatyrõ',
    'Pistas Usadas': 'Pistas reipuru va’ekue', 'Tiempo Empleado': 'Ára reipuru va’ekue',
    'Insignia Desbloqueada:': 'Insignia rehupytýva:', 'Repetir Misión': 'Ejapo jey mba’apo',
    'Finalizar y Volver al Dashboard': 'Emohu’ã ha ejevy ne rendápe',
    'Necesita práctica': 'Oikotevẽ ñembokatupyry', 'Dominado': 'Reikuaáma', 'Completado': 'Oĩmbáma',
    'Mis Chats': 'Che ñomongetakuéra', 'Mis chats': 'Che ñomongetakuéra',
    'Dame una pista': 'Eme’ẽ chéve peteĩ pista', 'Ver gráfico': 'Ehecha gráfico',
    'Probar de nuevo': 'Eha’ã jey', 'Fórmula y Propiedad en Estudio': 'Fórmula ha propiedad ñahesa’ỹijóva',
    'Visualizador Matemático Interactivo': 'Matemática rehecháva ha reipokóva',
    'Aprendé con TekoBot': 'Eikuaa TekoBot ndive', 'Antes de practicar': 'Ñañembokatupyry mboyve',
    'Guardado en este dispositivo': 'Oñeñongatu ko dispositivo-pe',
    'Comprobar comprensión': 'Jahecha reikũmbypa', 'Sí, se entiende': 'Heẽ, hesakã',
    'Tengo una pregunta': 'Areko peteĩ porandu', 'Ver historial de conversaciones': 'Ehecha ñomongeta yma guare',
    'Solicitar pista escalonada': 'Ejerure pista mbeguekatúpe', 'Mostrar en el gráfico': 'Ehechauka gráfico-pe',
    'Volver a intentar': 'Eha’ã jey', 'Nueva conversación': 'Ñomongeta pyahu',
    'Calcula el valor exacto de': 'Eheka valor exacto ko’ãva rehegua:',
    'Calcula la diferencia exacta:': 'Eheka diferencia exacta:',
    'Calcula': 'Ecalcula', 'calcula': 'ecalcula',
    'Determina el período exacto de la onda': 'Eheka período exacto ko onda rehegua:',
    'Determina': 'Eheka', 'determina': 'eheka',
    'paso a paso': 'peteĩ paso rire ambue',
    '¿Cuál es el valor exacto de': '¿Mboýpa valor exacto ko’ãva rehegua:',
    '¿cuál es el valor exacto de': '¿mboýpa valor exacto ko’ãva rehegua:',
    '¿Cuál es el valor': '¿Mboýpa valor', '¿cuál es el valor': '¿mboýpa valor',
    '¿cuánto vale': '¿mboýpa', '¿cuánto mide': '¿mboýpa omedi',
    '¿qué propiedad de la gráfica cambia?': '¿Mba’e propiedad gráfico rehegua piko oñemoambue?',
    '¿Cuál es la ecuación de la señal?': '¿Mba’épa pe señal ecuación?',
    'Recuerda que': 'Nemandu’áke:', 'Recuerda:': 'Nemandu’áke:',
    'Recuerda': 'Nemandu’áke', 'Observa cómo': 'Ehecha mba’éichapa',
    'Observa la relación directa entre': 'Ehecha relación directa oĩva ko’ãva apytépe:',
    'Observa': 'Ehecha', 'Observá': 'Ehecha', 'observa': 'ehecha',
    'Gira el dial y observa cómo': 'Embojere dial ha ehecha mba’éichapa',
    'Gira el ángulo': 'Embojere ángulo',
    'Interactúa con el dial de la circunferencia unitaria.': 'Eipuru dial circunferencia unitaria rehegua.',
    'Nota cómo': 'Ehechakuaa mba’éichapa', 'Revisa': 'Ehecha jey',
    '¡Exacto!': '¡Oĩ porã!', '¡Correcto!': '¡Oĩ porã!',
    'Hmm... revisemos esto': 'Jahecha jey ko mba’e', 'Pensemos un momento': 'Ñapensami oñondive',
    'Cuidado con la definición': 'Eñatendéke definición rehe',
    'Porque': 'Pórke', 'porque': 'pórke',
    'Sabiendo que': 'Jaikuaáma:', 'Conociendo que': 'Jaikuaáma:',
    'para completar la misión': 'remohu’ã hag̃ua ko mba’apo',
    'para observar en tiempo real': 'rehecha hag̃ua ko’ág̃aite',
    '¿por qué': '¿mba’érepa', '¿En qué cuadrante': '¿Mba’e cuadrante-pe',
    'y qué signo tiene': 'ha mba’e signo oguereko',
    'Si conoces el Cateto Adyacente y necesitas hallar el Cateto Opuesto para un ángulo': 'Reikuaáramo Cateto Adyacente ha rehekáramo Cateto Opuesto peteĩ ángulo-pe',
    '¿cuál es la razón trigonométrica más directa para usar?': '¿Mba’e razón trigonométrica piko iporãve reipuru?',
    'Para sincronizar el telescopio, simplifica la siguiente expresión trigonométrica:': 'Embojoaju hag̃ua telescopio, esimplifica ko expresión trigonométrica:',
    'Para validar las mediciones de la estructura, comprueba la identidad pitagórica fundamental:': 'Rehecha hag̃ua oĩ porãpa umi medidas, ecomproba identidad pitagórica fundamental:',
    'Para restaurar definitivamente el radar,': 'Emyatyrõ hag̃ua radar,',
    'Sincroniza la frecuencia, período y amplitud de funciones senoidales, cosenoidales y tangenciales.': 'Embojoaju frecuencia, período ha amplitud umi funciones senoidales, cosenoidales ha tangenciales rehegua.',
    'Domina las 3 funciones recíprocas:': 'Eikuaa porã umi 3 funciones recíprocas:',
    'Aplica seno, coseno, tangente, cosecante, secante y cotangente para reconstruir las medidas exactas de una estructura oculta.': 'Eipuru seno, coseno, tangente, cosecante, secante ha cotangente reheka hag̃ua medidas exactas peteĩ estructura okañýva rehegua.',
    'Restaura las coordenadas de los radares explorando la circunferencia unitaria y los signos de seno, coseno y tangente en los 4 cuadrantes.': 'Emyatyrõ radares coordenadas: ehesa’ỹijo circunferencia unitaria ha seno, coseno ha tangente signos umi 4 cuadrantes-pe.'
  };

  const CURRENT_LANG_KEY = 'teko-language';

  const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const dictionaryKeys = Object.keys(JOPAMATH_DICTIONARY).filter(k => k && k.length > 0).sort((a, b) => b.length - a.length);
  const dictionaryPattern = new RegExp('(?:' + dictionaryKeys.map(escapePattern).join('|') + ')', 'gu');

  const textState = new WeakMap();
  const attributeState = new WeakMap();

  const excluded = 'script, style, textarea, code, pre, canvas, math, .katex, .katex-message-box, .formula-katex-box, [contenteditable], [translate="no"], #jopamath-lang-switcher, .welcome__name, .teacher-welcome__name';

  const observerOptions = {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label']
  };

  const normalizeLanguage = lang => (lang === 'jopara' || lang === 'gn') ? 'jopara' : 'es';
  let currentLanguage = getSavedLanguage();

  function getSavedLanguage() {
    try {
      const saved = localStorage.getItem(CURRENT_LANG_KEY);
      return normalizeLanguage(saved);
    } catch (_) {
      return 'es';
    }
  }

  function setLanguage(lang) {
    lang = normalizeLanguage(lang);
    try {
      localStorage.setItem(CURRENT_LANG_KEY, lang);
    } catch (_) {}
    applyLanguage(lang);

    // Sincronizar todos los iframes hijos
    document.querySelectorAll('iframe').forEach(frame => {
      try { frame.contentWindow.JopaMathI18n?.applyLanguage(lang); } catch (_) {}
    });

    // Sincronizar parent window si existe
    try { if (window.parent !== window) window.parent.JopaMathI18n?.applyLanguage(lang); } catch (_) {}
  }

  function translateText(text) {
    if (!text || typeof text !== 'string') return text;
    const trimmed = text.trim();
    if (Object.prototype.hasOwnProperty.call(JOPAMATH_DICTIONARY, trimmed)) {
      return text.replace(trimmed, () => JOPAMATH_DICTIONARY[trimmed]);
    }
    return text.replace(dictionaryPattern, match => JOPAMATH_DICTIONARY[match] || match);
  }

  function translatedValue(state, value, isJopara) {
    if (!state || value !== state.rendered) state = { original: value };
    state.rendered = isJopara ? translateText(state.original) : state.original;
    return state;
  }

  function translateElement(root, isJopara) {
    if (!root) return;
    if (root.closest && root.closest(excluded)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement && node.parentElement.closest(excluded)) continue;
      const state = translatedValue(textState.get(node), node.nodeValue, isJopara);
      textState.set(node, state);
      if (node.nodeValue !== state.rendered) node.nodeValue = state.rendered;
    }
  }

  function applyLanguage(lang) {
    const nextLang = normalizeLanguage(lang);
    const changed = currentLanguage !== nextLang;
    currentLanguage = nextLang;
    const isJopara = currentLanguage === 'jopara';
    
    observer.disconnect();
    try {
      document.documentElement.lang = isJopara ? 'gn' : 'es';
      document.querySelectorAll('.jopamath-lang-btn').forEach(btn => {
        const active = btn.getAttribute('data-lang') === currentLanguage;
        btn.classList.toggle('jopamath-lang-btn--active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      if (document.body) {
        translateElement(document.body, isJopara);
      }
      document.querySelectorAll('[placeholder], [title], [aria-label]').forEach(el => {
        if (el.closest && el.closest(excluded)) return;
        const states = attributeState.get(el) || {};
        ['placeholder', 'title', 'aria-label'].forEach(attr => {
          if (!el.hasAttribute(attr)) { delete states[attr]; return; }
          const value = el.getAttribute(attr);
          states[attr] = translatedValue(states[attr], value, isJopara);
          if (value !== states[attr].rendered) el.setAttribute(attr, states[attr].rendered);
        });
        attributeState.set(el, states);
      });
    } finally {
      if (document.body) observer.observe(document.body, observerOptions);
    }
    if (changed) window.dispatchEvent(new CustomEvent('jopamath:languagechange', { detail: { language: currentLanguage } }));
  }

  // Inyectar el botón de cambio de idioma en la barra de navegación
  function injectLanguageSwitcher() {
    if (document.getElementById('jopamath-lang-switcher')) return;

    const topnavUser = document.querySelector('.topnav__user') || document.querySelector('.topnav__inner') || document.querySelector('.brand') || document.querySelector('.sidebar') || document.body;
    if (!topnavUser) return;

    const switcher = document.createElement('div');
    switcher.id = 'jopamath-lang-switcher';
    switcher.className = 'jopamath-switcher-container';
    switcher.innerHTML = `
      <div class="jopamath-pill-toggle" title="Modo de Idioma: Guaraní Jopara (JOPAMATH v2)">
        <button type="button" class="jopamath-lang-btn" data-lang="es" title="Español">🇪🇸 ES</button>
        <button type="button" class="jopamath-lang-btn" data-lang="jopara" title="Guaraní Jopara">🇵🇾 Jopara</button>
      </div>
    `;

    if (topnavUser.classList.contains('topnav__user')) {
      topnavUser.insertBefore(switcher, topnavUser.firstChild);
    } else {
      topnavUser.appendChild(switcher);
    }

    switcher.querySelectorAll('.jopamath-lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedLang = btn.getAttribute('data-lang');
        setLanguage(selectedLang);
      });
    });

    const currentLang = getSavedLanguage();
    applyLanguage(currentLang);
  }

  const observer = new MutationObserver(() => {
    if (currentLanguage === 'jopara') applyLanguage(currentLanguage);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLanguageSwitcher, { once: true });
  } else {
    injectLanguageSwitcher();
  }

  window.JopaMathI18n = {
    setLanguage,
    getLanguage: () => currentLanguage,
    getSavedLanguage,
    translateText,
    applyLanguage
  };

  window.addEventListener('storage', event => {
    if (event.key === CURRENT_LANG_KEY || event.key === null) applyLanguage(getSavedLanguage());
  });

})();
