# MATEJOPARA LOCALIZATION TOOL - MASTER SPECIFICATION
**Documento Fuente de Verdad del Proyecto (SPEC_MASTER.md)**

---

## 1. Misión y Propósito
Construir, probar, corregir y dejar completamente funcional una herramienta local profesional para convertir por lotes contenido educativo en español a propuestas de jopara pedagógico, preservando Matemática, código, variables, placeholders y estructura de archivos.

MateJopara es un proyecto educativo paraguayo orientado a Matemática y al uso pedagógico del jopara.
Esta es una **HERRAMIENTA INTERNA DE LOCALIZACIÓN**, utilizada durante el desarrollo para procesar textos de:
- Plataforma web
- Ejercicios matemáticos
- Actividades y pistas
- Retroalimentaciones (feedbacks)
- Botones y navegación
- Diálogos y narrativas de juegos
- Archivos educativos y futuras aplicaciones

### Pipeline Conceptual
```
CONTENIDO ESPAÑOL
  → MATEJOPARA LOCALIZATION TOOL
  → PROPUESTA JOPARA (IA / Memoria / Glosario)
  → VALIDACIÓN AUTOMÁTICA (Protección estricta de variables/matemática)
  → REVISIÓN HUMANA (Edición, Aprobación, Rechazo)
  → ARCHIVO FINAL JOPARA
  → INTEGRACIÓN EN WEB/JUEGO/APP
```

### Reglas de Ámbito
- La herramienta **NO** debe ejecutarse en producción junto con la web.
- **NO** crear una dependencia runtime entre la web educativa y esta herramienta.
- **NO** instalar un LLM dentro de la aplicación educativa.
- **NO** convertir esto en un traductor para estudiantes.

---

## 2. Filosofía del Proyecto
> **LA IA PROPONE.**  
> **LAS FUENTES ORIENTAN.**  
> **EL SOFTWARE VERIFICA.**  
> **LA PERSONA VALIDA.**

---

## 3. Stack Tecnológico Obligatorio
- **Backend**: Python 3.12 (o compatible 3.10+)
- **Framework**: FastAPI
- **Validación de Datos**: Pydantic v2
- **Persistencia**: SQLite
- **ORM**: SQLAlchemy 2.0 (o SQLModel) de manera consistente
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla + plantillas Jinja2 (HTMX para dinamismo)
- **Diseño / Paleta**: EdTech moderna y técnica:
  - Primario oscuro: `#07110D`
  - Verde bosque / acento principal: `#2D6A4F`
  - Verde esmeralda / acento secundario: `#52B788`
  - Fondos / Superficies: Blancos y grises neutros limpios
- **Testing**: pytest, pytest-asyncio, httpx
- **Configuración**: `.env` y `.env.example`
- **Scripts de inicio Windows**: `start.bat` y `start.ps1`
- **Modo de ejecución**: Localhost en navegador web

---

## 4. Estructura de Directorios
```
matejopara-localizer/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── translator.py
│   │   ├── protector.py
│   │   ├── validator.py
│   │   ├── glossary.py
│   │   ├── memory.py
│   │   ├── provenance.py
│   │   └── contexts.py
│   │
│   ├── providers/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── mock.py
│   │   ├── gemini.py
│   │   └── openai_compatible.py
│   │
│   ├── importers/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── json_importer.py
│   │   ├── csv_importer.py
│   │   └── txt_importer.py
│   │
│   ├── exporters/
│   │   ├── __init__.py
│   │   ├── json_exporter.py
│   │   ├── csv_exporter.py
│   │   ├── txt_exporter.py
│   │   └── audit_exporter.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py
│   │   └── models.py
│   │
│   ├── templates/
│   │   ├── base.html
│   │   ├── dashboard.html
│   │   ├── import.html
│   │   ├── translations.html
│   │   ├── review.html
│   │   ├── glossary.html
│   │   ├── memory.html
│   │   ├── sources.html
│   │   ├── export.html
│   │   └── settings.html
│   │
│   └── static/
│       ├── css/
│       │   └── style.css
│       └── js/
│           └── app.js
│
├── data/
│   ├── sources.json
│   ├── starter_glossary.json
│   └── demo/
│       └── demo_es.json
│
├── input/
├── output/
├── backups/
├── tests/
│   ├── conftest.py
│   ├── test_protector.py
│   ├── test_validator.py
│   ├── test_importers.py
│   ├── test_exporters.py
│   ├── test_glossary.py
│   ├── test_memory.py
│   ├── test_providers.py
│   ├── test_pipeline.py
│   └── test_e2e.py
│
├── .env.example
├── .gitignore
├── requirements.txt
├── start.bat
├── start.ps1
├── README.md
├── ARCHITECTURE.md
├── SOURCES.md
├── SPEC_MASTER.md
├── KNOWN_LIMITATIONS.md
└── FINAL_REPORT.md
```

---

## 5. Fuentes Lingüísticas Registradas
Registradas formalmente en `data/sources.json` y accesibles en la UI:
1. **SPL_DICTIONARY**: Diccionario Guaraní Paraguayo (`https://spl.gov.py/es/diccionario-guarani-paraguayo/`) - Referencia léxica y normativa.
2. **COREGUAPA**: Corpus de Referencia del Guaraní Paraguayo Actual (`https://corpus.spl.gov.py/`) - Uso contextual.
3. **GUARANI_ACADEMY**: Academia de la Lengua Guaraní (`https://spl.gov.py/es/academia-de-la-lengua-guarani/`) - Referencia normativa.
4. **PARAGUAYAN_SPANISH**: Diccionario del Castellano Paraguayo (`https://spl.gov.py/es/castellano-paraguayo/`) - Componente castellano del habla paraguaya.
5. **SPL_DICTIONARIES**: Portal general de diccionarios SPL (`https://spl.gov.py/es/diccionarios/`).
6. **SPL_RESEARCH**: Investigación lingüística (`https://spl.gov.py/es/investigacion-linguistica/`).
7. **LANGUAGE_LAW**: Ley N.º 4251/10 de Lenguas (`https://spl.gov.py/wp-content/uploads/2024/04/ley_de_lenguas.pdf`).
8. **MEC_STUDENT**: Matemática 1 — Texto para el estudiante (MEC) - Terminología matemática y educativa.
9. **MEC_TEACHER**: Matemática 1 — Guía didáctica para docente (MEC) - Terminología y lenguaje pedagógico.
10. **MATEJOPARA_GLOSSARY**: Glosario interno curado de decisiones de traducción.
11. **MATEJOPARA_TM**: Memoria de traducciones aprobadas.

*Nota de atribución*: Ninguna traducción se declara "oficial de la SPL". Se emplea trazabilidad descriptiva:
- "Referencia léxica: SPL"
- "Referencia contextual: COREGUAPA"
- "Terminología matemática: MEC"
- "Validación humana: pendiente/aprobada"

---

## 6. Principio Lingüístico: Jopara Pedagógico
- **No traducir palabra por palabra**.
- Preservar castellano cuando resulte natural, técnico o pedagógicamente conveniente.
- No forzar neologismos artificiales ni inventar deliberadamente terminología guaraní inexistente.
- En caso de incertidumbre: mantener el término original en español y marcar `NEEDS_REVIEW`.

---

## 7. Máquina de Estados
1. `NEW`: Entrada importada, pendiente de procesamiento.
2. `TM_MATCH`: Coincidencia exacta con traducción humana aprobada previa (no consume LLM).
3. `AUTO_GENERATED`: Generada por modelo de IA / Mock, validada técnicamente, pendiente de revisión humana.
4. `NEEDS_REVIEW`: Marcada con advertencias lingüísticas o incertidumbre terminológica.
5. `VALIDATION_ERROR`: Fallo de validación técnica (protección rota, desajuste numérico, etc.).
6. `HUMAN_VALIDATED`: Aprobada formalmente por un revisor humano (alimenta la Memoria de Traducción).
7. `REJECTED`: Rechazada explícitamente por el revisor humano.

> **REGLA ABSOLUTA**: Ninguna salida generada automáticamente por IA puede recibir el estado `HUMAN_VALIDATED`. Solo una acción humana explícita puede otorgarlo.

---

## 8. Contextos Pedagógicos
- `UI`: Botones, etiquetas, navegación (brevedad máxima).
- `INSTRUCTION`: Consigna y enunciados de ejercicios (claridad directa).
- `EXPLANATION`: Desarrollo explicativo conceptual (tono pedagógico).
- `HINT`: Pista para el estudiante (orienta sin resolver el problema).
- `FEEDBACK`: Retroalimentación ante acierto o error (constructivo, no punitivo).
- `DIALOGUE`: Conversacional y natural entre personajes/tutor.
- `STORY`: Narrativa contextual de problemas o juegos.
- `MATH_CONTENT`: Máxima fidelidad y precisión matemática.
- `GENERAL`: Registro estándar general.

---

## 9. Módulo Crítico: Protector y Restaurador de Contenido
Detecta mediante expresiones regulares y gramáticas específicas los siguientes elementos técnicos antes de interactuar con el LLM:
- Fórmulas matemáticas y trigonométricas: `sen(30°)`, `cos(α)`, `tan(x)`, `π/2`, `√3/2`, `x²`, etc.
- Números enteros, decimales, porcentajes, grados: `12`, `3.1416`, `50%`, `45°`.
- LaTeX / KaTeX / MathJax: `$x + y$`, `\frac{a}{b}`, `\[E=mc^2\]`.
- Placeholders y variables: `{nombre}`, `{{user}}`, `${value}`, `%score%`, `[player_name]`.
- URLs, emails, rutas y nombres de archivos: `https://...`, `user@domain.com`, `assets/img.png`.
- Fragmentos de código y etiquetas HTML: `<span class="...">`, `<code>`, `var x = 1;`.

### Estrategia de Sustitución
Sustitución por tokens deterministas: `[[MJ_PROTECTED_0001]]`, `[[MJ_PROTECTED_0002]]`, etc.
Restauración exacta tras recibir la respuesta.

---

## 10. Módulo de Verificación y Reintentos
Al restaurar, se realiza una auditoría comparativa estricta:
1. Mismo recuento de tokens protegidos.
2. Preservación idéntica de valores numéricos, fórmulas, variables y URLs.
3. Respeto de reglas de glosario (`KEEP_SPANISH` presente tal cual, `FORBIDDEN` ausente).
4. Estructura y tipos de datos intactos.
5. Ausencia de meta-texto del LLM ("Aquí está tu traducción:", "Claro, aquí tienes:").
6. Codificación UTF-8 íntegra (incluyendo vocales nasales guaraníes: `ã, ẽ, ĩ, õ, ũ, ỹ` y el puso `’`).

### Mecanismo de Autocorrección (Retry)
Si el LLM altera un marcador protegido o regla, el sistema ejecuta hasta 2 reintentos automáticos indicando la transgresión específica. Si falla tras 2 reintentos, el estado resultante es `VALIDATION_ERROR`.

---

## 11. Glosario y Memoria de Traducción
### Glosario
- Términos con estados: `HUMAN_VALIDATED`, `PREFERRED`, `KEEP_SPANISH`, `FORBIDDEN`, `CANDIDATE`.
- Incluye inicialmente como `KEEP_SPANISH` (configurable): `seno`, `coseno`, `tangente`, `hipotenusa`, `cateto opuesto`, `cateto adyacente`.
- CRUD completo en la interfaz y persistencia en SQLite.

### Translation Memory (TM)
- Clave de búsqueda: `hash(source_text + context)`.
- Si existe traducción con estado `HUMAN_VALIDATED`, se aplica inmediatamente con estado `TM_MATCH`, evitando llamadas innecesarias al LLM.

---

## 12. Proveedores de Lenguaje (LLM Providers)
Arquitectura desacoplada con interfaz abstracta `LLMProvider`:
- `MockProvider`: Generador determinista pedagógico jopara para pruebas unitarias, integración y trabajo offline sin consumir API keys.
- `GeminiProvider`: Integración con Google Gemini (e.g. `gemini-1.5-flash`, `gemini-2.0-flash`) vía HTTP/SDK con lectura segura desde `.env`.
- `OpenAICompatibleProvider`: Integración con endpoints compatibles OpenAI (Groq, Ollama, vLLM, OpenAI).

---

## 13. Importación y Exportación de Archivos
- **Importadores**:
  - `JSON`: Parser recursivo preservando claves estructurales, arrays y tipos de datos.
  - `CSV`: Detección de delimitadores, selección de columna origen y generación de columna Jopara.
  - `TXT`: Procesamiento por líneas o párrafos.
- **Exportadores**:
  - Salida guardada en `output/<nombre>_jopara.<ext>`.
  - **REGLA**: El archivo original NUNCA se modifica ni sobrescribe (verificación byte-a-byte).
  - Bloqueo por defecto de exportación final de producción si existen `VALIDATION_ERROR` o `NEEDS_REVIEW` (con opción explícita de exportación preliminar de trabajo).
- **Auditoría**:
  - Generación de `translation_audit.json` y `translation_report.html` con trazabilidad completa de cada unidad procesada.

---

## 14. Suite de Pruebas y Criterios de Aceptación
Suite exhaustiva con pytest verificando:
1. Protección matemática (`sen(30°)`, `π/2`, `√3/2`).
2. Protección de variables (`{nombre}`, URLs, etc.).
3. Preservación intacta de claves JSON y columnas CSV.
4. Cumplimiento de `KEEP_SPANISH` y rechazo de `FORBIDDEN`.
5. Comportamiento de Translation Memory (evita llamadas a LLM ante coincidencias exactas).
6. Separación de estados (`AUTO_GENERATED` nunca es `HUMAN_VALIDATED` hasta intervención humana).
7. Autocorrección con reintentos guiados.
8. Validación de codificación UTF-8 con caracteres guaraníes (`ã, ẽ, ĩ, õ, ũ, ỹ, ’`).
9. Integridad del archivo original.
10. Flujo End-to-End completo (Importar → Traducir → Revisar/Aprobar → Exportar → Persistencia tras reinicio).

---
*Este documento constituye la fuente de verdad técnica y operacional de MateJopara Localization Tool.*
