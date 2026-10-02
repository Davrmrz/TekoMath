# MateJopara Localization Tool

Herramienta interna profesional para la localización por lotes de contenido educativo en español a propuestas de **jopara pedagógico**, preservando rigurosamente Matemática, fórmulas trigonométricas, código, variables, placeholders y la estructura de archivos.

---

## 1. Filosofía del Proyecto
> **LA IA PROPONE.**  
> **LAS FUENTES ORIENTAN.**  
> **EL SOFTWARE VERIFICA.**  
> **LA PERSONA VALIDA.**

La herramienta **no** se ejecuta en producción con la web escolar ni instala LLMs dentro de la aplicación de los estudiantes. Es una estación de trabajo de escritorio para el equipo de desarrollo y contenidos educativos.

---

## 2. Requisitos del Sistema
- **Sistema Operativo:** Windows 10/11 (o Linux / macOS).
- **Python:** Python 3.12 (o 3.10+).
- **Navegador Web:** Chrome, Edge, Firefox, Brave u Opera.
- **Acceso a Internet:** Opcional (funciona 100% offline con `MockProvider`).

---

## 3. Instalación Rápida en Windows

### Opción A: Ejecutar script de inicio directo (Recomendado)
Hacer doble clic en:
```bat
start.bat
```
o desde PowerShell:
```powershell
.\start.ps1
```
El script verifica el entorno, instala dependencias faltantes e inicia el servidor en `http://127.0.0.1:8000`, abriendo automáticamente el navegador.

### Opción B: Instalación manual desde terminal
```bash
# 1. Clonar o ingresar a la carpeta del repositorio
cd c:\Users\fleit\Documents\Hacka\JOPAMATH

# 2. Instalar dependencias
python -m pip install -r requirements.txt

# 3. Iniciar el servidor local
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Acceder a la interfaz web en: [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

## 4. Configuración (.env)
Copiar `.env.example` a `.env` si se desean configurar claves de IA:
```bash
cp .env.example .env
```
Variables principales:
```env
HOST=127.0.0.1
PORT=8000
DATABASE_URL=sqlite:///./matejopara.db

# Proveedor activo: mock | gemini | openai_compatible
DEFAULT_PROVIDER=mock

# Google Gemini (opcional)
GEMINI_API_KEY=tu_api_key_aqui
GEMINI_MODEL=gemini-1.5-flash

# Compatible OpenAI (opcional para Groq, Ollama, OpenAI)
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

MAX_RETRIES=2
```
*Nota*: Si no se configura ninguna API key, la herramienta opera normalmente en modo `mock` sin bloqueos ni errores. Las claves también pueden ingresarse desde la pantalla **Configuración** en la interfaz web.

---

## 5. Formatos Soportados
1. **JSON (`.json`):**
   - Recorrido recursivo de objetos y listas.
   - Preserva claves estructurales, orden y tipos primitivos (`int`, `float`, `bool`, `null`).
   - Nunca traduce claves.
2. **CSV (`.csv`):**
   - Detección automática de delimitadores (`,`, `;`, `\t`, `|`).
   - Detección de columna origen (`texto_es`, `es`, `dialogo`, etc.) y columna de contexto si existe.
   - Preserva todas las demás columnas y crea la columna `jopara`.
3. **TXT (`.txt`):**
   - Lectura línea a línea o por bloques respetando saltos de línea y formateo.

**Regla de Seguridad Absoluta:** El archivo original guardado en `input/` **nunca se sobrescribe** ni se altera. La salida se escribe exclusivamente en `output/<nombre>_jopara.<ext>`.

---

## 6. Blindaje y Protección Matemática
Antes de enviar el texto al modelo de IA, el módulo `ContentProtector` sustituye los elementos técnicos por tokens internos deterministas (`[[MJ_PROTECTED_0001]]`):
- Fórmulas: `sen(30°)`, `cos(α)`, `tan(x)`, `sen(α) = 3/5`
- Constantes: `π/2`, `√3/2`, `√3`
- Variables y potencias: `x²`, `y³`
- Placeholders: `{nombre}`, `{{user}}`, `${value}`, `%score%`, `[player_name]`
- URLs y correos: `https://...`, `usuario@dominio.com`
- Números, porcentajes y grados: `3.1416`, `50%`, `45°`
- LaTeX / KaTeX: `$\frac{a}{b}$`

Tras la traducción, los tokens se restauran con fidelidad de byte. Si el modelo altera algún elemento protegido o transgrede un término `KEEP_SPANISH` o `FORBIDDEN`, se dispara un bucle de **autocorrección con reintentos guiados** (hasta 2 intentos). Si persiste, se marca como `VALIDATION_ERROR`.

---

## 7. Flujo de Trabajo en la Interfaz
1. **Dashboard:** Muestra estadísticas en tiempo real y permite cargar el dataset de prueba con un solo clic.
2. **Importar:** Arrastrar el archivo (`.json`, `.csv`, `.txt`) o seleccionarlo.
3. **Traducciones:** Vista tabular completa con botón **"Traducir Todo"** (con deduplicación en lote y reutilización de idénticos).
4. **Revisión Humana:** Vista lado a lado (Español vs Propuesta Jopara) con botones:
   - `Aprobar`: Asigna `HUMAN_VALIDATED` y guarda en la Memoria de Traducción.
   - `Guardar Edición`: Permite ajuste fino pedagógico y marca `human_edited = True`.
   - `Regenerar`: Solicita una nueva propuesta al motor.
   - `Rechazar`: Marca `REJECTED`.
   - `+ Glosario`: Agrega términos técnicos directos al Glosario.
5. **Exportar:** Revisa el informe de preparación de calidad. Si existen errores técnicos, bloquea la exportación de producción. Genera:
   - Archivo final: `output/<archivo>_jopara.<ext>`
   - `output/translation_audit.json`
   - `output/translation_report.html`

---

## 8. Ejecución de Pruebas Automatizadas
La suite de pruebas con `pytest` cubre los 22 requerimientos obligatorios:
```bash
python -m pytest tests/ -v
```
Resultado verificado: **26 tests passing (100%)**.

---

## 9. Solución de Problemas (Troubleshooting)
- **Problema:** En Windows aparece un error de codificación al imprimir caracteres guaraníes (`ã`, `ẽ`, `’`).
  - **Solución:** Los scripts `start.bat` y `start.ps1` configuran automáticamente la página de códigos en UTF-8 (`chcp 65001` y `PYTHONIOENCODING=utf-8`).
- **Problema:** "Exportación bloqueada por VALIDATION_ERROR".
  - **Solución:** Corrija la unidad observada en la pantalla de Revisión o use el botón "Reintentar Errores". Si es una prueba offline de borrador, marque la casilla "Generar exportación preliminar de trabajo".
