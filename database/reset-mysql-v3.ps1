param([string]$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin", [string]$dataPath = "C:\ProgramData\MySQL\MySQL Server 8.0\Data", [string]$configPath = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini")

Write-Host "============================================"
Write-Host "MySQL Password Reset - Using init-file method"
Write-Host "============================================"
Write-Host ""

$mysqld = Join-Path $mysqlBin "mysqld.exe"
$mysql = Join-Path $mysqlBin "mysql.exe"
$mysqlAdmin = Join-Path $mysqlBin "mysqladmin.exe"
$initFile = Join-Path $env:TEMP "mysql-init.sql"

Write-Host "[1/6] Creating init file..."
$initContent = @"
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
FLUSH PRIVILEGES;
"@
Set-Content -Path $initFile -Value $initContent -Encoding ASCII
Write-Host "  Init file: $initFile"

Write-Host ""
Write-Host "[2/6] Stopping MySQL80 service..."
Stop-Service MySQL80 -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5
Write-Host "  Service stopped"

Write-Host ""
Write-Host "[3/6] Starting MySQL with init-file..."
$proc = Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=`"$configPath`"", "--init-file=`"$initFile`"", "--console" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "[4/6] Checking if MySQL started with init-file..."
$mySqldProcess = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($mySqldProcess) {
    Write-Host "  MySQL is running (PID: $($mySqldProcess.Id))"
} else {
    Write-Host "  WARNING: MySQL process not found"
}

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[5/6] Shutting down MySQL..."
& $mysqlAdmin -u root -proot shutdown 2>$null
Start-Sleep -Seconds 5

if (!$proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "[6/6] Starting MySQL80 service..."
Start-Service MySQL80 -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "============================================"
Write-Host "Password reset attempt complete"
Write-Host "============================================"
Write-Host ""

Write-Host "Testing connection with password 'root'..."
try {
    $testResult = & $mysql -u root -proot -e "SELECT 'OK' as connected;" 2>&1
    if ($testResult -match "OK") {
        Write-Host "SUCCESS: Connected to MySQL with password 'root'"
    } else {
        Write-Host "Connection failed. Trying without password..."
        $testResult2 = & $mysql -u root -e "SELECT 'OK' as connected;" 2>&1
        if ($testResult2 -match "OK") {
            Write-Host "Connected without password (password may be empty)"
        } else {
            Write-Host "Result: $testResult"
            Write-Host "Result2: $testResult2"
        }
    }
} catch {
    Write-Host "Error: $_"
}

Remove-Item $initFile -ErrorAction SilentlyContinue
Read-Host "Press Enter to exit"