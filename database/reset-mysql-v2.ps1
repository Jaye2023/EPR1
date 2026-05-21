param([string]$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin", [string]$dataPath = "C:\ProgramData\MySQL\MySQL Server 8.0\Data", [string]$configPath = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini")

Write-Host "============================================"
Write-Host "MySQL Root Password Reset Script"
Write-Host "============================================"
Write-Host ""

$mysqlBin = $mysqlPath
$mysqld = Join-Path $mysqlBin "mysqld.exe"
$mysql = Join-Path $mysqlBin "mysql.exe"
$mysqlAdmin = Join-Path $mysqlBin "mysqladmin.exe"

Write-Host "[1/5] Stopping MySQL80 service..."
Stop-Service MySQL80 -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "  Service stopped"

Write-Host ""
Write-Host "[2/5] Starting MySQL with skip-grant-tables..."
Write-Host "  Command: $mysqld"
Write-Host "  Arguments: --defaults-file=`"$configPath`" --skip-grant-tables"

$proc = Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=`"$configPath`"", "--skip-grant-tables" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "[3/5] Checking MySQL process..."
$mySqldProcess = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($mySqldProcess) {
    Write-Host "  MySQL is running (PID: $($mySqldProcess.Id))"
} else {
    Write-Host "  WARNING: MySQL process not found"
}

Write-Host ""
Write-Host "[4/5] Resetting root password..."
$sqlCommands = @"
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
FLUSH PRIVILEGES;
"@

try {
    $result = $sqlCommands | & $mysql -u root 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Password reset successful!"
    } else {
        Write-Host "  Result: $result"
    }
} catch {
    Write-Host "  Error (may be normal if already done): $_"
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[5/5] Shutting down MySQL and restarting service..."
& $mysqlAdmin -u root shutdown 2>$null
Start-Sleep -Seconds 5

if (!$proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

Start-Service MySQL80 -ErrorAction SilentlyContinue
Write-Host "  MySQL80 service restarted"

Write-Host ""
Write-Host "============================================"
Write-Host "Password reset complete!"
Write-Host "New password: root"
Write-Host "============================================"
Write-Host ""

Write-Host "Testing connection..."
$testResult = & $mysql -u root -proot -e "SELECT 'OK' as connected;" 2>&1
if ($testResult -match "OK") {
    Write-Host "SUCCESS: Connected to MySQL with password 'root'"
} else {
    Write-Host "Connection test result: $testResult"
}

Read-Host "Press Enter to exit"