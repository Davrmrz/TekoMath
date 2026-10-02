<?php
// views/tutor_view.php - Layout Invertido (Widgets 32% Izquierda, Chat 68% Derecha) Sin Emojis
?>

<!-- Barra de Selección de Temas del Currículo MEC 1er Año -->
<div id="topic-chips-bar" class="topic-chips-bar">
    <!-- Generado dinámicamente por app.js -->
</div>

<main class="app-container">

    <!-- PANEL IZQUIERDO: WIDGETS COLAPSABLES (32% ANCHO - COMPACTO) -->
    <section class="visual-panel">

        <!-- WIDGET 1: FÓRMULA ACTIVA (COLAPSABLE) -->
        <div class="widget-card" data-widget-id="formula">
            <div class="widget-header">
                <span class="formula-label">Fórmula y Propiedad en Estudio</span>
                <button class="widget-toggle-btn" title="Minimizar / Expandir">▼</button>
            </div>
            <div class="widget-body formula-card-top">
                <div id="active-formula" class="formula-katex-box">
                    <!-- KaTeX render -->
                </div>
                <div id="active-formula-note" class="formula-note">
                    Sincronizado en tiempo real con la explicación del tutor.
                </div>
            </div>
        </div>

        <!-- WIDGET 2: VISUALIZADOR MATEMÁTICO (COLAPSABLE) -->
        <div class="widget-card" data-widget-id="visual">
            <div class="widget-header">
                <span>Visualizador Matemático Interactivo</span>
                <button class="widget-toggle-btn" title="Minimizar / Expandir">▼</button>
            </div>
            <div class="widget-body">
                <div class="visual-tabs">
                    <button id="tab-circle" class="visual-tab-btn active">Circunferencia Trigonométrica</button>
                    <button id="tab-graph" class="visual-tab-btn">Gráfica de Función</button>
                </div>

                <!-- Vista 1: Circunferencia Unitaria -->
                <div id="circle-view" class="canvas-container">
                    <canvas id="unit-circle-canvas"></canvas>
                    <div class="canvas-instruction">
                        Arrastrá el punto en la circunferencia para explorar ángulos y cuadrantes.
                    </div>
                </div>

                <!-- Vista 2: Gráfica de Ondas -->
                <div id="graph-view" class="canvas-container" style="display: none;">
                    <canvas id="trig-graph-canvas"></canvas>
                    <div class="canvas-instruction">
                        Visualización de onda periódica: Amplitud, Período y Puntos Clave.
                    </div>
                </div>

                <!-- Vista 3: Visualizadores Dinámicos MEC -->
                <div id="mec-view" class="canvas-container" style="display: none;">
                    <canvas id="mec-visual-canvas"></canvas>
                    <div class="canvas-instruction">
                        Representación gráfica de la unidad temática seleccionada.
                    </div>
                </div>
            </div>
        </div>

        <!-- WIDGET 3: PROGRESO Y MAESTRÍA POR SUBTEMAS (COLAPSABLE) -->
        <div class="widget-card" data-widget-id="progress">
            <div class="widget-header">
                <span>Progreso - Plan MEC 1er Año</span>
                <button class="widget-toggle-btn" title="Minimizar / Expandir">▼</button>
            </div>
            <div class="widget-body">
                <div class="progress-card-title">
                    <span>Maestría del Estudiante</span>
                    <span id="global-mastery-score" class="brand-badge">Sin evidencia</span>
                </div>
                <div id="progress-bars-container">
                    <!-- Barras de progreso por subtema -->
                </div>
            </div>
        </div>

    </section>

    <!-- PANEL DERECHO: CHAT SOCRÁTICO AMPLIO (68% ANCHO) -->
    <section class="chat-panel">
        <div class="chat-header">
            <div class="chat-title">
                <button id="btn-toggle-chats" class="chat-action-btn primary" title="Ver historial de conversaciones">Mis Chats</button>
                <span>Aprendé con TekoBot</span>
            </div>
            <div class="chat-quick-bar">
                <button id="btn-hint" class="chat-action-btn" title="Solicitar pista escalonada">Dame una pista</button>
                <button id="btn-show-graph" class="chat-action-btn" title="Mostrar en el gráfico">Ver gráfico</button>
                <button id="btn-retry" class="chat-action-btn" title="Volver a intentar">Probar de nuevo</button>
            </div>
        </div>

        <!-- Drawer Lateral de Lista de Múltiples Chats -->
        <div id="chats-drawer" class="chats-drawer" style="display: none;">
            <div class="drawer-header">
                <span>Mis Conversaciones Guardadas</span>
                <button id="btn-close-drawer" class="btn-close-modal">&times;</button>
            </div>
            <div id="chats-list-container" class="chats-list-container">
                <!-- Cargado dinámicamente por app.js -->
            </div>
        </div>

        <!-- Contenedor de Mensajes del Chat Actual -->
        <div id="chat-messages" class="chat-messages">
            <!-- Mensajes inyectados dinámicamente por chat.js -->
        </div>

        <!-- Entrada de texto y foto del ejercicio -->
        <div class="chat-input-area">
            <div class="input-box-wrapper">
                
                <!-- Botón Subir Foto / OCR -->
                <label for="camera-upload" class="btn-icon" title="Subir foto del ejercicio" style="cursor: pointer; margin: 0;">
                    Foto
                    <input type="file" id="camera-upload" accept="image/*" style="display: none;">
                </label>
                
                <input 
                    type="text" 
                    id="chat-input" 
                    class="chat-input" 
                    placeholder="Escribí en jopara o español..." 
                    autocomplete="off"
                />
                <button id="send-btn" class="btn-send">
                    <span>Enviar</span>
                </button>
            </div>
        </div>
    </section>

</main>
