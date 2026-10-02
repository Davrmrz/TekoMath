from pathlib import Path
p=Path('modules/mec_visualizers.js');s=p.read_text(encoding='utf8').replace("this.kind==='cuadratica'?14:15;","this.kind==='cuadratica'?14:this.kind==='modulo'?34:this.kind==='parte_entera'?35:15;");p.write_text(s,encoding='utf8')
p=Path('assets/css/components.css');s=p.read_text(encoding='utf8');s+='''\n.plot-reference {margin-top:12px;text-align:left;font-size:.82rem;line-height:1.5;color:#36594e;}
.plot-reference[hidden] {display:none;}
.plot-reference p {margin:8px 0;}
.plot-reference details {border:1px solid #cfe3da;border-radius:8px;padding:8px;background:white;}
.plot-reference summary {cursor:pointer;font-weight:600;}
.plot-reference a {display:inline-block;margin-top:8px;color:#12664c;}
.plot-controls button {border:1px solid #b9d7c9;border-radius:8px;padding:8px 12px;background:#edfff6;color:#164d3c;cursor:pointer;}
#mec-visual-canvas {cursor:grab;max-width:100%;}
#mec-visual-canvas:active {cursor:grabbing;}
''';p.write_text(s,encoding='utf8')
