@echo off
REM =============================================================================
REM Pre-push Security Audit Hook
REM Platform: Windows (CMD / PowerShell)
REM =============================================================================
REM This hook runs before 'git push' and blocks if critical vulnerabilities exist.
REM To bypass in emergencies: git push --no-verify
REM =============================================================================

echo.
echo [Security] Running security audit before push...
echo.

call yarn npm audit --severity critical

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] No critical vulnerabilities found. Pushing...
    echo.
    exit /b 0
) else (
    echo.
    echo ====================================================================
    echo [BLOCKED] PUSH BLOCKED: Critical security vulnerabilities found!
    echo ====================================================================
    echo.
    echo To see details:     yarn audit
    echo To bypass (unsafe): git push --no-verify
    echo.
    exit /b 1
)
