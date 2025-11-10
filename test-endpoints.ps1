# Test Script for All Endpoints
Write-Host "`n=== Testing All Endpoints ===`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET
    Write-Host "   ✓ Health Check: OK" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Health Check Failed: $_" -ForegroundColor Red
}

# Test 2: Test Submission with Demo Data
Write-Host "`n2. Testing Test Submission Endpoint..." -ForegroundColor Yellow
$testData = @{
    name = "Test User " + (Get-Random -Minimum 1 -Maximum 1000)
    email = "test$(Get-Random -Minimum 1 -Maximum 10000)@example.com"
    testScore = Get-Random -Minimum 0 -Maximum 101
    feedback = "This is a test submission from PowerShell script"
    date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test/submit" -Method POST -Body $testData -ContentType "application/json"
    Write-Host "   ✓ Test Submission: SUCCESS" -ForegroundColor Green
    Write-Host "   Response: $($response.message)" -ForegroundColor Gray
    Write-Host "   ID: $($response.data.id)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Test Submission Failed: $_" -ForegroundColor Red
}

# Test 3: Login Test (Customer)
Write-Host "`n3. Testing Login Endpoint (Customer)..." -ForegroundColor Yellow
$loginData = @{
    email = "customer@example.com"
    password = "Password123!"
    role = "customer"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "   ✓ Login (Customer): SUCCESS" -ForegroundColor Green
    Write-Host "   Token received: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
    $global:customerToken = $response.token
} catch {
    Write-Host "   ✗ Login Failed: $_" -ForegroundColor Red
}

# Test 4: Login Test (Dealer)
Write-Host "`n4. Testing Login Endpoint (Dealer)..." -ForegroundColor Yellow
$dealerLoginData = @{
    email = "dealer@example.com"
    password = "Password123!"
    role = "dealer"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/login" -Method POST -Body $dealerLoginData -ContentType "application/json"
    Write-Host "   ✓ Login (Dealer): SUCCESS" -ForegroundColor Green
    Write-Host "   Token received: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
    $global:dealerToken = $response.token
} catch {
    Write-Host "   ✗ Dealer Login Failed: $_" -ForegroundColor Red
}

# Test 5: Get Products
Write-Host "`n5. Testing Products Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method GET
    Write-Host "   ✓ Get Products: SUCCESS" -ForegroundColor Green
    Write-Host "   Products found: $($response.data.products.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Get Products Failed: $_" -ForegroundColor Red
}

# Test 6: Contact Form Submission
Write-Host "`n6. Testing Contact Form Endpoint..." -ForegroundColor Yellow
$contactData = @{
    name = "Contact Test User"
    email = "contact$(Get-Random -Minimum 1 -Maximum 10000)@example.com"
    phone = "+91 9999 999 999"
    message = "This is a test contact form submission from PowerShell script"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/contact/submit" -Method POST -Body $contactData -ContentType "application/json"
    Write-Host "   ✓ Contact Submission: SUCCESS" -ForegroundColor Green
    Write-Host "   Response: $($response.message)" -ForegroundColor Gray
    Write-Host "   ID: $($response.data.id)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Contact Submission Failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Testing Complete ===`n" -ForegroundColor Cyan
Write-Host "All data should now be stored in MongoDB Atlas!" -ForegroundColor Green
Write-Host "Check your MongoDB Atlas dashboard to verify the data." -ForegroundColor Yellow

