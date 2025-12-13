@echo off
echo ========================================
echo  Push to GitHub - YouTube Bot Defend Web
echo ========================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo Step 1: Initializing Git repository...
if exist ".git" (
    echo Git already initialized, skipping...
) else (
    git init
)

echo.
echo Step 2: Adding files...
git add .

echo.
echo Step 3: Creating commit...
git commit -m "Initial commit - YouTube Bot Defend Web App"

echo.
echo Step 4: Setting branch to main...
git branch -M main

echo.
echo ========================================
echo  NEXT STEPS (Manual):
echo ========================================
echo.
echo 1. Buat repository baru di GitHub:
echo    https://github.com/new
echo    Name: youtube-bot-defend-web
echo    Visibility: Public
echo    JANGAN centang "Add README" atau apapun
echo.
echo 2. Setelah buat repo, jalankan command ini:
echo.
echo    git remote add origin https://github.com/vodcarebeccca/youtube-bot-defend-web.git
echo    git push -u origin main
echo.
echo 3. Setelah push, import ke Vercel:
echo    https://vercel.com/new
echo.
echo ========================================
pause
