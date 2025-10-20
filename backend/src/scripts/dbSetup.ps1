Param(
  [string]$DbUser = "root",
  [string]$DbPassword = "1234",
  [string]$DbHost = "127.0.0.1",
  [int]$DbPort = 3306
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$repo = Split-Path -Parent $root
$schema = Join-Path $repo 'db/schema.sql'
$seed = Join-Path $repo 'db/seed.sql'

Write-Host "Running schema..." -ForegroundColor Cyan
Get-Content $schema -Raw | & mysql --host=$DbHost --port=$DbPort --user=$DbUser --password=$DbPassword

Write-Host "Running seed..." -ForegroundColor Cyan
Get-Content $seed -Raw | & mysql --host=$DbHost --port=$DbPort --user=$DbUser --password=$DbPassword

Write-Host "Database setup complete." -ForegroundColor Green
