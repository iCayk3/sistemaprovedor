param(
    [string]$HostName = "localhost",
    [string]$Port = "5432",
    [string]$Database = "controle_instalacao",
    [string]$User = "postgres"
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptRoot "src\main\resources\popular_banco_completo_teste.sql"

if (-not (Test-Path $sqlFile)) {
    throw "Arquivo SQL nao encontrado: $sqlFile"
}

$psql = Get-Command psql.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1

if (-not $psql) {
    $candidates = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        ForEach-Object { Join-Path $_.FullName "bin\psql.exe" } |
        Where-Object { Test-Path $_ }

    $psql = $candidates | Select-Object -First 1
}

if (-not $psql) {
    throw "psql.exe nao encontrado. Instale o PostgreSQL Client ou informe o caminho completo do psql manualmente."
}

Write-Host "Usando psql: $psql"
Write-Host "Banco: $Database em ${HostName}:$Port"
Write-Host "Arquivo: $sqlFile"

& $psql -v ON_ERROR_STOP=1 -h $HostName -p $Port -U $User -d $Database -f $sqlFile

if ($LASTEXITCODE -ne 0) {
    throw "Falha ao popular banco. Codigo de saida: $LASTEXITCODE"
}

Write-Host "Banco populado com sucesso."
