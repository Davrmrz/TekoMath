<?php
/** JOPAMATH v2-inspired context, glossary and protected-content adapter.
 *  Sources: JOPAMATH_v2/JOPAMATH/app/core/{prompts,contexts,protector,memory,provenance}.py
 *           JOPAMATH_v2/JOPAMATH/app/providers/http_utils.py
 *           JOPAMATH_v2/JOPAMATH/data/starter_glossary.json
 */
class TutorLanguage {
    public static function data(): array {
        static $data=null;
        return $data ??= json_decode(file_get_contents(__DIR__.'/../database/language_profiles.json'),true,512,JSON_THROW_ON_ERROR);
    }
    public static function normalize(string $language): string {return in_array($language,['jopara','es_py','es'],true)?$language:'jopara';}
    public static function protect(string $text): array {
        $values=[];
        $pattern='~```[\s\S]*?```|`[^`\n]+`|https?://[^\s<>]+|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\\\([\s\S]*?\\\\\)|\\\\\[[\s\S]*?\\\\\]|\{\{[^{}]+\}\}|\$\{[^{}]+\}|\{[\w.-]+\}|<[^>]+>|\\\\[a-zA-Z]+(?:\{[^{}]*\})+|[^\n.!?]*[=^√π≤≥+×÷/][^\n.!?]*|\b(?:sen|sin|cos|tan|log|ln)\s*\([^)]*\)|[−-]?\d+(?:[.,]\d+)?(?:°|%)?~u';
        $masked=preg_replace_callback($pattern,function($m)use(&$values){$token='[[MJ_PROTECTED_'.count($values).']]';$values[]=$m[0];return $token;},$text);
        return ['text'=>$masked,'values'=>$values];
    }
    public static function restore(string $text,array $values): string {
        return preg_replace_callback('/\[\[MJ_PROTECTED_(\d+)\]\]/',fn($m)=>$values[(int)$m[1]]??$m[0],$text);
    }
    public static function text(string $text,string $language='jopara',string $context='GENERAL'): string {
        $language=self::normalize($language);$protected=self::protect($text);$mapping=[];
        foreach(self::data()['phrases'] as $phrase)if($context==='UI'?$phrase['context']==='UI':$phrase['context']!=='UI')$mapping[$phrase['source']]=$phrase[$language];
        $result=strtr($protected['text'],$mapping);
        if($language==='es'){
            $words=self::data()['neutral_words'];
            $result=preg_replace_callback('/\p{L}+/u',function($m)use($words){
                $word=$m[0];$translated=$words[mb_strtolower($word,'UTF-8')]??null;
                if($translated===null)return $word;
                return mb_substr($word,0,1)===mb_strtoupper(mb_substr($word,0,1))?mb_strtoupper(mb_substr($translated,0,1)).mb_substr($translated,1):$translated;
            },$result);
        }
        return self::restore($result,$protected['values']);
    }
    public static function options(array $options,string $language): array {
        return array_map(fn($option)=>array_replace($option,['label'=>self::text($option['label'],$language,'UI')]),$options);
    }
    public static function lessonText(string $text,bool $workshop=false): string {
        $literals=[];
        $pattern='~```[\s\S]*?```|`[^`\n]+`|https?://[^\s<>]+|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\\\([\s\S]*?\\\\\)|\\\\\[[\s\S]*?\\\\\]|\{\{[^{}]+\}\}|\$\{[^{}]+\}|<[^>]+>~u';
        $masked=preg_replace_callback($pattern,function($m)use(&$literals){$token='[[LESSON_LITERAL_'.count($literals).']]';$literals[]=$m[0];return $token;},$text);
        $pairs=array_merge(self::data()['guidance_phrases']??[],self::data()['lesson_phrases']??[],$workshop?(self::data()['workshop_phrases']??[]):[]);
        foreach(array_values($pairs) as $translated)$pairs[$translated]=$translated;
        $translated=strtr($masked,$pairs);
        return preg_replace_callback('/\[\[LESSON_LITERAL_(\d+)\]\]/',fn($m)=>$literals[(int)$m[1]]??$m[0],$translated);
    }
    public static function response(array $output,array $state): array {
        $lang=$state['language']??'jopara';
        if(self::normalize($lang)==='jopara')$output['tutor_message_jopara']=self::lessonText($output['tutor_message_jopara'],isset($state['workshop']));
        $output['tutor_message_jopara']=self::text($output['tutor_message_jopara'],$lang);
        $output['quick_options']=self::options($output['quick_options']??[],$lang);
        return $output;
    }
    public static function instruction(string $language): string {
        $data=self::data();$profile=$data['profiles'][self::normalize($language)];
        return "REGISTRO OBLIGATORIO: {$profile['label']}. {$profile['instruction']}\n".
            'Conserva significado, dificultad e intención. Una pista sigue siendo una pista y la devolución orienta sin castigar. No resuelvas ejercicios pendientes. KEEP_SPANISH: '.implode(', ',array_column($data['glossary'],'source_term')).'. No inventes terminología guaraní. El campo tutor_message_jopara es un nombre de compatibilidad y no obliga a usar jopara.';
    }
    public static function acceptLocalized(string $candidate,array $protected): ?string {
        // Reject missing, duplicated, unknown or reordered math placeholders.
        preg_match_all('/\[\[MJ_PROTECTED_\d+\]\]/',$candidate,$found);
        preg_match_all('/\[\[MJ_PROTECTED_\d+\]\]/',$protected['text'],$expected);
        if($found[0]!==$expected[0])return null;
        $without=preg_replace('/\[\[MJ_PROTECTED_\d+\]\]/','',$candidate);
        if(preg_match('/MJ_PROTECTED|[\d=+*^<>$]|\\\\(?:frac|sqrt|sin|cos|tan)/u',$without))return null;
        foreach(self::data()['glossary'] as $term){
            $word=$term['source_term'];
            if(mb_stripos($protected['text'],$word)!==false && mb_stripos($candidate,$word)===false)return null;
        }
        return self::restore($candidate,$protected['values']);
    }
}
