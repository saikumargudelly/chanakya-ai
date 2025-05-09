#!/bin/bash
# This script ensures Node 16 is used, installs dependencies, and starts the React frontend

# 1. Load nvm if installed via profile
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2. Install Node 16 if not present
nvm install 16
nvm use 16

# 3. Move to frontend directory
cd frontend

# 4. Clean and install dependencies
rm -rf node_modules package-lock.json
echo "Installing npm dependencies..."
npm install

# 5. Start the React development server
npm start
