<?php
require_once __DIR__.'/language_service.php';
require_once __DIR__ . '/curriculum_service.php';
require_once __DIR__ . '/problem_guide.php';
require_once __DIR__ . '/question_resolver.php';
require_once __DIR__ . '/problem_workshop.php';
require_once __DIR__ . '/trig_questions.php';

class PedagogyService {
    public const LABELS = [
        'explain' => 'Sí, explicame', 'known' => 'Ya conozco el tema',
        'question' => 'Tengo una pregunta', 'example' => 'Mostrame un ejemplo',
        'check' => 'Comprobar comprensión', 'understood' => 'Sí, se entiende',
        'partial' => 'Más o menos', 'confused' => 'No entendí',
        'practice' => 'Sí, vamos a practicar', 'more' => 'Explicame un poco más',
        'resume' => 'Retomar donde estábamos', 'hint' => 'Dame una pista',
        'review' => 'Repasar lo aprendido', 'finish' => 'Terminar por ahora'
    ];

    public static function normalize(string $text): string {
        return trim(strtr(mb_strtolower($text, 'UTF-8'), ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','¿'=>'','?'=>'','¡'=>'','!'=>'','.'=>'']));
    }

    public static function conversationalAction(string $message,array $state): string {
        if(isset($state['workshop']))return '';
        $text=QuestionResolver::normalize($message);
        $text=preg_replace('/^(?:(?:bueno|dale|ok|okay|entonces|por favor|porfa)\s+)+/u','',$text);
        $text=preg_replace('/\s+(?:por favor|porfa|gracias)$/u','',$text);
        foreach(self::LABELS as $id=>$label){
            $labels=[$label];foreach(['jopara','es_py','es'] as $lang)$labels[]=TutorLanguage::text($label,$lang,'UI');
            foreach($labels as $value)if(QuestionResolver::normalize($value)===$text)return $id;
        }
        foreach(TutorLanguage::data()['conversation_intents']??[] as $id=>$patterns)foreach($patterns as $pattern)if(preg_match('~'.$pattern.'~u',$text))return $id;
        return '';
    }

    public static function action(string $message, string $action, array $state): string {
        if ($action !== '') {
            if (!isset(self::LABELS[$action])) throw new InvalidArgumentException('Acción desconocida.');
            return $action;
        }
        $text = self::normalize($message);
        foreach (self::LABELS as $key => $label) if ($text === self::normalize($label)) return $key;
        if (preg_match('/no entendi|no entiendo|mas o menos|explica\w* mejor|mejor explicacion|mas facil|mas simple/u', $text)) return 'confused';
        if (preg_match('/otro ejemplo|un ejemplo/u', $text)) return 'example';
        if (preg_match('/^(si|entendi|se entiende)$/u', $text)) {
            return ['TOPIC_SELECTED'=>'explain','CHECK_UNDERSTANDING'=>'understood','READY_CHECK'=>'practice'][$state['mode']] ?? 'question_text';
        }
        if (preg_match('/^(explicame|explica|enseñame)/u', $text) && $state['mode'] === 'TOPIC_SELECTED') return 'explain';
        return $state['mode'] === 'PRACTICE_MODE' && !preg_match('/[?¿]|por que|que significa|ayuda/u', $message) ? 'answer' : 'question_text';
    }

    public static function transition(array $state, string $message, string $action = ''): array {
        $lesson = CurriculumService::lesson($state['topic'], $state['subtopic']);
        if (!$lesson) throw new InvalidArgumentException('Elegí una unidad y un subtema válidos.');
        $action=$action?:self::conversationalAction($message,$state);
        $higher=$action==='resume'?null:(QuestionResolver::higherTopic($message)??((isset($state['scope_query'])&&!QuestionResolver::match($message)&&(QuestionResolver::isFollowup(QuestionResolver::normalize($message))||in_array($action,['more','example','confused'],true)))?$state['scope_query']:null));
        unset($state['scope_query']);
        if($higher){$state['scope_query']=$higher;return $state;}
        if(isset($state['workshop']))return ProblemWorkshop::transition($state,$message,$action);
        if(TrigQuestions::transition($state,$message,$action))return $state;
        $problem = ProblemGuide::transition($state, $message, $action);
        if ($problem) return $problem;
        unset($state['own_problem']);
        $routingAction=$action;
        if($routingAction==='')foreach(self::LABELS as $key=>$label)if(self::normalize($label)===self::normalize($message)){$routingAction=$key;break;}
        if($routingAction==='resume')unset($state['question_context']);
        $question=QuestionResolver::transition($state,$message,$routingAction);
        if($question)return $question;
        $action = self::action($message, $action, $state);
        $mode = $state['mode'];
        $state['feedback'] = null;
        $state['question_pending'] = false;
        $allowed = array_column(self::options($state), 'id');
        if (in_array($action, ['question','question_text'], true)) {
            if ($mode !== 'QUESTION_MODE') {
                $state['return_stack'][] = ['mode'=>$mode, 'lesson'=>$state['lesson'], 'active_exercise_id'=>$state['active_exercise_id']];
            }
            $state['mode'] = 'QUESTION_MODE';
            $state['question_pending'] = $action === 'question';
            if($action==='question_text')$state['question_context']=['keys'=>[],'intent'=>'definition','message'=>$message,'example_index'=>0];
        } elseif ($action === 'resume' && ($mode === 'QUESTION_MODE' || $state['return_stack'])) {
            $resume = array_pop($state['return_stack']);
            if ($resume) foreach ($resume as $key=>$value) $state[$key]=$value;
            else $state['mode']='TEACHING_MODE';
        } elseif ($action === 'example' && in_array($mode, ['TEACHING_MODE','EXAMPLE_MODE','QUESTION_MODE','CHECK_UNDERSTANDING','READY_CHECK'], true)) {
            $state['lesson']['example_variant'] = ($mode === 'EXAMPLE_MODE' || str_contains(self::normalize($message), 'otro ejemplo')) ? (($state['lesson']['example_variant'] ?? 0) + 1) : 0;
            $state['mode']='EXAMPLE_MODE';
        } elseif (in_array($action, ['confused','partial','more'], true)) {
            // Keep the section and exercise; choose another explanation, not a restart.
            if ($mode === 'QUESTION_MODE' && $state['return_stack']) {
                $resume = array_pop($state['return_stack']);
                foreach ($resume as $key=>$value) $state[$key]=$value;
            }
            $state['mode'] = 'TEACHING_MODE';
            $state['lesson']['variant'] = $action==='more'?0:($state['lesson']['variant'] ?? 0) + 1;
        } elseif (in_array($action, $allowed, true)) {
            switch ($action) {
                case 'explain': $state['mode']='TEACHING_MODE'; break;
                case 'known': $state['mode']='READY_CHECK'; break;
                case 'example': $state['mode']='EXAMPLE_MODE'; break;
                case 'check': $state['mode']='CHECK_UNDERSTANDING'; break;
                case 'understood':
                    $state['lesson']['completed_sections'] = array_values(array_unique(array_merge($state['lesson']['completed_sections'], [$state['lesson']['section_id']])));
                    if ($state['lesson']['step'] + 1 < count($lesson['sections'])) {
                        $state['lesson']['step']++;
                        $state['lesson']['section_id']=$lesson['sections'][$state['lesson']['step']]['id'];
                        $state['lesson']['variant']=0;
                        $state['mode']='TEACHING_MODE';
                    } else $state['mode']='READY_CHECK';
                    break;
                case 'practice':
                    $state['mode']='PRACTICE_MODE';
                    $state['active_exercise_id']=$lesson['practice']['id'] ?? 'reflection';
                    $state['hint_level']=0;
                    break;
                case 'hint': $state['hint_level']=min(4,$state['hint_level']+1); $state['feedback']='hint'; break;
                case 'review': $state['mode']='REVIEW_MODE'; break;
                case 'finish': $state['mode']='COMPLETED'; break;
            }
        } elseif ($action === 'answer' && $mode === 'PRACTICE_MODE') {
            $practice = $lesson['practice'] ?? null;
            if ($practice && in_array(self::normalize($message), $practice['answers'], true)) {
                $state['feedback']='correct';
                $state['mode']='REVIEW_MODE';
            } else {
                $state['feedback']=$practice ? 'try_again' : 'reflection';
            }
        }
        return $state;
    }

    public static function options(array $state): array {
        $ids = [
            'TOPIC_SELECTED'=>['explain','known','question'],
            'TEACHING_MODE'=>['example','question','confused'],
            'EXAMPLE_MODE'=>['check','example','question','more'],
            'QUESTION_MODE'=>['resume'],
            'CHECK_UNDERSTANDING'=>['understood','partial','confused','question'],
            'READY_CHECK'=>['practice','more','question'],
            'PRACTICE_MODE'=>['hint','question','review'],
            'REVIEW_MODE'=>['more','finish','question'],
            'COMPLETED'=>['review','question']
        ][$state['mode']] ?? ['question'];
        if ($state['return_stack'] && $state['mode'] === 'EXAMPLE_MODE') $ids[]='resume';
        return array_map(fn($id)=>['id'=>$id,'label'=>($id==='example' && $state['mode']==='EXAMPLE_MODE') ? 'Mostrame otro ejemplo' : self::LABELS[$id]], $ids);
    }

    public static function response(array $state): array {
        if(isset($state['scope_query']))return QuestionResolver::scopeResponse($state);
        if(isset($state['workshop']))return ProblemWorkshop::response($state);
        if(isset($state['numeric_query']))return TrigQuestions::response($state);
        if(isset($state['own_problem']))return ProblemGuide::response($state);
        if($state['mode']==='QUESTION_MODE' && !($state['question_pending']??false))return QuestionResolver::response($state);
        return TutorLanguage::response(self::rawResponse($state),$state);
    }
    private static function rawResponse(array $state): array {
        $lesson = CurriculumService::lesson($state['topic'], $state['subtopic']);
        $section = $lesson['sections'][$state['lesson']['step']] ?? $lesson['sections'][0];
        $title = $lesson['title'];
        $formula = '';
        $visual = ['type'=>'none'];
        switch ($state['mode']) {
            case 'TOPIC_SELECTED': $text="Hola.\nVamos a estudiar **{$title}**. ¿Querés que primero te explique desde el principio?"; break;
            case 'TEACHING_MODE':
                $text="**{$title}**\n\n" . (($state['lesson']['variant'] ?? 0) > 0 ? $section['alternative'] : $section['concept']);
                $formula=$section['formula']; $visual=$section['visual']; break;
            case 'EXAMPLE_MODE':
                $alternate=(($state['lesson']['example_variant'] ?? 0) % 2) === 1;
                $text="Veamos un ejemplo del profesor.\n\n".($alternate ? $section['example_alt'] : $section['example'])."\n\nEste ejemplo está resuelto para mostrarte cómo se usa la idea.";
                $formula=$section['formula']; $visual=$alternate ? ['type'=>'none'] : $section['visual']; break;
            case 'QUESTION_MODE':$text='¿Qué parte querés que aclaremos? Podés escribir tu duda; guardé el punto donde estábamos.';break;
            case 'CHECK_UNDERSTANDING': $text="Hasta acá trabajamos esta idea:\n\n".$section['concept']."\n\n¿Se entiende esta relación?"; break;
            case 'READY_CHECK': $text="Ya tenemos una base para **{$title}**. ¿Querés que empecemos a practicar? También podemos explicar un poco más."; break;
            case 'PRACTICE_MODE':
                $practice=$lesson['practice'] ?? null;
                $text=$practice['prompt'] ?? "Vamos a razonar sobre **{$title}**: explicá con tus palabras qué representa cada dato de la fórmula y por qué se usa en el ejemplo. Esta primera actividad es una reflexión guiada, sin calificación automática.";
                if (in_array($state['feedback'] ?? '', ['hint','try_again'], true)) $text="Vamos por partes. ".($practice['hint'] ?? 'Identificá la entrada, la salida y la relación que las conecta. Empezá por una sola idea.');
                if (($state['feedback'] ?? '') === 'reflection') $text='Gracias por explicar tu razonamiento. En esta actividad local no voy a marcarlo como correcto sin comprobarlo. Podés comparar tu explicación con el ejemplo o hacer una pregunta concreta.';
                break;
            case 'REVIEW_MODE':
                $text=(($state['feedback'] ?? '')==='correct' ? "¡Bien! ".($lesson['practice']['explanation'] ?? '')."\n\n" : '')."**Repaso: {$title}**\n\n".$section['concept']."\n\nUna actividad no alcanza para afirmar dominio. Podés seguir repasando o terminar por ahora.";
                $formula=$section['formula']; break;
            default: $text="Guardamos el punto de esta lección de **{$title}**. Cuando quieras, podés volver a repasarla.";
        }
        if($state['mode']==='TEACHING_MODE') {
            $card=null;foreach(QuestionResolver::cards() as $c)if($c['key']===$state['topic'].':'.$state['subtopic']){$card=$c;break;}
            if($state['lesson']['variant']>0)$text='**'.$title."**\n\n".($card['simple']??$card['definition']??$section['concept'])."\n\n¿Qué parte te cuesta: identificar los datos o entender la relación?";
            else {
                $blocks=['**'.$title.'**',"**La idea principal**\n".$section['concept']];
                if(!empty($card['detail'])&&$card['detail']!==$section['concept']&&!str_contains($card['detail'],$section['example']))$blocks[]="**Entendamos la relación**\n".$card['detail'];
                if(!empty($card['why']))$blocks[]="**Por qué funciona**\n".$card['why'];
                if(!empty($card['usage']))$blocks[]="**Cuándo usarlo**\n".$card['usage'];
                $blocks[]="**Veamos cómo se aplica**\n".$section['example'];
                if(!empty($section['example_alt'])&&$section['example_alt']!==$section['example'])$blocks[]="**Otro ejemplo para comparar**\n".$section['example_alt']."\n\nCompará los datos de ambos ejemplos: pueden cambiar las cantidades o la forma de presentar el problema, pero la definición y las condiciones de la relación siguen siendo las mismas. Identificá qué se conserva antes de hacer una cuenta nueva.";
                if(!empty($card['warning']))$blocks[]="**Qué conviene revisar**\n".$card['warning'];
                $blocks[]="**Cómo razonar con esta idea**\nAntes de calcular, identificá qué representa cada dato y qué cantidad buscás. Relacioná esos datos con la definición; después elegí la fórmula y comprobá sus condiciones. En el ejemplo, seguí cada transformación y preguntate por qué es válida.\n\nPara comprobar que entendiste, explicá con tus palabras qué relación usamos y qué cambiaría si cambiara uno de los datos. Podés pedirme otro ejemplo o una explicación más sencilla.";
                $text=implode("\n\n",$blocks);
            }
        }
        return ['tutor_message_jopara'=>$text,'pedagogical_state'=>$state,
            'formula_display'=>['latex'=>$formula,'note'=>$title], 'visual_action'=>$visual,
            'quick_options'=>self::options($state)];
    }
}
