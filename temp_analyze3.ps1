$ErrorActionPreference = "Continue"
$file = "d:\TRAEworkspace\Ricky_finance_repository\Ricky_finance\temp_analysis.xlsx"

Write-Host "=== Trying COM Excel Application ==="
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $wb = $excel.Workbooks.Open($file)
    
    Write-Host "Sheets count: $($wb.Worksheets.Count)"
    foreach ($ws in $wb.Worksheets) {
        Write-Host "  Sheet: $($ws.Name)"
    }
    
    # Focus on first sheet "总资产摘要" or whatever sheet1 is
    $ws1 = $wb.Worksheets(1)
    Write-Host "`n========== Sheet1: $($ws1.Name) =========="
    $used = $ws1.UsedRange
    $maxRow = $used.Rows.Count
    $maxCol = $used.Columns.Count
    Write-Host "Rows: $maxRow, Cols: $maxCol"
    
    Write-Host "`n--- Column Widths ---"
    for ($c = 1; $c -le $maxCol; $c++) {
        $w = $ws1.Columns($c).ColumnWidth
        Write-Host "  Col $c : width=$w"
    }
    
    Write-Host "`n--- Row Heights (first 15) ---"
    for ($r = 1; $r -le [Math]::Min($maxRow, 15); $r++) {
        $h = $ws1.Rows($r).RowHeight
        Write-Host "  Row $r : height=$h"
    }
    
    Write-Host "`n--- Freeze Pane ---"
    try {
        $fp = $ws1.Application.ActiveWindow.FreezePanes
        Write-Host "  FreezePanes: $fp"
    } catch {}
    
    Write-Host "`n--- Cell Data & Formatting (rows 1-20) ---"
    for ($r = 1; $r -le [Math]::Min($maxRow, 20); $r++) {
        for ($c = 1; $c -le [Math]::Min($maxCol, 22); $c++) {
            $cell = $ws1.Cells($r, $c)
            $val = $cell.Value()
            $formula = $cell.Formula
            if ($val -ne $null -and $val.ToString().Trim() -ne "") {
                $fontName = $cell.Font.Name
                $fontSize = $cell.Font.Size
                $fontBold = $cell.Font.Bold
                $fontColor = $cell.Font.Color
                $bgColor = $cell.Interior.Color
                $hAlign = $cell.HorizontalAlignment
                $vAlign = $cell.VerticalAlignment
                $numFmt = $cell.NumberFormat
                $wrapText = $cell.WrapText
                $mergeCells = $cell.MergeCells
                $mergeArea = ""
                if ($mergeCells) { $mergeArea = $cell.MergeArea.Address(0,0) }
                
                $fw = "f=($fontName,$fontSize,b=$fontBold,c=$fontColor)"
                $bg = "bg=$bgColor"
                $ha = "ha=$hAlign"
                $va = "va=$vAlign"
                $nf = "fmt='$numFmt'"
                $mg = if($mergeCells){" MERGED:$mergeArea"}else{""}
                Write-Host "  ($r,$c): '$val' | $fw $bg $ha $va $nf wrap=$wrapText $mg"
            }
        }
    }
    
    # Focus on Sheet2
    if ($wb.Worksheets.Count -ge 2) {
        $ws2 = $wb.Worksheets(2)
        Write-Host "`n========== Sheet2: $($ws2.Name) =========="
        $used2 = $ws2.UsedRange
        $mr2 = $used2.Rows.Count
        $mc2 = $used2.Columns.Count
        Write-Host "Rows: $mr2, Cols: $mc2"
        
        Write-Host "`n--- Cell Data (rows 1-10) ---"
        for ($r = 1; $r -le [Math]::Min($mr2, 10); $r++) {
            for ($c = 1; $c -le [Math]::Min($mc2, 15); $c++) {
                $cell = $ws2.Cells($r, $c)
                $val = $cell.Value()
                if ($val -ne $null -and $val.ToString().Trim() -ne "") {
                    Write-Host "  ($r,$c): '$val' | f=($($cell.Font.Name),$($cell.Font.Size)) | bg=$($cell.Interior.Color) | fmt='$($cell.NumberFormat)'"
                }
            }
        }
    }
    
    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
} catch {
    Write-Host "COM failed: $_"
}