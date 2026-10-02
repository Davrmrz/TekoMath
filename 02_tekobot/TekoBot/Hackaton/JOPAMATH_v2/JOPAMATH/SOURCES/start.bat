@echo off
chcp 65001 >nul
echo ========================================================
echo        MATEJOPARA LOCALIZATION TOOL - INICIO
echo ========================================================
echo.

rem Check python
set PYTHON_CMD=python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "C:\Users\fleit\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
        set PYTHON_CMD="C:\Users\fleit\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
    ) else (
        echo [ERROR] No se encontro Python en el sistema.
        pause
        exit /b 1
    )
)

echo [INFO] Utilizando: %PYTHON_CMD%
echo [INFO] Verificando dependencias...
%PYTHON_CMD% -m pip install -q -r requirements.txt

echo.
echo [INFO] Iniciando servidor web en http://127.0.0.1:8000...
echo [INFO] Presione Ctrl+C en cualquier momento para detener.
echo.

start http://127.0.0.1:8000
%PYTHON_CMD% -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

pause
