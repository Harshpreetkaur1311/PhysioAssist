Write-Host "Starting PhysioAssist Services..." -ForegroundColor Green

# Start Backend
Write-Host "Starting Flask Backend on port 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python app.py"

# Start AI Engine
Write-Host "Starting Python AI Engine (Pose Detection)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python pose_detection.py"

# Start Frontend
Write-Host "Starting Vite React Frontend on port 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "All services started in separate windows! You can now use the application." -ForegroundColor Green
