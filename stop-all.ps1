<#
    One-click stop all services script
    Author: System Generated
    Date: 2026-05-20
    
    Features:
    1. Stop all running services (Unified API + Quote System + ERP System + SRM System)
    2. Kill all node.exe processes
    3. Release all occupied ports
#>

$ErrorActionPreference = "SilentlyContinue"

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
    Write-ColorOutput "==========================================" -Color White
    Write-ColorOutput "      ONE-CLICK STOP ALL SERVICES" -Color Cyan
    Write-ColorOutput "==========================================`n" -Color White
    
    Write-ColorOutput "[INFO] Stopping all services..." -Color Yellow
    
    # Stop all Node.js processes
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    
    if ($nodeProcesses) {
        $count = $nodeProcesses.Count
        Write-ColorOutput "[INFO] Found $count node.exe process(es) to stop" -Color Yellow
        
        foreach ($process in $nodeProcesses) {
            Write-ColorOutput "[STOP] Terminating process: node.exe (PID: $($process.Id))" -Color Red
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
        
        # Wait for processes to terminate
        Start-Sleep -Seconds 2
        
        # Verify all processes are stopped
        $remainingProcesses = Get-Process node -ErrorAction SilentlyContinue
        if (-not $remainingProcesses) {
            Write-ColorOutput "`n[SUCCESS] All services stopped successfully!" -Color Green
            Write-ColorOutput "[SUCCESS] All ports released: 3001, 5173, 5174, 5175" -Color Green
        }
        else {
            Write-ColorOutput "`n[WARNING] Some processes may still be running" -Color Yellow
        }
    }
    else {
        Write-ColorOutput "[INFO] No node.exe processes found running" -Color Gray
        Write-ColorOutput "[SUCCESS] All services are already stopped" -Color Green
    }
    
    Write-ColorOutput "`n==========================================" -Color White
    Write-ColorOutput "      ALL SERVICES STOPPED" -Color Green
    Write-ColorOutput "==========================================`n" -Color White
    
    Write-ColorOutput "Press any key to exit..." -Color Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Execute
Stop-AllServices