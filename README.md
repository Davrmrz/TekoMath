# Estructura Modular de TEKO Math

Este directorio organiza todos los módulos funcionales del ecosistema **TEKO Math** en 7 secciones estructuradas:

```
TEKO Math/
├── 01_sistema_principal_y_registro_offline/
│   ├── config/ (session.php, database.php, misiones_data.php)
│   ├── sql/ (schema.sql, sample_data.sql)
│   ├── index.php (Login)
│   ├── registro.php
│   ├── registro_process.php
│   ├── auth.php
│   ├── logout.php
│   ├── dashboard.php
│   ├── docente.php
│   ├── dashboard.js
│   ├── docente.js
│   ├── script.js
│   ├── api_estudiantes.php
│   └── api_progreso.php
│
├── 02_tekobot/
│   ├── TekoBot/ (Hackaton/, assets/, models/)
│   ├── chat.php
│   ├── chat.js
│   └── chat.css
│
├── 03_teko_arcade/
│   ├── TEKOARCADE/ (JUEGOS/, dist/, src/)
│   ├── juego.php
│   ├── juego.js
│   └── juego.css
│
├── 04_diagnostico_y_rutas_de_aprendizaje/
│   ├── tekobeta.php
│   ├── misiones.js
│   ├── misiones.css
│   ├── quiz.js
│   ├── api_tareas.php
│   ├── api_materiales.php
│   ├── docente-matematica Guia 1_260821_135131.pdf
│   └── Estudiante-Matematica 1- EM- 2016 MEC.pdf
│
├── 05_jopamath/
│   └── jopamath_i18n.js
│
├── 06_teko_live/
│   ├── api_sala.php
│   ├── teko_live.js
│   └── teko_live.css
│
└── 07_diseno_y_graficos/
    ├── assets/ (images/, icons/, logos/)
    ├── visualizer.js
    ├── visualizer.css
    ├── style.css
    ├── dashboard.css
    └── docente.css
```

---

## 📌 Detalle de Cada Módulo

### 1. Sistema Principal y Registro Offline (`01_sistema_principal_y_registro_offline/`)
- **Propósito:** Gestión de autenticación, sesiones seguras (estudiante/docente), persistencia híbrida en MySQL/SQLite y sincronización con almacenamiento local (`localStorage`) para resiliencia offline.

### 2. TekoBot (`02_tekobot/`)
- **Propósito:** Tutor de inteligencia artificial pedagógico adaptativo con la mascota `tejuxi`, dual coding (KaTeX + Canvas interactivo) y explicación paso a paso en Guaraní Jopara y Español.

### 3. Teko Arcade (`03_teko_arcade/`)
- **Propósito:** Dimensión gamificada interactiva construida en React + TypeScript + Vite con 6 mini-juegos matemáticos (Triangle Forge, Signal Sync, Vector Launch, Pair Matrix, Ratio Rush, Graph Lab), niveles, XP y efectos acústicos con Web Audio API.

### 4. Diagnóstico y Rutas de Aprendizaje (`04_diagnostico_y_rutas_de_aprendizaje/`)
- **Propósito:** Evaluaciones diagnósticas, analítica docente de nivel de dominio conceptual y misiones estructuradas en las 5 etapas pedagógicas del currículo MEC (Explorá, Descubrí, Resolvé, Desafío, Final).

### 5. JopaMath (`05_jopamath/`)
- **Propósito:** Motor lingüístico de traducción pedagógica en tiempo real a Guaraní Jopara, principio de preservación y protección matemática, y glosario conceptual contextualizado.

### 6. Teko Live (`06_teko_live/`)
- **Propósito:** Modo de clase interactiva multijugador tipo Kahoot en tiempo real con PIN de 6 dígitos, temporizador regresivo, rachas de fuego ("On Fire") y podio de honor proyectable en el aula.

### 7. Diseño y Gráficos (`07_diseno_y_graficos/`)
- **Propósito:** Visualizador trigonométrico interactivo en Canvas con círculo unitario (r=1) y gráfica cartesiana periódica animada sincrónica, junto a la identidad visual basada en papel milimetrado ("Graph Paper").
