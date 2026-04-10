param(
  [string]$AvdName = 'Pixel_6_API_35',
  [string]$AppId = 'com.kineticsanctuary.app',
  [switch]$BootOnly
)

$ErrorActionPreference = 'Stop'

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

& $adbExe start-server | Out-Null

$devicesOutput = & $adbExe devices
$runningEmulator = ($devicesOutput | Select-String -Pattern '^emulator-\d+\s+device').Length -gt 0

if (-not $runningEmulator) {
  Write-Host "Starting emulator: $AvdName"
  Start-Process -FilePath $emulatorExe -ArgumentList @('-avd', $AvdName, '-no-snapshot', '-gpu', 'swiftshader_indirect') | Out-Null
}

Write-Host 'Waiting for emulator device...'
& $adbExe wait-for-device | Out-Null

Write-Host 'Waiting for Android boot completion...'
while ((& $adbExe shell getprop sys.boot_completed).Trim() -ne '1') {}

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
