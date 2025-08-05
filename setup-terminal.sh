#!/bin/bash

echo "🚀 Setting up a better terminal environment..."

# Install Homebrew if not installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install useful tools
echo "🛠️ Installing useful terminal tools..."
brew install tree bat exa fzf htop

# Install iTerm2
echo "🖥️ Installing iTerm2..."
brew install --cask iterm2

# Install Oh My Zsh
echo "🐚 Installing Oh My Zsh..."
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi

# Install Powerlevel10k theme
echo "🎨 Installing Powerlevel10k theme..."
if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k" ]; then
    git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
fi

# Create a better .zshrc
echo "⚙️ Setting up .zshrc with useful configurations..."

cat > ~/.zshrc << 'EOF'
# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# Set theme
ZSH_THEME="powerlevel10k/powerlevel10k"

# Plugins
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh

# Useful aliases
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."

# Git shortcuts
alias gs="git status"
alias ga="git add ."
alias gc="git commit -m"
alias gp="git push origin main"
alias gl="git log --oneline --graph --decorate"

# Development
alias dev="npm run dev"
alias build="npm run build"
alias start="npm start"
alias test="npm test"

# Database shortcuts
alias mongo="mongod --dbpath ~/mongodb-data"
alias redis="redis-server"

# Better commands
alias ls="exa"
alias cat="bat"
alias top="htop"

# Clear screen
alias c="clear"

# Navigation
alias ll="exa -la"
alias la="exa -a"
alias lt="exa --tree"

# Project specific
alias chat-app="cd ~/My\ Stuff/Software\ Development/Chat-App"
alias chat-dev="cd ~/My\ Stuff/Software\ Development/Chat-App && npm run dev"

# Colors
export CLICOLOR=1
export LSCOLORS=ExFxBxDxCxegedabagacad

# History
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history
setopt SHARE_HISTORY

# Better completion
autoload -U compinit
zstyle ':completion:*' menu select
zmodload zsh/complist
compinit
_comp_options+=(globdots)

echo "🎉 Terminal setup complete! Restart your terminal to see the changes."
EOF

echo "✅ Terminal setup complete!"
echo "🔄 Please restart your terminal to see all the improvements!"
echo ""
echo "📝 What was installed:"
echo "   • iTerm2 (better terminal app)"
echo "   • Oh My Zsh (better shell)"
echo "   • Powerlevel10k (beautiful theme)"
echo "   • Useful tools: tree, bat, exa, fzf, htop"
echo "   • Custom aliases for development"
echo ""
echo "🎯 Quick commands you can now use:"
echo "   • 'dev' instead of 'npm run dev'"
echo "   • 'gs' instead of 'git status'"
echo "   • 'c' to clear screen"
echo "   • 'll' for better file listing"
echo "   • 'chat-app' to go to your project" 