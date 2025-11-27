#!/bin/bash

# ========================================
# Publish Spatuletail Game to GitHub Packages
# ========================================

set -e  # Exit on error

COLORS_RED='\033[0;31m'
COLORS_GREEN='\033[0;32m'
COLORS_YELLOW='\033[1;33m'
COLORS_BLUE='\033[0;34m'
COLORS_CYAN='\033[0;36m'
COLORS_NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "  GitHub Packages Publishing Script"
echo "========================================"
echo ""

# Check if GitHub token is configured
if ! npm config get //npm.pkg.github.com/:_authToken > /dev/null 2>&1; then
  echo -e "${COLORS_RED}❌ GitHub token not configured!${COLORS_NC}"
  echo -e "${COLORS_YELLOW}Please set your GitHub Personal Access Token:${COLORS_NC}"
  echo ""
  echo "  npm config set //npm.pkg.github.com/:_authToken YOUR_TOKEN"
  echo ""
  echo -e "${COLORS_CYAN}See GITHUB_PACKAGES.md for details on creating a token.${COLORS_NC}"
  exit 1
fi

echo -e "${COLORS_GREEN}✓ GitHub token configured${COLORS_NC}"

# Backup original package.json
echo -e "${COLORS_BLUE}📦 Backing up package.json...${COLORS_NC}"
cp package.json package-tern.json

# Update package.json for GitHub Packages
echo -e "${COLORS_BLUE}📝 Updating package.json for GitHub Packages...${COLORS_NC}"
cp albatross.json package.json

# Show what will be published
echo ""
echo -e "${COLORS_CYAN}Package to be published:${COLORS_NC}"
npm pack --dry-run | grep "name:" || true
npm pack --dry-run | grep "version:" || true
echo ""

# Confirm before publishing
read -p "Do you want to publish to GitHub Packages? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${COLORS_BLUE}🚀 Publishing to GitHub Packages...${COLORS_NC}"

  if npm publish; then
    echo ""
    echo -e "${COLORS_GREEN}✅ Successfully published to GitHub Packages!${COLORS_NC}"
    echo ""
    echo -e "${COLORS_CYAN}View your package at:${COLORS_NC}"
    echo "  https://github.com/palidintheonly/Spatuletail---Game/packages"
    echo ""
    echo -e "${COLORS_CYAN}Users can install with:${COLORS_NC}"
    echo "  npm install @palidintheonly/spatuletail-game"
    echo ""
  else
    echo ""
    echo -e "${COLORS_RED}❌ Publishing failed!${COLORS_NC}"
    echo -e "${COLORS_YELLOW}Restoring original package.json...${COLORS_NC}"
    mv package-tern.json package.json
    exit 1
  fi
else
  echo -e "${COLORS_YELLOW}Publishing cancelled.${COLORS_NC}"
fi

# Restore original package.json
echo -e "${COLORS_BLUE}🔄 Restoring original package.json...${COLORS_NC}"
mv package-tern.json package.json

echo ""
echo -e "${COLORS_GREEN}Done!${COLORS_NC}"
echo ""
