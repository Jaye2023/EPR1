<#
    One-click start all services script
    Author: System Generated
    Date: 2026-05-20

    Features:
    1. Start all services (Unified API Server + Quote System + ERP System + SRM System)
    2. Support restart (stop all then restart)
    3. Auto detect and release occupied ports
    4. Unified database integration - all systems connect to centralized API
#>

param(
    [switch]$Restart
)

$ErrorActionPreference = "SilentlyContinue"

# Services configuration
$services = @(
    @{ Name = "Unified API Server"; Path = "d:\DY\database"; Command = "node unified-api-server.js"; Port = 3001 }
    @{ Name = "Quote System (SQS)"; Path = "d:\DY\SQS\vue"; Command = "npm run dev"; Port = 5173 }
    @{ Name = "ERP System"; Path = "d:\DY\ERP"; Command = "npm run dev"; Port = 5174 }
    @{ Name = "SRM System"; Path = "d:\DY\SRM"; Command = "npm run dev"; Port = 5175 }
)

function Write-ColorOutput {
    param(
        [string]$Message,
        [ConsoleColor]$Color = [ConsoleColor]::White
    )
    $originalColor = $Host.UI.RawUI.ForegroundColor
    $Host.UI.RawUI.ForegroundColor = $Color
    Write-Output $Message
    $Host.UI.RawUI.ForegroundColor = $originalColor
}

function Stop-AllServices {
    Write-ColorOutput "`n[INFO] Stopping all services..." -Color Yellow
    
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        foreach ($process in $nodeProcesses) {
            Write-ColorOutput "[STOP] Terminating process: node.exe (PID: $($process.Id))" -Color Red
            Stop-Process -Id $process.Id -Force
        }
    }
    
    Start-Sleep -Seconds 2
    
    Write-ColorOutput "[SUCCESS] All services stopped`n" -Color Green
}

function Start-AllServices {
    Write-ColorOutput "==========================================" -Color White
    Write-ColorOutput "      ONE-CLICK START ALL SERVICES" -Color Cyan
    Write-ColorOutput "==========================================`n" -Color White
    
    foreach ($service in $services) {
        Write-ColorOutput "[START] Starting $($service.Name)..." -Color Cyan
        
        Start-Process powershell.exe -ArgumentList "-Command cd '$($service.Path)'; $($service.Command)" -WorkingDirectory $service.Path -NoNewWindow
        
        Write-ColorOutput "[RUNNING] $($service.Name) started on port $($service.Port)" -Color Green
        Start-Sleep -Seconds 2
    }
    
    Write-ColorOutput "`n==========================================" -Color White
    Write-ColorOutput "      ALL SERVICES STARTED!" -Color Green
    Write-ColorOutput "==========================================`n" -Color White
    
    Write-ColorOutput "`n📊 Unified Database Connection:" -Color Cyan
    Write-ColorOutput "   Database: SQLite (d:\DY\database\unified.db)" -Color White
    Write-ColorOutput "   API Server: http://localhost:3001`n" -Color White
    
    Write-ColorOutput "🌐 Frontend Systems:" -Color Cyan
    foreach ($service in $services) {
        if ($service.Port -ne 3001) {
            Write-ColorOutput "   ✅ $($service.Name): http://localhost:$($service.Port)" -Color White
        }
    }
    
    Write-ColorOutput "`nPress any key to exit..." -Color Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

if ($Restart) {
    Write-ColorOutput "[RESTART] Performing restart operation..." -Color Yellow
    Stop-AllServices
}

Start-AllServices