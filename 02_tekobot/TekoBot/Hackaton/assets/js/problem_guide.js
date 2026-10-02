class ProblemGuide {
    static detects(message, action) {
        if(!action && /(?:^| )(?:por que|que (?:es|significa)|cual es (?:el dominio|el signo|el recorrido|su dominio|su recorrido)|como (?:se define|funciona)|para que sirve)(?: |$)/u.test(QuestionResolver.normalize(message)))return false;
        return action==='own_problem' || (!action && /\d.*[=+*/^°]|[=+*/^].*\d|(?:sen|cos|tan|tg|log)\s*\(?\s*\d/i.test(message)); }
    static start(state,message,action) {
        if(action==='resume'){delete state.own_problem;return false;}
        if(action==='own_problem' || (!state.own_problem && this.detects(message,action)))state.own_problem={statement:message};
        return Boolean(state.own_problem);
    }
    static response(state) {
        return TutorLanguage.response(this.rawResponse(state),state);
    }
    static rawResponse(state) {
        const lesson=LessonEngine.lesson(state);
        const steps={
            funciones:['Identificá la variable de entrada y qué cantidad querés encontrar.','Reconocé el tipo de función y las restricciones de su dominio.','Elegí la regla de evaluación o transformación que corresponde; explicá por qué sirve antes de sustituir datos.'],
            trigonometria:['Dibujá el ángulo o el triángulo y distinguí los datos conocidos de la incógnita.','Si conocés un ángulo, elegí una razón trigonométrica; si buscás un ángulo a partir de una razón, considerá su inversa.','Revisá las unidades, el cuadrante y las restricciones. Explicá qué relación vas a usar antes de sustituir valores.'],
            geometria:['Ubicá los puntos, coordenadas o datos de la recta y señalá la incógnita.','Distinguí si necesitás pendiente, distancia, punto medio o ecuación. No intercambies las coordenadas.','Elegí la relación apropiada y comprobá si hay una recta vertical o un denominador nulo antes de sustituir.'],
            combinatoria:['Identificá los elementos disponibles y qué selección pide el problema.','Decidí si el orden importa y si se permiten repeticiones. Explicá esas decisiones.','Con esas condiciones, elegí entre conteo, variaciones, permutaciones o combinaciones antes de reemplazar datos.']
        }[state.topic]||['Separá datos e incógnita.','Elegí una relación del tema.','Justificá tu elección antes de calcular.'];
        return {tutor_message_jopara:`Trabajemos juntos.\n**${lesson.title} · Tu problema**\n\nGuía local: puedo orientarte sobre el método; para interpretar problemas libres en detalle hace falta la IA conectada.\n\n${steps.map((t,i)=>`${i+1}. ${t}\n${LessonEngine.unit(state.topic)?.explanation_guide?.[i]?.text || ''}`).join('\n\n')}\n\nAhora te toca. Escribí tu primer paso y por qué lo elegiste. Reservamos para vos el resultado y la operación inmediatamente anterior.`,formula_display:{latex:'',note:'Tu problema · últimos pasos reservados'},visual_action:{type:'none'},quick_options:[{id:'hint',label:'Una pista'},{id:'resume',label:'Volver a la lección'}]};
    }
}
window.ProblemGuide=ProblemGuide;
