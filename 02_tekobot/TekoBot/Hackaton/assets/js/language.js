// Shared register adapter. Phrase catalog and glossary originate in language_profiles.json.
class TutorLanguage {
    static data() {return window.TUTOR_LANGUAGE_DATA;}
    static normalize(language) {return ['jopara','es_py','es'].includes(language)?language:'jopara';}
    static protect(text) {
        const values=[];
        const pattern=/```[\s\S]*?```|`[^`\n]+`|https?:\/\/[^\s<>]+|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\{\{[^{}]+\}\}|\$\{[^{}]+\}|\{[\w.-]+\}|<[^>]+>|\\[a-zA-Z]+(?:\{[^{}]*\})+|[^\n.!?]*[=^√π≤≥+×÷\/][^\n.!?]*|\b(?:sen|sin|cos|tan|log|ln)\s*\([^)]*\)|[−-]?\d+(?:[.,]\d+)?(?:°|%)?/gu;
        const masked=text.replace(pattern,value=>{const token=`[[MJ_PROTECTED_${values.length}]]`;values.push(value);return token;});
        return {text:masked,values};
    }
    static restore(text,values) {return text.replace(/\[\[MJ_PROTECTED_(\d+)\]\]/g,(token,index)=>values[Number(index)]??token);}
    static text(text,language='jopara',context='GENERAL') {
        if(typeof text!=='string')return text;
        language=this.normalize(language);
        const protectedText=this.protect(text);
        // Whole phrases, longest first, in one pass: never cascade translations.
        const entries=this.data().phrases.filter(p=>context==='UI'?p.context==='UI':p.context!=='UI');
        const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const mapping=new Map(entries.map(p=>[p.source,p[language]]));
        let result=protectedText.text.replace(new RegExp(entries.map(p=>p.source).sort((a,b)=>b.length-a.length).map(escape).join('|'),'gu'),source=>mapping.get(source));
        if(language==='es'){
            const words=this.data().neutral_words;
            result=result.replace(/\p{L}+/gu,word=>{
                const translated=words[word.toLocaleLowerCase('es')];
                return !translated?word:word[0]===word[0].toLocaleUpperCase('es')?translated[0].toLocaleUpperCase('es')+translated.slice(1):translated;
            });
        }
        return this.restore(result,protectedText.values);
    }
    static options(options,language) {return options.map(option=>({...option,label:this.text(option.label,language,'UI')}));}
    static lessonText(text, workshop = false) {
        // Only authored catalog phrases may precede the conservative math mask.
        // Literal code, links, markup and explicit LaTeX remain opaque.
        const literals = [];
        const masked = text.replace(/```[\s\S]*?```|`[^`\n]+`|https?:\/\/[^\s<>]+|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\{\{[^{}]+\}\}|\$\{[^{}]+\}|<[^>]+>/gu, value => {
            literals.push(value);
            return `[[LESSON_LITERAL_${literals.length - 1}]]`;
        });
        const pairs = {...(this.data().guidance_phrases || {}), ...(this.data().lesson_phrases || {}), ...(workshop ? this.data().workshop_phrases || {} : {})};
        // Restored chats may already contain translations. Never translate twice.
        for (const translated of Object.values(pairs)) pairs[translated] = translated;
        const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = Object.keys(pairs).sort((a, b) => b.length - a.length).map(escape).join('|');
        const translated = pattern ? masked.replace(new RegExp(pattern, 'gu'), source => pairs[source]) : masked;
        return translated.replace(/\[\[LESSON_LITERAL_(\d+)\]\]/g, (token, index) => literals[Number(index)] ?? token);
    }
    static response(output,state) {
        // Local workshop prose is trusted. Translate its known phrases before the
        // broad math protector masks entire lines; numbers and operators stay intact.
        if(this.normalize(state.language)==='jopara'){
            output={...output,tutor_message_jopara:this.lessonText(output.tutor_message_jopara,Boolean(state.workshop))};
        }
        return {...output,tutor_message_jopara:this.text(output.tutor_message_jopara,state.language),quick_options:this.options(output.quick_options||[],state.language)};
    }
}
window.TutorLanguage=TutorLanguage;
