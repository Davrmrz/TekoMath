# ========================================================
#       MATEJOPARA LOCALIZATION TOOL - INICIO POWERSHELL
# ========================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor DarkGreen
Write-Host "       MATEJOPARA LOCALIZATION TOOL - INICIO           " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor DarkGreen
Write-Host ""

$pythonCmd = "python"
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    $fallbackPath = "C:\Users\fleit\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
    if (Test-Path $fallbackPath) {
        $pythonCmd = $fallbackPath
    } else {
        Write-Error "No se encontró Python instalado."
        exit 1
    }
}

Write-Host "[INFO] Utilizando Python: $pythonCmd" -ForegroundColor Cyan
Write-Host "[INFO] Verificando dependencias..." -ForegroundColor Gray
& $pythonCmd -m pip install -q -r requirements.txt

Write-Host ""
Write-Host "[INFO] Iniciando servidor web en http://127.0.0.1:8000..." -ForegroundColor Green
Write-Host "[INFO] Presione Ctrl+C para detener." -ForegroundColor Gray
Write-Host ""

Start-Process "http://127.0.0.1:8000"
& $pythonCmd -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
