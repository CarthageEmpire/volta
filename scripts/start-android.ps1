param(
  [string]$AvdName = 'Pixel_5',
  [string]$AppId = 'com.kineticsanctuary.app',
  [switch]$BootOnly,
  [int]$BootTimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'

function Invoke-CommandWithTimeout {
  param(
    [scriptblock]$ScriptBlock,
    [object[]]$ArgumentList = @(),
    [int]$TimeoutSeconds = 15
  )

  $job = Start-Job -ScriptBlock $ScriptBlock -ArgumentList $ArgumentList
  try {
    if (Wait-Job -Job $job -Timeout $TimeoutSeconds) {
      return Receive-Job -Job $job
    }

    Stop-Job -Job $job -ErrorAction SilentlyContinue | Out-Null
    return $null
  }
  finally {
    Remove-Job -Job $job -Force -ErrorAction SilentlyContinue | Out-Null
  }
}

function Resolve-JavaHome {
  $candidates = @(
    'C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot',
    'C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot',
    'C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot'
  )

  foreach ($candidate in $candidates) {
    if (Test-Path "$candidate\bin\java.exe") {
      return $candidate
    }
  }

  return $null
}

function Get-BootCompleted {
  param(
    [string]$AdbPath
  )

  try {
    $output = Invoke-CommandWithTimeout -TimeoutSeconds 10 -ArgumentList @($AdbPath) -ScriptBlock {
      param($ResolvedAdbPath)
      & $ResolvedAdbPath shell getprop sys.boot_completed 2>$null
    }
    if ($null -eq $output) {
      return ''
    }

    return ($output | Out-String).Trim()
  }
  catch {
    return ''
  }
}

function Get-AvailableAvds {
  param(
    [string]$EmulatorPath
  )

  $avds = & $EmulatorPath -list-avds 2>$null
  if ($LASTEXITCODE -ne 0 -or $null -eq $avds) {
    return @()
  }

  return @($avds | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

function Resolve-AvdName {
  param(
    [string]$DesiredAvdName,
    [string[]]$AvailableAvds
  )

  if ($AvailableAvds -contains $DesiredAvdName) {
    return $DesiredAvdName
  }

  if ($AvailableAvds.Count -eq 1) {
    $fallback = $AvailableAvds[0]
    Write-Host "AVD '$DesiredAvdName' was not found. Using the only installed emulator: $fallback"
    return $fallback
  }

  if ($AvailableAvds.Count -gt 1) {
    $fallback = $AvailableAvds[0]
    Write-Host "AVD '$DesiredAvdName' was not found. Using '$fallback'. Available AVDs: $($AvailableAvds -join ', ')"
    return $fallback
  }

  throw 'No Android Virtual Devices were found. Create an emulator in Android Studio Device Manager first.'
}

function Get-RunningEmulatorSerial {
  param(
    [string]$AdbPath
  )

  $devices = & $AdbPath devices
  $match = $devices | Select-String -Pattern '^(emulator-\d+)\s+device'
  if ($match.Count -gt 0) {
    return $match[0].Matches[0].Groups[1].Value
  }

  return $null
}

function Stop-RunningEmulators {
  param(
    [string]$AdbPath
  )

  $serial = Get-RunningEmulatorSerial -AdbPath $AdbPath
  if ($serial) {
    try {
      & $AdbPath -s $serial emu kill | Out-Null
      Start-Sleep -Seconds 5
    }
    catch {
    }
  }

  Get-Process emulator,qemu-system-x86_64,qemu-system-x86_64-headless -ErrorAction SilentlyContinue |
    Stop-Process -Force -ErrorAction SilentlyContinue
}

function Start-EmulatorInstance {
  param(
    [string]$EmulatorPath,
    [string]$SelectedAvdName,
    [switch]$WipeData
  )

  $arguments = @('-avd', $SelectedAvdName, '-no-snapshot', '-gpu', 'swiftshader_indirect')
  if ($WipeData) {
    $arguments += '-wipe-data'
  }

  if ($WipeData) {
    Write-Host "Starting emulator with a clean data image: $SelectedAvdName"
  }
  else {
    Write-Host "Starting emulator: $SelectedAvdName"
  }

  Start-Process -FilePath $EmulatorPath -ArgumentList $arguments | Out-Null
}

function Wait-ForBootCompletion {
  param(
    [string]$AdbPath,
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  Write-Host 'Waiting for emulator device...'
  & $AdbPath wait-for-device | Out-Null

  Write-Host 'Waiting for Android boot completion...'
  while ((Get-Date) -lt $deadline) {
    if ((Get-BootCompleted -AdbPath $AdbPath) -eq '1') {
      return $true
    }

    Start-Sleep -Seconds 3
  }

  return $false
}

function Restart-Emulator {
  param(
    [string]$AdbPath,
    [string]$EmulatorPath,
    [string]$SelectedAvdName,
    [switch]$WipeData
  )

  Stop-RunningEmulators -AdbPath $AdbPath
  Start-Sleep -Seconds 3
  Start-EmulatorInstance -EmulatorPath $EmulatorPath -SelectedAvdName $SelectedAvdName -WipeData:$WipeData
}

function Test-BootCorruption {
  param(
    [string]$AdbPath
  )

  try {
    $logs = & $AdbPath logcat -d -b all 2>$null
    if ($null -eq $logs) {
      return $false
    }

    $text = $logs | Out-String
    return $text.Contains('No fallback file found for: /data/system/users/0/settings_global.xml')
  }
  catch {
    return $false
  }
}

$sdkRoot = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not (Test-Path $sdkRoot)) {
  throw "Android SDK not found at $sdkRoot"
}

$emulatorExe = Join-Path $sdkRoot 'emulator\emulator.exe'
$adbExe = Join-Path $sdkRoot 'platform-tools\adb.exe'
if (-not (Test-Path $emulatorExe)) {
  throw "Emulator executable not found at $emulatorExe"
}
if (-not (Test-Path $adbExe)) {
  throw "adb executable not found at $adbExe"
}

$javaHome = Resolve-JavaHome
if (-not $javaHome) {
  throw 'No suitable Java JDK found. Install JDK 21 (preferred) or JDK 17.'
}

$env:ANDROID_SDK_ROOT = $sdkRoot
$env:ANDROID_HOME = $sdkRoot
$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$sdkRoot\platform-tools;$sdkRoot\emulator;$sdkRoot\cmdline-tools\latest\bin;$env:Path"

Write-Host "Using JAVA_HOME: $javaHome"
Write-Host "Using ANDROID_SDK_ROOT: $sdkRoot"

$availableAvds = Get-AvailableAvds -EmulatorPath $emulatorExe
$selectedAvd = Resolve-AvdName -DesiredAvdName $AvdName -AvailableAvds $availableAvds

& $adbExe start-server | Out-Null

$runningEmulatorSerial = Get-RunningEmulatorSerial -AdbPath $adbExe

if (-not $runningEmulatorSerial) {
  Start-EmulatorInstance -EmulatorPath $emulatorExe -SelectedAvdName $selectedAvd
}
else {
  Write-Host "Using running emulator: $runningEmulatorSerial"
}

$bootCompleted = Wait-ForBootCompletion -AdbPath $adbExe -TimeoutSeconds $BootTimeoutSeconds

if (-not $bootCompleted) {
  Write-Host 'Existing emulator did not finish booting in time. Restarting it with a cold boot.'
  Restart-Emulator -AdbPath $adbExe -EmulatorPath $emulatorExe -SelectedAvdName $selectedAvd
  $bootCompleted = Wait-ForBootCompletion -AdbPath $adbExe -TimeoutSeconds $BootTimeoutSeconds
}

if (-not $bootCompleted) {
  if (Test-BootCorruption -AdbPath $adbExe) {
    Write-Host 'Detected corrupted emulator user data. Recreating the AVD data partition and booting again.'
    Restart-Emulator -AdbPath $adbExe -EmulatorPath $emulatorExe -SelectedAvdName $selectedAvd -WipeData
    $bootCompleted = Wait-ForBootCompletion -AdbPath $adbExe -TimeoutSeconds $BootTimeoutSeconds
  }

  if (-not $bootCompleted) {
    throw "Android emulator did not finish booting within $BootTimeoutSeconds seconds."
  }
}

if ($BootOnly) {
  Write-Host 'Emulator is ready.'
  exit 0
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
  Write-Host 'Building web app...'
  npm run build

  Write-Host 'Syncing Capacitor Android project...'
  npx cap sync android

  Write-Host 'Installing app on emulator...'
  Push-Location (Join-Path $repoRoot 'android')
  try {
    .\gradlew.bat installDebug
  }
  finally {
    Pop-Location
  }

  Write-Host 'Launching app...'
  & $adbExe shell am start -n "$AppId/.MainActivity" | Out-Null
  Write-Host 'Done. App is running on the emulator.'
}
finally {
  Pop-Location
}
