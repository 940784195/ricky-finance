$ErrorActionPreference = "Continue"
$file = "d:\TRAEworkspace\Ricky_finance_repository\Ricky_finance\temp_analysis.xlsx"

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $wb = $excel.Workbooks.Open($file)
    
    Write-Host "=== ALL SHEETS ==="
    for ($i = 1; $i -le $wb.Worksheets.Count; $i++) {
        $ws = $wb.Worksheets($i)
        $used = $ws.UsedRange
        Write-Host "  $i : $($ws.Name) (Rows=$($used.Rows.Count), Cols=$($used.Columns.Count), TabColor=$($ws.Tab.Color))"
    }
    
    # Sheet3 - first month sheet
    if ($wb.Worksheets.Count -ge 3) {
        $ws3 = $wb.Worksheets(3)
        Write-Host "`n=== Sheet3: $($ws3.Name) (first 10 rows) ==="
        $used3 = $ws3.UsedRange
        for ($r = 1; $r -le [Math]::Min($used3.Rows.Count, 10); $r++) {
            for ($c = 1; $c -le [Math]::Min($used3.Columns.Count, 12); $c++) {
                $val = $ws3.Cells($r, $c).Value()
                if ($val -ne $null -and $val.ToString().Trim() -ne "") {
                    Write-Host "  ($r,$c): '$val' | bg=$($ws3.Cells($r,$c).Interior.Color)"
                }
            }
        }
    }
    
    # Sheet15
    if ($wb.Worksheets.Count -ge 15) {
        $ws15 = $wb.Worksheets(15)
        Write-Host "`n=== Sheet15: $($ws15.Name) (first 10 rows) ==="
        $used15 = $ws15.UsedRange
        for ($r = 1; $r -le [Math]::Min($used15.Rows.Count, 10); $r++) {
            for ($c = 1; $c -le [Math]::Min($used15.Columns.Count, 12); $c++) {
                $val = $ws15.Cells($r, $c).Value()
                if ($val -ne $null -and $val.ToString().Trim() -ne "") {
                    Write-Host "  ($r,$c): '$val' | bg=$($ws15.Cells($r,$c).Interior.Color)"
                }
            }
        }
    }
    
    # Sheet16
    if ($wb.Worksheets.Count -ge 16) {
        $ws16 = $wb.Worksheets(16)
        Write-Host "`n=== Sheet16: $($ws16.Name) (first 10 rows) ==="
        $used16 = $ws16.UsedRange
        for ($r = 1; $r -le [Math]::Min($used16.Rows.Count, 10); $r++) {
            for ($c = 1; $c -le [Math]::Min($used16.Columns.Count, 15); $c++) {
                $val = $ws16.Cells($r, $c).Value()
                if ($val -ne $null -and $val.ToString().Trim() -ne "") {
                    Write-Host "  ($r,$c): '$val' | bg=$($ws16.Cells($r,$c).Interior.Color)"
                }
            }
        }
    }
    
    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
} catch {
    Write-Host "Error: $_"
}