# Gráficos vinculados a los temas

`TopicTrigGraph` amplía el visualizador existente con las seis funciones trigonométricas y una vista de triángulos semejantes. Mantiene las tres funciones arco del visualizador original. Cada lección y cada ficha de consulta especifica su gráfico, también cuando la consulta coincide con un alias del glosario.

La circunferencia, el ángulo arrastrable, el punto de la curva, la fórmula numérica y la tabla comparten un modelo. El control angular también funciona con teclado. Las gráficas directas muestran una vuelta, con marcas en grados y radianes. El control de tamaño de los triángulos permite comprobar la invariancia de las razones; cambiar el ángulo modifica esas razones. Las asíntotas se dibujan separadamente y se cortan las ramas al atravesar un polo. La tabla muestra «No definida» en esos puntos.

Las páginas 24, 28, 29, 30 y 31 adjuntadas por el usuario se conservan en `assets/books/figures/trig-*.png`, disponibles en referencias desplegables y con enlace al PDF. Las ilustraciones originales son referencias estáticas; la representación matemática contigua es la que se manipula.

`scripts/build_trig_topics.py` añade tres etapas a cada función: definición/razón, dominio y recorrido, y comportamiento gráfico. Amplía semejanza y las recíprocas, e incluye los ejemplos de hipotenusa 30 y cateto 20. Distingue máximos o mínimos de una rama de extremos globales y valores no definidos de infinito. Se ejecuta al final de `build_glossary.py`; después debe ejecutarse `build_curriculum.py` para sincronizar el navegador.

Verificación: `tests/trig_topics_browser.cjs` comprueba selección contextual de seis funciones, explicaciones detalladas, semejanza, arrastre y controles, valores en polos, razones conocidas, imágenes del libro y ancho móvil, tanto con PHP como sin API. Las pruebas existentes verifican paridad PHP/JavaScript y preservación del contexto conversacional.
