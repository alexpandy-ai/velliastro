@echo off
echo Syncing files...
copy /Y "D:\alex\apps\velliastro\graha-chart.html" "D:\alex\apps\velliastro\index.html"
copy /Y "D:\alex\apps\velliastro\index.html" "D:\alex\apps\velliastro\deploy\index.html"
echo Deploying to Harvis...
set PATH=C:\Program Files\nodejs;%PATH%
set NPM_CONFIG_CACHE=D:\alex\apps\velliastro\npm-cache
cd /D "D:\alex\apps\velliastro\deploy"
call npx --yes harvis
echo.
echo Done. Open https://velliastro.harvis.page and press Ctrl+Shift+R to hard refresh.
pause
