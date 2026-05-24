$ErrorActionPreference = "Stop"
$file = "d:\TRAEworkspace\Ricky_finance_repository\Ricky_finance\temp_analysis.xlsx"

Write-Host "File exists: $(Test-Path $file)"

Write-Host "=== Trying ZIP ==="
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($file)
    foreach ($entry in $zip.Entries) {
        Write-Host "Entry: $($entry.FullName) ($($entry.Length) bytes)"
    }
    
    # Read shared strings
    $ssEntry = $zip.GetEntry("xl/sharedStrings.xml")
    if ($ssEntry) {
        $stream = $ssEntry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xml = $reader.ReadToEnd()
        Write-Host "=== SharedStrings (first 2000 chars) ==="
        Write-Host $xml.Substring(0, [Math]::Min(2000, $xml.Length))
        $reader.Close()
    }
    
    # Read styles
    $stylesEntry = $zip.GetEntry("xl/styles.xml")
    if ($stylesEntry) {
        $stream = $stylesEntry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xml = $reader.ReadToEnd()
        Write-Host "=== Styles (first 3000 chars) ==="
        Write-Host $xml.Substring(0, [Math]::Min(3000, $xml.Length))
        $reader.Close()
    }
    
    # Read sheet1
    $sheetEntry = $zip.GetEntry("xl/worksheets/sheet1.xml")
    if ($sheetEntry) {
        $stream = $sheetEntry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xml = $reader.ReadToEnd()
        Write-Host "=== Sheet1 XML (first 5000 chars) ==="
        Write-Host $xml.Substring(0, [Math]::Min(5000, $xml.Length))
        $reader.Close()
    }
    
    $zip.Dispose()
} catch {
    Write-Host "ZIP failed: $_"
}