// modules/mec_visualizers.js
// Visualizadores interactivos en Canvas HTML5 para los 8 temas del Currículo MEC 1er Año

class MECVisualizers {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.slope = 1; this.intercept = 0; this.shift = 0; this.kind = 'logaritmica';
        this.controls = document.createElement('div'); this.controls.className='plot-controls';
        this.controls.innerHTML=`<label>Función <select aria-label="Tipo de función">
            <option value="logaritmica">Logarítmica</option><option value="exponencial">Exponencial</option>
            <option value="cuadratica">Cuadrática</option><option value="lineal">Lineal</option>
            <option value="constante">Constante</option><option value="modulo">Valor absoluto</option>
            <option value="parte_entera">Parte entera</option></select></label>
            <label>Forma a <input aria-label="Forma de la curva" type="range" min="-4" max="4" step="0.1" value="1"></label>
            <label>Horizontal h <input aria-label="Desplazamiento horizontal" type="range" min="-4" max="4" step="0.1" value="0"></label>
            <label>Vertical k <input aria-label="Desplazamiento vertical" type="range" min="-4" max="4" step="0.1" value="0"></label>
            <button type="button">Restablecer</button>`;
        this.canvas.before(this.controls);
        this.caption=document.createElement('div');this.caption.className='plot-formula';this.caption.setAttribute('aria-live','polite');this.canvas.after(this.caption);
        this.reference=document.createElement('div');this.reference.className='plot-reference';this.caption.after(this.reference);
        this.controls.querySelector('select').onchange=e=>this.setFunction(e.target.value);
        this.controls.querySelector('button').onclick=()=>this.setFunction(this.kind);
        this.controls.querySelectorAll('input').forEach(input=>input.oninput=()=>{
            const values=Array.from(this.controls.querySelectorAll('input'),el=>Number(el.value));
            [this.slope,this.shift,this.intercept]=values;this.renderTopicVisual(this.topic);
        });
        this.canvas.style.touchAction='none';
        this.canvas.setAttribute('aria-label','Gráfico interactivo: arrastrá la curva o el punto naranja. También podés usar los controles con el teclado.');
        const position=e=>{const r=this.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*this.canvas.width/r.width,y:(e.clientY-r.top)*this.canvas.height/r.height};};
        this.canvas.addEventListener('pointerdown',e=>{
            if(this.controls.hidden || !this.plot) return;
            const p=position(e),v=this.plot;
            const x=v.xmin+(p.x-v.left)/v.sx;
            const curveY=v.top+(v.ymax-this.evaluate(x))*v.sy;
            const handle=Math.hypot(p.x-this.handle.x,p.y-this.handle.y)<18;
            if(!handle && Math.abs(p.y-curveY)>18)return;
            this.drag={id:e.pointerId,p,handle,h:this.shift,k:this.intercept};
            this.canvas.setPointerCapture(e.pointerId);
        });
        this.canvas.addEventListener('pointermove',e=>{
            if(!this.drag || this.drag.id!==e.pointerId)return;
            const p=position(e),v=this.plot,d=this.drag;
            const clamp=n=>Math.round(Math.max(-4,Math.min(4,n))*10)/10;
            if(d.handle){
                const y=v.ymax-(p.y-v.top)/v.sy;
                this.slope=clamp((y-this.intercept)/this.base(this.handle.input));
            }else{
                this.shift=clamp(d.h+(p.x-d.p.x)/v.sx);
                this.intercept=clamp(d.k-(p.y-d.p.y)/v.sy);
            }
            this.renderTopicVisual(this.topic);
        });
        const end=e=>{if(this.drag?.id===e.pointerId)this.drag=null;};
        this.canvas.addEventListener('pointerup',end);this.canvas.addEventListener('pointercancel',end);this.canvas.addEventListener('lostpointercapture',end);
        new ResizeObserver(()=>{if(this.topic)this.renderTopicVisual(this.topic);}).observe(this.canvas.parentElement);
        this.initSize();
    }

    initSize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const size = Math.min(rect.width || 360, 380);
        this.canvas.width = size;
        this.canvas.height = Math.min(size, 260);
        this.cx = this.canvas.width / 2;
        this.cy = this.canvas.height / 2;
    }

    renderTopicVisual(topic, data = {}) {
        this.topic=topic;
        const linear=['funciones','funciones_lineales'].includes(topic);
        this.controls.hidden=!linear;this.caption.hidden=!linear;this.reference.hidden=!linear;
        this.initSize();
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (topic) {
            case 'numeros_reales':
                this.drawNumberLine(data);
                break;
            case 'conjuntos':
                this.drawVennDiagram(data);
                break;
            case 'funciones':
            case 'funciones_lineales':
                this.drawFunctionPlot(data);
                break;
            case 'ecuaciones':
                this.drawEquationScale(data);
                break;
            case 'geometria':
                this.drawCartesianDistance(data);
                break;
            case 'estadistica':
                this.drawBarChart(data);
                break;
            default:
                // Por defecto o trigonometría handled by unit_circle.js
                break;
        }
    }

    // 1. RECTA REAL (Números Reales)
    drawNumberLine(data = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const cy = this.cy;

        // Línea horizontal de la recta real
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(25, cy);
        ctx.lineTo(w - 25, cy);
        ctx.stroke();

        // Flechas en los extremos
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(w - 20, cy - 5); ctx.lineTo(w - 10, cy); ctx.lineTo(w - 20, cy + 5); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(20, cy - 5); ctx.lineTo(10, cy); ctx.lineTo(20, cy + 5); ctx.fill();

        // Marcas numéricas (-3 a +3)
        const step = (w - 70) / 6;
        const startX = 35;
        const labels = ['-3', '-2', '-1', '0', '1', '2', '3'];

        labels.forEach((lbl, idx) => {
            const x = startX + idx * step;
            ctx.beginPath();
            ctx.moveTo(x, cy - 6);
            ctx.lineTo(x, cy + 6);
            ctx.stroke();

            ctx.fillStyle = (lbl === '0') ? '#2563eb' : '#64748b';
            ctx.font = (lbl === '0') ? 'bold 13px Inter' : '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(lbl, x, cy + 22);
        });

        // Marcar punto irracional π (3.14) y √2 (1.41)
        const piX = startX + (3.14 + 3) * (step / 1);
        ctx.beginPath();
        ctx.arc(startX + (1.41 + 3) * step, cy, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px Inter';
        ctx.fillText('√2 ≈ 1.41 (Irracional)', startX + (1.41 + 3) * step, cy - 12);

        const radPi = startX + (3.14 + 3) * step;
        if (radPi < w - 25) {
            ctx.beginPath();
            ctx.arc(radPi, cy, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.fillStyle = '#10b981';
            ctx.fillText('π ≈ 3.14', radPi, cy - 12);
        }

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px Inter';
        ctx.fillText('Recta Real ℝ (Racionales e Irracionales)', w / 2, 25);
    }

    // 2. DIAGRAMA DE VENN (Conjuntos)
    drawVennDiagram(data = {}) {
        const ctx = this.ctx;
        const cx = this.cx;
        const cy = this.cy + 10;
        const r = 65;

        // Conjunto A (Azul)
        ctx.beginPath();
        ctx.arc(cx - 35, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Conjunto B (Morado)
        ctx.beginPath();
        ctx.arc(cx + 35, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Etiquetas de Conjuntos
        ctx.fillStyle = '#1e40af';
        ctx.font = 'bold 14px Inter';
        ctx.fillText('A = {1, 2, 3}', cx - 80, cy - r - 8);

        ctx.fillStyle = '#5b21b6';
        ctx.fillText('B = {2, 3, 4}', cx + 30, cy - r - 8);

        // Elementos dentro
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px Inter';
        ctx.fillText('1', cx - 60, cy + 4);
        ctx.fillText('4', cx + 60, cy + 4);

        // Intersección {2, 3}
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px Inter';
        ctx.fillText('2, 3', cx - 10, cy + 4);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Diagrama de Venn: A ∩ B = {2, 3}', cx, 22);
    }

    // 3. PLANO CARTESIANO Y TRAZADO DE FUNCIONES
    setFunction(kind) {
        if(!['logaritmica','exponencial','cuadratica','lineal','constante','modulo','parte_entera'].includes(kind))return;
        this.kind=kind;this.shift=0;this.intercept=0;this.slope=kind==='exponencial'?2:1;
        this.controls.querySelector('select').value=kind;
        this.renderTopicVisual(this.topic || 'funciones');
    }

    base(x) {
        switch(this.kind){
            case 'logaritmica':return x>0?Math.log2(x):NaN;
            case 'exponencial':return 3**x;
            case 'cuadratica':return x*x;
            case 'constante':return 1;
            case 'modulo':return Math.abs(x);
            case 'parte_entera':return Math.floor(x);
            default:return x;
        }
    }

    evaluate(x) {return this.slope*this.base(x-this.shift)+this.intercept;}

    drawFunctionPlot() {
        const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height;
        const v=this.plot={left:30,top:16,xmin:-4,xmax:10,ymin:-4,ymax:6};
        v.sx=(w-42)/(v.xmax-v.xmin);v.sy=(h-40)/(v.ymax-v.ymin);
        const px=x=>v.left+(x-v.xmin)*v.sx,py=y=>v.top+(v.ymax-y)*v.sy;
        ctx.font='10px sans-serif';ctx.textAlign='center';
        for(let x=v.xmin;x<=v.xmax;x++){
            ctx.strokeStyle=x===0?'#475569':'#dce4e8';ctx.lineWidth=x===0?1.5:0.7;
            ctx.beginPath();ctx.moveTo(px(x),py(v.ymin));ctx.lineTo(px(x),py(v.ymax));ctx.stroke();
            if(x%2===0){ctx.fillStyle='#475569';ctx.fillText(x,px(x),py(0)+13);}
        }
        for(let y=v.ymin;y<=v.ymax;y++){
            ctx.strokeStyle=y===0?'#475569':'#dce4e8';ctx.beginPath();ctx.moveTo(px(v.xmin),py(y));ctx.lineTo(px(v.xmax),py(y));ctx.stroke();
            if(y!==0){ctx.fillStyle='#475569';ctx.fillText(y,px(0)-12,py(y)+3);}
        }
        ctx.fillText('x',w-7,py(0)-5);ctx.fillText('y',px(0)+10,12);
        ctx.save();ctx.beginPath();ctx.rect(v.left,v.top,w-42,h-40);ctx.clip();
        if(this.kind==='logaritmica'){
            ctx.setLineDash([4,4]);ctx.strokeStyle='#94a3b8';ctx.beginPath();ctx.moveTo(px(this.shift),py(v.ymin));ctx.lineTo(px(this.shift),py(v.ymax));ctx.stroke();ctx.setLineDash([]);
        }
        const trace=(original)=>{
            ctx.beginPath();ctx.strokeStyle=original?'#a4c9d7':'#00a8df';ctx.lineWidth=original?1.5:3;
            ctx.setLineDash(original?[4,4]:[]);let previous=null;
            for(let pixel=0;pixel<=w-42;pixel++){
                const x=v.xmin+pixel/v.sx,y=original?(this.kind==='exponencial'?2:1)*this.base(x):this.evaluate(x);
                if(!Number.isFinite(y)){previous=null;continue;}
                const step=this.kind==='parte_entera' && previous!==null && y!==previous;
                if(previous===null || step)ctx.moveTo(px(x),py(y));else ctx.lineTo(px(x),py(y));previous=y;
            }
            ctx.stroke();ctx.setLineDash([]);
        };
        trace(true);trace(false);
        const input=this.kind==='logaritmica'?2:this.kind==='exponencial'?0:1;
        this.handle={x:px(this.shift+input),y:py(this.evaluate(this.shift+input)),input};
        ctx.beginPath();ctx.arc(this.handle.x,this.handle.y,7,0,Math.PI*2);ctx.fillStyle='#f59e0b';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.restore();
        const num=n=>String(Number(n.toFixed(1))),term=this.shift===0?'x':`(x ${this.shift<0?'+':'−'} ${num(Math.abs(this.shift))})`;
        const forms={logaritmica:`log₂${term}`,exponencial:`3^${term}`,cuadratica:`${term}²`,lineal:term,constante:'1',modulo:`|${term}|`,parte_entera:`⌊${term}⌋`};
        const tail=this.intercept===0?'':` ${this.intercept<0?'−':'+'} ${num(Math.abs(this.intercept))}`;
        this.caption.textContent=`f(x) = ${num(this.slope)} · ${forms[this.kind]}${tail}`;
        if(this.kind==='logaritmica')this.caption.textContent+=` · Dominio: x > ${num(this.shift)}`;
        const inputs=this.controls.querySelectorAll('input');[this.slope,this.shift,this.intercept].forEach((n,i)=>inputs[i].value=n);
        inputs[1].disabled=this.kind==='constante';
        if(this.reference.dataset.kind!==this.kind){
            this.reference.dataset.kind=this.kind;
            const page=this.kind==='logaritmica'?24:this.kind==='exponencial'?17:this.kind==='cuadratica'?14:this.kind==='modulo'?34:this.kind==='parte_entera'?35:15;
            const figure=['logaritmica','exponencial'].includes(this.kind);
            this.reference.innerHTML=`<p>Arrastrá la curva celeste para desplazarla. Mové el punto naranja arriba o abajo para cambiar su forma. La línea punteada conserva el modelo inicial.</p>
            ${figure?`<details open><summary>Imagen original del libro · pág. ${page-2}</summary><img src="assets/books/figures/${this.kind}.png" alt="${this.kind==='logaritmica'?'Figura 1.3: función logarítmica':'Figura 1.1: función exponencial'} del libro MEC" style="width:100%;height:auto"></details>`:''}
            <a href="assets/books/matematica-1-mec-2016.pdf#page=${page}" target="_blank" rel="noopener">Ver ${figure?'figura':'ejercicio'} en el PDF · pág. ${page-2}</a>
            ${this.kind==='exponencial'?'<p>Modelo N(t) = 2 · 3ᵗ; una unidad horizontal equivale a 15 minutos del ejemplo.</p>':''}
            ${this.kind==='logaritmica'?'<p>Modelo y = log₂x, según la tabla 1.5. El dibujo impreso no coincide exactamente con los valores de esa tabla.</p>':''}`;
        }
    }

    // 4. BALANZA DE ECUACIONES
    drawEquationScale(data = {}) {
        const ctx = this.ctx;
        const cx = this.cx;
        const cy = this.cy + 15;

        // Base de la balanza
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy + 50); ctx.lineTo(cx + 20, cy + 50); ctx.lineTo(cx, cy + 10);
        ctx.fill();

        // Barra de la balanza
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 110, cy + 10);
        ctx.lineTo(cx + 110, cy + 10);
        ctx.stroke();

        // Platos
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('2x + 6', cx - 110, cy - 10);
        ctx.fillText('14', cx + 110, cy - 10);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px Inter';
        ctx.fillText('Equilibrio de Ecuaciones: 2x + 6 = 14', cx, 22);
    }

    // 5. DISTANCIA ENTRE PUNTOS (Geometría Analítica)
    drawCartesianDistance(data = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = 60;
        const cy = h - 50;
        const scale = 35;

        // Ejes
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(30, cy); ctx.lineTo(w - 30, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx, h - 20); ctx.stroke();

        // Puntos P1(0,0) y P2(3,4)
        const p1x = cx + 0 * scale; const p1y = cy - 0 * scale;
        const p2x = cx + 3 * scale; const p2y = cy - 4 * scale;

        // Segmento Hipotenusa (Distancia d)
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p2y); ctx.stroke();

        // Triángulo rectángulo proyectado
        ctx.strokeStyle = '#94a3b8';
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p1y); ctx.lineTo(p2x, p2y); ctx.stroke();
        ctx.setLineDash([]);

        // Dibujar puntos
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(p1x, p1y, 5, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(p2x, p2y, 5, 0, 2 * Math.PI); ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px Inter';
        ctx.fillText('P1(0,0)', p1x - 10, p1y + 18);
        ctx.fillText('P2(3,4)', p2x + 8, p2y);
        ctx.fillStyle = '#14b8a6';
        ctx.fillText('d = 5', (p1x + p2x) / 2 - 10, (p1y + p2y) / 2 - 8);

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText('Distancia entre Puntos en el Plano', w / 2, 22);
    }

    // 6. GRÁFICO DE BARRAS (Estadística Descriptiva)
    drawBarChart(data = {}) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const margin = 40;

        const values = [2, 4, 6, 8, 10];
        const barWidth = 35;
        const gap = 15;
        const startX = margin + 20;
        const maxVal = 12;

        // Ejes
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(margin, h - margin); ctx.lineTo(w - margin, h - margin); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(margin, 30); ctx.lineTo(margin, h - margin); ctx.stroke();

        values.forEach((v, idx) => {
            const barHeight = (v / maxVal) * (h - margin - 50);
            const x = startX + idx * (barWidth + gap);
            const y = (h - margin) - barHeight;

            ctx.fillStyle = '#f97316';
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(v.toString(), x + barWidth / 2, y - 6);
        });

        // Línea de la Media (x̄ = 6)
        const meanY = (h - margin) - (6 / maxVal) * (h - margin - 50);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(margin, meanY); ctx.lineTo(w - margin, meanY); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px Inter';
        ctx.fillText('Media x̄ = 6', w - margin - 40, meanY - 6);

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText('Estadística: Datos y Media Aritmética', w / 2, 20);
    }
}
