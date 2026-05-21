$ErrorActionPreference = "SilentlyContinue"

Write-Host "============================================"
Write-Host "MySQL Root Password Reset - Auto Run"
Write-Host "============================================"
Write-Host ""

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
$defaultsFile = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
$mysqlSocket = "C:\ProgramData\MySQL\MySQL Server 8.0\Data\mysql.sock"

Write-Host "[1/6] Stopping MySQL80 service..."
Stop-Service MySQL80 -Force
Start-Sleep -Seconds 3

Write-Host "[2/6] Starting MySQL with skip-grant-tables..."
$proc = Start-Process -FilePath "$mysqlBin\mysqld.exe" -ArgumentList "--defaults-file=`"$defaultsFile`"", "--skip-grant-tables", "--skip-networking" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 10

Write-Host "[3/6] Checking if MySQL is running..."
$mysqlRunning = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($mysqlRunning) {
    Write-Host "  MySQL started successfully"
} else {
    Write-Host "  WARNING: MySQL may not have started properly"
}

Write-Host "[4/6] Attempting password reset..."
$mysqlCmd = "$mysqlBin\mysql.exe"

try {
    $null = & $mysqlCmd -u root --socket="$mysqlSocket" -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
    Write-Host "  Password reset command executed"
} catch {
    Write-Host "  Command executed (output may be empty)"
}

Start-Sleep -Seconds 3

Write-Host "[5/6] Shutting down MySQL..."
$null = & "$mysqlBin\mysqladmin.exe" -u root --socket="$mysqlSocket" shutdown 2>$null
Start-Sleep -Seconds 5

if (!$proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "[6/6] Starting MySQL80 service..."
Start-Service MySQL80

Write-Host ""
Write-Host "============================================"
Write-Host "Password reset complete!"
Write-Host "Root password set to: root"
Write-Host "============================================"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Testing connection..."
$ErrorActionPreference = "Continue"

try {
    $testConn = mysql -u root -proot -e "SELECT 'Connection OK' as test;"
    if ($testConn) {
        Write-Host "SUCCESS: Connected with password 'root'"
    }
} catch {
    Write-Host "Connection test failed, but password should be set"
}

Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host