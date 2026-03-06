# PowerShell script to generate favicon files from source logo
# Usage: .\scripts\generate-favicons.ps1

Add-Type -AssemblyName System.Drawing

$sourceLogo = "public\assets\img\logo\my_logo.png"
$outputDir = "public"

# Check if source exists
if (-not (Test-Path $sourceLogo)) {
    Write-Error "Source logo not found: $sourceLogo"
    exit 1
}

Write-Host "Loading source image: $sourceLogo" -ForegroundColor Cyan

# Load source image
$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path $sourceLogo))

# Function to resize and save image
function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutputPath
    )
    
    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # High quality settings
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Draw resized image
    $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    
    # Save
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "Created: $OutputPath ($Width x $Height)" -ForegroundColor Green
}

# Generate all required favicon sizes
Write-Host "`nGenerating favicon files..." -ForegroundColor Yellow

Resize-Image -Image $sourceImage -Width 16 -Height 16 -OutputPath "$outputDir\favicon-16x16.png"
Resize-Image -Image $sourceImage -Width 32 -Height 32 -OutputPath "$outputDir\favicon-32x32.png"
Resize-Image -Image $sourceImage -Width 180 -Height 180 -OutputPath "$outputDir\apple-touch-icon.png"
Resize-Image -Image $sourceImage -Width 192 -Height 192 -OutputPath "$outputDir\icon-192.png"
Resize-Image -Image $sourceImage -Width 512 -Height 512 -OutputPath "$outputDir\icon-512.png"

# Cleanup
$sourceImage.Dispose()

Write-Host "All favicon files generated successfully!" -ForegroundColor Green
Write-Host "`nGenerated files in public/ folder:" -ForegroundColor Cyan
Write-Host "  - favicon-16x16.png (16x16)"
Write-Host "  - favicon-32x32.png (32x32)"
Write-Host "  - apple-touch-icon.png (180x180)"
Write-Host "  - icon-192.png (192x192)"
Write-Host "  - icon-512.png (512x512)"
