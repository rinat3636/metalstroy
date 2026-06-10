# Загрузка проекта в rinat3636/metalstroy (заменяет main полностью)
# Использование:
#   $env:GITHUB_TOKEN = "github_pat_..."
#   .\scripts\push-metalstroy.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$token = $env:GITHUB_TOKEN
if (-not $token) {
  Write-Host "Задайте токен: `$env:GITHUB_TOKEN = 'github_pat_...'" -ForegroundColor Red
  Write-Host "Нужны права: Contents Read and write для репозитория metalstroy"
  exit 1
}

git remote set-url origin "https://x-access-token:${token}@github.com/rinat3636/metalstroy.git"
Write-Host "Пуш в metalstroy (main, force)..." -ForegroundColor Cyan
git push origin main --force
git remote set-url origin "https://github.com/rinat3636/metalstroy.git"
Write-Host "Готово: https://github.com/rinat3636/metalstroy" -ForegroundColor Green
