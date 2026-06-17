#!/bin/bash
# One-time setup for a fresh Mac: installs the tools needed to edit this site.
#
# On a brand-new Mac you don't have this file yet — bootstrap from Terminal:
#   curl -fsSL https://raw.githubusercontent.com/tlnagarut/workshop/main/setup.sh | bash
#
# Or, if you already have the project folder:
#   ./setup.sh
#
# Installs (via Homebrew): git, Node.js, and VS Code, then downloads the project.
# Python is NOT needed. There are no project dependencies to install.

set -e

REPO_URL="https://github.com/tlnagarut/workshop.git"
CLONE_DIR="$HOME/dev/tl-nagarut-site"

echo "🛠  TL Nagarut — setting up your Mac"
echo ""

# --- Homebrew -------------------------------------------------------------
if ! command -v brew >/dev/null 2>&1; then
  echo "▶ Installing Homebrew (the Mac package installer)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Make `brew` available in this script on Apple Silicon Macs.
  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
else
  echo "✓ Homebrew already installed"
fi

echo ""

# --- git ------------------------------------------------------------------
if ! command -v git >/dev/null 2>&1; then
  echo "▶ Installing git..."
  brew install git
else
  echo "✓ git already installed ($(git --version))"
fi

# --- Node.js --------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "▶ Installing Node.js..."
  brew install node
else
  echo "✓ Node.js already installed ($(node --version))"
fi

# --- VS Code --------------------------------------------------------------
if [ ! -d "/Applications/Visual Studio Code.app" ]; then
  echo "▶ Installing VS Code..."
  brew install --cask visual-studio-code
else
  echo "✓ VS Code already installed"
fi

echo ""

# --- The project itself ---------------------------------------------------
# If we're already inside the project folder, leave it be. Otherwise download
# it (this is what happens on a fresh Mac bootstrapped via curl | bash).
if [ -f "build.sh" ] && [ -d "tools" ]; then
  PROJECT_DIR="$(pwd)"
  echo "✓ Already inside the project folder"
elif [ -d "$CLONE_DIR" ]; then
  PROJECT_DIR="$CLONE_DIR"
  echo "✓ Project already downloaded at $CLONE_DIR"
else
  echo "▶ Downloading the website project to $CLONE_DIR..."
  mkdir -p "$(dirname "$CLONE_DIR")"
  git clone "$REPO_URL" "$CLONE_DIR"
  PROJECT_DIR="$CLONE_DIR"
fi

echo ""
echo "✅ All set! Next steps:"
echo "   1. Open the project:   cd \"$PROJECT_DIR\"  (and: code .  to edit in VS Code)"
echo "   2. After editing, run  ./build.sh    to rebuild the site"
echo "   3. Run  ./preview.sh   to see it in your browser"
echo ""
echo "   (Python is not needed, and there's nothing else to install.)"
