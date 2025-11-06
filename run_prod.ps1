$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

if (-not (Test-Path ".venv")) {
    py -m venv .venv
}

$python = Join-Path ".venv" "Scripts/python.exe"
$pip = Join-Path ".venv" "Scripts/pip.exe"
$waitressExe = Join-Path ".venv" "Scripts/waitress-serve.exe"

if (-not (Test-Path $python)) { throw "Python в .venv не найден." }

if (Test-Path "requirements.txt") {
    & $pip install -r requirements.txt | Out-Null
}

if (-not (Test-Path ".env") -and (Test-Path "example.env")) {
    Copy-Item "example.env" ".env"
}

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $kv = $line.Split('=', 2)
            $key = $kv[0].Trim()
            $value = $kv[1].Trim()
            [Environment]::SetEnvironmentVariable($key, $value)
            Set-Item -Path env:$key -Value $value
        }
    }
}

# значения по умолчанию
if (-not $env:HOST) { $env:HOST = '127.0.0.1' }
if (-not $env:PORT) { $env:PORT = '8000' }

# установка waitress в случае, если её нет
& $pip show waitress | Out-Null 2>$null
if ($LASTEXITCODE -ne 0 -and -not (Test-Path $waitressExe)) {
    & $pip install waitress | Out-Null
}

if (Test-Path $waitressExe) {
    & $waitressExe --host=$env:HOST --port=$env:PORT wsgi:application
} else {
    & $python -m waitress --host=$env:HOST --port=$env:PORT wsgi:application
}


