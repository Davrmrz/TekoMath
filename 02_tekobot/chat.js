/* ============================================
   TEKO Math — AI Agent Chat Script (chat.js)
   Frontend interactive mockup & API integration hooks
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const chatMessages    = document.getElementById('chat-messages');
  const chatForm        = document.getElementById('chat-form');
  const chatInput       = document.getElementById('chat-input');
  const typingIndicator = document.getElementById('typing-indicator');
  const suggestionPills = document.querySelectorAll('.suggestion-pill');
  const topicChips      = document.querySelectorAll('.topic-chip');
  const formulaBtns     = document.querySelectorAll('.formula-btn');
  const clearChatBtn    = document.getElementById('clear-chat-btn');

  // User Dropdown Topnav
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('topnav__user-dropdown--open');
    });

    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && e.target !== userMenuBtn) {
        userDropdown.classList.remove('topnav__user-dropdown--open');
      }
    });
  }

  // Auto-scroll to bottom
  function scrollToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Helper to format time
  function getNowTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Append user message to chat UI
  function appendUserMessage(text) {
    const time = getNowTime();
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg chat-msg--user';
    msgEl.innerHTML = `
      <div class="chat-msg__avatar">T</div>
      <div class="chat-msg__body">
        <div class="chat-msg__meta">
          <span>Tú</span> · <span>${time}</span>
        </div>
        <div class="chat-msg__bubble">
          ${escapeHtml(text)}
        </div>
      </div>
    `;
    chatMessages.appendChild(msgEl);
    scrollToBottom();
  }

  // Append bot message to chat UI
  function appendBotMessage(htmlContent) {
    const time = getNowTime();
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg chat-msg--bot';
    msgEl.innerHTML = `
      <div class="chat-msg__avatar">🤖</div>
      <div class="chat-msg__body">
        <div class="chat-msg__meta">
          <span>Tutor IA Teko</span> · <span>${time}</span>
        </div>
        <div class="chat-msg__bubble">
          ${htmlContent}
        </div>
      </div>
    `;
    chatMessages.appendChild(msgEl);
    scrollToBottom();
  }

  function showTyping(show = true) {
    if (typingIndicator) {
      typingIndicator.style.display = show ? 'inline-flex' : 'none';
      if (show) scrollToBottom();
    }
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /* =========================================================================
     INTEGRATION POINT FOR AI BACKEND / AGENT API
     
     Aquí conectarás tu endpoint real de IA (ej: Python FastAPI, Node, o PHP endpoint)
     ========================================================================= */
  async function callAIAgent(userMessage) {
    showTyping(true);

    /* 
    EJEMPLO DE CÓDIGO PARA TU INTEGRACIÓN REAL:
    -------------------------------------------
    try {
      const response = await fetch('api/agent_chat.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await response.json();
      showTyping(false);
      appendBotMessage(data.reply);
      return;
    } catch (err) {
      showTyping(false);
      appendBotMessage("⚠️ Ocurrió un error al conectar con el Agente IA.");
      return;
    }
    */

    // --- RESPUESTA SIMULADA / MOCKUP ---
    setTimeout(() => {
      showTyping(false);

      let replyHtml = '';
      const lower = userMessage.toLowerCase();

      if (lower.includes('pitagoras') || lower.includes('pitágoras')) {
        replyHtml = `
          ¡Excelente pregunta geométrica! El <strong>Teorema de Pitágoras</strong> establece la relación entre los lados de un triángulo rectángulo:
          <div class="math-callout">
            a² + b² = c²
          </div>
          <div class="math-step"><strong>a</strong> y <strong>b</strong>: catetos (lados perpendiculares).</div>
          <div class="math-step"><strong>c</strong>: hipotenusa (lado opuesto al ángulo recto de 90°).</div>
          <p><strong>Ejemplo práctico:</strong> Si los catetos miden 3 y 4, la hipotenusa será: √(3² + 4²) = √(9 + 16) = √25 = <strong>5</strong>.</p>
          <div class="chat-msg__actions">
            <button class="msg-action-pill" onclick="sendPrompt('¿Cómo se calcula un cateto desconocido?')">❓ Calcular un cateto</button>
            <button class="msg-action-pill" onclick="sendPrompt('Dame 3 ejercicios de Pitágoras')">🎯 Generar ejercicios</button>
          </div>
        `;
      } else if (lower.includes('2x') || lower.includes('cuadratica') || lower.includes('ecuacion') || lower.includes('ecuación')) {
        replyHtml = `
          Para resolver la ecuación cuadrática <strong>2x² + 3x − 5 = 0</strong> aplicamos la fórmula general:
          <div class="math-callout">
            x = (−b ± √(b² − 4ac)) / (2a)
          </div>
          <div class="math-step"><strong>1. Identificamos valores:</strong> a = 2, b = 3, c = −5</div>
          <div class="math-step"><strong>2. Discriminante:</strong> Δ = 3² − 4(2)(−5) = 9 + 40 = <strong>49</strong> (Mayor a 0, 2 soluciones reales)</div>
          <div class="math-step"><strong>3. Raíz:</strong> √49 = 7</div>
          <div class="math-step"><strong>4. Soluciones:</strong>
            <br>• x₁ = (−3 + 7) / 4 = 4 / 4 = <strong>1</strong>
            <br>• x₂ = (−3 − 7) / 4 = −10 / 4 = <strong>−2.5</strong>
          </div>
          <div class="chat-msg__actions">
            <button class="msg-action-pill" onclick="sendPrompt('¿Cómo se grafica esta parábola?')">📊 Ver gráfica</button>
            <button class="msg-action-pill" onclick="sendPrompt('¿Cómo se factoriza 2x² + 3x - 5?')">✂️ Factorización</button>
          </div>
        `;
      } else if (lower.includes('derivada') || lower.includes('calculo') || lower.includes('cálculo')) {
        replyHtml = `
          ¡Perfecto para cálculo diferencial! Aplicando la <strong>regla de la potencia</strong>:
          <div class="math-callout">
            d/dx [xⁿ] = n · xⁿ⁻¹
          </div>
          <p>Para la función <strong>f(x) = x³ − 4x</strong>:</p>
          <div class="math-step">• Derivada de x³ = 3x²</div>
          <div class="math-step">• Derivada de −4x = −4</div>
          <div class="math-step"><strong>Resultado:</strong> f'(x) = <strong>3x² − 4</strong></div>
          <div class="chat-msg__actions">
            <button class="msg-action-pill" onclick="sendPrompt('Encontrar los puntos críticos donde f\'(x) = 0')">📍 Puntos críticos</button>
          </div>
        `;
      } else {
        replyHtml = `
          ¡He recibido tu consulta sobre: <em>"${escapeHtml(userMessage)}"</em>!
          <div class="math-callout">
            📌 Tutor IA Teko listo para analizar paso a paso
          </div>
          <p>Estoy listo para ayudarte a desglosar este concepto, formular ecuaciones o generar problemas de práctica interactiva.</p>
          <div class="chat-msg__actions">
            <button class="msg-action-pill" onclick="sendPrompt('Explicar con un ejemplo visual')">📐 Ejemplo visual</button>
            <button class="msg-action-pill" onclick="sendPrompt('Resolver paso a paso con fórmulas')">📝 Paso a paso</button>
          </div>
        `;
      }

      appendBotMessage(replyHtml);
    }, 900);
  }

  // Handle Form Submit
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      appendUserMessage(text);
      chatInput.value = '';
      chatInput.focus();

      callAIAgent(text);
    });
  }

  // Global helper for action pills inside messages
  window.sendPrompt = function(promptText) {
    if (chatInput) {
      chatInput.value = promptText;
      chatForm.dispatchEvent(new Event('submit'));
    }
  };

  // Suggestion Pills
  suggestionPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const prompt = pill.dataset.prompt || pill.textContent.trim();
      if (chatInput) {
        chatInput.value = prompt;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  });

  // Topic Chips selection
  topicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      topicChips.forEach(c => c.classList.remove('topic-chip--active'));
      chip.classList.add('topic-chip--active');
      const topic = chip.dataset.topic;
      appendBotMessage(`📚 Cambiaste al módulo de <strong>${chip.textContent.trim()}</strong>. ¿En qué ejercicio o concepto te gustaría profundizar hoy?`);
    });
  });

  // Formula Symbol Buttons (insert into input)
  formulaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const symbol = btn.dataset.insert || btn.textContent.trim();
      if (chatInput) {
        const start = chatInput.selectionStart;
        const end = chatInput.selectionEnd;
        const value = chatInput.value;
        chatInput.value = value.substring(0, start) + symbol + value.substring(end);
        chatInput.focus();
        chatInput.selectionStart = chatInput.selectionEnd = start + symbol.length;
      }
    });
  });

  // Clear Chat Button
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      if (confirm('¿Deseas reiniciar la conversación con el Tutor IA?')) {
        chatMessages.innerHTML = `
          <div class="chat-msg chat-msg--bot">
            <div class="chat-msg__avatar">🤖</div>
            <div class="chat-msg__body">
              <div class="chat-msg__meta">
                <span>Tutor IA Teko</span> · <span>${getNowTime()}</span>
              </div>
              <div class="chat-msg__bubble">
                ¡Hola de nuevo! Conversación reiniciada. ¿Qué tema matemático revisamos hoy?
              </div>
            </div>
          </div>
        `;
      }
    });
  }

  // Initial scroll
  scrollToBottom();
});
