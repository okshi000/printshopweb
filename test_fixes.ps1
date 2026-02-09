$token = "9|lD73gxAdJ9pQU10XbIDyR0X6bHmAv47taqP8B9Hkb4ec761e"
$baseUrl = "http://102.203.200.213/api"
$headers = @{
    "Accept" = "application/json"
    "Authorization" = "Bearer $token"
}

$results = @()
$testNum = 0

function Test-Api {
    param([string]$Method, [string]$Endpoint, [string]$Description)
    $script:testNum++
    $url = "$baseUrl$Endpoint"
    try {
        $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $headers -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
        $status = "PASS"
        $detail = "OK"
    } catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        $status = "FAIL-$statusCode"
        try {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $detail = ($reader.ReadToEnd() | ConvertFrom-Json).message
        } catch { $detail = $_.Exception.Message }
    }
    $script:results += [PSCustomObject]@{Num=$script:testNum; Endpoint=$Endpoint; Status=$status; Detail=$detail}
    Write-Host "$($script:testNum). [$Method] $Endpoint - $status - $detail"
}

Write-Host "=== Re-testing previously FAILED endpoints ==="
Write-Host ""

Test-Api "GET" "/customers/1" "Show customer 1"
Test-Api "GET" "/customers/1/transactions" "Customer 1 transactions"
Test-Api "GET" "/suppliers/1/transactions" "Supplier 1 transactions"
Test-Api "GET" "/accountant/analytics" "Accountant analytics"
Test-Api "GET" "/reports/financial/balance-sheet" "Financial balance sheet"
Test-Api "GET" "/reports/customers/report" "Customers report"
Test-Api "GET" "/reports/cash-flow/summary" "Cash flow summary"
Test-Api "GET" "/reports/cash-flow/trend" "Cash flow trend"
Test-Api "GET" "/reports/cash-flow/balance-by-source" "Balance by source"
Test-Api "GET" "/reports/cash-flow/daily-summary" "Daily summary"
Test-Api "GET" "/reports/cash-flow/forecast" "Cash flow forecast"
Test-Api "GET" "/reports-v2/customers/report" "V2 Customers report"
Test-Api "GET" "/reports-v2/cashflow/summary" "V2 Cashflow summary"
Test-Api "GET" "/reports-v2/cashflow/trend" "V2 Cashflow trend"
Test-Api "GET" "/reports-v2/cashflow/balance-by-source" "V2 Balance by source"
Test-Api "GET" "/reports-v2/cashflow/daily-summary" "V2 Daily summary"
Test-Api "GET" "/reports-v2/cashflow/forecast" "V2 Cashflow forecast"

Write-Host ""
$total = $results.Count
$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -like "FAIL*" }).Count
Write-Host "=== RESULTS: $passed/$total passed ==="

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "STILL FAILING:"
    $results | Where-Object { $_.Status -like "FAIL*" } | ForEach-Object {
        Write-Host "  $($_.Num). $($_.Endpoint) - $($_.Status) - $($_.Detail)"
    }
}
