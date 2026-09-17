param(
    [string]$Target = (Join-Path $env:USERPROFILE 'Documents\DAON backups'),
    [int]$KeepDays = 30,
    [string]$HostName = 'mcr'
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $Target | Out-Null

& scp -p -q "${HostName}:/var/backups/daon/reservations-*.json" $Target
if ($LASTEXITCODE -ne 0) {
    throw "scp could not copy the backups from $HostName (exit $LASTEXITCODE)"
}

$cutoff = (Get-Date).AddDays(-$KeepDays).ToString('yyyyMMdd')
Get-ChildItem -Path $Target -Filter 'reservations-*.json' | Where-Object {
    $_.BaseName -match '^reservations-(\d{8})$' -and $Matches[1] -lt $cutoff
} | Remove-Item -Force

$latest = Get-ChildItem -Path $Target -Filter 'reservations-*.json' | Sort-Object Name | Select-Object -Last 1
"$(Get-ChildItem -Path $Target -Filter 'reservations-*.json' | Measure-Object | Select-Object -ExpandProperty Count) backups in $Target, newest $($latest.Name)"
