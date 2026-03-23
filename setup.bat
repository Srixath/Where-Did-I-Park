@echo off
REM Create directory structure
md src\components 2>nul
md public 2>nul

REM Install dependencies
call npm install

echo Setup complete!
