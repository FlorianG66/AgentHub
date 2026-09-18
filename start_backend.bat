@echo off
title Backend FastAPI - SaaS Multi-Agents
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
pause
