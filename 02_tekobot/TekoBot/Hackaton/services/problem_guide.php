<?php
require_once __DIR__.'/language_service.php';
/** Student problems never reuse solved lesson examples or computed visual values. */
class ProblemGuide {
    public static function transition(array $state, string $message, string $action): ?array {
        if ($action === 'resume') return null;
        $conceptQuestion=preg_match('/(?:^| )(?:por que|que (?:es|significa)|cual es (?:el dominio|el signo|el recorrido|su dominio|su recorrido)|como (?:se define|funciona)|para que sirve)(?: |$)/u',QuestionResolver::normalize($message));
        if ($action === 'own_problem' || (!isset($state['own_problem']) && !$conceptQuestion && $action === '' && preg_match('/\d.*[=+*\/^°]|[=+*\/^].*\d|(?:sen|cos|tan|tg|log)\s*\(?\s*\d/iu', $message))) {
            $state['own_problem'] = ['statement'=>$message];
        }
        return isset($state['own_problem']) ? $state : null;
    }
    public static function response(array $state): array {
        return TutorLanguage::response(self::rawResponse($state),$state);
    }
    private static function rawResponse(array $state): array {
        $lesson=CurriculumService::lesson($state['topic'],$state['subtopic']);
        $steps=[
            'funciones'=>['Identificá la variable de entrada y la cantidad que buscás.','Reconocé el tipo de función y las restricciones del dominio.','Elegí la regla de evaluación o transformación y justificá por qué corresponde antes de sustituir.'],
            'trigonometria'=>['Dibujá el ángulo o el triángulo; distinguí datos e incógnita.','Si conocés un ángulo, elegí una razón; si buscás un ángulo a partir de una razón, considerá su inversa.','Revisá unidades, cuadrante y restricciones antes de sustituir valores.'],
            'geometria'=>['Ubicá los puntos y señalá la incógnita.','Distinguí si necesitás pendiente, distancia, punto medio o ecuación.','Elegí la relación y comprobá si hay una recta vertical o denominadores nulos antes de sustituir.'],
            'combinatoria'=>['Identificá los elementos y la selección pedida.','Decidí si importa el orden y si se permiten repeticiones.','Elegí entre conteo, variaciones, permutaciones o combinaciones y justificá tu elección.']
        ][$state['topic']] ?? ['Identificá los datos.','Separá la incógnita.','Elegí una relación del tema y justificá su uso.'];
        $text="Trabajemos juntos.\n**{$lesson['title']} · Tu problema**\n\nGuía local: puedo orientarte sobre el método; para interpretar problemas libres en detalle hace falta la IA conectada.\n\n";
        foreach($steps as $i=>$step) $text.=($i+1).'. '.$step."\n".(CurriculumService::unit($state['topic'])['explanation_guide'][$i]['text'] ?? '')."\n\n";
        $text.="Ahora te toca. Escribí tu primer paso y explicá por qué lo elegiste. Reservamos el resultado y la operación inmediatamente anterior para vos.";
        return ['tutor_message_jopara'=>$text,'formula_display'=>['latex'=>'','note'=>'Tu problema · últimos pasos reservados'],'visual_action'=>['type'=>'none'],'quick_options'=>[['id'=>'hint','label'=>'Una pista'],['id'=>'resume','label'=>'Volver a la lección']]];
    }
}
