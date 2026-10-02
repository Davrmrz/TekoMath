<?php
// views/header.php
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TekoBot — Tutor Inteligente de Matemáticas</title>
    
    <!-- Fuentes Google -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- KaTeX para Fórmulas Matemáticas -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>

    <!-- Estilos de la Aplicación -->
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/components.css?v=20260926-tekobot">
    <link rel="icon" type="image/png" href="assets/images/tejuxi-face.png">
</head>
<body>

<!-- Barra de Navegación Superior -->
<header class="navbar">
    <div class="nav-brand">
        <img class="brand-logo" src="assets/images/tejuxi-face.png" alt="TekoBot" width="60" height="60">
        <div>
            <div class="brand-title">
                TekoBot
                <span class="brand-badge">Hackathon GuaranIA</span>
            </div>
            <div class="brand-sub">TekoBot · Tu tutor de matemática • 1er Curso Media • Guaraní Jopara</div>
        </div>
    </div>

    <div class="nav-actions">
        <span id="connection-status" class="status-badge online">🟢 Conectado</span>
        
        <select id="language-mode" class="lang-select" title="Modo de Idioma">
            <option value="jopara" selected>🇵🇾 Guaraní Jopara (Predeterminado)</option>
            <option value="es_py">🇵🇾 Español Paraguayo</option>
            <option value="es">🌐 Español Estándar</option>
        </select>

        <button id="btn-problem-workshop" class="btn-header">Resolver un problema</button>
    </div>
</header>
