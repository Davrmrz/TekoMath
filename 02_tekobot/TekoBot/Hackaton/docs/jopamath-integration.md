# Integración de JOPAMATH v2 y registros del tutor

La aplicación utiliza un adaptador compartido en `assets/js/language.js` y `services/language_service.php`. La configuración editorial está en `database/language_profiles.json`; `python scripts/build_languages.py` regenera `assets/js/language_data.js`. El modo offline y PHP usan el mismo catálogo.

## Elementos analizados y aprovechados (JOPAMATH v2)

- `JOPAMATH_v2/JOPAMATH/app/core/prompts.py`: conservar intención y dificultad, evitar traducción palabra por palabra y terminología guaraní inventada.
- `JOPAMATH_v2/JOPAMATH/app/core/contexts.py`: separar interfaz, explicación, consigna, pista, diálogo y devolución. El contexto de interfaz utiliza su propio catálogo de frases.
- `JOPAMATH_v2/JOPAMATH/data/starter_glossary.json`: glosario extendido con diez entradas. Se conservan seno, coseno, tangente, hipotenusa, cateto opuesto y cateto adyacente como KEEP_SPANISH. Se agregan triángulo, clic→cliquea y pista como PREFERRED. La entrada FORBIDDEN del archivo es una demostración con términos ficticios; no se incorpora como vocabulario real.
- `JOPAMATH_v2/JOPAMATH/app/core/protector.py`: proteger contenido matemático, números, enlaces y marcadores antes de adaptar la prosa; restaurarlos literalmente después. El adaptador PHP/JS implementa este principio sin requerir un servidor Python adicional.
- `JOPAMATH_v2/JOPAMATH/app/core/memory.py`: reservar la condición HUMAN_VALIDATED a traducciones revisadas por personas. La base incluida no contiene entradas de memoria aprobadas. Las frases nuevas se identifican como adaptaciones editoriales sin validación humana; las sustituciones del proveedor mock no se presentan como traducciones certificadas.
- `JOPAMATH_v2/JOPAMATH/app/core/provenance.py`: módulo nuevo en v2. Gestiona citas lingüísticas y metadatos de procedencia (MEC, SPL, COREGUAPA, Academia Lengua Guaraní). Las atribuciones son descriptivas y nunca afirman «Traducción oficial».
- `JOPAMATH_v2/JOPAMATH/app/providers/http_utils.py`: módulo nuevo en v2. Implementa `post_with_retry` con backoff exponencial acotado para límites de tasa y fallos transitorios de red (códigos 408, 425, 429, 500–504). Los providers Gemini y OpenAI-compatible de v2 usan esta utilidad.

## Comportamiento

Jopara integra expresiones guaraníes dentro de las explicaciones y consignas; ya no coloca el mismo saludo y despedida bilingües en todas las respuestas. Mantiene los términos técnicos del currículo en español. Las adaptaciones locales son frases completas de un catálogo, no una traducción libre de texto desconocido.

Español paraguayo emplea voseo y frases conversacionales como «Mirá», «de a poco» y «contame», sin insertar guaraní automáticamente. Español neutro usa tuteo y consignas como «observa», «identifica» y «explica», sin regionalismos paraguayos. El texto escrito por el estudiante y los mensajes históricos se conservan.

El selector actualiza el estado local y los botones inmediatamente; las nuevas respuestas utilizan ese idioma. La preferencia se guarda localmente y en la sesión del servidor al enviar el siguiente mensaje. También se respeta en la bienvenida, las consultas y los problemas propios.

La IA recibe el perfil elegido en la instrucción de sistema. Para las lecciones adapta el borrador con marcadores de contenido protegido: si elimina, duplica, reordena o inventa marcadores, añade números o elimina términos obligatorios, se conserva el borrador local. El estado, las opciones, la fórmula principal y el gráfico siguen bajo control del motor pedagógico. La guía de problemas propios mantiene su filtro independiente y la reserva de los últimos pasos.

## Verificación y alcance

- `node tests/language_test.cjs`: 1062 respuestas de los 59 subtemas, seis estados y tres idiomas; paridad PHP/JS, diferencias de registro, protección literal de matemáticas y rechazo de salidas dañadas.
- `node tests/language_browser.cjs`: iniciar PHP en `127.0.0.1:8129` con `tests/web_router.php`. Comprueba `index.php` y `index.html` offline, bienvenida, cambio de idioma, ejemplos, preguntas y recarga.
- `node tests/question_resolver_test.cjs` y `node tests/lesson_parity_test.cjs`: regresión de preguntas y transiciones.

Las pruebas usan contenido local y un servidor sin clave de IA; no certifican la calidad de respuestas de un proveedor externo. La conservación de marcadores es una comprobación estructural, no una demostración de equivalencia semántica de toda la prosa. Las nuevas propuestas jopara siguen disponibles para revisión lingüística por hablantes paraguayos, sin atribuirles una aprobación que no existe.

