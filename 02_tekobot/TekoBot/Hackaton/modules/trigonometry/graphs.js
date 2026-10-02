// Interactive plots. Inverse functions use numerical x and radians on y.
class TrigGraph {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        Object.assign(this, {funcType:'sin', amplitude:1, frequency:1, phaseShift:0, verticalShift:0}, options);
        const controls = document.createElement('div');
        controls.className = 'plot-controls';
        controls.innerHTML = `<label>Función / Eiporavo <select aria-label="Función trigonométrica">${[['sin','Seno'],['cos','Coseno'],['tan','Tangente'],['asin','sen⁻¹ · arcsen'],['acos','cos⁻¹ · arccos'],['atan','tg⁻¹ · arctan']].map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select></label><label>Escala A <input aria-label="Escala A" type="range" min="-3" max="3" step="0.25" value="1"></label>`;
        this.canvas.before(controls);
        this.select = controls.querySelector('select');
        this.slider = controls.querySelector('input');
        this.select.onchange = () => this.setParameters({funcType:this.select.value});
        this.slider.oninput = () => this.setParameters({amplitude:Number(this.slider.value)});
        this.caption = document.createElement('div');
        this.caption.className = 'plot-formula'; this.caption.setAttribute('aria-live','polite');
        this.canvas.after(this.caption);
        new ResizeObserver(()=>this.draw()).observe(this.canvas.parentElement);
        this.draw();
    }
    setParameters(params) { Object.assign(this, params); this.draw(); }
    evaluate(x) {
        const input=this.frequency*x+this.phaseShift;
        return this.amplitude*Math[this.funcType](input)+this.verticalShift;
    }
    draw() {
        const inverse = ['asin','acos','atan'].includes(this.funcType);
        const w=this.canvas.width=Math.max(220, this.canvas.parentElement.clientWidth || 340), h=this.canvas.height=260;
        const ctx=this.ctx, left=38, right=w-15, top=20, bottom=h-32;
        const xmin=inverse?-2:-Math.PI*2, xmax=inverse?2:Math.PI*2;
        const ymax=Math.max(4,Math.abs(this.amplitude)*(inverse?Math.PI:1)+Math.abs(this.verticalShift)+0.5);
        const px=x=>left+(x-xmin)/(xmax-xmin)*(right-left), py=y=>bottom-(y+ymax)/(2*ymax)*(bottom-top);
        ctx.clearRect(0,0,w,h); ctx.font='11px sans-serif'; ctx.textAlign='center';
        for(let i=-2;i<=2;i++) {
            const x=inverse?i:i*Math.PI;
            ctx.strokeStyle='#dce8e1'; ctx.beginPath();ctx.moveTo(px(x),top);ctx.lineTo(px(x),bottom);ctx.stroke();
            ctx.fillStyle='#38584b';ctx.fillText(inverse?String(i):i===0?'0':`${i}π`,px(x),h-12);
        }
        ctx.strokeStyle='#57796b';ctx.beginPath();ctx.moveTo(left,py(0));ctx.lineTo(right,py(0));ctx.moveTo(px(0),top);ctx.lineTo(px(0),bottom);ctx.stroke();
        ctx.textAlign='left';ctx.fillText(inverse?'y (radianes)':'y',left,12);ctx.fillText(inverse?'x':'x (rad)',right-38,h-1);
        for(let y=-Math.floor(ymax);y<=ymax;y++) if(y) {ctx.fillText(String(y),2,py(y)+4);}
        ctx.save();ctx.beginPath();ctx.rect(left,top,right-left,bottom-top);ctx.clip();
        ctx.strokeStyle='#e63c96';ctx.lineWidth=2.5;ctx.beginPath();
        let previous=null, previousInput=null;
        for(let pixel=left;pixel<=right;pixel++) {
            const x=xmin+(pixel-left)/(right-left)*(xmax-xmin), input=this.frequency*x+this.phaseShift, y=this.evaluate(x);
            const branch=Math.floor((input+Math.PI/2)/Math.PI);
            const crossed=this.funcType==='tan' && previousInput!==null && branch!==previousInput;
            if(!Number.isFinite(y)||Math.abs(y)>ymax*2) {previous=null;previousInput=branch;continue;}
            if(previous===null||crossed)ctx.moveTo(pixel,py(y));else ctx.lineTo(pixel,py(y));
            previous=y;previousInput=branch;
        }
        ctx.stroke();ctx.restore();
        const names={sin:'sen',cos:'cos',tan:'tg',asin:'arcsen',acos:'arccos',atan:'arctan'};
        this.caption.textContent=`y = ${this.amplitude} · ${names[this.funcType]}(${this.frequency}x ${this.phaseShift<0?'−':'+'} ${Math.abs(this.phaseShift)}) ${this.verticalShift<0?'−':'+'} ${Math.abs(this.verticalShift)}${inverse?' · Salida en radianes':''}`;
        this.select.value=this.funcType;this.slider.value=this.amplitude;
    }
}
