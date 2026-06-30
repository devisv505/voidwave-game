# =====================================================================
#  bump-version.ps1  —  cache-buster bumper for the VOIDWAVE site
# ---------------------------------------------------------------------
#  Rewrites the ?v=... token on every local css/js reference in the
#  .html files to a fresh timestamp, so visitors' browsers fetch the
#  NEW css/js instead of a stale cached copy.
#
#  Run it whenever you've changed a stylesheet or script, BEFORE you
#  commit + push:
#
#      ./bump-version.ps1
#      git add -A
#      git commit -m "update site"
#      git push
# =====================================================================
$stamp = Get-Date -Format 'yyyyMMddHHmm'
$enc   = New-Object System.Text.UTF8Encoding($false)   # UTF-8, no BOM
$pat   = '\.(css|js|gif|png|jpe?g|webp|mp4)\?v=[0-9]+'
$repl  = '.$1?v=' + $stamp

Get-ChildItem -LiteralPath $PSScriptRoot -Filter *.html -File | ForEach-Object {
    $t  = [IO.File]::ReadAllText($_.FullName)
    $t2 = [regex]::Replace($t, $pat, $repl)
    if ($t -ne $t2) {
        [IO.File]::WriteAllText($_.FullName, $t2, $enc)
        Write-Output ("bumped " + $_.Name)
    }
}
Write-Output ("cache version -> " + $stamp)
