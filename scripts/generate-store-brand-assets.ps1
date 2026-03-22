param(
  [string]$Root = "store-metadata/assets",
  [string]$IconPath = "assets/images/icon.png"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path -Path $IconPath)) {
  throw "Icon not found: $IconPath. Run scripts/generate-brand-icons.ps1 first."
}

$script:BrandIcon = [System.Drawing.Image]::FromFile($IconPath)

function New-Color {
  param(
    [Parameter(Mandatory = $true)][string]$Hex,
    [int]$Alpha = 255
  )

  $raw = $Hex.TrimStart("#")
  if ($raw.Length -ne 6) {
    throw "Hex color must be #RRGGBB: $Hex"
  }

  $r = [Convert]::ToInt32($raw.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($raw.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($raw.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function Get-Font {
  param(
    [float]$Size,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
  )

  try {
    return [System.Drawing.Font]::new("Segoe UI", $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
  } catch {
    return [System.Drawing.Font]::new("Arial", $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
  }
}

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = [Math]::Max(1, $Radius * 2)

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function Set-Quality {
  param([System.Drawing.Graphics]$Graphics)

  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $Graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
}

function Draw-GradientBackground {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Width,
    [int]$Height,
    [string]$StartHex,
    [string]$EndHex,
    [float]$Angle = 140
  )

  $rect = [System.Drawing.RectangleF]::new(0, 0, $Width, $Height)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    (New-Color -Hex $StartHex),
    (New-Color -Hex $EndHex),
    $Angle
  )
  $Graphics.FillRectangle($brush, $rect)
  $brush.Dispose()
}

function Draw-SoftCircle {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Diameter,
    [string]$Hex,
    [int]$Alpha
  )

  $brush = New-Object System.Drawing.SolidBrush((New-Color -Hex $Hex -Alpha $Alpha))
  $Graphics.FillEllipse($brush, [System.Drawing.RectangleF]::new($X, $Y, $Diameter, $Diameter))
  $brush.Dispose()
}

function Fill-RoundedRect {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Brush]$Brush,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-RoundedRectPath -X $X -Y $Y -Width $Width -Height $Height -Radius $Radius
  $Graphics.FillPath($Brush, $path)
  $path.Dispose()
}

function Draw-RoundedRect {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-RoundedRectPath -X $X -Y $Y -Width $Width -Height $Height -Radius $Radius
  $Graphics.DrawPath($Pen, $path)
  $path.Dispose()
}

function Draw-LeftText {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [string]$Hex,
    [int]$Alpha,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height
  )

  $brush = New-Object System.Drawing.SolidBrush((New-Color -Hex $Hex -Alpha $Alpha))
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Near
  $format.LineAlignment = [System.Drawing.StringAlignment]::Near
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $format.FormatFlags = [System.Drawing.StringFormatFlags]::LineLimit
  $Graphics.DrawString($Text, $Font, $brush, [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height), $format)
  $format.Dispose()
  $brush.Dispose()
}

function Draw-Chip {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [float]$X,
    [float]$Y,
    [float]$Scale
  )

  $chipHeight = 42 * $Scale
  $chipWidth = 190 * $Scale
  $radius = 20 * $Scale

  $chipBrush = New-Object System.Drawing.SolidBrush((New-Color -Hex "#F8FAFC" -Alpha 32))
  Fill-RoundedRect -Graphics $Graphics -Brush $chipBrush -X $X -Y $Y -Width $chipWidth -Height $chipHeight -Radius $radius
  $chipBrush.Dispose()

  $chipBorder = New-Object System.Drawing.Pen((New-Color -Hex "#E2E8F0" -Alpha 90), [float](1.2 * $Scale))
  Draw-RoundedRect -Graphics $Graphics -Pen $chipBorder -X $X -Y $Y -Width $chipWidth -Height $chipHeight -Radius $radius
  $chipBorder.Dispose()

  $font = Get-Font -Size (18 * $Scale) -Style ([System.Drawing.FontStyle]::Bold)
  Draw-LeftText -Graphics $Graphics -Text $Text -Font $font -Hex "#F8FAFC" -Alpha 245 -X ($X + (18 * $Scale)) -Y ($Y + (10 * $Scale)) -Width ($chipWidth - (24 * $Scale)) -Height ($chipHeight - (12 * $Scale))
  $font.Dispose()
}

function Draw-FeatureGraphic {
  param([string]$Path)

  $width = 1024
  $height = 500
  $bmp = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  Set-Quality -Graphics $g

  Draw-GradientBackground -Graphics $g -Width $width -Height $height -StartHex "#07192A" -EndHex "#12567B" -Angle 143
  Draw-SoftCircle -Graphics $g -X 40 -Y -120 -Diameter 520 -Hex "#8BC4DD" -Alpha 36
  Draw-SoftCircle -Graphics $g -X 640 -Y 140 -Diameter 380 -Hex "#F2C94C" -Alpha 24
  Draw-SoftCircle -Graphics $g -X 760 -Y -40 -Diameter 220 -Hex "#93C5FD" -Alpha 34

  $g.DrawImage($script:BrandIcon, [System.Drawing.RectangleF]::new(54, 62, 352, 352))

  $titleFont = Get-Font -Size 86 -Style ([System.Drawing.FontStyle]::Bold)
  $subtitleFont = Get-Font -Size 34 -Style ([System.Drawing.FontStyle]::Regular)
  $metaFont = Get-Font -Size 20 -Style ([System.Drawing.FontStyle]::Regular)

  Draw-LeftText -Graphics $g -Text "ANTI SLOT" -Font $titleFont -Hex "#F8FAFC" -Alpha 252 -X 418 -Y 58 -Width 590 -Height 150
  Draw-LeftText -Graphics $g -Text "Break the gambling loop before it starts." -Font $subtitleFont -Hex "#E2E8F0" -Alpha 245 -X 420 -Y 190 -Width 560 -Height 100

  Draw-Chip -Graphics $g -Text "Urge support" -X 420 -Y 276 -Scale 1
  Draw-Chip -Graphics $g -Text "Money guard" -X 620 -Y 276 -Scale 1
  Draw-Chip -Graphics $g -Text "Daily progress" -X 820 -Y 276 -Scale 1

  Draw-LeftText -Graphics $g -Text "Store preview artwork" -Font $metaFont -Hex "#E2E8F0" -Alpha 190 -X 420 -Y 436 -Width 300 -Height 46

  $titleFont.Dispose()
  $subtitleFont.Dispose()
  $metaFont.Dispose()
  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

function Draw-StatPill {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Scale,
    [string]$Value,
    [string]$Label
  )

  $pillBrush = New-Object System.Drawing.SolidBrush((New-Color -Hex "#F8FAFC" -Alpha 236))
  Fill-RoundedRect -Graphics $Graphics -Brush $pillBrush -X $X -Y $Y -Width $Width -Height $Height -Radius (22 * $Scale)
  $pillBrush.Dispose()

  $valueFont = Get-Font -Size (58 * $Scale) -Style ([System.Drawing.FontStyle]::Bold)
  $labelFont = Get-Font -Size (22 * $Scale) -Style ([System.Drawing.FontStyle]::Bold)

  Draw-LeftText -Graphics $Graphics -Text $Value -Font $valueFont -Hex "#0F172A" -Alpha 255 -X ($X + (28 * $Scale)) -Y ($Y + (20 * $Scale)) -Width ($Width * 0.6) -Height ($Height - (20 * $Scale))
  Draw-LeftText -Graphics $Graphics -Text $Label -Font $labelFont -Hex "#334155" -Alpha 240 -X ($X + (34 * $Scale)) -Y ($Y + (92 * $Scale)) -Width ($Width * 0.8) -Height ($Height - (80 * $Scale))

  $valueFont.Dispose()
  $labelFont.Dispose()
}

function Draw-InfoCard {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Scale,
    [string]$Title,
    [string]$Body
  )

  $fill = New-Object System.Drawing.SolidBrush((New-Color -Hex "#0B2D4A" -Alpha 222))
  Fill-RoundedRect -Graphics $Graphics -Brush $fill -X $X -Y $Y -Width $Width -Height $Height -Radius (26 * $Scale)
  $fill.Dispose()

  $border = New-Object System.Drawing.Pen((New-Color -Hex "#93C5FD" -Alpha 95), [float](1.5 * $Scale))
  Draw-RoundedRect -Graphics $Graphics -Pen $border -X $X -Y $Y -Width $Width -Height $Height -Radius (26 * $Scale)
  $border.Dispose()

  $dotBrush = New-Object System.Drawing.SolidBrush((New-Color -Hex "#F97316" -Alpha 245))
  $dotSize = 11 * $Scale
  $Graphics.FillEllipse($dotBrush, $X + (24 * $Scale), $Y + (28 * $Scale), $dotSize, $dotSize)
  $dotBrush.Dispose()

  $titleFont = Get-Font -Size (30 * $Scale) -Style ([System.Drawing.FontStyle]::Bold)
  $bodyFont = Get-Font -Size (20 * $Scale) -Style ([System.Drawing.FontStyle]::Regular)

  Draw-LeftText -Graphics $Graphics -Text $Title -Font $titleFont -Hex "#F8FAFC" -Alpha 255 -X ($X + (45 * $Scale)) -Y ($Y + (18 * $Scale)) -Width ($Width - (60 * $Scale)) -Height (52 * $Scale)
  Draw-LeftText -Graphics $Graphics -Text $Body -Font $bodyFont -Hex "#CBD5E1" -Alpha 240 -X ($X + (26 * $Scale)) -Y ($Y + (60 * $Scale)) -Width ($Width - (44 * $Scale)) -Height ($Height - (70 * $Scale))

  $titleFont.Dispose()
  $bodyFont.Dispose()
}

function Draw-PhoneScreenshot {
  param(
    [string]$Path,
    [int]$Width,
    [int]$Height,
    [string]$StartHex,
    [string]$EndHex,
    [string]$Headline,
    [string]$Subline,
    [string]$StatValue,
    [string]$StatLabel,
    [string]$Card1Title,
    [string]$Card1Body,
    [string]$Card2Title,
    [string]$Card2Body
  )

  $bmp = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  Set-Quality -Graphics $g

  Draw-GradientBackground -Graphics $g -Width $Width -Height $Height -StartHex $StartHex -EndHex $EndHex -Angle 143
  Draw-SoftCircle -Graphics $g -X ($Width * 0.06) -Y (-$Height * 0.09) -Diameter ($Width * 0.92) -Hex "#8BC4DD" -Alpha 35
  Draw-SoftCircle -Graphics $g -X ($Width * 0.55) -Y ($Height * 0.72) -Diameter ($Width * 0.55) -Hex "#F59E0B" -Alpha 20

  $scale = $Width / 1080.0
  $margin = 62 * $scale
  $top = 56 * $scale

  $logoSize = 122 * $scale
  $g.DrawImage($script:BrandIcon, [System.Drawing.RectangleF]::new($margin, $top, $logoSize, $logoSize))

  $brandFont = Get-Font -Size (66 * $scale) -Style ([System.Drawing.FontStyle]::Bold)
  $headlineFont = Get-Font -Size (48 * $scale) -Style ([System.Drawing.FontStyle]::Bold)
  $sublineFont = Get-Font -Size (26 * $scale) -Style ([System.Drawing.FontStyle]::Regular)

  Draw-LeftText -Graphics $g -Text "ANTI SLOT" -Font $brandFont -Hex "#F8FAFC" -Alpha 252 -X ($margin + $logoSize + (26 * $scale)) -Y ($top + (6 * $scale)) -Width ($Width - ($margin * 2) - $logoSize - (12 * $scale)) -Height (126 * $scale)
  Draw-LeftText -Graphics $g -Text $Headline -Font $headlineFont -Hex "#F8FAFC" -Alpha 255 -X $margin -Y ($top + $logoSize + (18 * $scale)) -Width ($Width - ($margin * 2)) -Height (120 * $scale)
  Draw-LeftText -Graphics $g -Text $Subline -Font $sublineFont -Hex "#DBEAFE" -Alpha 240 -X $margin -Y ($top + $logoSize + (122 * $scale)) -Width ($Width - ($margin * 2)) -Height (76 * $scale)

  $panelX = $margin
  $panelY = $top + $logoSize + (220 * $scale)
  $panelW = $Width - ($margin * 2)
  $panelH = 700 * $scale
  $panelRadius = 46 * $scale

  $panelFill = New-Object System.Drawing.SolidBrush((New-Color -Hex "#F8FAFC" -Alpha 244))
  Fill-RoundedRect -Graphics $g -Brush $panelFill -X $panelX -Y $panelY -Width $panelW -Height $panelH -Radius $panelRadius
  $panelFill.Dispose()

  $panelBorder = New-Object System.Drawing.Pen((New-Color -Hex "#FFFFFF" -Alpha 196), [float](2.2 * $scale))
  Draw-RoundedRect -Graphics $g -Pen $panelBorder -X $panelX -Y $panelY -Width $panelW -Height $panelH -Radius $panelRadius
  $panelBorder.Dispose()

  $statX = $panelX + (34 * $scale)
  $statY = $panelY + (34 * $scale)
  $statW = $panelW - (68 * $scale)
  $statH = 196 * $scale
  Draw-StatPill -Graphics $g -X $statX -Y $statY -Width $statW -Height $statH -Scale $scale -Value $StatValue -Label $StatLabel

  $cardW = $panelW - (68 * $scale)
  $cardH = 174 * $scale
  $card1Y = $statY + $statH + (22 * $scale)
  $card2Y = $card1Y + $cardH + (20 * $scale)

  Draw-InfoCard -Graphics $g -X ($panelX + (34 * $scale)) -Y $card1Y -Width $cardW -Height $cardH -Scale $scale -Title $Card1Title -Body $Card1Body
  Draw-InfoCard -Graphics $g -X ($panelX + (34 * $scale)) -Y $card2Y -Width $cardW -Height $cardH -Scale $scale -Title $Card2Title -Body $Card2Body

  $noteFont = Get-Font -Size (18 * $scale) -Style ([System.Drawing.FontStyle]::Regular)
  Draw-LeftText -Graphics $g -Text "Preview concept - replace with live app captures before final submit." -Font $noteFont -Hex "#DBEAFE" -Alpha 200 -X $margin -Y ($Height - (58 * $scale)) -Width ($Width - (2 * $margin)) -Height (32 * $scale)

  $brandFont.Dispose()
  $headlineFont.Dispose()
  $sublineFont.Dispose()
  $noteFont.Dispose()
  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

function Ensure-ParentDirectory {
  param([string]$Path)

  $parent = Split-Path -Path $Path -Parent
  if (-not (Test-Path -Path $parent)) {
    New-Item -Path $parent -ItemType Directory -Force | Out-Null
  }
}

try {
  $featurePath = Join-Path $Root "android/feature-graphic.png"
  $androidOne = Join-Path $Root "android/phone/screenshot-01.png"
  $androidTwo = Join-Path $Root "android/phone/screenshot-02.png"
  $iosOne = Join-Path $Root "ios/6.7/screenshot-01.png"

  Ensure-ParentDirectory -Path $featurePath
  Ensure-ParentDirectory -Path $androidOne
  Ensure-ParentDirectory -Path $iosOne

  Draw-FeatureGraphic -Path $featurePath

  Draw-PhoneScreenshot -Path $androidOne -Width 1080 -Height 1920 -StartHex "#071A2B" -EndHex "#145A80" -Headline "Craving hits. You stay in control." -Subline "Fast support flows and emergency actions in one tap." -StatValue "26 days" -StatLabel "steady streak" -Card1Title "2-minute calm protocol" -Card1Body "Breathing, grounding, and focus reset tools." -Card2Title "Money guard active" -Card2Body "Safer boundaries for high-risk spending moments."
  Draw-PhoneScreenshot -Path $androidTwo -Width 1080 -Height 1920 -StartHex "#0B1F33" -EndHex "#1B6A84" -Headline "Track progress. Build momentum." -Subline "Daily streaks, journals, and practical recovery modules." -StatValue "91%" -StatLabel "consistency score" -Card1Title "Progress timeline" -Card1Body "See wins, relapses, and comeback patterns clearly." -Card2Title "Private daily diary" -Card2Body "Capture triggers and lessons with local-safe storage."
  Draw-PhoneScreenshot -Path $iosOne -Width 1290 -Height 2796 -StartHex "#071A2B" -EndHex "#0F5B7A" -Headline "Your pocket recovery partner." -Subline "Structured support, safer habits, and visible growth." -StatValue "42 days" -StatLabel "gamble-free" -Card1Title "Urgency playbook" -Card1Body "Step-by-step tools when temptation spikes fast." -Card2Title "Reality modules" -Card2Body "Practical exercises to weaken gambling impulses."

  Write-Host "Store brand assets generated under $Root"
}
finally {
  if ($null -ne $script:BrandIcon) {
    $script:BrandIcon.Dispose()
  }
}
