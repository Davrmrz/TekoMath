# TekoBot — tejuxi, tutor matemático en guaraní jopara

**Proyecto desarrollado para el Hackathon GuaranIA.**

> Aprendé matemática con tejuxi, la mascota de TekoBot: ojos morados, pañuelo verde y curiosidad por aprender.

---

## ðŸŒŸ CaracterÃ­sticas Principales

1. **El GuaranÃ­ Jopara no es un accesorio:** La IA enseÃ±a con una combinaciÃ³n natural de guaranÃ­ y espaÃ±ol tÃ©cnico cotidiano de las aulas paraguayas.
2. **EnseÃ±anza por estados:** El profesor explica, resuelve ejemplos docentes y comprueba comprensiÃ³n antes de invitar a practicar. Las preguntas se pueden interrumpir y retomar sin reiniciar la lecciÃ³n.
3. **Dual Coding (FÃ³rmula + GrÃ¡fico Sincronizado):** Cada explicaciÃ³n vincula en tiempo real fÃ³rmulas en KaTeX con la **Circunferencia TrigonomÃ©trica interactiva** en Canvas y el graficador de ondas sinusoidales.
4. **DetecciÃ³n Exacta de Errores y Calidez PedagÃ³gica:** Identifica si el error es de cuadrante, signo, confusiÃ³n seno/coseno o cÃ¡lculo de Ã¡ngulo de referencia, sin juicios negativos.
5. **Andamiaje de 5 Niveles de Pistas:** Desde un recordatorio conceptual sutil hasta procedimientos parciales guiados.
6. **Resiliencia Offline:** El visualizador en Canvas, KaTeX y el banco de ejercicios funcionan incluso sin conexiÃ³n a internet.
7. **EvaluaciÃ³n DiagnÃ³stica:** MÃ³dulo de Pre-Test y Post-Test para registrar la evoluciÃ³n del aprendizaje.

---

## ðŸš€ CÃ³mo Ejecutar el Proyecto

### OpciÃ³n 1: Con el servidor integrado de PHP (Recomendado para pruebas rÃ¡pidas)
Asegurate de tener PHP instalado (o abrir la terminal de XAMPP) y ejecutar en la carpeta del proyecto:

```bash
php -S localhost:8000
```
Luego abrÃ­ tu navegador en: **http://localhost:8000**

### OpciÃ³n 2: Con XAMPP / Apache / MySQL
1. CopiÃ¡ esta carpeta dentro del directorio `htdocs` de XAMPP (por ejemplo `C:\xampp\htdocs\math-tutor-ai`).
2. IniciÃ¡ los mÃ³dulos de **Apache** y **MySQL** desde el panel de control de XAMPP.
3. ImportÃ¡ el archivo `database/schema.sql` y `database/seed_data.sql` desde phpMyAdmin (o dejÃ¡ que la aplicaciÃ³n lo inicialice automÃ¡ticamente).
4. AbrÃ­ tu navegador en: **http://localhost/math-tutor-ai**

---

## ðŸ”‘ ConfiguraciÃ³n de la API Key de Gemini (Opcional)
Para activar las respuestas generativas avanzadas con Google Gemini:
1. AbrÃ­ el archivo `.env` en la raÃ­z del proyecto.
2. IngresÃ¡ tu clave:
   ```env
   GEMINI_API_KEY="tu_clave_aqui"
   ```
*(Nota: Si no tenÃ©s una clave en este momento, la aplicaciÃ³n cuenta con un motor inteligente local en GuaranÃ­ Jopara que responderÃ¡ todas las preguntas de la demo).*

---

## ðŸ“‚ Estructura del CÃ³digo

* `/api`: Endpoints REST (`chat.php`, `diagnostic.php`, `progress.php`, `exercises.php`).
* `/assets`: Estilos CSS modernos, KaTeX y scripts de interacciÃ³n.
* `/config`: ConexiÃ³n de base de datos PDO (MySQL con fallback automÃ¡tico a SQLite) y cargador `.env`.
* `/database`: Esquema SQL normalizado y datos iniciales de ejercicios.
* `/modules/trigonometry`: Circunferencia trigonomÃ©trica en Canvas (`unit_circle.js`), graficador de funciones (`graphs.js`) y banco local (`exercises_data.js`).
* `/prompts`: Prompt de profesor adaptativo en GuaranÃ­ Jopara y taxonomÃ­a de errores.
* `/services`: Servicios de backend (`ai_service.php`, `math_service.php`, `progress_service.php`).
* `/views`: Interfaz Split-Screen responsiva y modal de diagnÃ³stico.

## Unidades y enseÃ±anza (etapa 2)

El selector organiza 56 subtemas en cuatro unidades del Ã­ndice proporcionado:
Funciones, Funciones trigonomÃ©tricas, LÃ­nea recta y AnÃ¡lisis combinatorio.
Cada conversaciÃ³n guarda el subtema y el punto de la explicaciÃ³n.

El catÃ¡logo fuente estÃ¡ en `database/curriculum.json`; ejecutar
`python scripts/build_curriculum.py` despuÃ©s de editarlo actualiza la copia local.
Ver `docs/etapa-2.md` para el alcance de esta entrega y los comandos de pruebas.
La prÃ¡ctica adaptativa completa y el progreso por evidencias continÃºan en las
etapas siguientes.

## Libro, problemas propios y exploraciÃ³n

El catÃ¡logo incorpora el libro MEC 2016 de 152 pÃ¡ginas, con enlaces a las pÃ¡ginas originales y extractos para contextualizar las explicaciones. Las tres lecciones de funciones inversas son ampliaciones didÃ¡cticas explÃ­citas (59 subtemas en total). Para regenerar el catÃ¡logo: ejecutar `scripts/import_mec_book.py` con el PDF original, `scripts/upgrade_learning.py` y `scripts/build_curriculum.py`.

MarcÃ¡ **Che ejercicio Â· Mi problema** para escribir un enunciado libre. La guÃ­a conserva el enunciado al pedir pistas y reserva el resultado y la operaciÃ³n inmediatamente anterior. La IA recibe una polÃ­tica especÃ­fica y sus pasos pasan un filtro que rechaza expresiones numÃ©ricas y algebraicas; si la respuesta no cumple, se usa una guÃ­a conceptual local. Sin conexiÃ³n o sin Gemini, la guÃ­a indica su alcance y orienta por tema, sin simular una resoluciÃ³n personalizada. **Volver a la lecciÃ³n** termina este modo.

El grÃ¡fico permite modificar pendiente y ordenada. El selector trigonomÃ©trico incluye seno, coseno, tangente, arcsen, arccos y arctan; las inversas muestran radianes en el eje vertical. La barra lateral contiene tablas de valores, signos y recorridos principales.

La entrada del chat permite texto y fotos de ejercicios. Las funciones de voz, dictado y lectura en voz alta fueron retiradas.

Pruebas adicionales: `node tests/learning_upgrade_browser.cjs`, con el servidor de pruebas descrito en `tests/web_router.php`.

## Preguntas adaptadas al concepto

Las consultas usan un catÃ¡logo compartido (`question_bank` en `database/curriculum.json`), generado mediante `scripts/build_question_bank.py` y `scripts/build_curriculum.py`. El navegador y PHP reconocen conceptos y alias, comparaciones, ejemplos, causas, aplicaciones, dominios, signos y referencias al concepto anterior. Una consulta no cambia la lecciÃ³n seleccionada ni su progreso. La fÃ³rmula y el grÃ¡fico corresponden al concepto consultado cuando hay un visual disponible. Ante una pregunta no reconocida, el modo local solicita precisiÃ³n; no pretende comprender cualquier enunciado libre. Gemini recibe los conceptos de la consulta, en lugar de quedar limitado al subtema abierto. Los problemas propios conservan su polÃ­tica de ayuda sin resultados finales.

Pruebas: `node tests/question_resolver_test.cjs` comprueba respuestas y estados equivalentes entre PHP y JavaScript; `node tests/question_browser.cjs` verifica el flujo en servidor y offline, incluyendo recarga y regreso a la lecciÃ³n.

## Registros lingÃ¼Ã­sticos y JOPAMATH

El tutor distingue jopara pedagÃ³gico, espaÃ±ol paraguayo coloquial y espaÃ±ol neutro, tanto con servidor como offline. El adaptador aprovecha el glosario, los contextos pedagÃ³gicos y el principio de protecciÃ³n matemÃ¡tica de JOPAMATH. Las fÃ³rmulas y los datos se conservan mientras cambia la redacciÃ³n. Ver `docs/jopamath-integration.md` para fuentes, alcance y pruebas. El catÃ¡logo editable es `database/language_profiles.json`; despuÃ©s de cambiarlo, ejecutar `python scripts/build_languages.py`.

## Respuestas locales adaptadas a la pregunta

El motor distingue definiciones breves, explicaciones sencillas, ejemplos, causas, usos, grÃ¡ficas, signos, dominio y recorrido (tambiÃ©n consultas combinadas). Las repreguntas como Â«me lo explicas mÃ¡s fÃ¡cilÂ», Â«y su recorridoÂ» o Â«me das otro ejemploÂ» conservan el concepto anterior; nombrar otro concepto cambia la consulta sin mover la lecciÃ³n. Se admiten abreviaturas `q`, `pq`, `xq` y variantes ortogrÃ¡ficas acotadas del catÃ¡logo.

Las definiciones ya no agregan automÃ¡ticamente bloques generales de la unidad. Si falta una explicaciÃ³n especÃ­fica, se solicita precisiÃ³n y no se sustituye por contenido ajeno. Los estados antiguos de pregunta sin contexto tambiÃ©n piden aclaraciÃ³n. Las preguntas conceptuales con Ã¡ngulos no se convierten automÃ¡ticamente en problemas de cÃ¡lculo, y las dudas durante la prÃ¡ctica conservan el ejercicio pendiente.

Esto sigue siendo recuperaciÃ³n local de un catÃ¡logo, no comprensiÃ³n irrestricta de cualquier pregunta. Agregar contenidos en `scripts/build_question_bank.py` y regenerar con ese script y `scripts/build_curriculum.py`. Pruebas: `node tests/adaptive_questions_test.cjs` y `node tests/question_browser.cjs` (servidor de pruebas en el puerto 8127), ademÃ¡s de las pruebas de paridad e idiomas.

