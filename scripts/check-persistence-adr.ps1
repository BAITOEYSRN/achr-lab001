# Fitness Function: ADR 0001 — Local JSON Persistence
# ตรวจว่า implementation ยังสอดคล้อง ADR 0001 และ constitution Principle II
# Usage: powershell -ExecutionPolicy Bypass -File scripts/check-persistence-adr.ps1
# Exit 0 = pass, Exit 1 = violation

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repoRoot

$violations = @()

# 1. Forbidden database dependencies in package.json
$packageJsonPath = Join-Path $repoRoot "package.json"
if (-not (Test-Path $packageJsonPath)) {
    Write-Error "package.json not found"
    exit 1
}

$package = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$forbidden = @("sqlite3", "better-sqlite3", "sequelize")
$allDeps = @()
if ($package.dependencies) {
    $allDeps += $package.dependencies.PSObject.Properties.Name
}
if ($package.devDependencies) {
    $allDeps += $package.devDependencies.PSObject.Properties.Name
}

foreach ($dep in $forbidden) {
    if ($allDeps -contains $dep) {
        $violations += "Forbidden dependency found in package.json: $dep (ADR 0001)"
    }
}

# 2. Task store must use sync JSON file I/O
$taskStorePath = Join-Path $repoRoot "src\storage\taskStore.ts"
if (-not (Test-Path $taskStorePath)) {
    $violations += "Missing src/storage/taskStore.ts"
} else {
    $taskStoreSource = Get-Content $taskStorePath -Raw
    if ($taskStoreSource -notmatch "readFileSync") {
        $violations += "taskStore.ts must use fs.readFileSync (ADR 0001)"
    }
    if ($taskStoreSource -notmatch "writeFileSync") {
        $violations += "taskStore.ts must use fs.writeFileSync (ADR 0001)"
    }
    if ($taskStoreSource -match "sqlite|sequelize|better-sqlite") {
        $violations += "taskStore.ts references forbidden storage library"
    }
}

# 3. Default store path follows ADR follow-up decision
$pathsFile = Join-Path $repoRoot "src\lib\paths.ts"
if (Test-Path $pathsFile) {
    $pathsSource = Get-Content $pathsFile -Raw
    if ($pathsSource -notmatch "cli-task-manager") {
        $violations += "paths.ts should resolve ~/.cli-task-manager/tasks.json per ADR 0001"
    }
} else {
    $violations += "Missing src/lib/paths.ts"
}

if ($violations.Count -gt 0) {
    Write-Host "ADR 0001 fitness check FAILED:" -ForegroundColor Red
    foreach ($v in $violations) {
        Write-Host "  - $v" -ForegroundColor Red
    }
    exit 1
}

Write-Host "ADR 0001 fitness check PASSED - local JSON persistence guardrails intact." -ForegroundColor Green
exit 0
