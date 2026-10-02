from pathlib import Path
p=Path('modules/mec_visualizers.js');s=p.read_text(encoding='utf8')
a=s.index('        this.slope =');b=s.index('        new ResizeObserver',a)
s=s[:a]+'''        this.slope = 1; this.intercept = 0; this.shift = 0; this.kind = 'logaritmica';
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
''' + s[b:]
s=s.replace('this.controls.hidden=!linear;this.caption.hidden=!linear;','this.controls.hidden=!linear;this.caption.hidden=!linear;this.reference.hidden=!linear;')
a=s.index('    drawFunctionPlot(');b=s.index('    // 4.',a)
s=s[:a]+'''    setFunction(kind) {
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
            const page=this.kind==='logaritmica'?24:this.kind==='exponencial'?17:this.kind==='cuadratica'?14:15;
            const figure=['logaritmica','exponencial'].includes(this.kind);
            this.reference.innerHTML=`<p>Arrastrá la curva celeste para desplazarla. Mové el punto naranja arriba o abajo para cambiar su forma. La línea punteada conserva el modelo inicial.</p>
            ${figure?`<details open><summary>Imagen original del libro · pág. ${page-2}</summary><img src="assets/books/figures/${this.kind}.png" alt="${this.kind==='logaritmica'?'Figura 1.3: función logarítmica':'Figura 1.1: función exponencial'} del libro MEC" style="width:100%;height:auto"></details>`:''}
            <a href="assets/books/matematica-1-mec-2016.pdf#page=${page}" target="_blank" rel="noopener">Ver ${figure?'figura':'ejercicio'} en el PDF · pág. ${page-2}</a>
            ${this.kind==='exponencial'?'<p>Modelo N(t) = 2 · 3ᵗ; una unidad horizontal equivale a 15 minutos del ejemplo.</p>':''}
            ${this.kind==='logaritmica'?'<p>Modelo y = log₂x, según la tabla 1.5. El dibujo impreso no coincide exactamente con los valores de esa tabla.</p>':''}`;
        }
    }

''' + s[b:]
p.write_text(s,encoding='utf8')
p=Path('assets/js/app.js');s=p.read_text(encoding='utf8');s=s.replace('const topicChanged = currentTopic !== state.topic;','const topicChanged = currentTopic !== state.topic || tutorState?.subtopic !== state.subtopic;')
s=s.replace('mecVisualizer.renderTopicVisual(topic);', '''mecVisualizer.renderTopicVisual(topic);
            if (['funciones','funciones_lineales'].includes(topic)) {
                const subtopic=tutorState?.subtopic;
                const kind=['lineal','constante','exponencial','logaritmica','modulo','parte_entera'].includes(subtopic)
                    ? subtopic : topic==='funciones_lineales'?'lineal':subtopic==='tipos'?'cuadratica':'logaritmica';
                mecVisualizer.setFunction(kind);
            }''');p.write_text(s,encoding='utf8')
