@echo off
echo ========================================
echo  YouTube Bot Defend - Web App Deploy
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Building project...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo Build successful! Output in dist/ folder
echo.
echo ========================================
echo  Deploy Options:
echo ========================================
echo.
echo 1. Deploy to Vercel:
echo    vercel --prod
echo.
echo 2. Deploy to Firebase:
echo    firebase deploy --only hosting
echo.
echo 3. Manual upload:
echo    Upload contents of dist/ folder to your hosting
echo.
echo ========================================
pause
