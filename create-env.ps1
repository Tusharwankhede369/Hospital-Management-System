# PowerShell script to create .env file
$envContent = @"
# MongoDB Connection
MONGODB_URI=mongodb+srv://hmstusharproject_db_user:Tusharhms2026@hms.a8kou0t.mongodb.net/?appName=Hms

# Server Port
PORT=5000

# JWT Secret
JWT_SECRET=fbe904aa0293af35939fb9f59c9b6e4119c939f8e7aa50551e585658ecf5a0ef769ac6944b71732952ce1475c2b8648b392869f531b6bf02f860a2325264bf02

# Email Configuration (for password reset - optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
"@

$envPath = Join-Path $PSScriptRoot "backend\.env"
$envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
Write-Host ".env file created successfully at: $envPath" -ForegroundColor Green

