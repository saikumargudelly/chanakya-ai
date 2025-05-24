#!/bin/bash

# Clean Python cache and temporary files
find . -type d -name "__pycache__" -exec rm -r {} +
find . -type f -name "*.py[co]" -delete
find . -type d -name ".pytest_cache" -exec rm -r {} +
find . -type d -name ".mypy_cache" -exec rm -r {} +
find . -type d -name "htmlcov" -exec rm -r {} +
find . -type f -name ".coverage" -delete

# Clean frontend build artifacts
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name "out" -type d -prune -exec rm -rf '{}' +
find . -name ".vercel" -type d -prune -exec rm -rf '{}' +

# Remove Python virtual environment
if [ -d "venv" ]; then
    echo "Removing Python virtual environment..."
    rm -rf venv
fi

# Remove Python build artifacts
rm -rf build/ dist/ *.egg-info/

# Clean npm/yarn cache
echo "Cleaning npm cache..."
npm cache clean --force

echo "Cleanup complete!"
