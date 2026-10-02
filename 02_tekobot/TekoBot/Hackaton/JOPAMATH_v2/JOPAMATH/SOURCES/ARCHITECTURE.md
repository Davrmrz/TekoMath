# Arquitectura del Sistema - MateJopara Localization Tool

## 1. Visión General y Flujo de Datos
MateJopara Localization Tool es una aplicación de escritorio local basada en FastAPI, SQLite y plantillas Jinja2/HTML5/CSS3. Implementa un pipeline desacoplado que garantiza la separación estricta entre la lógica de extracción de archivos, la inferencia de lenguaje natural, las restricciones normativas y la validación matemática.

```
[ ARCHIVO EN ESPAÑOL ] (JSON / CSV / TXT)
         │
         ▼
[ IMPORTER LAYER ] (Preserva claves, tipos y orden)
         │
         ▼
[ BATCH TRANSLATOR COORDINATOR ]
   │
   ├─► [ 1. TM EXACT LOOKUP ] ───► Si existe HUMAN_VALIDATED ──► [ TM_MATCH ] (Evita LLM)
   │
   ├─► [ 2. GLOSSARY CONSTRAINTS ] (KEEP_SPANISH, PREFERRED, FORBIDDEN)
   │
   ├─► [ 3. CONTENT PROTECTOR ] ─► Enmascara fórmulas y variables con [[MJ_PROTECTED_XXXX]]
   │
   ├─► [ 4. LLM PROVIDER ] (Mock / Gemini / OpenAI Compatible)
   │
   ├─► [ 5. CONTENT RESTORER ] ──► Restaura tokens con byte-fidelity
   │
   ├─► [ 6. VALIDATOR & RETRY ] ─► Hasta 2 reintentos si rompe matemática o reglas
   │
   ▼
[ TRANSLATION UNITS (DB) ] (Estados: AUTO_GENERATED, NEEDS_REVIEW, VALIDATION_ERROR)
         │
         ▼
[ ESTUDIO DE REVISIÓN HUMANA ] (Edición libre, regeneración, rechazo)
         │
         ├───► APROBACIÓN EXPLÍCITA ───► [ HUMAN_VALIDATED ]
         │                                    │
         │                                    ▼
         │                         [ TRANSLATION MEMORY ]
         ▼
[ EXPORTER & AUDIT ENGINE ]
   ├──► output/<nombre>_jopara.<ext> (Archivo idéntico localizado)
   ├──► output/translation_audit.json (Registro auditable detallado)
   └──► output/translation_report.html (Reporte visual de calidad)
```

---

## 2. Componentes Principales

### 2.1 Core Modules (`app/core/`)
- `protector.py`: Identifica expresiones matemáticas (LaTeX, funciones trigonométricas `sen(30°)`, fracciones `π/2`, raíces `√3/2`), potencias `x²`, variables de plantilla (`{nombre}`, `{{user}}`, `%score%`, `[player_name]`), URLs y códigos. Sustituye las ocurrencias por `[[MJ_PROTECTED_XXXX]]` y las restaura posteriormente con tolerancia a espacios.
- `validator.py`: Realiza una auditoría comparativa rigurosa entre el texto original y la propuesta restaurada. Verifica integridad matemática, conteo de números, preservación de marcadores, ausencia de términos `FORBIDDEN`, cumplimiento de `KEEP_SPANISH`, ausencia de meta-texto de IA y limpieza de codificación UTF-8.
- `translator.py`: Coordina el pipeline completo, gestiona la caché de deduplicación en memoria para cadenas repetidas, ejecuta los reintentos automáticos y administra la resiliencia ante fallos individuales.
- `memory.py`: Implementa la memoria de traducción mediante un hash SHA-256 normalizado de `source_text + context`.
- `glossary.py`: Extrae dinámicamente las restricciones aplicables a cada cadena según su contexto pedagógico.
- `contexts.py`: Define los 9 contextos pedagógicos (`UI`, `INSTRUCTION`, `EXPLANATION`, `HINT`, `FEEDBACK`, `DIALOGUE`, `STORY`, `MATH_CONTENT`, `GENERAL`) e infiere heurísticamente el contexto adecuado según la clave y el texto.
- `provenance.py`: Genera trazabilidad honesta basada en las fuentes normativas registradas sin atribuir falsas certificaciones oficiales.

### 2.2 Proveedores LLM (`app/providers/`)
- `base.py`: Define la interfaz abstracta `BaseLLMProvider`.
- `mock.py`: Motor local determinista que implementa sustituciones pedagógicas, respeta reglas de glosario y permite simular reintentos y errores sin conexión ni API keys.
- `gemini.py`: Cliente REST asíncrono con `httpx` para la API de Google Gemini (e.g. `gemini-1.5-flash`).
- `openai_compatible.py`: Cliente REST asíncrono compatible con OpenAI, Groq, Ollama y servidores locales vLLM.

### 2.3 Importadores y Exportadores (`app/importers/` y `app/exporters/`)
- **JSON:** Deserializa preservando la jerarquía completa. El exportador utiliza un árbol base en memoria para garantizar que las claves, tipos numéricos y booleanos permanezcan inalterados.
- **CSV:** Maneja detección de dialectos con `csv.Sniffer`, preserva todas las columnas auxiliares y crea la columna `jopara`.
- **TXT:** Procesa por líneas o bloques preservando saltos de línea estructurales.
- **Auditoría:** `AuditExporter` genera `translation_audit.json` y `translation_report.html` en cada proceso de entrega.

---

## 3. Máquina de Estados
Cada unidad de traducción transita por un ciclo de vida estrictamente controlado:

| Estado | Significado | ¿Puede recibirlo la IA? | Impacto en Producción |
| :--- | :--- | :---: | :--- |
| `NEW` | Unidad importada pendiente de proceso | No | Bloquea o se mantiene en español |
| `TM_MATCH` | Coincidencia exacta con traducción humana previa | Sí (automático por TM) | Listo para exportación |
| `AUTO_GENERATED` | Generada por IA y validada técnicamente | Sí | Requiere revisión antes de entrega final |
| `NEEDS_REVIEW` | Generada por IA pero con advertencias pedagógicas | Sí | Requiere revisión humana |
| `VALIDATION_ERROR` | Fallo técnico (matemática o tokens alterados) | Sí | **Bloquea exportación de producción** |
| `HUMAN_VALIDATED` | Aprobada explícitamente por un revisor humano | **NUNCA** | Listo para exportación |
| `REJECTED` | Rechazada explícitamente por el revisor | No | Excluida |

> **Regla de Oro:** Ninguna salida producida automáticamente por IA puede ostentar el estado `HUMAN_VALIDATED`.

---

## 4. Esquema de Persistencia Relacional (SQLite)
Base de datos única local `matejopara.db` gestionada mediante SQLAlchemy 2.0:
- `projects`: Identificador UUID, nombre, nombre de archivo original, formato, delimitador y metadatos estructurales JSON.
- `translation_units`: Clave/ruta, texto español, propuesta jopara, contexto, estado, proveedor, modelo, mapa de protección JSON, resultado de validación, bandera `human_edited`, términos de glosario y fuentes referenciadas.
- `glossary_items`: Término origen, salida preferida, estado (`KEEP_SPANISH`, `PREFERRED`, `FORBIDDEN`, `HUMAN_VALIDATED`, `CANDIDATE`), contextos aplicables JSON, fuentes JSON y justificación didáctica.
- `translation_memory`: Hash normalizado (`SHA-256`), texto fuente, texto destino aprobado, contexto, fecha y autor de validación.
- `app_settings`: Pares clave-valor para configuración en tiempo de ejecución (claves de API, modelos, proveedor activo y número de reintentos).
