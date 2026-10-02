// assets/js/app.js - Orquestador completo (Banana & Verde, Sin Emojis, Widgets a la Izquierda, Chat Amplio a la Derecha)

document.addEventListener('DOMContentLoaded', () => {

    // ── PREVENCIÓN DE ERRORES CORS EN ARCHIVOS LOCALES ─────────────
    // Evita que la consola se llene de errores CORS "origin 'null' has been blocked"
    // al abrir index.html directamente sin un servidor local.
    if (window.location.protocol === 'file:') {
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string' && url.startsWith('api/')) {
                return Promise.reject(new Error("Fetch a api/ bloqueado en file:// para prevenir CORS. Usando modo offline local."));
            }
            return originalFetch(url, options);
        };
    }

    // ── GESTIÓN DE SESIONES Y MULTI-CHAT (LOCALSTORAGE + BD) ───────
    function generateUUID() {
        return 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    }

    let studentId = parseInt(localStorage.getItem('kyhyjey_student') || '1');
    let currentLanguage = window.JopaMathI18n?.getLanguage() || localStorage.getItem('teko_math_lang') || 'es';
    let currentTopic = 'trigonometria';
    let sessionUuid = null;

    let isOnline = navigator.onLine && window.location.protocol !== 'file:';
    let messageHistory = [];
    let currentExercise = null;
    let dbSessionId = null;
    let tutorState = null;
    let submitting = false;
    let hasOpenedChat = false;

    function applyTutorState(state) {
        if (!state) return;
        const topicChanged = currentTopic !== state.topic || tutorState?.subtopic !== state.subtopic;
        if(state.language!==currentLanguage) {
            state.language=currentLanguage;
            delete state.last_response;
        }
        tutorState = state;
        offlineEngine.setTutorState(state);
        currentTopic = state.topic;
        localStorage.setItem('kyhyjey_topic', currentTopic);
        localStorage.setItem(`kyhyjey_state_${sessionUuid}`, JSON.stringify(state));
        if (offlineEngine.topic !== currentTopic) offlineEngine.setTopic(currentTopic);
        renderTopicChips();
        if(topicChanged) updateTopicVisualizer(currentTopic);
        renderLessonContext();
    }

    function restoreLocalTutorState() {
        tutorState = null;
        dbSessionId = null;
        try { applyTutorState(JSON.parse(localStorage.getItem(`kyhyjey_state_${sessionUuid}`))); } catch (e) {}
    }

    function getLocalSessionsStore() {
        try {
            return JSON.parse(localStorage.getItem('kyhyjey_sessions_store')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveLocalSessionsStore(sessions) {
        localStorage.setItem('kyhyjey_sessions_store', JSON.stringify(sessions));
    }

    function saveMessageToLocalSession(uuid, role, message, latex = null) {
        const key = `kyhyjey_history_${uuid}`;
        let history = [];
        try { history = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
        history.push({ role, message, formula_latex: latex, created_at: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(history));

        let store = getLocalSessionsStore();
        let sessionIndex = store.findIndex(s => s.session_uuid === uuid);
        const topicNames = {
            trigonometria: 'Trigonometría', numeros_reales: 'Números Reales', conjuntos: 'Conjuntos',
            funciones: 'Funciones', funciones_lineales: 'Func. Lineales', ecuaciones: 'Ecuaciones',
            geometria: 'Geometría', estadistica: 'Estadística'
        };

        if (sessionIndex >= 0) {
            store[sessionIndex].interactions = (store[sessionIndex].interactions || 0) + 1;
            if (role === 'user' && (!store[sessionIndex].preview || store[sessionIndex].preview === 'Nueva Conversación')) {
                store[sessionIndex].preview = message.substring(0, 35) + '...';
            }
        } else {
            store.unshift({
                session_uuid: uuid,
                topic: currentTopic,
                topic_label: topicNames[currentTopic] || 'Matemática',
                language: currentLanguage,
                interactions: 1,
                preview: message.substring(0, 35) + '...',
                date_formatted: new Date().toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            });
        }
        saveLocalSessionsStore(store);
    }

    // ── INSTANCIAR VISUALIZADORES ──────────────────────────────────
    const unitCircle = new UnitCircle('unit-circle-canvas', {
        initialAngle: 150, showCosX: true, showSinY: true, hideFinalValues: true,
        onAngleChange: (v) => updateFormulaCard(`\\theta = ${v.angleDeg}^\\circ`, `Cuadrante ${v.quadrant}`)
    });

    const trigGraph = new TopicTrigGraph('trig-graph-canvas', {
        funcType: 'sin', amplitude: 2, frequency: 1, highlightFeature: 'amplitude'
    });

    const mecVisualizer = new MECVisualizers('mec-visual-canvas');

    const offlineEngine = new OfflinePedagogyEngine();
    offlineEngine.setLanguage(currentLanguage);
    offlineEngine.setTopic(currentTopic);

    const chatUI = new ChatUI('chat-messages', {
        onQuickOptionClick: (opt, action) => handleUserSubmission(opt, action)
    });


    // ── MULTI-CHAT DRAWER & HISTORIAL COMPLETO ──────────────────────
    const btnToggleChats = document.getElementById('btn-toggle-chats');
    const chatsDrawer = document.getElementById('chats-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const chatsListContainer = document.getElementById('chats-list-container');

    if (btnToggleChats && chatsDrawer) {
        btnToggleChats.addEventListener('click', () => {
            const isVisible = chatsDrawer.style.display !== 'none';
            chatsDrawer.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) loadSessionsList();
        });
    }

    if (btnCloseDrawer && chatsDrawer) {
        btnCloseDrawer.addEventListener('click', () => {
            chatsDrawer.style.display = 'none';
        });
    }

    async function loadSessionsList() {
        if (!chatsListContainer) return;
        chatsListContainer.innerHTML = '<p style="text-align:center; padding:1rem;">Cargando conversaciones...</p>';

        let sessions = [];

        try {
            const res = await fetch(`api/sessions.php?student_id=${studentId}`);
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.sessions && json.sessions.length > 0) {
                    sessions = json.sessions;
                }
            }
        } catch (e) {}

        if (sessions.length === 0) {
            sessions = getLocalSessionsStore();
        }

        const byUuid=new Map(sessions.map(s=>[s.session_uuid,s]));
        getLocalSessionsStore().forEach(s=>{if(!byUuid.has(s.session_uuid)) byUuid.set(s.session_uuid,s);});
        renderSessionsList([...byUuid.values()]);
    }

    function renderSessionsList(sessions) {
        if (!chatsListContainer) return;
        chatsListContainer.innerHTML = '';

        if (!sessions || sessions.length === 0) {
            chatsListContainer.innerHTML = `
                <div style="text-align:center; padding:1.5rem; color:var(--text-muted);">
                    <p style="font-weight:600; margin-bottom:0.5rem;">Sin conversaciones guardadas</p>
                    <p style="font-size:0.8rem;">Hacé clic en cualquier tema arriba para iniciar un nuevo chat.</p>
                </div>`;
            return;
        }

        sessions.forEach(s => {
            const isActive = s.session_uuid === sessionUuid;
            const card = document.createElement('div');
            card.className = `chat-item-card ${isActive ? 'active' : ''}`;
            card.innerHTML = `
                <div class="chat-item-info">
                    <div class="chat-item-title">${s.topic_label || 'Matemática'} (${(s.language || 'jopara').toUpperCase()})</div>
                    <div class="chat-item-preview">${s.preview || 'Conversación activa'}</div>
                    <div class="chat-item-meta">
                        <span>Fecha: ${s.date_formatted || 'Reciente'}</span>
                        <span>${s.interactions || 1} mensajes</span>
                    </div>
                </div>
                <button class="chat-item-delete" title="Eliminar conversación">&times;</button>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('chat-item-delete')) return;
                switchChatSession(s.session_uuid, s.topic, s.language);
            });

            const delBtn = card.querySelector('.chat-item-delete');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteChatSession(s.session_uuid, s.id, card);
                });
            }

            chatsListContainer.appendChild(card);
        });
    }

    async function switchChatSession(uuid, topic, lang) {
        if (submitting) return;
        openLearningView();
        sessionUuid = uuid;
        localStorage.setItem('kyhyjey_session', uuid);
        if (topic) {
            currentTopic = topic;
            localStorage.setItem('kyhyjey_topic', topic);
            offlineEngine.setTopic(topic);
            renderTopicChips();
            updateTopicVisualizer(topic);
        }
        // Opening an old conversation must respect the current site language.
        offlineEngine.setLanguage(currentLanguage);

        if (chatsDrawer) chatsDrawer.style.display = 'none';
        
        const msgContainer = document.getElementById('chat-messages');
        if (msgContainer) msgContainer.innerHTML = '';
        messageHistory = [];

        restoreLocalTutorState();
        currentExercise = offlineEngine.getCurrentExercise();
        if (!(await restoreHistory())) showWelcomeMessage();
    }

    async function createNewTopicChatSession(topic, subtopic, purpose='') {
        if (submitting) return;
        openLearningView();
        const newUuid = generateUUID();
        sessionUuid = newUuid;
        tutorState = LessonEngine.initial(topic, subtopic);
        if(purpose==='problem_workshop')tutorState.workshop={stage:'topic'};
        tutorState.language=currentLanguage;
        offlineEngine.setTutorState(tutorState);
        dbSessionId = null;
        localStorage.setItem('kyhyjey_session', newUuid);
        localStorage.setItem(`kyhyjey_state_${newUuid}`, JSON.stringify(tutorState));
        currentTopic = topic;
        localStorage.setItem('kyhyjey_topic', topic);
        offlineEngine.setTopic(topic);
        currentExercise = offlineEngine.getCurrentExercise();

        if (chatsDrawer) chatsDrawer.style.display = 'none';

        const msgContainer = document.getElementById('chat-messages');
        if (msgContainer) msgContainer.innerHTML = '';
        messageHistory = [];

        const topicNames = {
            trigonometria: 'Trigonometría', numeros_reales: 'Números Reales', conjuntos: 'Conjuntos',
            funciones: 'Funciones', funciones_lineales: 'Func. Lineales', ecuaciones: 'Ecuaciones',
            geometria: 'Geometría', estadistica: 'Estadística'
        };

        let store = getLocalSessionsStore();
        store.unshift({
            session_uuid: newUuid,
            topic: topic,
            topic_label: purpose==='problem_workshop'?'Resolver un problema':LessonEngine.unit(topic)?.title || topicNames[topic] || 'Matemática',
            subtopic,
            language: currentLanguage,
            interactions: 0,
            preview: 'Nueva Conversación',
            date_formatted: new Date().toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        });
        saveLocalSessionsStore(store);

        submitting = true;
        try {
            const response = await fetch('api/sessions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', session_uuid: newUuid, student_id: studentId, topic: topic, subtopic, language: currentLanguage, purpose })
            });
            const result = await response.json();
            if (sessionUuid !== newUuid) return;
            if (!result.success) throw new Error(result.error);
            if (result.success) {
                dbSessionId = result.session.id;
                applyTutorState(result.session.tutor_state);
            }
        } catch (e) {
            localStorage.setItem(`kyhyjey_local_${newUuid}`, '1');
        } finally { submitting = false; }
        if (sessionUuid !== newUuid) return;

        renderTopicChips();
        updateTopicVisualizer(topic);
        showWelcomeMessage();
        document.getElementById('btn-close-sidebar')?.click();
    }

    document.getElementById('btn-problem-workshop')?.addEventListener('click',async()=>{
        await createNewTopicChatSession('funciones','concepto','problem_workshop');
        document.getElementById('learning-chat')?.scrollIntoView({block:'start'});
        document.getElementById('chat-input')?.focus();
    });

    async function deleteChatSession(uuid, dbId, cardElement) {
        if (!confirm('¿Seguro que querés eliminar esta conversación?')) return;
        cardElement.remove();

        let store = getLocalSessionsStore().filter(s => s.session_uuid !== uuid);
        saveLocalSessionsStore(store);
        localStorage.removeItem(`kyhyjey_history_${uuid}`);

        if (dbId) {
            try {
                fetch('api/sessions.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', session_id: dbId, student_id: studentId })
                });
            } catch (e) {}
        }
    }

    // ── SELECTOR DE TEMAS MEC (SIN EMOJIS, ELEGANTES NOMBRES TÉCNICOS) ─────
    const TOPIC_META = {
        trigonometria:      { label: 'Funciones trigonométricas' },
        combinatoria: {label:'Análisis combinatorio'},
        numeros_reales:     { label: 'Números Reales' },
        conjuntos:          { label: 'Conjuntos' },
        funciones:          { label: 'Funciones' },
        funciones_lineales: { label: 'Func. Lineales' },
        ecuaciones:         { label: 'Ecuaciones' },
        geometria:          { label: 'Línea recta' },
        estadistica:        { label: 'Estadística' }
    };

    function renderTopicChips() {
        const bar = document.getElementById('topic-chips-bar');
        if (!bar) return;
        bar.classList.add('curriculum-selector');
        bar.replaceChildren();
        const heading=document.createElement('div');
        heading.className='curriculum-heading';heading.textContent='Nuevo chat · Elegí qué estudiar';bar.appendChild(heading);
        window.TUTOR_CURRICULUM.units.filter(unit=>hasOpenedChat || unit.key==='trigonometria').forEach(unit=>{
            const group=document.createElement('details');group.className='curriculum-unit';
            group.open=unit.key===currentTopic;
            const summary=document.createElement('summary');summary.textContent=`Unidad ${unit.id} · ${unit.title}`;group.appendChild(summary);
            unit.subtopics.forEach(topic=>{
                const button=document.createElement('button');button.type='button';
                button.className='curriculum-subtopic'+(tutorState?.topic===unit.key && tutorState?.subtopic===topic.id?' selected':'');
                button.textContent=topic.title;
                button.title=topic.page ? `Libro MEC 2016 · página ${topic.page}` : 'Ampliación didáctica';
                button.addEventListener('click',()=>createNewTopicChatSession(unit.key,topic.id));group.appendChild(button);
            });
            bar.appendChild(group);
        });
    }

    function renderLessonContext() {
        let context=document.getElementById('lesson-context');
        if(!context) {
            context=document.createElement('div');context.id='lesson-context';context.className='lesson-context';
            document.querySelector('.chat-header')?.after(context);
        }
        const lesson=tutorState && LessonEngine.lesson(tutorState);
        const problemToggle=document.getElementById('own-problem');
        if(problemToggle){problemToggle.closest('label').hidden=Boolean(tutorState?.workshop);if(tutorState?.workshop)problemToggle.checked=false;}
        if(tutorState?.workshop){context.textContent='Resolver un problema · Guía paso a paso y comprobación de tu resultado';return;}
        const labels={TOPIC_SELECTED:'Preparación',TEACHING_MODE:'Explicación',EXAMPLE_MODE:'Ejemplo resuelto',QUESTION_MODE:'Tu pregunta',CHECK_UNDERSTANDING:'Comprobación',READY_CHECK:'Antes de practicar',PRACTICE_MODE:'Práctica guiada',REVIEW_MODE:'Repaso',COMPLETED:'Lección guardada'};
        context.textContent=lesson ? `Unidad ${tutorState.unit_id} · ${lesson.title} · ${labels[tutorState.mode]||'Aprendizaje'}${localStorage.getItem(`kyhyjey_local_${sessionUuid}`)?' · Guardado en este dispositivo':''}` : 'Elegí una unidad y un subtema para comenzar.';
        if(lesson) {
            const source=document.createElement(lesson.source?'a':'span');source.className='lesson-source';
            source.textContent=lesson.source?`Aranduka · MEC 2016, página ${lesson.source.printed_page}`:lesson.source_note;
            if(lesson.source){source.href=lesson.source.url;source.target='_blank';source.rel='noopener';}
            context.append(source);
        }
    }

    function updateTopicVisualizer(topic) {
        const circleView = document.getElementById('circle-view');
        const graphView  = document.getElementById('graph-view');
        const mecView    = document.getElementById('mec-view');
        const tabCircle  = document.getElementById('tab-circle');
        const tabGraph   = document.getElementById('tab-graph');

        let workshopNote=document.getElementById('workshop-visual-note');
        if(!workshopNote){workshopNote=document.createElement('p');workshopNote.id='workshop-visual-note';workshopNote.textContent='En este chat trabajamos el procedimiento paso a paso. La comprobación se realiza cuando enviás tu resultado.';document.querySelector('[data-widget-id="visual"] .widget-body')?.append(workshopNote);}
        workshopNote.hidden=!tutorState?.workshop;
        if(tutorState?.workshop){
            for(const element of [circleView,graphView,mecView,tabCircle,tabGraph])if(element)element.style.display='none';
            updateFormulaCard('','Resolver un problema · resultado reservado para vos');
            return;
        }

        if (topic === 'trigonometria') {
            if (circleView) circleView.style.display = 'block';
            if (graphView)  graphView.style.display  = 'none';
            if (mecView)    mecView.style.display    = 'none';
            if (tabCircle)  tabCircle.style.display  = 'inline-block';
            if (tabGraph)   tabGraph.style.display   = 'inline-block';
            unitCircle.draw();
        } else {
            if (circleView) circleView.style.display = 'none';
            if (graphView)  graphView.style.display  = 'none';
            if (mecView)    mecView.style.display    = 'block';
            if (tabCircle)  tabCircle.style.display  = 'none';
            if (tabGraph)   tabGraph.style.display   = 'none';
            
            mecVisualizer.renderTopicVisual(topic);
            if (['funciones','funciones_lineales'].includes(topic)) {
                const subtopic=tutorState?.subtopic;
                const kind=['lineal','constante','exponencial','logaritmica','modulo','parte_entera'].includes(subtopic)
                    ? subtopic : topic==='funciones_lineales'?'lineal':subtopic==='tipos'?'cuadratica':'logaritmica';
                mecVisualizer.setFunction(kind);
            }
        }
    }

    renderTopicChips();

    // ── CAMBIO DE IDIOMA ───────────────────────────────────────────
    const langSelect = document.getElementById('language-mode');
    window.addEventListener('jopamath:languagechange', event => {
        changeTutorLanguage(event.detail.language);
    });
    function changeTutorLanguage(language) {
            if (currentLanguage === language) return;
            currentLanguage = language;
            if (langSelect) langSelect.value = language;
            localStorage.setItem('kyhyjey_lang', currentLanguage);
            saveLocalSessionsStore(getLocalSessionsStore().map(session => session.session_uuid === sessionUuid ? {...session, language} : session));
            offlineEngine.setLanguage(language);
            if (tutorState) {
                tutorState.language = language;
                delete tutorState.last_response;
                localStorage.setItem(`kyhyjey_state_${sessionUuid}`, JSON.stringify(tutorState));
                chatUI.renderQuickOptions(LessonEngine.response(tutorState).quick_options);
            }
    }
    if (langSelect) {
        langSelect.value = currentLanguage;
        langSelect.addEventListener('change', (e) => {
            if (window.JopaMathI18n) {
                window.JopaMathI18n.setLanguage(e.target.value === 'jopara' ? 'jopara' : 'es');
                return;
            }
            currentLanguage = e.target.value;
            localStorage.setItem('kyhyjey_lang', currentLanguage);
            saveLocalSessionsStore(getLocalSessionsStore().map(session=>session.session_uuid===sessionUuid?{...session,language:currentLanguage}:session));
            offlineEngine.setLanguage(currentLanguage);
            if(tutorState) {
                tutorState.language=currentLanguage;
                delete tutorState.last_response;
                localStorage.setItem(`kyhyjey_state_${sessionUuid}`,JSON.stringify(tutorState));
                const localized=LessonEngine.response(tutorState);
                chatUI.renderQuickOptions(localized.quick_options);
            }
            const confirmMsgs = {
                jopara:  "Jasegi en jopara. ¿Jahechápa " + TOPIC_META[currentTopic]?.label + "?",
                es_py:   "Dale, seguimos en español paraguayo. ¿Vemos " + TOPIC_META[currentTopic]?.label + "?",
                es:      "Continuaremos en español neutro. ¿Seguimos con " + TOPIC_META[currentTopic]?.label + "?"
            };
            chatUI.appendMessage('tutor', confirmMsgs[currentLanguage] || confirmMsgs.jopara);
        });
    }

    // ── RESTAURAR HISTORIAL DE CHAT ───────────────────────────────
    async function restoreHistory() {
        const requestedUuid = sessionUuid;
        let history = [];

        try {
            if(localStorage.getItem(`kyhyjey_local_${sessionUuid}`)) throw new Error('Local session');
            const res = await fetch(`api/history.php?session_uuid=${sessionUuid}&student_id=${studentId}&limit=50`);
            if (res.ok) {
                const json = await res.json();
                if (sessionUuid !== requestedUuid) return true;
                if (json.success) {
                    dbSessionId = json.session_id;
                    applyTutorState(json.tutor_state);
                }
                if (json.success && json.history?.length) {
                    history = json.history;
                }
            }
        } catch (e) {}

        if (sessionUuid !== requestedUuid) return true;
        if (!history || history.length === 0) {
            try {
                history = JSON.parse(localStorage.getItem(`kyhyjey_history_${sessionUuid}`)) || [];
            } catch (e) {}
        }

        if (!history || history.length === 0) return false;

        chatUI.appendMessage('tutor', '---', null, `Conversación sobre ${TOPIC_META[currentTopic]?.label || currentTopic}`);
        history.forEach(msg => {
            chatUI.appendMessage(msg.role === 'user' ? 'user' : 'tutor', msg.message, msg.formula_latex);
        });
        messageHistory = history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.message }));
        if(tutorState && LessonEngine.lesson(tutorState)) {
            const restored=tutorState.last_response || LessonEngine.response(tutorState);
            chatUI.renderQuickOptions(restored.quick_options);
            syncVisualWidget(restored.visual_action);
            updateFormulaCard(restored.formula_display.latex,restored.formula_display.note);
        }
        renderLessonContext();
        return true;
    }

    function showWelcomeMessage() {
        if(tutorState && LessonEngine.lesson(tutorState)) {
            const welcome=tutorState.last_response || LessonEngine.response(tutorState);
            tutorState.last_response=welcome;
            applyTutorState(tutorState);
            chatUI.appendMessage('tutor',welcome.tutor_message_jopara);
            chatUI.renderQuickOptions(welcome.quick_options);
            saveMessageToLocalSession(sessionUuid,'assistant',welcome.tutor_message_jopara);
        } else {
            chatUI.appendMessage('tutor',TutorLanguage.text('Hola. Soy TekoBot, tu tutor de matemática. Elegí una unidad y un subtema para comenzar. Voy a explicarte la idea, mostrar un ejemplo y acompañarte cuando quieras practicar.',currentLanguage));
            renderLessonContext();
        }
    }

    // ── SUBIDA DE FOTO OCR ─────────────────────────────────────────
    const cameraUpload = document.getElementById('camera-upload');
    if (cameraUpload) {
        cameraUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            chatUI.appendMessage('user', `Foto: ${file.name}`);
            chatUI.showTypingIndicator();
            const fd = new FormData();
            fd.append('exercise_image', file);
            try {
                const res  = await fetch('api/upload_image.php', { method: 'POST', body: fd });
                const json = await res.json();
                submitting = false;
        chatUI.hideTypingIndicator();
                if (json.success) {
                    chatUI.appendMessage('tutor', json.confirmation_message_jopara, json.formula_latex, "Ejercicio detectado");
                    chatUI.renderQuickOptions(["¡Sí, está correcto! Empecemos", "No, déjame corregirlo"]);
                }
            } catch (err) {
                submitting = false;
        chatUI.hideTypingIndicator();
                chatUI.appendMessage('tutor', "Ahecha peteĩ ejercicio en tu foto:\n\n\"Determinar el ejercicio\"\n\n¿Está correcto? ¿Jajapo juntos?", null, "Confirmá para comenzar");
                chatUI.renderQuickOptions(["¡Sí, está correcto!", "No, probar otra foto"]);
            }
        });
    }

    // ── ENVÍO DE MENSAJES ──────────────────────────────────────────
    async function handleUserSubmission(userMsg, action = '') {
        if (!userMsg?.trim() || submitting) return;
        if (!tutorState && messageHistory.length === 0) { renderLessonContext(); return; }
        const msg = userMsg.trim();
        if(!action && document.getElementById('own-problem')?.checked) action='own_problem';
        if(action==='resume'||action==='own_problem') document.getElementById('own-problem').checked=false;
        if(tutorState) tutorState.language=currentLanguage;
        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.value = '';

        chatUI.appendMessage('user', msg);
        messageHistory.push({ role: 'user', content: msg });
        saveMessageToLocalSession(sessionUuid, 'user', msg);

        if (/video|youtube|eheka.*video/i.test(msg)) {
            chatUI.appendMessage('tutor','La búsqueda de videos todavía no está conectada. Podemos continuar con la explicación o el ejemplo de este subtema.');
            if(tutorState && LessonEngine.lesson(tutorState)) chatUI.renderQuickOptions(LessonEngine.options(tutorState));
            return;
        }

        submitting = true;
        chatUI.showTypingIndicator();
        let tutorResult = null;

        if (isOnline && !localStorage.getItem(`kyhyjey_local_${sessionUuid}`)) {
            try {
                const res = await fetch('api/chat.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: msg,
                        action,
                        revision: tutorState?.revision,
                        student_id: studentId,
                        session_uuid: sessionUuid,
                        language: currentLanguage,
                        context: {
                            current_topic: currentTopic,
                            current_exercise: currentExercise || offlineEngine.getCurrentExercise(),
                            hint_level: offlineEngine.currentHintLevel,
                            history: messageHistory.slice(-12)
                        }
                    })
                });
                if (res.status === 409) {
                    const data=await res.json();applyTutorState(data.tutor_state);
                    chatUI.appendMessage('tutor',data.error);
                    chatUI.renderQuickOptions(LessonEngine.options(tutorState));
                    submitting=false;chatUI.hideTypingIndicator();return;
                }
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.response) {
                        tutorResult = data.response;
                        applyTutorState(data.tutor_state);
                        if (data.session_id) dbSessionId = data.session_id;

                    }
                }
            } catch (e) {}
        }

        if (!tutorResult) {
            if(tutorState && LessonEngine.lesson(tutorState)) {
                localStorage.setItem(`kyhyjey_local_${sessionUuid}`,'1');
                const local=offlineEngine.processLesson(msg,action);
                tutorResult=local.response;applyTutorState(local.tutor_state);
            } else tutorResult = offlineEngine.processMessage(msg);
        }

        submitting = false;
        chatUI.hideTypingIndicator();

        if (tutorResult) {
            const joparaMsg = tutorResult.tutor_message_jopara || '';
            const latex     = tutorResult.formula_display?.latex || null;
            const note      = tutorResult.formula_display?.note  || null;
            const errType   = tutorResult.pedagogical_state?.detected_error_type || null;

            chatUI.appendMessage('tutor', joparaMsg, latex, note, errType);
            messageHistory.push({ role: 'assistant', content: joparaMsg });
            saveMessageToLocalSession(sessionUuid, 'assistant', joparaMsg, latex);

            if (tutorResult.quick_options) chatUI.renderQuickOptions(tutorResult.quick_options);
            if (tutorResult.visual_action) syncVisualWidget(tutorResult.visual_action);
            updateFormulaCard(latex || '', note);

        }
    }

    // ── SINCRONIZACIÓN VISUAL ──────────────────────────────────────
    function syncVisualWidget(action) {
        if (!action) return;
        // No new visual means preserve the student's current graph and controls.
        if(action.type === 'none') return;
        if(['function_graph','unit_circle'].includes(action.type)) {
            document.getElementById('mec-view').style.display='none';
            document.getElementById('tab-circle').style.display='inline-block';
            document.getElementById('tab-graph').style.display='inline-block';
        }
        if (action.type === 'function_graph') {
            document.getElementById('tab-graph')?.click();
            trigGraph.setParameters({ funcType: action.funcType || 'sin', angle: action.angle_deg ?? 30, triangleMode: action.triangle_mode || 'similar', amplitude: action.amplitude ?? 1, frequency: action.frequency ?? 1, phaseShift: action.phaseShift ?? 0, verticalShift: action.verticalShift ?? 0, highlightFeature: action.highlight_feature || 'none' });
        } else if (action.type === 'unit_circle') {
            document.getElementById('tab-circle')?.click();
            unitCircle.setVisualState(action);
        }
    }

    function updateFormulaCard(latex, note) {
        const fc = document.getElementById('active-formula');
        const nc = document.getElementById('active-formula-note');
        if(fc && !window.katex) fc.textContent=latex;
        if (fc && window.katex) {
            try { katex.render(latex, fc, { displayMode: true, throwOnError: false }); }
            catch (e) { fc.textContent = latex; }
        }
        if (nc && note) nc.textContent = note;
    }

    // ── EVENT LISTENERS ────────────────────────────────────────────
    document.getElementById('send-btn')?.addEventListener('click', () =>
        handleUserSubmission(document.getElementById('chat-input')?.value));

    document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserSubmission(e.target.value); }
    });

    document.getElementById('btn-hint')?.addEventListener('click', () => handleUserSubmission('Dame una pista'));
    document.getElementById('btn-show-graph')?.addEventListener('click', () => {
        if(tutorState?.last_response?.visual_action?.type !== 'none') syncVisualWidget(tutorState?.last_response?.visual_action);
        else handleUserSubmission('¿Cómo puedo representar visualmente este concepto?');
        if(window.matchMedia('(max-width:960px)').matches)document.getElementById('learning-visuals')?.scrollIntoView({block:'start'});
    });
    document.getElementById('btn-retry')?.addEventListener('click', () =>
        handleUserSubmission('Probar de nuevo'));

    // Tabs visuales
    document.getElementById('tab-circle')?.addEventListener('click', () => {
        document.getElementById('tab-circle').classList.add('active');
        document.getElementById('tab-graph').classList.remove('active');
        document.getElementById('circle-view').style.display = 'block';
        document.getElementById('graph-view').style.display = 'none';
        unitCircle.draw();
    });
    document.getElementById('tab-graph')?.addEventListener('click', () => {
        document.getElementById('tab-graph').classList.add('active');
        document.getElementById('tab-circle').classList.remove('active');
        document.getElementById('circle-view').style.display = 'none';
        document.getElementById('graph-view').style.display = 'block';
        trigGraph.draw();
    });

    // Estado Conexión
    const statusEl = document.getElementById('connection-status');
    function updateStatus() {
        isOnline = navigator.onLine && window.location.protocol !== 'file:';
        if (statusEl) {
            statusEl.textContent = isOnline ? 'Con conexión' : 'Modo local';
            statusEl.className = 'status-badge ' + (isOnline ? 'online' : 'offline');
        }
    }
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();

    // ── INICIALIZACIÓN ─────────────────────────────────────────────
    function openLearningView() {
        hasOpenedChat = true;
        renderTopicChips();
        document.body.classList.remove('show-welcome');
        requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }

    function showLanding() {
        if (submitting) return;
        sessionUuid = null;
        tutorState = null;
        dbSessionId = null;
        messageHistory = [];
        document.body.classList.add('show-welcome');
        if (chatsDrawer) chatsDrawer.style.display = 'none';
        document.getElementById('btn-close-sidebar')?.click();
        renderTopicChips();
    }

    const welcomeTopics = document.getElementById('welcome-topics');
    const unit = window.TUTOR_CURRICULUM.units.find(unit => unit.key === 'trigonometria');
    unit?.subtopics.forEach((topic, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'welcome-topic';
        const number = document.createElement('span');
        number.className = 'welcome-topic-number';
        number.textContent = String(index + 1).padStart(2, '0');
        const title = document.createElement('span');
        title.textContent = topic.title;
        button.append(number, title);
        button.addEventListener('click', () => createNewTopicChatSession(unit.key, topic.id));
        welcomeTopics?.append(button);
    });
    document.getElementById('btn-welcome')?.addEventListener('click', showLanding);
    showLanding();
});document.addEventListener('DOMContentLoaded', () => {
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');
    const sidebar = document.getElementById('app-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    function openSidebar() {
        if(sidebar) sidebar.classList.add('active');
        if(sidebarOverlay) sidebarOverlay.classList.add('active');
    }
    
    function closeSidebar() {
        if(sidebar) sidebar.classList.remove('active');
        if(sidebarOverlay) sidebarOverlay.classList.remove('active');
    }
    
    if(btnToggleSidebar) btnToggleSidebar.addEventListener('click', openSidebar);
    if(btnCloseSidebar) btnCloseSidebar.addEventListener('click', closeSidebar);
    if(sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
});
