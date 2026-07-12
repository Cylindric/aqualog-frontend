#!/bin/bash
set -e

COLOR_RESET="\033[0m"
COLOR_GREEN="\033[0;32m"
COLOR_ORANGE="\033[0;33m"


if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${COLOR_ORANGE}Created .env file from .env.example. Please review and update it as needed.${COLOR_RESET}"
else
    echo -e "${COLOR_GREEN}.env file already exists. Skipping creation.${COLOR_RESET}"
fi

# if [ ! -d .venv ]; then
#     python3 -m venv .venv
#     echo -e "${COLOR_ORANGE}Created virtual environment in .venv.${COLOR_RESET}"
# else
#     echo -e "${COLOR_GREEN}Virtual environment already exists. Skipping creation.${COLOR_RESET}"
# fi

# Install system-wide dependencies
if ! command -v python3 &> /dev/null; then
    echo -e "${COLOR_ORANGE}Python3 is not installed. Please install it before running this script.${COLOR_RESET}"
    exit 1
fi
if ! command -v pipx &> /dev/null; then
    echo -e "${COLOR_ORANGE}pipx is not installed. Installing...${COLOR_RESET}"
    python3 -m pip install --user pipx
    python3 -m pipx ensurepath
fi
if ! command -v poetry &> /dev/null; then
    echo -e "${COLOR_ORANGE}poetry is not installed. Installing...${COLOR_RESET}"
    pipx install poetry
fi

# Install NVM if not already installed
if [ ! -d "$HOME/.nvm" ]; then
    echo -e "${COLOR_ORANGE}NVM is not installed. Installing...${COLOR_RESET}"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
fi

# Install Node.js using NVM if not already installed
if ! command -v node &> /dev/null; then
    echo -e "${COLOR_ORANGE}Node.js is not installed. Installing...${COLOR_RESET}"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    nvm install --lts
fi

# Update NPM dependencies
npm install

# Activate the virtual environment
eval $(poetry env activate)

# Install build-time dependencies
poetry install --with dev

# Create necessary directories if they don't exist
if [ ! -d ./.data ]; then
    mkdir -p ./.data/data
    mkdir -p ./.data/certs
    mkdir -p ./.data/custom-templates
    echo -e "${COLOR_ORANGE}Created necessary directories in ./.data.${COLOR_RESET}"
else
    echo -e "${COLOR_GREEN}Necessary directories already exist in ./.data. Skipping creation.${COLOR_RESET}"
fi
