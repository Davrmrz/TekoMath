# Limitaciones Conocidas del Sistema (KNOWN_LIMITATIONS.md)

En concordancia con el principio de transparencia técnica y honestidad lingüística del proyecto MateJopara, se documentan las siguientes limitaciones operativas y metodológicas conocidas:

---

## 1. Limitaciones Lingüísticas y de Modelos de Lenguaje
1. **La IA propone, no certifica:** Ningún modelo de lenguaje comercial (Google Gemini, OpenAI GPT, Groq Llama, etc.) posee competencia nativa completa en *jopara pedagógico paraguayo escolar*. Sus propuestas constituyen borradores asistidos que **requieren necesariamente revisión humana** antes de su despliegue ante estudiantes.
2. **Variabilidad dialectal del Jopara:** El jopara es un fenómeno dinámico de contacto de lenguas (guaraní-castellano) con gradaciones regionales y sociolectales. Lo que en Asunción puede sonar fluido, en el interior del país puede percibirse con menor o mayor peso guaraní. El Glosario interno debe ajustarse según la población escolar destinataria.
3. **Traducción de humor y modismos culturales:** Los modismos, juegos de palabras o referencias narrativas en los diálogos de juegos pueden sufrir traducciones literales no deseadas por parte de los LLMs. La vista de **Estudio de Revisión** fue concebida precisamente para permitir la reescritura humana de estos pasajes.

---

## 2. Limitaciones de Blindaje y Expresiones Matemáticas
1. **Fórmulas no delimitadas en prosa libre:** Si un ejercicio redacta una fracción en texto informal (por ejemplo: "tres dividido dos" en lugar de "3/2"), el extractor numérico protegerá los dígitos aislados pero no interpretará la semántica de la fracción como un bloque único a menos que esté tipografiado formalmente.
2. **Formatos LaTeX exóticos:** Se soportan bloques estándar `$...$`, `$$...$$`, `\(...\)`, `\[...\]` y comandos comunes como `\frac{...}{...}`. Fórmulas incrustadas en entornos multipárrafo complejos (`\begin{align*}...`) deben estructurarse preferentemente en una sola línea para evitar fragmentaciones en JSON/CSV.

---

## 3. Limitaciones en Archivos y Formatos
1. **Archivos CSV con formatos inconsistentes:** Aunque el importador cuenta con detección automática mediante `csv.Sniffer`, archivos con saltos de línea no escapados dentro de celdas o con delimitadores mixtos en un mismo archivo deben normalizarse previamente.
2. **Archivos binarios no soportados directamente:** La herramienta procesa actualmente **JSON, CSV y TXT**. Formatos como Excel binario (`.xlsx`), Word (`.docx`) o bases de datos binarias deben exportarse a JSON o CSV antes de ser procesados por la herramienta.

---

## 4. Limitaciones de Red y Conectividad
1. **Modo Mock vs Proveedores Reales:** En modo offline sin internet ni API keys (`MockProvider`), el sistema genera propuestas deterministas simuladas útiles para pruebas técnicas y flujos de calidad, pero **no** genera traducciones jopara completas para vocabulario imprevisto que no esté en sus diccionarios de verbos y términos educativos.
2. **Límites de cuota (Rate Limits):** En proveedores en la nube gratuitos (como Gemini Free Tier), lotes de más de 15 peticiones por minuto pueden disparar errores 429 de la API externa. La herramienta reporta el error como `VALIDATION_ERROR` en la unidad correspondiente sin detener el procesamiento del resto del lote.
