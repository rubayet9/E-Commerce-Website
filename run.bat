@echo off
title E-Commerce App Launcher
echo ===================================================
echo     E-Commerce Website Development Launcher
echo ===================================================
echo.
echo Starting Database (Prisma Postgres on Port 51214)...
start "Prisma Database" cmd /k "cd /d %~dp0\server && npx prisma dev"
echo Waiting 5 seconds for database to start...
timeout /t 5 >nul

echo Starting Backend (Express API on Port 5000)...
start "Express Backend Server" cmd /k "cd /d %~dp0\server && npm run dev"

echo Starting Frontend (Next.js Client on Port 3000)...
start "Next.js Frontend Client" cmd /k "cd /d %~dp0\client && npm run dev"

echo.
echo ===================================================
echo [Success] Database and servers are launching in separate windows!
echo - Database: Port 51214 (Prisma Dev)
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
echo Close the opened command prompt windows to stop the servers.
echo ===================================================
pause
