#!/bin/bash

# Railway Build Script
set -e

echo "🚀 Starting Railway build..."

# Check environment
echo "📋 Environment check:"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "NODE_VERSION: $(node --version)"
echo "YARN_VERSION: $(yarn --version)"
echo "PWD: $(pwd)"

# List files
echo "📁 Current directory contents:"
ls -la

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile --production=false

# Check if build directory exists
echo "🔍 Checking for .next directory..."
if [ -d ".next" ]; then
    echo "⚠️  .next directory exists, removing..."
    rm -rf .next
fi

# Build the application
echo "🏗️  Building application..."
NODE_ENV=production yarn build

# Verify build output
echo "✅ Build completed, checking output..."
if [ -d ".next" ]; then
    echo "📁 .next directory created successfully"
    ls -la .next/
else
    echo "❌ .next directory not found after build"
    exit 1
fi

echo "🎉 Railway build completed successfully!"
