@echo off
REM ========================================
REM Publish Spatuletail Game to GitHub Packages (Windows)
REM ========================================

echo.
echo ========================================
echo   GitHub Packages Publishing Script
echo ========================================
echo.

REM Check if GitHub token is configured
npm config get //npm.pkg.github.com/:_authToken >nul 2>&1
if errorlevel 1 (
  echo [31m ERROR: GitHub token not configured! [0m
  echo [33m Please set your GitHub Personal Access Token: [0m
  echo.
  echo   npm config set //npm.pkg.github.com/:_authToken YOUR_TOKEN
  echo.
  echo [36m See GITHUB_PACKAGES.md for details on creating a token. [0m
  exit /b 1
)

echo [32m OK: GitHub token configured [0m

REM Backup original package.json
echo [34m Backing up package.json... [0m
copy package.json package.json.backup >nul

REM Update package.json for GitHub Packages
echo [34m Updating package.json for GitHub Packages... [0m
copy package-github.json package.json >nul

REM Show what will be published
echo.
echo [36m Package to be published: [0m
npm pack --dry-run | findstr "name:"
npm pack --dry-run | findstr "version:"
echo.

REM Confirm before publishing
set /p confirm="Do you want to publish to GitHub Packages? (y/n): "
if /i not "%confirm%"=="y" (
  echo [33m Publishing cancelled. [0m
  del package.json.backup
  exit /b 0
)

echo [34m Publishing to GitHub Packages... [0m

npm publish
if errorlevel 1 (
  echo.
  echo [31m ERROR: Publishing failed! [0m
  echo [33m Restoring original package.json... [0m
  move /y package.json.backup package.json >nul
  exit /b 1
)

echo.
echo [32m SUCCESS: Published to GitHub Packages! [0m
echo.
echo [36m View your package at: [0m
echo   https://github.com/palidintheonly/Spatuletail---Game/packages
echo.
echo [36m Users can install with: [0m
echo   npm install @palidintheonly/spatuletail-game
echo.

REM Restore original package.json
echo [34m Restoring original package.json... [0m
move /y package.json.backup package.json >nul

echo.
echo [32m Done! [0m
echo.
