# 06 — Teko Live (Arena Multijugador en Vivo)

Módulo de aprendizaje social y competitivo en tiempo real estilo **Kahoot** para aulas interactivas.

## 📁 Archivos del Módulo
* `api_sala.php`: Servicio backend con endpoints para creación de salas, unión por PIN, avance de preguntas y cálculo de podio.
* `teko_live.js`: Controlador de interfaz para anfitrión (Docente) y participantes (Alumnos) con soporte de Web Audio API.
* `teko_live.css`: Estilos visuales de la arena, temporizador regresivo, contador de respuestas y podio animado.

## ⚡ Dinámica de Juego
1. **Acceso por PIN:** Los alumnos ingresan el código de 6 dígitos desde su móvil o computadora.
2. **Puntaje por Velocidad:** Respuestas correctas más rápidas obtienen mayor cantidad de puntos.
3. **Rachas de Fuego 🔥:** Bonificaciones acumulativas por respuestas correctas consecutivas.
4. **Podio de Honor 🏆:** Celebración visual con fanfarria para los 3 primeros lugares.
