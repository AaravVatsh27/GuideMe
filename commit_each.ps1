$status = git status --porcelain
foreach ($line in $status) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $file = $line.Substring(3).Trim()
    if ($file -match '^"(.*)"$') {
        $file = $matches[1]
    }
    
    $action = "Update"
    if ($line.StartsWith("??")) {
        $action = "Add"
    } elseif ($line.StartsWith(" D")) {
        $action = "Remove"
    }

    Write-Host "Processing $file"
    git add $file
    git commit -m "$action $file"
}
git push
