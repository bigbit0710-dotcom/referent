function Stop-PortListeners {
  param([int[]]$Ports)

  foreach ($port in $Ports) {
    netstat -ano | Select-String ":$port\s.*LISTENING" | ForEach-Object {
      if ($_.Line -match '\s(\d+)\s*$') {
        Stop-Process -Id ([int]$Matches[1]) -Force -ErrorAction SilentlyContinue
      }
    }
  }
}

Stop-PortListeners -Ports (3000..3010)
Start-Sleep -Seconds 2
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

Write-Host "Запуск dev-сервера на http://localhost:3000 ..."
pnpm dev
