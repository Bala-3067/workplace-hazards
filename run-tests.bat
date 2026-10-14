@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d "%~dp0"
node tests\run-tests.mjs > test-output.txt 2>&1
echo EXIT:%ERRORLEVEL% >> test-output.txt
