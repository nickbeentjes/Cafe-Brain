@echo off
echo ========================================
echo    Cafe Brain Database Test Suite
echo ========================================
echo.

echo Choose an option:
echo 1. Quick database test
echo 2. Detailed database diagnostics
echo 3. Setup environment variables
echo 4. Test Square sync to TimescaleDB
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Running quick database test...
    node scripts/quick-db-test.js
    pause
) else if "%choice%"=="2" (
    echo.
    echo Running detailed database diagnostics...
    node scripts/db-diagnostic.js
    pause
) else if "%choice%"=="3" (
    echo.
    echo Setting up environment variables...
    node scripts/setup-env.js
    pause
) else if "%choice%"=="4" (
    echo.
    echo Testing Square sync to TimescaleDB...
    node scripts/test-square-sync.js
    pause
) else if "%choice%"=="5" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please try again.
    pause
    goto :eof
)
