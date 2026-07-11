param(
  [int[]]$Ports = @(5000, 5173),
  [string[]]$Folders = @()
)

$ErrorActionPreference = "SilentlyContinue"
$processIds = New-Object "System.Collections.Generic.HashSet[int]"

foreach ($port in $Ports) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object {
      if ($_ -and $_ -ne $PID) {
        [void]$processIds.Add([int]$_)
      }
    }
}

$processNamePattern = "^(node|npm|npm.cmd|npx|cmd)(\.exe)?$"
foreach ($folder in $Folders) {
  if ([string]::IsNullOrWhiteSpace($folder)) {
    continue
  }

  $resolvedFolder = (Resolve-Path -LiteralPath $folder -ErrorAction SilentlyContinue).Path
  if (-not $resolvedFolder) {
    $resolvedFolder = $folder
  }

  $needle = $resolvedFolder.ToLowerInvariant()
  Get-CimInstance Win32_Process |
    Where-Object {
      $_.ProcessId -ne $PID -and
      $_.CommandLine -and
      $_.Name -match $processNamePattern -and
      $_.CommandLine.ToLowerInvariant().Contains($needle)
    } |
    ForEach-Object {
      [void]$processIds.Add([int]$_.ProcessId)
    }
}

foreach ($processId in $processIds) {
  if ($processId -and $processId -ne $PID) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}
