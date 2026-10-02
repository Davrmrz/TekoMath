// Whitelisted expression tree: never execute model or student code.
class WorkshopExpression {
 // Spanish grouping is explicit: 9.022 = 9022, 0.125 stays decimal.
 static numeric(text){
  let t=text.trim();
  if(/^[+-]?[1-9]\d{0,2}(?:\.\d{3})+(?:,\d+)?$/.test(t))t=t.replace(/\./g,'');
  t=t.replace(',','.');
  return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(t)&&Number.isFinite(Number(t))?Number(t):null;
 }
 static parse(text){
  try{
   const spoken={"cero":0,"uno":1,"una":1,"dos":2,"tres":3,"cuatro":4,"cinco":5,"seis":6,"siete":7,"ocho":8,"nueve":9,"diez":10,"once":11,"doce":12,"trece":13,"catorce":14,"quince":15,"veinte":20,"treinta":30,"petei":1,"mokoi":2,"mbohapy":3,"irundy":4,"po":5,"potei":6,"pokoi":7,"poapy":8,"porundy":9,"pa":10};text=text.replace(/\b(?:cero|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|veinte|treinta|petei|mokoi|mbohapy|irundy|po|potei|pokoi|poapy|porundy|pa)\b/g,w=>String(spoken[w]));
   text=text.replace(/multiplicado por/g,'*').replace(/dividido (?:por|entre)/g,'/').replace(/elevado a(?: la)?/g,'^');
   text=text.replace(/(\d)\s*x\s*(?=[\d(])/g,'$1*').replace(/√/g,'sqrt');
   text=text.replace(/^(?:¿?cuanto es|calcular?|resuelve|resolver?)\s+/,'').replace(/[?=]\s*$/,'').replace(/\bpor\b/g,'*').replace(/\bentre\b/g,'/').replace(/\bmas\b/g,'+').replace(/\bmenos\b/g,'-').replace(/×|·|\bx\b/g,'*').replace(/÷|:/g,'/').replace(/²/g,'^2').replace(/³/g,'^3');
   const tokens=text.match(/\d+(?:[.,]\d+)*|\.\d+|[a-z_]+|[^\s]/g)||[];
   if(!tokens.length||tokens.length>100)return null;
   let i=0;const op=(name,...args)=>({op:name,args});
   const functions={sqrt:'sqrt',raiz:'sqrt',ln:'ln',sen:'sin_deg',sin:'sin_deg',cos:'cos_deg',tan:'tan_deg'};
   const atom=()=>{let n,t=tokens[i++];if(t==='('){n=sum();if(tokens[i++]!==')')throw Error();}
    else if(functions[t]){if(tokens[i++]!=='(')throw Error();n=op(functions[t],sum());if(tokens[i++]!==')')throw Error();}
    else{const value=this.numeric(t||'');if(value===null)throw Error();n={value};}
    while(tokens[i]==='!'||tokens[i]==='%'){n=tokens[i++]==='!'?op('factorial',n):op('div',n,{value:100});}return n;};
   const power=()=>{let n=atom();if(tokens[i]==='^'){i++;n=op('pow',n,unary());}return n;};
   const unary=()=>{if(tokens[i]==='+'){i++;return unary();}if(tokens[i]==='-'){i++;return op('sub',{value:0},unary());}return power();};
   const product=()=>{let n=unary();while(['*','/'].includes(tokens[i])){const t=tokens[i++];n=op(t==='*'?'mul':'div',n,unary());}return n;};
   const sum=()=>{let n=product();while(['+','-'].includes(tokens[i])){const t=tokens[i++];n=op(t==='+'?'add':'sub',n,product());}return n;};
   const ast=sum();if(i!==tokens.length||!ast.op)return null;
   const expected=this.evaluate(ast),steps=this.explain(ast);
   const notation=/[1-9]\d{0,2}\.\d{3}|,\d/.test(text)?' Punto de miles y coma decimal.':'';
   return {rule:'general',ast,expected,answer_unit:'',summary:'Vamos a calcular:\n'+this.expression(ast)+notation,steps,hint:steps[0]};
  }catch{return null;}
 }
 static expression(node){if(node.value!==undefined)return String(node.value);const a=node.args.map(n=>this.expression(n)),symbols={add:'+',sub:'−',mul:'·',div:'/',pow:'^'};return symbols[node.op]?'('+a[0]+' '+symbols[node.op]+' '+a[1]+')':node.op+'('+a[0]+')';}
 static explain(node){
  if(node.value!==undefined)return [];
  const methods={"add":"Sumá las cantidades.","sub":"Restá la segunda cantidad de la primera.","mul":"Multiplicá los factores.","div":"Dividí la primera cantidad por la segunda. El divisor no puede ser cero.","pow":"Elevá la base al exponente.","sqrt":"Buscá la raíz cuadrada no negativa.","sin_deg":"Usá seno en modo grados (DEG).","cos_deg":"Usá coseno en modo grados (DEG).","tan_deg":"Usá tangente en modo grados (DEG).","factorial":"Multiplicá los enteros positivos hasta el número indicado. Por definición, 0! = 1.","ln":"Usá logaritmo natural; la entrada debe ser positiva."};
  let method=methods[node.op];
  if(node.args.some(n=>n.op==='div'))method=({add:'Para sumar fracciones, usá un denominador común.',sub:'Para restar fracciones, usá un denominador común.',mul:'Multiplicá numeradores entre sí y denominadores entre sí.',div:'Multiplicá por el recíproco de la segunda fracción. No puede ser cero.'}[node.op]||method);
  if(node.op==='mul'&&node.args.every(n=>Number.isInteger(n.value)&&n.value>=0)){const b=node.args[1].value;if(b>=10&&b<100){const t=Math.floor(b/10)*10,u=b-t;if(u)method='Separá el segundo factor:\n'+b+' = '+t+' + '+u+'\nMultiplicá por cada parte y sumá los dos productos.';}}
  return [...node.args.flatMap(n=>this.explain(n)),method+'\n'+this.expression(node)];
 }
 static evaluate(node,depth=0){if(depth>8||!node||typeof node!=='object')throw Error('Expresión inválida');
  if(typeof node.value==='number'&&Number.isFinite(node.value))return node.value;
  if(!Array.isArray(node.args)||node.args.length<1||node.args.length>2)throw Error('Operación inválida');
  const a=node.args.map(n=>this.evaluate(n,depth+1));const unary=['sqrt','sin_deg','cos_deg','tan_deg','factorial','ln'];if(a.length!==(unary.includes(node.op)?1:2))throw Error('Cantidad de argumentos inválida');let v;
  switch(node.op){case 'add':v=a[0]+a[1];break;case 'sub':v=a[0]-a[1];break;case 'mul':v=a[0]*a[1];break;case 'div':v=a[0]/a[1];break;case 'pow':if(Math.abs(a[1])>100)throw Error('Exponente excesivo');v=Math.pow(a[0],a[1]);break;case 'sqrt':v=Math.sqrt(a[0]);break;case 'sin_deg':v=Math.sin(a[0]*Math.PI/180);break;case 'cos_deg':v=Math.cos(a[0]*Math.PI/180);break;case 'tan_deg':if(Math.abs(Math.cos(a[0]*Math.PI/180))<1e-10)throw Error('Tangente no definida');v=Math.tan(a[0]*Math.PI/180);break;case 'ln':v=Math.log(a[0]);break;case 'factorial':if(!Number.isInteger(a[0])||a[0]<0||a[0]>170)throw Error('Factorial fuera de rango');v=1;for(let i=2;i<=a[0];i++)v*=i;break;default:throw Error('Operación no admitida');}
  if(!Number.isFinite(v))throw Error('Resultado no real o división por cero');return v;
 }
}
