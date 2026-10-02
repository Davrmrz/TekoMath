// modules/trigonometry/unit_circle.js
// Visualizador Interactivo de Circunferencia Trigonométrica (HTML5 Canvas 2D)

class UnitCircle {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.angleDeg = options.initialAngle || 30;
        this.showCosX = options.showCosX !== false;
        this.showSinY = options.showSinY !== false;
        this.hideFinalValues = options.hideFinalValues || false;
        this.highlightQuadrant = options.highlightQuadrant || null; // 'I', 'II', 'III', 'IV', 'all'
        this.isDragging = false;
        
        this.onAngleChange = options.onAngleChange || null;

        this.initCanvasSize();
        this.bindEvents();
        this.draw();
    }

    initCanvasSize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const size = Math.min(rect.width || 380, 420);
        this.canvas.width = size;
        this.canvas.height = size;
        this.cx = size / 2;
        this.cy = size / 2;
        this.radius = (size / 2) * 0.72;
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.initCanvasSize();
            this.draw();
        });

        const updateFromPos = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = clientX - rect.left - this.cx;
            const y = clientY - rect.top - this.cy;
            
            // Canvas Y crece hacia abajo, en trigonometría hacia arriba
            let rad = Math.atan2(-y, x);
            let deg = (rad * 180) / Math.PI;
            if (deg < 0) deg += 360;
            
            this.setAngle(Math.round(deg));
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            updateFromPos(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                updateFromPos(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Soporte Touch para celulares
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                updateFromPos(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isDragging && e.touches.length === 1) {
                updateFromPos(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    setAngle(deg, triggerCallback = true) {
        this.angleDeg = ((deg % 360) + 360) % 360;
        this.draw();
        if (triggerCallback && this.onAngleChange) {
            this.onAngleChange(this.getValues());
        }
    }

    setVisualState(state) {
        if (state.angle_deg !== undefined) this.angleDeg = state.angle_deg;
        if (state.show_cos_x !== undefined) this.showCosX = state.show_cos_x;
        if (state.show_sin_y !== undefined) this.showSinY = state.show_sin_y;
        if (state.hide_final_values !== undefined) this.hideFinalValues = state.hide_final_values;
        if (state.highlight_quadrant !== undefined) this.highlightQuadrant = state.highlight_quadrant;
        this.draw();
    }

    getValues() {
        const rad = (this.angleDeg * Math.PI) / 180;
        const cosVal = Math.cos(rad);
        const sinVal = Math.sin(rad);
        let quad = 'I';
        if (this.angleDeg > 90 && this.angleDeg <= 180) quad = 'II';
        else if (this.angleDeg > 180 && this.angleDeg <= 270) quad = 'III';
        else if (this.angleDeg > 270 && this.angleDeg <= 360) quad = 'IV';

        return {
            angleDeg: this.angleDeg,
            angleRad: rad,
            cos: cosVal,
            sin: sinVal,
            quadrant: quad
        };
    }

    draw() {
        const ctx = this.ctx;
        const cx = this.cx;
        const cy = this.cy;
        const r = this.radius;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Resaltado de cuadrante si aplica
        this.drawQuadrantHighlight();

        // 2. Ejes Cartesianos X e Y
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;

        // Eje X
        ctx.beginPath();
        ctx.moveTo(15, cy);
        ctx.lineTo(this.canvas.width - 15, cy);
        ctx.stroke();

        // Eje Y
        ctx.beginPath();
        ctx.moveTo(cx, 15);
        ctx.lineTo(cx, this.canvas.height - 15);
        ctx.stroke();

        // Etiquetas de Ejes y Cuadrantes
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('X (cos)', this.canvas.width - 45, cy - 8);
        ctx.fillText('Y (sen)', cx + 8, 25);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('I', cx + r * 0.55, cy - r * 0.55);
        ctx.fillText('II', cx - r * 0.65, cy - r * 0.55);
        ctx.fillText('III', cx - r * 0.65, cy + r * 0.65);
        ctx.fillText('IV', cx + r * 0.55, cy + r * 0.65);

        // 3. Circunferencia Unitaria
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 4. Ángulo y Posición del Punto P
        const rad = (this.angleDeg * Math.PI) / 180;
        const px = cx + r * Math.cos(rad);
        const py = cy - r * Math.sin(rad); // Invertir Y para canvas

        // 5. Arco del Ángulo θ
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, -rad, true);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 6. Proyección X (Coseno) - Barra Azul/Cyan
        if (this.showCosX) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(px, cy);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 3.5;
            ctx.stroke();
        }

        // 7. Proyección Y (Seno) - Barra Verde/Esmeralda
        if (this.showSinY) {
            ctx.beginPath();
            ctx.moveTo(px, cy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3.5;
            ctx.stroke();
        }

        // 8. Radio Vector (Hipotenusa)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 9. Punto P(x, y)
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 10. Texto de Datos (Ángulo y Valores)
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText(`θ = ${this.angleDeg}°`, cx + 38, cy - 10);

        if (!this.hideFinalValues) {
            const cosVal = Math.cos(rad).toFixed(2);
            const sinVal = Math.sin(rad).toFixed(2);
            ctx.fillStyle = '#0f172a';
            ctx.font = '12px Fira Code, monospace';
            ctx.fillText(`P = (${cosVal}, ${sinVal})`, px > cx ? px - 70 : px + 12, py < cy ? py - 12 : py + 20);
        }
    }

    drawQuadrantHighlight() {
        if (!this.highlightQuadrant) return;
        const ctx = this.ctx;
        const cx = this.cx;
        const cy = this.cy;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';

        if (this.highlightQuadrant === 'I' || this.highlightQuadrant === 'all') {
            ctx.fillRect(cx, 0, w - cx, cy);
        }
        if (this.highlightQuadrant === 'II' || this.highlightQuadrant === 'all') {
            ctx.fillRect(0, 0, cx, cy);
        }
        if (this.highlightQuadrant === 'III' || this.highlightQuadrant === 'all') {
            ctx.fillRect(0, cy, cx, h - cy);
        }
        if (this.highlightQuadrant === 'IV' || this.highlightQuadrant === 'all') {
            ctx.fillRect(cx, cy, w - cx, h - cy);
        }
    }
}
