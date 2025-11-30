@echo off
REM Windows batch script to test extension loading
echo.
echo ========================================
echo   Uproot Extension Load Test
echo ========================================
echo.
echo Extension location:
echo \\wsl.localhost\Ubuntu\home\imorgado\Documents\agent-girl\uproot\.output\chrome-mv3
echo.
echo Instructions:
echo 1. Open Chrome and go to: chrome://extensions/
echo 2. Enable "Developer mode" (toggle in top-right)
echo 3. Click "Load unpacked" button
echo 4. Paste the path above into the file browser address bar
echo 5. Press Enter and select the folder
echo.
echo Expected result:
echo - Extension loads without errors
echo - No "Service worker registration failed" errors
echo - "Uproot" extension appears in the list
echo.
pause
