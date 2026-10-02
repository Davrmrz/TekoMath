// Generated from database/problem_workshop.json.
window.PROBLEM_WORKSHOP = {
  "welcome": "Escribí el enunciado completo del problema, con sus datos y lo que te pide. Primero identificaremos qué conocemos y qué buscamos; después avanzaremos paso a paso. El cálculo final queda para vos y comprobaré tu resultado. También podés escribir ecuaciones y operaciones directamente.",
  "unknown": "Necesito aclarar el enunciado antes de calcular. Indicá qué cantidad buscás y a qué corresponde cada medida, con su unidad. Si es un problema de alturas, incluí la distancia horizontal o sombra y el ángulo en grados. Podés completar los datos en el siguiente mensaje. No voy a marcar una respuesta como correcta o incorrecta sin una interpretación verificable.",
  "rules": [
    {
      "id": "linear",
      "pattern": "^(?:resolver?\\s+|resuelve\\s+|calcula\\s+)?([+-]?(?:\\d+(?:\\.\\d+)?|\\d*\\.\\d+)?)\\s*\\*?\\s*x\\s*([+-]\\s*\\d+(?:\\.\\d+)?)?\\s*=\\s*([+-]?\\d+(?:\\.\\d+)?)$",
      "steps": [
        "La incógnita es x. La igualdad exige que ambos miembros tengan el mismo valor. Para conservarla, cualquier operación que hagamos debe aplicarse a ambos lados.",
        "Primero identificá el término que se suma o resta junto a x. Usá su operación opuesta en ambos miembros para dejar solo el término que contiene x. Si ese término no existe, este paso no hace falta.",
        "Ahora identificá el número que multiplica a x. Para despejarla, dividí ambos miembros por ese número. Hacé vos ese cálculo final; después sustituí tu valor en la ecuación original y verificá la igualdad."
      ],
      "hint": "Revisá el signo del término independiente. Al deshacer una suma se resta; al deshacer una resta se suma. Después se deshace la multiplicación dividiendo."
    },
    {
      "id": "arithmetic",
      "pattern": "^(?:calcula(?:r)?\\s+|resuelve\\s+|resolver?\\s+)?([+-]?\\d+(?:\\.\\d+)?(?:/[+-]?\\d+(?:\\.\\d+)?)?)\\s*([+*/-])\\s*([+-]?\\d+(?:\\.\\d+)?(?:/[+-]?\\d+(?:\\.\\d+)?)?)$",
      "steps": [
        "Identificá la operación entre los dos números. Si hay fracciones, cada una representa numerador dividido por denominador; un denominador cero no está permitido.",
        "Para sumar o restar fracciones, buscá un denominador común. Para multiplicarlas, multiplicá numeradores entre sí y denominadores entre sí. Para dividir, multiplicá por el recíproco del segundo número, siempre que no sea cero. Aplicá solo la regla correspondiente al signo del enunciado.",
        "Realizá vos el cálculo y simplificá la fracción o escribí un decimal. Antes de enviarlo, revisá los signos y si el tamaño del resultado es razonable."
      ],
      "hint": "Una fracción se simplifica dividiendo numerador y denominador por el mismo número distinto de cero. En una división, no se puede usar cero como divisor."
    },
    {
      "id": "hypotenuse",
      "pattern": "^(?:hallar|calcular|calcula|halla) (?:la )?hipotenusa (?:con )?catetos (\\d+(?:\\.\\d+)?) (?:y|,) (\\d+(?:\\.\\d+)?)(?: cm)?$",
      "steps": [
        "Los dos datos son catetos: forman el ángulo recto. Buscamos la hipotenusa, el lado situado frente a ese ángulo y el más largo.",
        "Aplicamos Pitágoras: h² = a² + b². Elevá cada cateto al cuadrado y sumá ambos cuadrados; no sumes los lados antes de elevar.",
        "La incógnita es una longitud, no su cuadrado. Tomá la raíz cuadrada positiva de la suma. Dejo esa cuenta final para vos: enviá la longitud y comprobá que sea mayor que cada cateto."
      ],
      "hint": "La raíz positiva es la adecuada porque una longitud no puede ser negativa. Conservá las unidades de los datos."
    }
  ],
  "natural": {
    "number_words": {
      "seis": 6,
      "treinta": 30,
      "cuarenta y cinco": 45,
      "sesenta": 60,
      "diez": 10,
      "cinco": 5,
      "doce": 12,
      "veinte": 20
    },
    "rules": [
      {
        "id": "shadow_height",
        "summary": "Identifiqué una sombra de {length} m y un ángulo de elevación solar de {angle}°. Buscamos la altura. Suponemos que el árbol está vertical y el terreno es horizontal. Si no es así, corregí esos datos antes de continuar.",
        "steps": [
          "Dibujá un triángulo rectángulo. Identificá los lados: altura = opuesto; distancia horizontal {length} m = adyacente; ángulo {angle}°.",
          "Usamos tangente porque relaciona opuesto y adyacente.\ntan({angle}°) = h / {length}",
          "Despejá la altura:\nh = {length} · tan({angle}°)\nCalculá en grados y enviá el resultado en metros."
        ],
        "hint": "Revisá qué lado es opuesto, adyacente o hipotenusa respecto del ángulo dado. La calculadora debe estar en grados (DEG); comprobá también las unidades."
      },
      {
        "id": "elevation_height",
        "summary": "Datos: distancia horizontal {length} m; ángulo de elevación {angle}°. ¿Buscás la altura sobre el punto de observación? Suponemos suelo horizontal. Si la persona observa desde cierta altura, falta ese dato para hallar la altura total.",
        "steps": [
          "Dibujá un triángulo rectángulo. Identificá los lados: altura = opuesto; distancia horizontal {length} m = adyacente; ángulo {angle}°.",
          "Usamos tangente porque relaciona opuesto y adyacente.\ntan({angle}°) = h / {length}",
          "Despejá la altura:\nh = {length} · tan({angle}°)\nCalculá en grados y enviá el resultado en metros."
        ],
        "hint": "Revisá qué lado es opuesto, adyacente o hipotenusa respecto del ángulo dado. La calculadora debe estar en grados (DEG); comprobá también las unidades."
      },
      {
        "id": "elevation_distance",
        "summary": "Identifiqué una altura de {length} m y un ángulo de elevación de {angle}°. Buscamos la distancia horizontal a la base, suponiendo terreno horizontal y observación desde el suelo.",
        "steps": [
          "Dibujá un triángulo rectángulo. Identificá los lados: altura {length} m = opuesto; distancia = adyacente; ángulo {angle}°.",
          "Usamos tangente porque relaciona opuesto y adyacente.\ntan({angle}°) = {length} / d",
          "Despejá la distancia:\nd = {length} / tan({angle}°)\nCalculá en grados y enviá el resultado en metros."
        ],
        "hint": "Revisá qué lado es opuesto, adyacente o hipotenusa respecto del ángulo dado. La calculadora debe estar en grados (DEG); comprobá también las unidades."
      },
      {
        "id": "ladder_height",
        "summary": "Identifiqué una escalera de {length} m y un ángulo de {angle}° con el suelo. Buscamos la altura que alcanza sobre una pared vertical, con suelo horizontal.",
        "steps": [
          "Dibujá un triángulo rectángulo. Identificá los lados: escalera {length} m = hipotenusa; altura = opuesto; ángulo {angle}°.",
          "Usamos seno porque relaciona opuesto e hipotenusa.\nsen({angle}°) = h / {length}",
          "Despejá la altura:\nh = {length} · sen({angle}°)\nCalculá en grados y enviá el resultado en metros."
        ],
        "hint": "Revisá qué lado es opuesto, adyacente o hipotenusa respecto del ángulo dado. La calculadora debe estar en grados (DEG); comprobá también las unidades."
      }
    ]
  },
  "topics": [
    {
      "id": "arithmetic",
      "label": "Números y operaciones",
      "aliases": [
        "aritmetica",
        "numeros",
        "operaciones",
        "fracciones",
        "porcentajes"
      ],
      "prompt": "Indicá las cantidades, sus unidades y qué operación o cantidad se busca."
    },
    {
      "id": "algebra",
      "label": "Álgebra y ecuaciones",
      "aliases": [
        "algebra",
        "ecuaciones",
        "ecuacion"
      ],
      "prompt": "Indicá la incógnita y las relaciones de igualdad o condiciones del problema."
    },
    {
      "id": "functions",
      "label": "Funciones",
      "aliases": [
        "funciones",
        "funcion"
      ],
      "prompt": "Incluí la regla de la función, el valor de entrada o salida conocido y qué se pide."
    },
    {
      "id": "trigonometry",
      "label": "Trigonometría",
      "aliases": [
        "trigonometria",
        "trigonometrico",
        "funciones trigonometricas",
        "funcion trigonometrica",
        "trigonometricas",
        "trigonometrica"
      ],
      "prompt": "Indicá ángulos con sus unidades, lados o distancias conocidos y qué altura, distancia o razón buscás."
    },
    {
      "id": "geometry",
      "label": "Geometría",
      "aliases": [
        "geometria",
        "triangulo",
        "pitagoras"
      ],
      "prompt": "Indicá la figura, medidas con sus unidades y si se busca un lado, área, perímetro o distancia."
    },
    {
      "id": "counting",
      "label": "Combinatoria y probabilidad",
      "aliases": [
        "combinatoria",
        "probabilidad",
        "conteo"
      ],
      "prompt": "Indicá cuántos elementos hay, cuántos se eligen, si importa el orden y si se permite repetir."
    },
    {
      "id": "statistics",
      "label": "Estadística",
      "aliases": [
        "estadistica",
        "media",
        "promedio"
      ],
      "prompt": "Incluí todos los datos y qué medida estadística se pide."
    },
    {
      "id": "unsure",
      "label": "No sé el tema",
      "aliases": [
        "no se",
        "no estoy seguro",
        "otro"
      ],
      "prompt": "Escribí el enunciado completo; identificaremos juntos el tema y lo que se busca."
    }
  ],
  "topic_question": "¿Qué tema querés practicar? Elegí una opción o escribí el enunciado y después «No sé el tema»."
};
