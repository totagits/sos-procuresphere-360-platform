# SOS ProcureSphere 360 - Automated Installation Script
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SOS ProcureSphere 360: Automated Setup & Config" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Install Node modules
Write-Host "`n[1/4] Installing dependencies across npm workspaces..." -ForegroundColor Yellow
npm install --no-audit --no-fund

# 2. Build shared package types
Write-Host "`n[2/4] Compiling shared package types..." -ForegroundColor Yellow
npm run build -w packages/shared

# 3. Compile Prisma client & push schema
Write-Host "`n[3/4] Initialising local SQLite database & prisma models..." -ForegroundColor Yellow
npx prisma db push --schema=apps/api/prisma/schema.prisma

# 4. Execute data seed
Write-Host "`n[4/4] Seeding default SOS Liberia grant parameters..." -ForegroundColor Yellow
npx ts-node apps/api/prisma/seed.ts

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  Setup completed! Launch the app using: .\run.ps1" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
