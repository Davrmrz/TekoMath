// assets/js/chat.js - Clase ChatUI para renderizado de mensajes con alineación estricta de alumno a la derecha

class ChatUI {
    constructor(messagesContainerId, options = {}) {
        this.container = document.getElementById(messagesContainerId);
        this.onQuickOptionClick = options.onQuickOptionClick || null;
    }

    appendMessage(sender, messageText, latexFormula = null, note = null, errorBadgeType = null) {
        if (!this.container) return;

        const isUser = sender === 'user';
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${isUser ? 'user' : 'tutor'}`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        if (isUser) avatarDiv.textContent = 'Tú';
        else {
            const face = document.createElement('img');
            face.src = 'assets/images/tejuxi-face.png';
            face.alt = 'TekoBot';
            face.width = 44; face.height = 44;
            avatarDiv.appendChild(face);
        }

        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'message-content-wrapper';

        if (errorBadgeType && !isUser) {
            const errorBadge = document.createElement('div');
            errorBadge.className = 'error-badge';
            errorBadge.textContent = `Detalle detectado: ${errorBadgeType}`;
            wrapperDiv.appendChild(errorBadge);
        }

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        // Upgrade known lesson prose in old histories without changing saved text
        // or touching a student's own words and calculations.
        const language = window.JopaMathI18n?.getLanguage();
        const displayText = !isUser && language === 'jopara' && window.TutorLanguage
            ? TutorLanguage.lessonText(messageText) : messageText;
        let formattedText = this._formatMarkdown(displayText);
        bubbleDiv.innerHTML = formattedText;

        if (latexFormula) {
            const katexDiv = document.createElement('div');
            katexDiv.className = 'katex-message-box';
            if (window.katex) {
                try {
                    katex.render(latexFormula, katexDiv, { displayMode: true, throwOnError: false });
                } catch (e) {
                    katexDiv.textContent = latexFormula;
                }
            } else {
                katexDiv.textContent = latexFormula;
            }
            bubbleDiv.appendChild(katexDiv);
        }

        wrapperDiv.appendChild(bubbleDiv);

        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        metaDiv.textContent = isUser ? `Tú • ${timeStr}` : `TekoBot • ${timeStr}`;
        wrapperDiv.appendChild(metaDiv);

        msgDiv.appendChild(avatarDiv);
        msgDiv.appendChild(wrapperDiv);

        this.container.appendChild(msgDiv);
        this._scrollToBottom();
    }

    renderQuickOptions(optionsArray) {
        if (!this.container || !Array.isArray(optionsArray) || optionsArray.length === 0) return;

        const existingOptions = this.container.querySelectorAll('.quick-options-container');
        existingOptions.forEach(el => el.remove());

        const container = document.createElement('div');
        container.className = 'quick-options-container';

        optionsArray.forEach(option => {
            const optText = typeof option === 'string' ? option : option.label;
            const chip = document.createElement('button');
            chip.className = 'quick-option-chip';
            chip.textContent = optText;
            chip.addEventListener('click', () => {
                container.remove();
                if (this.onQuickOptionClick) {
                    this.onQuickOptionClick(optText, typeof option === 'object' ? option.id : '');
                }
            });
            container.appendChild(chip);
        });

        this.container.appendChild(container);
        this._scrollToBottom();
    }

    showTypingIndicator() {
        if (!this.container) return;
        this.hideTypingIndicator();

        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'chat-message tutor';
        indicator.innerHTML = `
            <div class="message-avatar"><img src="assets/images/tejuxi-face.png" alt="TekoBot" width="44" height="44"></div>
            <div class="message-content-wrapper">
                <div class="message-bubble" style="color: var(--text-muted); font-style: italic;">
                    TekoBot está preparando tu respuesta...
                </div>
            </div>
        `;
        this.container.appendChild(indicator);
        this._scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    _formatMarkdown(text) {
        if (!text) return '';
        let formatted = text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        return formatted;
    }

    _scrollToBottom() {
        if (this.container) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    }
}
