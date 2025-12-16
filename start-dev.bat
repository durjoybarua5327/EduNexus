@echo off
echo Starting EduNexus...

echo Starting Backend (Port 3001)...
start "EduNexus Backend" /D "backend" cmd /k "npm run dev"

echo Starting Frontend (Port 3000)...
start "EduNexus Frontend" /D "frontend" cmd /k "npm run dev"

echo Done! Both servers are starting.
