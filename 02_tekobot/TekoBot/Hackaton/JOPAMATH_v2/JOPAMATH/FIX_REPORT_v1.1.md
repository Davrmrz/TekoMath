# MateJopara Localization Tool — Correcciones v1.1

## Problemas corregidos

1. **JSON i18n con claves que contienen puntos**: la v1.0 interpretaba `home.title` como una ruta anidada y podía dejar la clave original sin traducir. La v1.1 usa RFC 6901 JSON Pointer para rutas internas y conserva literalmente todas las claves.
2. **CSV incompleto**: la v1.0 aceptaba una sola columna fuente. La v1.1 acepta varias columnas textuales por fila y genera una columna jopara separada por cada fuente cuando corresponde.
3. **Autodetección CSV falsa**: se eliminó el matching por substring que hacía que `es` coincidiera dentro de `respuesta_a`.
4. **Exportación parcial confusa**: producción ya no vuelve silenciosamente al español para textos pendientes. Si falta aprobación, bloquea; para pruebas se usa BORRADOR.
5. **429/timeouts/errores temporales**: Gemini y proveedores OpenAI-compatible/NVIDIA NIM ahora usan reintentos con exponential backoff acotado.
6. **Pruebas de regresión**: se añadieron casos reales de web i18n, CSV multicolumna, exportación de borrador/producción y retry HTTP.

## Uso recomendado

- Web: `web_es.json` → importar → traducir → Exportar BORRADOR para probar → revisar → Exportar PRODUCCIÓN.
- Juego: CSV con columnas como `dialogo,pregunta,respuesta_a,respuesta_b,pista`; indicarlas separadas por coma al importar o dejar autodetección.
- El archivo original nunca se sobrescribe.
