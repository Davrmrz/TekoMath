# Etapa 2: unidades, subtemas y enseñanza explícita

## Contenido

El índice de la imagen define cuatro unidades: Funciones (13 subtemas), Funciones
trigonométricas (21), Línea recta (15) y Análisis combinatorio (7). Contenido.pdf
desarrolla trigonometría; su «Módulo 1.0» se incorpora a la unidad 2 del índice,
sin cambiar la numeración de las otras unidades. Las páginas del libro se guardan
como referencia del índice; los temas adicionales del PDF no reciben páginas
inventadas del libro.

`database/curriculum.json` es el catálogo canónico. Contiene conceptos, fórmulas,
ejemplos docentes originales y alternativos para los 56 subtemas. El PDF es una
referencia de contenido, no una fuente de instrucciones para ejecutar acciones.
`python scripts/build_curriculum.py` genera la copia de navegador usada en modo
local. No se borran las antiguas unidades de la base: las conversaciones existentes
siguen accesibles. Los nuevos chats se crean desde el catálogo de cuatro unidades.

## Flujo

El backend valida unidad y subtema antes de crear un chat. Persiste la bienvenida
sin exigir un mensaje del alumno. Las opciones tienen identificadores de acción,
independientes de su redacción. La secuencia es:

TOPIC_SELECTED → TEACHING_MODE → EXAMPLE_MODE → CHECK_UNDERSTANDING
→ siguiente sección o READY_CHECK → PRACTICE_MODE (sólo con consentimiento).

Las preguntas guardan el modo y la sección en `return_stack`. Retomar restaura el
punto exacto. «No entendí» usa otra explicación; «Mostrame otro ejemplo» alterna
entre dos demostraciones preparadas. Recargar restaura mensaje, opciones, fórmula
y visual desde `last_response`. Los ejemplos no se registran como aciertos.

Gemini puede redactar enseñanza, ejemplos y respuestas a dudas con el contexto de
la sección. Sólo se acepta su texto: las opciones, transiciones, fórmulas, visuales
y estado los decide el servidor. Sin servicio, se usan los contenidos preparados;
las dudas específicas que exceden ese material se reconocen como limitación.

El modo local utiliza el mismo catálogo y reglas equivalentes, verificadas por
pruebas de paridad. Si una conversación continúa localmente, se marca «Guardado
en este dispositivo» y no se sobrescribe al volver la conexión. La reconciliación
de eventos entre servidor y dispositivo queda para la etapa 4.

## Alcance de práctica

La circunferencia, signos y ángulos de referencia tienen una actividad inicial
de reconocimiento de cuadrantes. Los demás subtemas ofrecen una reflexión guiada
sin calificación automática. La adaptación de dificultad, el banco gradual, los
diagnósticos de error y los refuerzos sistemáticos pertenecen a la etapa 3.
No se atribuye dominio a una confirmación de comprensión o a una única respuesta.
Se eliminaron los porcentajes de demostración predeterminados.

## Verificación

- `php tests/session_state_test.php`: persistencia y aislamiento.
- `php tests/pedagogy_test.php`: recorrido de las 56 lecciones, interrupciones,
  explicaciones alternativas, consentimiento y ausencia de dominio ficticio.
- `node tests/lesson_parity_test.cjs`: paridad PHP/JS y catálogo generado.
- Servidor aislado: `php -S 127.0.0.1:8127 tests/web_router.php`.
- `python tests/stage2_api_test.py`: API, subtema, bienvenida única y revisiones.
- `node tests/stage2_browser.cjs`: interfaz HTML/PHP, escritorio/móvil y offline.

El servidor de prueba usa SQLite temporal y desactiva Gemini. No modifica la base
real ni consume llamadas del proveedor. MySQL y la redacción de Gemini en vivo
no se han validado en esta etapa.
