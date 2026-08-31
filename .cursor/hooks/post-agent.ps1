$ErrorActionPreference = "Continue"

$logFile = Join-Path $PSScriptRoot "post-agent.log"

function Write-Log {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

try {
    $null = [Console]::In.ReadToEnd()

    $repoRoot = git rev-parse --show-toplevel 2>$null
    if (-not $repoRoot) {
        Write-Log "Skip: not a git repository"
        exit 0
    }

    Set-Location $repoRoot

    $chartFiles = @("graha-chart.html", "index.html")
    $changed = git status --porcelain -- @chartFiles

    if (-not $changed) {
        Write-Log "Skip: no chart file changes"
        exit 0
    }

    git add -- @chartFiles
    $commitMessage = "Auto: update graha chart ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
    git commit -m $commitMessage 2>&1 | ForEach-Object { Write-Log $_ }

    if ($LASTEXITCODE -eq 0) {
        git push 2>&1 | ForEach-Object { Write-Log $_ }
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Warning: git push failed"
        }
    } else {
        Write-Log "Warning: git commit failed or nothing to commit"
    }

    Copy-Item "graha-chart.html" "index.html" -Force
    $deployDir = Join-Path $repoRoot "deploy"
    if (-not (Test-Path $deployDir)) {
        New-Item -ItemType Directory -Path $deployDir | Out-Null
    }

    Copy-Item "index.html" (Join-Path $deployDir "index.html") -Force

    $harvisConfig = Join-Path $repoRoot "harvis.json"
    if (Test-Path $harvisConfig) {
        Copy-Item $harvisConfig (Join-Path $deployDir "harvis.json") -Force
    }

    Set-Location $deployDir
    $env:NPM_CONFIG_CACHE = Join-Path $repoRoot "npm-cache"
    $nodeDir = "C:\Program Files\nodejs"
    if (Test-Path $nodeDir) {
        $env:PATH = "$nodeDir;$env:PATH"
    }

    npx --yes harvis 2>&1 | ForEach-Object { Write-Log $_ }
    Write-Log "Deploy finished"
} catch {
    Write-Log "Error: $($_.Exception.Message)"
}

exit 0
