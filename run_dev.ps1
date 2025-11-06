$ErrorActionPreference = "Stop"

# перехожу в корень проекта (куда сохранён скрипт)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# создаю виртуальное окружение, если отсутствует
if (-not (Test-Path ".venv")) {
    py -m venv .venv
}

$python = Join-Path ".venv" "Scripts/python.exe"
$pip = Join-Path ".venv" "Scripts/pip.exe"

if (-not (Test-Path $python)) { throw "Python в .venv не найден." }

# устанавливаю зависимости, если есть requirements.txt
if (Test-Path "requirements.txt") {
    & $pip install -r requirements.txt | Out-Null
}

# если .env не существует, копирую из example.env
if (-not (Test-Path ".env") -and (Test-Path "example.env")) {
    Copy-Item "example.env" ".env"
}

# загружаю переменные окружения из .env
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

# запуск приложения (debug управляется через .env -> DEBUG)
& $python "app.py"


