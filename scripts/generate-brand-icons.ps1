param(
  [string]$OutDir = "assets/images"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-Color {
  param(
    [Parameter(Mandatory = $true)][string]$Hex,
    [int]$Alpha = 255
  )

  $raw = $Hex.TrimStart("#")
  if ($raw.Length -ne 6) {
    throw "Hex color must be in #RRGGBB format: $Hex"
  }

  $r = [Convert]::ToInt32($raw.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($raw.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($raw.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
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

function Draw-AntiSlotEmblem {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [int]$CanvasSize,
    [double]$Scale = 0.72,
    [bool]$TransparentBackground = $false,
    [bool]$Monochrome = $false
  )

  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  if ($TransparentBackground) {
    $Graphics.Clear([System.Drawing.Color]::Transparent)
  } else {
    $backgroundRect = [System.Drawing.RectangleF]::new(0, 0, $CanvasSize, $CanvasSize)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      $backgroundRect,
      (New-Color -Hex "#091A2B"),
      (New-Color -Hex "#155A80"),
      140
    )
    $Graphics.FillRectangle($bgBrush, $backgroundRect)

    $glowBrush = New-Object System.Drawing.SolidBrush((New-Color -Hex "#8BC4DD" -Alpha 42))
    $Graphics.FillEllipse(
      $glowBrush,
      [System.Drawing.RectangleF]::new(
        $CanvasSize * 0.12,
        $CanvasSize * 0.08,
        $CanvasSize * 0.76,
        $CanvasSize * 0.62
      )
    )
    $glowBrush.Dispose()
    $bgBrush.Dispose()
  }

  $center = [double]($CanvasSize / 2)
  $outerDiameter = [double]($CanvasSize * $Scale)
  $outerX = [double]($center - ($outerDiameter / 2))
  $outerRect = [System.Drawing.RectangleF]::new($outerX, $outerX, $outerDiameter, $outerDiameter)

  if ($Monochrome) {
    $monoPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [float]($CanvasSize * 0.08))
    $monoPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $monoPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $Graphics.DrawEllipse($monoPen, $outerRect)

    $slashPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [float]($CanvasSize * 0.105))
    $slashPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $slashPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $offset = [float]($outerDiameter * 0.33)
    $Graphics.DrawLine(
      $slashPen,
      [float]($center - $offset),
      [float]($center + $offset),
      [float]($center + $offset),
      [float]($center - $offset)
    )

    $badgeDiameter = [float]($outerDiameter * 0.3)
    $badgeRect = [System.Drawing.RectangleF]::new(
      [float]($outerX + $outerDiameter - ($badgeDiameter * 0.9)),
      [float]($outerX + $outerDiameter - ($badgeDiameter * 0.9)),
      $badgeDiameter,
      $badgeDiameter
    )
    $Graphics.FillEllipse([System.Drawing.Brushes]::White, $badgeRect)

    $monoPen.Dispose()
    $slashPen.Dispose()
    return
  }

  $outerBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $outerRect,
    (New-Color -Hex "#0F5B7A"),
    (New-Color -Hex "#0B2D4A"),
    140
  )
  $Graphics.FillEllipse($outerBrush, $outerRect)
  $outerBrush.Dispose()

  $outerBorderPen = New-Object System.Drawing.Pen((New-Color -Hex "#F8FAFC" -Alpha 50), [float]($CanvasSize * 0.01))
  $Graphics.DrawEllipse($outerBorderPen, $outerRect)
  $outerBorderPen.Dispose()

  $innerDiameter = [double]($outerDiameter * 0.74)
  $innerRect = [System.Drawing.RectangleF]::new(
    [float]($center - ($innerDiameter / 2)),
    [float]($center - ($innerDiameter / 2)),
    [float]$innerDiameter,
    [float]$innerDiameter
  )
  $innerBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $innerRect,
    (New-Color -Hex "#1E6F95"),
    (New-Color -Hex "#133A5A"),
    120
  )
  $Graphics.FillEllipse($innerBrush, $innerRect)
  $innerBrush.Dispose()

  $diceSize = [double]($innerDiameter * 0.5)
  $diceRect = [System.Drawing.RectangleF]::new(
    [float]($center - ($diceSize / 2)),
    [float]($center - ($diceSize / 2)),
    [float]$diceSize,
    [float]$diceSize
  )

  $dicePath = New-RoundedRectPath -X $diceRect.X -Y $diceRect.Y -Width $diceRect.Width -Height $diceRect.Height -Radius ([float]($diceSize * 0.18))
  $diceFill = New-Object System.Drawing.SolidBrush((New-Color -Hex "#F8FAFC" -Alpha 28))
  $diceBorder = New-Object System.Drawing.Pen((New-Color -Hex "#F8FAFC" -Alpha 198), [float]($CanvasSize * 0.008))
  $Graphics.FillPath($diceFill, $dicePath)
  $Graphics.DrawPath($diceBorder, $dicePath)
  $diceFill.Dispose()
  $diceBorder.Dispose()
  $dicePath.Dispose()

  $pipBrush = New-Object System.Drawing.SolidBrush((New-Color -Hex "#F8FAFC"))
  $pipRadius = [float]($diceSize * 0.065)
  $pipOffsets = @(
    @(-0.22, -0.22),
    @(0.22, -0.22),
    @(0.0, 0.0),
    @(-0.22, 0.22),
    @(0.22, 0.22)
  )
  foreach ($offset in $pipOffsets) {
    $px = [float]($center + ($diceSize * $offset[0]))
    $py = [float]($center + ($diceSize * $offset[1]))
    $Graphics.FillEllipse($pipBrush, $px - $pipRadius, $py - $pipRadius, $pipRadius * 2, $pipRadius * 2)
  }
  $pipBrush.Dispose()

  $slashPen = New-Object System.Drawing.Pen((New-Color -Hex "#F97316"), [float]($CanvasSize * 0.065))
  $slashPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $slashPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $slashOffset = [float]($innerDiameter * 0.36)
  $Graphics.DrawLine(
    $slashPen,
    [float]($center - $slashOffset),
    [float]($center + $slashOffset),
    [float]($center + $slashOffset),
    [float]($center - $slashOffset)
  )
  $slashPen.Dispose()

  $badgeDiameter = [double]($outerDiameter * 0.34)
  $badgeRect = [System.Drawing.RectangleF]::new(
    [float]($outerX + $outerDiameter - ($badgeDiameter * 0.92)),
    [float]($outerX + $outerDiameter - ($badgeDiameter * 0.92)),
    [float]$badgeDiameter,
    [float]$badgeDiameter
  )
  $badgeBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $badgeRect,
    (New-Color -Hex "#D14343"),
    (New-Color -Hex "#9F1239"),
    120
  )
  $Graphics.FillEllipse($badgeBrush, $badgeRect)
  $badgeBrush.Dispose()

  $badgeBorder = New-Object System.Drawing.Pen((New-Color -Hex "#F8FAFC" -Alpha 216), [float]($CanvasSize * 0.008))
  $Graphics.DrawEllipse($badgeBorder, $badgeRect)
  $badgeBorder.Dispose()

  $shieldWidth = [double]($badgeDiameter * 0.44)
  $shieldHeight = [double]($badgeDiameter * 0.48)
  $shieldX = [double]($badgeRect.X + (($badgeDiameter - $shieldWidth) / 2))
  $shieldY = [double]($badgeRect.Y + ($badgeDiameter * 0.24))
  $shieldPoints = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new([float]$shieldX, [float]$shieldY),
    [System.Drawing.PointF]::new([float]($shieldX + $shieldWidth), [float]$shieldY),
    [System.Drawing.PointF]::new([float]($shieldX + ($shieldWidth * 0.88)), [float]($shieldY + ($shieldHeight * 0.64))),
    [System.Drawing.PointF]::new([float]($shieldX + ($shieldWidth * 0.5)), [float]($shieldY + $shieldHeight)),
    [System.Drawing.PointF]::new([float]($shieldX + ($shieldWidth * 0.12)), [float]($shieldY + ($shieldHeight * 0.64)))
  )
  $shieldPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $shieldPath.AddPolygon($shieldPoints)
  $shieldFill = New-Object System.Drawing.SolidBrush((New-Color -Hex "#FFFFFF"))
  $Graphics.FillPath($shieldFill, $shieldPath)
  $shieldFill.Dispose()
  $shieldPath.Dispose()

  $checkPen = New-Object System.Drawing.Pen((New-Color -Hex "#9F1239"), [float]($CanvasSize * 0.007))
  $checkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $checkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawLine(
    $checkPen,
    [float]($shieldX + ($shieldWidth * 0.24)),
    [float]($shieldY + ($shieldHeight * 0.55)),
    [float]($shieldX + ($shieldWidth * 0.44)),
    [float]($shieldY + ($shieldHeight * 0.76))
  )
  $Graphics.DrawLine(
    $checkPen,
    [float]($shieldX + ($shieldWidth * 0.44)),
    [float]($shieldY + ($shieldHeight * 0.76)),
    [float]($shieldX + ($shieldWidth * 0.78)),
    [float]($shieldY + ($shieldHeight * 0.4))
  )
  $checkPen.Dispose()
}

function New-BrandIcon {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][int]$Size,
    [double]$Scale = 0.72,
    [bool]$TransparentBackground = $false,
    [bool]$Monochrome = $false
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Draw-AntiSlotEmblem -Graphics $graphics -CanvasSize $Size -Scale $Scale -TransparentBackground $TransparentBackground -Monochrome $Monochrome
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

if (-not (Test-Path -Path $OutDir)) {
  New-Item -Path $OutDir -ItemType Directory | Out-Null
}

New-BrandIcon -Path (Join-Path $OutDir "icon.png") -Size 1024 -Scale 0.72
New-BrandIcon -Path (Join-Path $OutDir "splash-icon.png") -Size 1024 -Scale 0.58 -TransparentBackground $true
New-BrandIcon -Path (Join-Path $OutDir "android-icon-foreground.png") -Size 432 -Scale 0.7 -TransparentBackground $true
New-BrandIcon -Path (Join-Path $OutDir "android-icon-background.png") -Size 432 -Scale 0.95
New-BrandIcon -Path (Join-Path $OutDir "android-icon-monochrome.png") -Size 432 -Scale 0.72 -TransparentBackground $true -Monochrome $true
New-BrandIcon -Path (Join-Path $OutDir "favicon.png") -Size 128 -Scale 0.8

Write-Host "Brand icons generated in $OutDir"
