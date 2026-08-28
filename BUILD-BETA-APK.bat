@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Qrayti - Android v1.12 build
color 0B

echo =====================================================
echo        Qrayti Android - v1.12
echo =====================================================
echo.

set "SDK=%LOCALAPPDATA%\Android\Sdk"
if defined ANDROID_HOME set "SDK=%ANDROID_HOME%"
if not exist "%SDK%" (
  echo [ERROR] Android SDK not found at:
  echo %SDK%
  echo.
  echo Open Android Studio ^> Tools ^> SDK Manager once, then run this file again.
  pause
  exit /b 1
)
set "ANDROID_HOME=%SDK%"
set "ANDROID_SDK_ROOT=%SDK%"

rem -----------------------------------------------------
rem IMPORTANT: Do not use the system Java blindly.
rem Qrayti Android Beta uses AGP 8.13.x, whose supported/default JDK is 17.
rem Java 26 can break Gradle/Kotlin script parsing, so prefer Android Studio JBR
rem and otherwise download a private portable JDK 17 only for this project.
rem -----------------------------------------------------
set "QJDK="
if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" set "QJDK=%ProgramFiles%\Android\Android Studio\jbr"
if not defined QJDK if exist "%ProgramFiles%\Android\Android Studio\jre\bin\java.exe" set "QJDK=%ProgramFiles%\Android\Android Studio\jre"
if not defined QJDK if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr\bin\java.exe" set "QJDK=%LOCALAPPDATA%\Programs\Android Studio\jbr"
if not defined QJDK if exist "%LOCALAPPDATA%\Android\Android Studio\jbr\bin\java.exe" set "QJDK=%LOCALAPPDATA%\Android\Android Studio\jbr"

set "JDKROOT=%~dp0.qrayti-build-tools\jdk17"
if not defined QJDK (
  for /d %%D in ("%JDKROOT%\*") do (
    if exist "%%~fD\bin\java.exe" if not defined QJDK set "QJDK=%%~fD"
  )
)

if not defined QJDK (
  echo [0/5] Compatible Android JDK not found. Preparing private Microsoft JDK 17 ^(first build only^) ...
  if not exist "%~dp0.qrayti-build-tools" mkdir "%~dp0.qrayti-build-tools"
  if exist "%JDKROOT%" rmdir /s /q "%JDKROOT%"
  mkdir "%JDKROOT%"
  set "JZIP=%TEMP%\qrayti-microsoft-jdk17.zip"

  set "JZIPOK="
  if exist "!JZIP!" (
    for %%F in ("!JZIP!") do set "JZIPSIZE=%%~zF"
    if !JZIPSIZE! GEQ 50000000 set "JZIPOK=1"
  )

  if defined JZIPOK (
    echo       Reusing existing JDK ZIP: !JZIP!
    echo       Existing ZIP size: !JZIPSIZE! bytes.
  ) else (
    if exist "!JZIP!" del /q "!JZIP!"
    echo       Downloading official Microsoft OpenJDK 17...
    where curl.exe >nul 2>nul
    if not errorlevel 1 (
      curl.exe -L --fail --retry 3 --retry-delay 2 --connect-timeout 30 -o "!JZIP!" "https://aka.ms/download-jdk/microsoft-jdk-17-windows-x64.zip"
    ) else (
      powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $u='https://aka.ms/download-jdk/microsoft-jdk-17-windows-x64.zip'; $o=[IO.Path]::Combine($env:TEMP,'qrayti-microsoft-jdk17.zip'); Invoke-WebRequest -Uri $u -OutFile $o -MaximumRedirection 10"
    )
    if not exist "!JZIP!" goto :jdkdownloadfail
    for %%F in ("!JZIP!") do set "JZIPSIZE=%%~zF"
    if !JZIPSIZE! LSS 50000000 goto :jdkdownloadfail
    echo       Downloaded !JZIPSIZE! bytes.
  )

  echo       Testing ZIP and extracting...
  set "EXTRACTOK="
  where tar.exe >nul 2>nul
  if not errorlevel 1 (
    tar.exe -tf "!JZIP!" >nul 2>nul
    if not errorlevel 1 (
      tar.exe -xf "!JZIP!" -C "%JDKROOT%"
      if not errorlevel 1 set "EXTRACTOK=1"
    )
  )

  if not defined EXTRACTOK (
    echo       tar.exe fallback unavailable/failed. Trying safe PowerShell extraction...
    if exist "%JDKROOT%" rmdir /s /q "%JDKROOT%"
    mkdir "%JDKROOT%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$zip=[IO.Path]::GetFullPath('!JZIP!'); $dest=[IO.Path]::GetFullPath('%JDKROOT%'); Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory($zip,$dest)"
    if not errorlevel 1 set "EXTRACTOK=1"
  )

  if not defined EXTRACTOK goto :jdkdownloadfail

  if exist "%JDKROOT%\bin\java.exe" set "QJDK=%JDKROOT%"
  if not defined QJDK for /d %%D in ("%JDKROOT%\*") do (
    if exist "%%~fD\bin\java.exe" if not defined QJDK set "QJDK=%%~fD"
  )
)

if not defined QJDK (
  echo [ERROR] A compatible JDK could not be prepared.
  pause
  exit /b 1
)

set "JAVA_HOME=%QJDK%"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo [JAVA] Using: %JAVA_HOME%
"%JAVA_HOME%\bin\java.exe" -version
if errorlevel 1 (
  echo [ERROR] Selected Java could not start.
  pause
  exit /b 1
)
echo.

echo [1/5] Android SDK: %SDK%

set "SDKMANAGER=%SDK%\cmdline-tools\latest\bin\sdkmanager.bat"
if not exist "%SDK%\platforms\android-36\android.jar" (
  echo [2/5] Android 16 / API 36 is missing.
  if exist "%SDKMANAGER%" (
    echo       Installing API 36 and build tools...
    (for /l %%i in (1,1,40) do @echo y) | call "%SDKMANAGER%" "platforms;android-36" "build-tools;35.0.0" "platform-tools"
    if errorlevel 1 goto :sdkfail
  ) else (
    echo [ERROR] API 36 is not installed and sdkmanager was not found.
    echo Android Studio ^> Tools ^> SDK Manager ^> install Android 16 ^(API 36^).
    pause
    exit /b 1
  )
) else echo [2/5] Android API 36 is ready.

set "GDIR=%~dp0.qrayti-build-tools\gradle-8.13"
set "GZIP=%TEMP%\qrayti-gradle-8.13-bin.zip"
if not exist "%GDIR%\bin\gradle.bat" (
  echo [3/5] Getting Gradle 8.13 ^(first build only^) ...
  if not exist "%GZIP%" powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing 'https://services.gradle.org/distributions/gradle-8.13-bin.zip' -OutFile '%GZIP%'"
  if not exist "%GZIP%" (
    echo [ERROR] Could not download Gradle.
    pause
    exit /b 1
  )
  if exist "%~dp0.qrayti-build-tools\gradle-8.13" rmdir /s /q "%~dp0.qrayti-build-tools\gradle-8.13"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force '%GZIP%' '%~dp0.qrayti-build-tools'"
  if not exist "%GDIR%\bin\gradle.bat" (
    echo [ERROR] Gradle extraction failed.
    pause
    exit /b 1
  )
) else echo [3/5] Gradle 8.13 is ready.

echo [4/5] Building native Qrayti APK with the compatible JDK...
call "%GDIR%\bin\gradle.bat" --stop >nul 2>nul
call "%GDIR%\bin\gradle.bat" --no-daemon --stacktrace :app:testDebugUnitTest :app:assembleRc
if errorlevel 1 (
  echo.
  echo [ERROR] Android build failed. Keep this window open and send the FIRST error above to ChatGPT.
  pause
  exit /b 1
)

if not exist "app\build\outputs\apk\rc\app-rc.apk" (
  echo [ERROR] Build finished but APK was not found.
  pause
  exit /b 1
)
mkdir release 2>nul
copy /y "app\build\outputs\apk\rc\app-rc.apk" "release\Qrayti-v1.12.0.apk" >nul
for %%F in ("release\Qrayti-v1.12.0.apk") do set "APKSIZE=%%~zF"
echo [5/5] DONE.
echo.
echo APK:
echo %~dp0release\Qrayti-v1.12.0.apk
echo Size: %APKSIZE% bytes
echo.
echo This is a debug-signed release candidate for direct testing, not a Play Store release.
pause
exit /b 0


:jdkdownloadfail
echo.
echo [ERROR] The private JDK 17 download/extraction failed.
echo.
echo Try this easy manual fallback:
echo   1. Open https://aka.ms/download-jdk/microsoft-jdk-17-windows-x64.zip
echo   2. Download the ZIP.
echo   3. Extract it anywhere.
echo   4. Put the extracted JDK folder inside:
echo      %~dp0.qrayti-build-tools\jdk17\
echo   5. Run BUILD-BETA-APK.bat again.
echo.
pause
exit /b 1

:sdkfail
echo [ERROR] Android SDK installation failed.
echo Open Android Studio ^> Tools ^> SDK Manager, install Android 16 API 36, then retry.
pause
exit /b 1
