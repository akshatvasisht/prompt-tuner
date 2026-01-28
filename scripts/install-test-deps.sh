#!/bin/bash
# Install system dependencies for Playwright Chromium on Ubuntu/Debian
#
# This script installs the required shared libraries for running
# Playwright's Chromium browser in automated tests.
#
# Usage: sudo bash scripts/install-test-deps.sh

set -e

echo "Installing Playwright Chromium system dependencies..."

# Update package list
apt-get update

# Install required packages
apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2

echo "✓ System dependencies installed successfully"
echo ""
echo "You can now run: npm run test:e2e"
