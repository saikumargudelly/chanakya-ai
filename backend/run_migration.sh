#!/bin/bash

# Navigate to the backend directory
cd "$(dirname "$0")"

# Create the instance directory if it doesn't exist
mkdir -p instance

# Run the migration
python3 run_migration.py
