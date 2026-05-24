$ErrorActionPreference = "Stop"
$file = "d:\TRAEworkspace\Ricky_finance_repository\Ricky_finance\temp_analysis.xlsx"

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($file)

# Read workbook for sheet names
$wbEntry = $zip.GetEntry("xl/workbook.xml")
$stream = $wbEntry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
Write-Host "=== WORKBOOK (sheet names) ==="
Write-Host $xml
$reader.Close()

# Read shared strings completely
$ssEntry = $zip.GetEntry("xl/sharedStrings.xml")
$stream = $ssEntry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
Write-Host "`n=== SHARED STRINGS (full) ==="
Write-Host $xml
$reader.Close()

$zip.Dispose()