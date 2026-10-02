# Glosario y alcance curricular

La aplicación incorpora 264 entradas con definiciones propias, ejemplos, nombres alternativos, nivel y referencias. Incluye conocimientos previos, contenidos de primer curso y las funciones trigonométricas inversas solicitadas como ampliación didáctica. No constituye una certificación del MEC ni una garantía de exhaustividad del currículo vigente.

## Fuentes y criterios

El catálogo `glossary_sources` de `database/curriculum.json` conserva los enlaces y las advertencias de cada fuente, consultadas el 26 de septiembre de 2026:

- Libro de Matemática de primer curso MEC 2016, disponible localmente.
- Priorización curricular MEC 2021, alojada en el portal oficial de información pública paraguayo: páginas PDF 31–32 para tercer ciclo y 78–79 para Educación Media. Es una referencia histórica, no una verificación de vigencia para 2026.
- Guía del elaborador MEC para segundo ciclo y los ítems liberados SNEPE 2015, para conocimientos previos.
- Programa oficial de Ingeniería Mecatrónica de la UNA, utilizado únicamente para identificar contenidos universitarios como integrales y ecuaciones diferenciales. No se presenta como aprobación del MEC.
- `Contenido.pdf`, aportado por el usuario, se utiliza solo como referencia interna. El original permanece fuera del sitio, en la carpeta Downloads del propietario; no se distribuye una copia pública ni un enlace de descarga. No se encontró evidencia de aprobación MEC de este archivo.

Las referencias respaldan las áreas y el alcance curricular; las definiciones son redacción propia y no citas textuales de esos documentos. Las razones trigonométricas son adimensionales. Se distingue entre recíprocas (secante, cosecante, cotangente) e inversas (arcocoseno, arcoseno, arcotangente), evitando la ambigüedad del PDF aportado.

## Respuestas y límites

El buscador está en el menú lateral y funciona sin conversación ni conexión. Las entradas alimentan también las respuestas locales del tutor.

Para once grupos de temas reconocidos y documentados como posteriores, el tutor devuelve exactamente: `esa pregunta abarca a temas de un curso mayor`. La comprobación funciona antes de procesar ejercicios propios y antes de llamar al modelo remoto. No borra el ejercicio pendiente. Un término desconocido produce una solicitud de aclaración, no una clasificación automática como curso superior. El reconocimiento usa alias explícitos y no puede clasificar cualquier formulación posible.

Arcoseno, arcocoseno y arcotangente se admiten como ampliación solicitada; se explican intervalos principales, dominio, salida angular, grados/radianes y diferencia con el recíproco. Las fórmulas trigonométricas «derivadas» no se confunden con derivación de cálculo.

## Mantenimiento

Editar las entradas en `database/glossary_*.txt` (título, alias, definición y ejemplo separados por `|`) y los criterios en `scripts/build_glossary.py`. Ejecutar `python scripts/build_glossary.py` y después `python scripts/build_curriculum.py`. La reconstrucción completa con `scripts/build_question_bank.py` también integra el glosario.

Validaciones: `tests/glossary_test.cjs` compara las respuestas y estados JavaScript/PHP, verifica referencias y comprueba que el filtro conserve el ejercicio pendiente. `tests/glossary_browser.cjs` verifica búsqueda, funciones inversas, límites de alcance y aclaraciones con servidor y en modo local. Se mantienen las pruebas de adaptación de preguntas, paridad de lecciones e idiomas.
