<#
Usage:
  .\create_and_push_to_github.ps1 -RepoName "MyRepo" -Visibility public

This script will:
 - create a .gitignore (if missing)
 - init git (if missing), add and commit
 - create a GitHub repo under the account `Thandie-007` using `gh` if available
 - add origin and push

Notes:
 - Requires Git and either GitHub CLI (`gh`) logged in or a GitHub token for manual steps.
 - If you prefer to create the repo yourself, skip the `gh` steps and add remote manually.
#>
param(
    [string]$RepoName = $(Split-Path -Leaf (Get-Location)),
    [ValidateSet('public','private')]
    [string]$Visibility = 'public'
)

Write-Host "Preparing to push repository to GitHub: Thandie-007/$RepoName ($Visibility)"

# Create .gitignore if not exists
$gitignorePath = Join-Path (Get-Location) '.gitignore'
if (-not (Test-Path $gitignorePath)) {
    Write-Host "Creating .gitignore"
    @"
node_modules/
dist/
build/
.env
.env.*
.vscode/
.DS_Store
*.log
coverage/
frontend/node_modules/
frontend/dist/
backend/vendor/
*.sqlite
*.db
"@ | Out-File -FilePath $gitignorePath -Encoding UTF8
} else {
    Write-Host ".gitignore already exists"
}

# Initialize git if needed
if (-not (Test-Path '.git')) {
    git init
    Write-Host "Initialized empty git repository"
} else {
    Write-Host "Git repository already initialized"
}

# Stage and commit
git add -A
$existingCommit = git rev-parse --verify HEAD 2>$null
if ($LASTEXITCODE -ne 0) {
    git commit -m "chore: initial commit"
    Write-Host "Created initial commit"
} else {
    Write-Host "Repository already has commits"
}

# Create repo using gh if available
$ghAvailable = (Get-Command gh -ErrorAction SilentlyContinue) -ne $null
if ($ghAvailable) {
    Write-Host "GitHub CLI detected. Attempting to create repo Thandie-007/$RepoName"
    # Ensure user is authenticated
    try {
        gh auth status 2>&1 | Out-Null
        # Use --source and --remote to set origin and push
        gh repo create "Thandie-007/$RepoName" --$Visibility --source=. --remote=origin --push --confirm
        Write-Host "Repository created and pushed via gh: https://github.com/Thandie-007/$RepoName"
        exit 0
    } catch {
        Write-Warning "gh repo create failed: $_"
        Write-Host "You can create the repo manually or log in with 'gh auth login' and re-run this script."
    }
} else {
    Write-Host "GitHub CLI (gh) not found. Skipping automatic repo creation."
}

# Fallback instructions for manual remote creation using GitHub token
Write-Host "\nManual steps if gh is not available:\n"
Write-Host "1) Create a repository on GitHub at https://github.com/Thandie-007 (name: $RepoName)"
Write-Host "2) Add remote and push:"
Write-Host "   git remote add origin https://github.com/Thandie-007/$RepoName.git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"

Write-Host "\nOr, if you have a GITHUB_TOKEN env var you can run (PowerShell):"
Write-Host "  curl -H \"Authorization: token $env:GITHUB_TOKEN\" -d '{\"name\": \"$RepoName\", \"private\": $(if ($Visibility -eq 'private') { 'true' } else { 'false' })}' https://api.github.com/orgs/Thandie-007/repos"
Write-Host "  git remote add origin https://github.com/Thandie-007/$RepoName.git"
Write-Host "  git branch -M main"
Write-Host "  git push -u origin main"
