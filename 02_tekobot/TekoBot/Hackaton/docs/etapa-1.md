# Etapa 1: sesiones y contrato del tutor

Se conserva la arquitectura PHP/JavaScript. La creación utiliza el UUID del
navegador, admite reintentos y respeta el estudiante de la solicitud. Consultar
historial ya no crea conversaciones vacías. El tema guardado prevalece sobre el
contexto enviado en mensajes posteriores.

`Database::getTutorState` aplica una migración aditiva e idempotente creando
`tutor_session_states` tanto en MySQL como en SQLite. No borra datos ni modifica
el historial. Requiere permiso CREATE en la base de datos. Las sesiones antiguas
reciben el estado inicial al abrirse, sin inferir dominio a partir del historial.

`services/tutor_state.php` define el contrato inicial y los diez modos previstos.
`saveTutorState` guarda actualizaciones internas con control de revisión para
rechazar escrituras desactualizadas. El modelo no puede sobrescribir este estado.
Las transiciones pedagógicas se implementarán en la etapa 2; en esta etapa el
estado inicial permanece en TOPIC_SELECTED durante el flujo antiguo.

Las respuestas de sesiones, historial y chat exponen `tutor_state`. El frontend
conserva una copia por UUID y evita cambiar de chat durante una respuesta activa.
El historial recupera los últimos mensajes en orden cronológico. Gemini recibe
el campo correcto del historial y el mensaje actual no se duplica.

Validación: ejecutar `php tests/session_state_test.php`. Usa SQLite en memoria,
sin alterar conversaciones reales. Cubre creación repetida, separación entre
sesiones, acceso por estudiante, persistencia de una interrupción, conflictos de
revisión y recuperación del historial reciente. La identidad del estudiante sigue
siendo la del prototipo; estas comprobaciones no sustituyen autenticación.

Pendiente: probar MySQL e interfaz en navegador; implementar transiciones,
selección de subtema, evaluación, progreso real y sincronización offline de eventos
en las etapas siguientes. El motor offline todavía utiliza sus reglas anteriores.
