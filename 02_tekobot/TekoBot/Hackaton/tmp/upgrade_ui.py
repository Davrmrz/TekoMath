from pathlib import Path
p=Path('modules/mec_visualizers.js')
s=p.read_text(encoding='utf-8').replace('this.initSize();','''this.slope = 2; this.intercept = 1;
        this.controls = document.createElement('div'); this.controls.className='plot-controls';
        this.controls.innerHTML='<label>Pendiente m <input aria-label="Pendiente" type="range" min="-5" max="5" step="0.25" value="2"></label><label>Ordenada b <input aria-label="Ordenada al origen" type="range" min="-4" max="4" step="0.25" value="1"></label>';
        this.canvas.before(this.controls);
        this.caption=document.createElement('div');this.caption.className='plot-formula';this.caption.setAttribute('aria-live','polite');this.canvas.after(this.caption);
        const inputs=this.controls.querySelectorAll('input');
        inputs.forEach(input=>input.oninput=()=>{this.slope=Number(inputs[0].value);this.intercept=Number(inputs[1].value);this.renderTopicVisual(this.topic);});
        new ResizeObserver(()=>{if(this.topic)this.renderTopicVisual(this.topic);}).observe(this.canvas.parentElement);
        this.initSize();''',1)
s=s.replace('this.initSize();\n        const ctx', '''this.topic=topic;
        const linear=['funciones','funciones_lineales'].includes(topic);
        this.controls.hidden=!linear;this.caption.hidden=!linear;
        this.initSize();
        const ctx''')
s=s.replace('const y = 2 * x + 1;', 'const y = this.slope * x + this.intercept;')
s=s.replace("ctx.fillText('Plano Cartesiano: f(x) = 2x + 1', cx, 20);", "ctx.fillText('Plano cartesiano · Explorá la recta', cx, 20);\n        this.caption.textContent=`f(x) = ${this.slope}x ${this.intercept < 0 ? '−' : '+'} ${Math.abs(this.intercept)}`;")
p.write_text(s,encoding='utf-8')
p=Path('index.html');s=p.read_text(encoding='utf-8')
s=s.replace('Unidades y subtemas</h3>','Ñaikũmby · Temas</h3>')
s=s.replace('</aside>','''    <section class="sidebar-section" id="extra-data">
        <h4>Datos extras · Ñanemandu’a</h4>
        <details><summary>Ángulos notables</summary><div class="extra-table"><table>
        <thead><tr><th>θ</th><th>sen θ</th><th>cos θ</th><th>tg θ</th></tr></thead>
        <tbody><tr><td>0°</td><td>0</td><td>1</td><td>0</td></tr><tr><td>30°</td><td>1/2</td><td>√3/2</td><td>√3/3</td></tr><tr><td>45°</td><td>√2/2</td><td>√2/2</td><td>1</td></tr><tr><td>60°</td><td>√3/2</td><td>1/2</td><td>√3</td></tr><tr><td>90°</td><td>1</td><td>0</td><td>No definida</td></tr><tr><td>180°</td><td>0</td><td>−1</td><td>0</td></tr><tr><td>270°</td><td>−1</td><td>0</td><td>No definida</td></tr><tr><td>360°</td><td>0</td><td>1</td><td>0</td></tr></tbody></table></div></details>
        <details><summary>Signos por cuadrante</summary><table><thead><tr><th>Cuadrante</th><th>sen</th><th>cos</th><th>tg</th></tr></thead><tbody><tr><td>I · 0°–90°</td><td>+</td><td>+</td><td>+</td></tr><tr><td>II · 90°–180°</td><td>+</td><td>−</td><td>−</td></tr><tr><td>III · 180°–270°</td><td>−</td><td>−</td><td>+</td></tr><tr><td>IV · 270°–360°</td><td>−</td><td>+</td><td>−</td></tr></tbody></table><p>Los intervalos excluyen los ejes. tg θ = sen θ / cos θ solo si cos θ ≠ 0.</p></details>
        <details><summary>Funciones inversas</summary><p>sen⁻¹ = arcsen, cos⁻¹ = arccos, tg⁻¹ = arctan. Devuelven un ángulo principal; no son recíprocas ni opuestos.</p><table><thead><tr><th>Función</th><th>Dominio</th><th>Recorrido</th></tr></thead><tbody><tr><td>arcsen</td><td>[−1, 1]</td><td>[−90°, 90°]</td></tr><tr><td>arccos</td><td>[−1, 1]</td><td>[0°, 180°]</td></tr><tr><td>arctan</td><td>ℝ</td><td>(−90°, 90°)</td></tr></tbody></table><h5>Valores principales</h5><table><thead><tr><th>x</th><th>arcsen x</th><th>arccos x</th><th>arctan x</th></tr></thead><tbody><tr><td>−1</td><td>−90°</td><td>180°</td><td>−45°</td></tr><tr><td>0</td><td>0°</td><td>90°</td><td>0°</td></tr><tr><td>1</td><td>90°</td><td>0°</td><td>45°</td></tr></tbody></table></details>
        <details><summary>Aranduka · Libro MEC</summary><p>Matemática 1, texto para el estudiante, MEC 2016.</p><a href="assets/books/matematica-1-mec-2016.pdf" target="_blank" rel="noopener">Abrir libro completo</a></details>
    </section>
</aside>''')
s=s.replace('<!-- Botón Dictado por Voz -->','''<label class="problem-toggle"><input type="checkbox" id="own-problem"> Che ejercicio · Mi problema</label>
                <!-- Botón Dictado por Voz -->''')
s=s.replace('placeholder="Escribí o hablá en jopara o español..."','placeholder="Ehai ko’ápe · Escribí tu pregunta o problema…"')
s=s.replace('<span>Enviar</span>','<span>Emondo · Enviar</span>')
s=s.replace('Arrastrá el punto en la circunferencia para explorar áángulos y cuadrantes.','Emongu’e · Arrastrá el punto para explorar ángulos y cuadrantes. P(θ) = (cos θ, sen θ).')
s=s.replace('Visualización de onda periódica: Amplitud, Período y Puntos Clave.','Eiporavo · Elegí una función y cambiá su escala. Las inversas no son periódicas.')
s=s.replace('Representación gráfica de la unidad temática seleccionada.','Ejemplo de exploración libre. Mové los controles para observar cómo cambia la recta.')
s=s.replace('assets/js/lesson_engine.js','assets/js/problem_guide.js"></script>\n<script src="assets/js/lesson_engine.js')
p.write_text(s,encoding='utf-8')
