# 01 — Sistema Principal y Registro Offline

Este módulo gestiona la infraestructura central de **TEKO Math**, la persistencia de datos y el funcionamiento sin conexión.

## 📁 Archivos del Módulo
* `auth.php`: Validador de credenciales y controlador de sesiones de usuarios.
* `registro_process.php`: Controlador de creación y registro de nuevas cuentas de alumnos y docentes.
* `api_estudiantes.php`: Endpoint JSON para consulta de estudiantes y métricas.
* `api_progreso.php`: Endpoint JSON para persistencia de puntajes y quizzes.
* `dashboard.js`: Lógica del panel de control de estudiante y control de sesiones.
* `docente.js`: Lógica del panel pedagógico docente y asignación de tareas.
* `script.js`: Validaciones de formularios de login y registro.

## ⚙️ Características Técnicas
1. **Control de Acceso Basado en Roles:** Distinción estricta entre `estudiante` y `docente`.
2. **Persistencia Híbrida:** Conexión PDO con soporte MySQL y contingencia automática a SQLite local.
3. **Resiliencia Offline:** Almacenamiento local mediante `localStorage` para conservar el progreso del alumno sin requerir internet permanente.
