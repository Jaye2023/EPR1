@echo off
echo ============================================
echo MySQL Root Password Reset Script
echo ============================================
echo.

echo Step 1: Stopping MySQL service...
net stop MySQL80

echo.
echo Step 2: Starting MySQL with skip-grant-tables...
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
start /B mysqld --defaults-file="C:\ProgramData\MySQL\MySQL Server 8.0\my.ini" --skip-grant-tables

echo Waiting for MySQL to start...
timeout /t 5 /nobreak > nul

echo.
echo Step 3: Resetting root password to 'root'...
mysql -u root -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"

echo.
echo Step 4: Stopping MySQL...
mysqladmin -u root -proot shutdown 2>nul

echo.
echo Step 5: Restarting MySQL service...
net start MySQL80

echo.
echo ============================================
echo Password reset complete!
echo Root password is now: root
echo ============================================
pause