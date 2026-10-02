from pathlib import Path
p=Path('assets/js/app.js');s=p.read_text(encoding='utf8').replace('        tutorState = state;\n        offlineEngine.setTutorState(state);', '''        if(state.language!==currentLanguage) {
            state.language=currentLanguage;
            delete state.last_response;
        }
        tutorState = state;
        offlineEngine.setTutorState(state);''')
s=s.replace("            localStorage.setItem('kyhyjey_lang', currentLanguage);\n            offlineEngine.setLanguage(currentLanguage);", "            localStorage.setItem('kyhyjey_lang', currentLanguage);\n            saveLocalSessionsStore(getLocalSessionsStore().map(session=>session.session_uuid===sessionUuid?{...session,language:currentLanguage}:session));\n            offlineEngine.setLanguage(currentLanguage);")
p.write_text(s,encoding='utf8')
p=Path('api/chat.php');s=p.read_text(encoding='utf8').replace("$language = $data['language'] ?? 'jopara';","$language = TutorLanguage::normalize($data['language'] ?? 'jopara');")
s=s.replace("$next = Database::saveTutorState($sessionId, $studentId, $next, $tutorState['revision']);", "$next = Database::saveTutorState($sessionId, $studentId, $next, $tutorState['revision']);\n            $pdo->prepare('UPDATE learning_sessions SET language_used = ? WHERE id = ? AND student_id = ?')->execute([$language,$sessionId,$studentId]);")
p.write_text(s,encoding='utf8')
