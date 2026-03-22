param(
  [string]$ApiUrl = "https://api.antislot.app",
  [string]$SentryEnv = "production",
  [string]$SentryDsn = "",
  [string]$SentryTracesSampleRate = "0.2",
  [string]$SentryProfilesSampleRate = "0.0",
  [string]$EnableSmsRole = "false",
  [string]$EnableIap = "false",
  [string]$EnableNotifications = "false",
  [string]$PremiumFreeForNow = "false",
  [string]$FirebaseApiKey = "",
  [string]$FirebaseAuthDomain = "",
  [string]$FirebaseProjectId = "",
  [string]$FirebaseStorageBucket = "",
  [string]$FirebaseMessagingSenderId = "",
  [string]$FirebaseAppId = "",
  [string]$FirebaseMeasurementId = "",
  [string]$FirebaseDatabaseUrl = "",
  [string]$LiveSupportAgentId = "live_support_agent_1",
  [string]$LiveSupportAgentNameTr = "Canli Destek Uzmani",
  [string]$LiveSupportAgentNameEn = "Live Support Specialist",
  [switch]$SkipEasSecrets
)

$ErrorActionPreference = "Stop"

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string[]]$Lines
  )
  $content = ($Lines -join "`r`n")
  [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $Path), $content, [System.Text.UTF8Encoding]::new($false))
}

function Ensure-EnvKeys {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][hashtable]$Pairs
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    [System.IO.File]::WriteAllText($Path, "", [System.Text.UTF8Encoding]::new($false))
  }

  $lines = Get-Content -LiteralPath $Path
  $lineList = [System.Collections.Generic.List[string]]::new()
  foreach ($line in $lines) { [void]$lineList.Add($line) }

  foreach ($key in $Pairs.Keys) {
    $existingIndex = -1
    for ($i = 0; $i -lt $lineList.Count; $i++) {
      if ($lineList[$i] -match "^\s*$([regex]::Escape($key))=") {
        $existingIndex = $i
        break
      }
    }

    $newLine = "$key=$($Pairs[$key])"
    if ($existingIndex -ge 0) {
      $lineList[$existingIndex] = $newLine
    } else {
      [void]$lineList.Add($newLine)
    }
  }

  Write-Utf8NoBom -Path $Path -Lines $lineList
}

function Set-EasProjectSecret {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    Write-Host "SKIP (empty): $Name" -ForegroundColor Yellow
    return
  }

  Write-Host "SET SECRET: $Name" -ForegroundColor Cyan
  npx eas secret:create --scope project --name $Name --value $Value --type string --force --non-interactive | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to set EAS secret: $Name"
  }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $root "..")
Set-Location $projectRoot

$commonEnv = @{
  EXPO_PUBLIC_API_URL = $ApiUrl
  EXPO_PUBLIC_SENTRY_DSN = $SentryDsn
  EXPO_PUBLIC_SENTRY_ENV = $SentryEnv
  EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = $SentryTracesSampleRate
  EXPO_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE = $SentryProfilesSampleRate
  EXPO_PUBLIC_ENABLE_SMS_ROLE = $EnableSmsRole
  EXPO_PUBLIC_ENABLE_IAP = $EnableIap
  EXPO_PUBLIC_ENABLE_NOTIFICATIONS = $EnableNotifications
  EXPO_PUBLIC_PREMIUM_FREE_FOR_NOW = $PremiumFreeForNow
  EXPO_PUBLIC_FIREBASE_API_KEY = $FirebaseApiKey
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = $FirebaseAuthDomain
  EXPO_PUBLIC_FIREBASE_PROJECT_ID = $FirebaseProjectId
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = $FirebaseStorageBucket
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = $FirebaseMessagingSenderId
  EXPO_PUBLIC_FIREBASE_APP_ID = $FirebaseAppId
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID = $FirebaseMeasurementId
  EXPO_PUBLIC_FIREBASE_DATABASE_URL = $FirebaseDatabaseUrl
  EXPO_PUBLIC_LIVE_SUPPORT_AGENT_ID = $LiveSupportAgentId
  EXPO_PUBLIC_LIVE_SUPPORT_AGENT_NAME_TR = $LiveSupportAgentNameTr
  EXPO_PUBLIC_LIVE_SUPPORT_AGENT_NAME_EN = $LiveSupportAgentNameEn
}

Ensure-EnvKeys -Path ".env" -Pairs $commonEnv
Ensure-EnvKeys -Path ".env.production" -Pairs $commonEnv
Ensure-EnvKeys -Path ".env.example" -Pairs $commonEnv
Ensure-EnvKeys -Path ".env.production.example" -Pairs $commonEnv

Write-Host "Updated .env files." -ForegroundColor Green

if (-not $SkipEasSecrets) {
  npx eas whoami | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "EAS auth missing. Run: eas login"
  }

  foreach ($entry in $commonEnv.GetEnumerator()) {
    Set-EasProjectSecret -Name $entry.Key -Value ([string]$entry.Value)
  }

  Write-Host "EAS project secrets updated." -ForegroundColor Green
}

Write-Host "Done. Run: npm run preflight:release:mobile" -ForegroundColor Green

