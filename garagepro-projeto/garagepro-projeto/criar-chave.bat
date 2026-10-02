@echo off
chcp 65001 >nul
echo ============================================
echo  GaragePro - criar chave de assinatura (uma vez so)
echo ============================================
where keytool >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERRO] Nao encontrei o "keytool".
  echo Instala o Java ^(Temurin JDK 21^) em https://adoptium.net e volta a correr este ficheiro.
  pause
  exit /b 1
)
if exist garagepro.jks (
  echo [ERRO] Ja existe garagepro.jks nesta pasta. Nao crio outra para nao estragar as atualizacoes.
  pause
  exit /b 1
)
echo.
set /p PASS=Escolhe uma palavra-passe para a chave (minimo 6 caracteres, sem espacos): 
keytool -genkeypair -v -storetype PKCS12 -keystore garagepro.jks -alias garagepro -keyalg RSA -keysize 2048 -validity 10000 -storepass "%PASS%" -keypass "%PASS%" -dname "CN=GaragePro, O=BBTecnoDev, C=PT"
if errorlevel 1 ( echo [ERRO] Falhou a criacao da chave. & pause & exit /b 1 )
powershell -NoProfile -Command "[Convert]::ToBase64String([IO.File]::ReadAllBytes('garagepro.jks')) | Set-Content -NoNewline garagepro-chave-base64.txt"
echo.
echo ============================================
echo  FEITO!
echo  - garagepro.jks             = a tua chave. GUARDA-A (pen + Google Drive). Se a perderes, nao ha atualizacoes.
echo  - garagepro-chave-base64.txt = o texto a colar no GitHub (segredo ANDROID_KEYSTORE_BASE64)
echo  - A palavra-passe vai para o segredo ANDROID_KEYSTORE_PASSWORD
echo  NUNCA carregues estes ficheiros para o repositorio.
echo ============================================
pause
