Write-Host "============================================"
Write-Host "MySQL Root Password Reset Script"
Write-Host "============================================"
Write-Host ""

Write-Host "Step 1: Stopping MySQL service..."
Stop-Service MySQL80 -Force
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 2: Starting MySQL with skip-grant-tables..."
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$defaultsFile = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
$proc = Start-Process -FilePath $mysqlPath -ArgumentList "--defaults-file=`"$defaultsFile`"", "--skip-grant-tables" -PassThru -WindowStyle Hidden

Write-Host "Waiting for MySQL to start..."
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "Step 3: Resetting root password to 'root'..."
$mysqlCmd = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

& $mysqlCmd -u root -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"

Write-Host ""
Write-Host "Step 4: Stopping MySQL..."
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqladmin.exe" -u root -proot shutdown 2>$null

Start-Sleep -Seconds 3
if (!$proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
}

Write-Host ""
Write-Host "Step 5: Restarting MySQL service..."
Start-Service MySQL80

Write-Host ""
Write-Host "============================================"
Write-Host "Password reset complete!"
Write-Host "Root password is now: root"
Write-Host "============================================"