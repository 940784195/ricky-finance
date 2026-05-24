$ErrorActionPreference = "Stop"
$file = "d:\TRAEworkspace\Ricky_finance_repository\Ricky_finance\.trae\skills\data-export\templates\2_资产分配记录表202601-202612.xlsx"

Write-Host "=== Trying COM Excel ==="
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $wb = $excel.Workbooks.Open($file)
    
    foreach ($ws in $wb.Worksheets) {
        Write-Host ""
        Write-Host "========== SHEET: $($ws.Name) =========="
        $usedRange = $ws.UsedRange
        $rows = $usedRange.Rows.Count
        $cols = $usedRange.Columns.Count
        Write-Host "Rows: $rows, Cols: $cols"
        
        Write-Host "--- Column Widths ---"
        for ($c = 1; $c -le $cols; $c++) {
            $w = $ws.Columns($c).ColumnWidth
            if ($w) { Write-Host "  Col $c : width=$w" }
        }
        
        Write-Host "--- Row Heights ---"
        for ($r = 1; $r -le [Math]::Min($rows, 5); $r++) {
            $h = $ws.Rows($r).RowHeight
            if ($h) { Write-Host "  Row $r : height=$h" }
        }
        
        Write-Host "--- Merged Cells ---"
        foreach ($mc in $ws.UsedRange.MergeArea) {
            if ($mc.MergeCells) {
                Write-Host "  $($mc.Address(0,0))"
            }
        }
        
        Write-Host "--- Cell Contents (first $([Math]::Min($rows, 30)) rows) ---"
        for ($r = 1; $r -le [Math]::Min($rows, 30); $r++) {
            for ($c = 1; $c -le $cols; $c++) {
                $cell = $ws.Cells($r, $c)
                $val = $cell.Value()
                if ($val -ne $null) {
                    $fontName = $cell.Font.Name
                    $fontSize = $cell.Font.Size
                    $fontBold = $cell.Font.Bold
                    $fontColor = $cell.Font.Color
                    $bgColor = $cell.Interior.Color
                    $hAlign = $cell.HorizontalAlignment
                    $vAlign = $cell.VerticalAlignment
                    $numFmt = $cell.NumberFormat
                    $wrapText = $cell.WrapText
                    
                    $info = "font=($fontName,$fontSize,bold=$fontBold,color=$fontColor) bg=$bgColor hAlign=$hAlign vAlign=$vAlign wrap=$wrapText numFmt=$numFmt"
                    Write-Host "  ($r,$c): val=$val | $info"
                }
            }
        }
    }
    
    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
} catch {
    Write-Host "COM failed: $_"
    Write-Host "=== Trying ZIP/XML ==="
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $zip = [System.IO.Compression.ZipFile]::OpenRead($file)
        foreach ($entry in $zip.Entries) {
            Write-Host "Entry: $($entry.FullName) ($($entry.Length) bytes)"
        }
        $zip.Dispose()
    } catch {
        Write-Host "ZIP also failed: $_"
    }
}