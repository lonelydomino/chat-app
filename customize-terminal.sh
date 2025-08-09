#!/bin/bash

echo "🎨 Terminal Customization Options"
echo "================================"
echo ""
echo "1. Configure Powerlevel10k (current theme)"
echo "2. Change to Agnoster theme"
echo "3. Change to Dracula theme"
echo "4. Change to Spaceship theme"
echo "5. Add more useful aliases"
echo "6. Install Starship (alternative theme)"
echo "7. View current configuration"
echo "8. Exit"
echo ""
read -p "Choose an option (1-8): " choice

case $choice in
  1)
    echo "Running Powerlevel10k configuration..."
    p10k configure
    ;;
  2)
    echo "Changing to Agnoster theme..."
    sed -i '' 's/ZSH_THEME="powerlevel10k\/powerlevel10k"/ZSH_THEME="agnoster"/' ~/.zshrc
    echo "Theme changed! Restart your terminal to see changes."
    ;;
  3)
    echo "Changing to Dracula theme..."
    sed -i '' 's/ZSH_THEME="powerlevel10k\/powerlevel10k"/ZSH_THEME="dracula"/' ~/.zshrc
    echo "Theme changed! Restart your terminal to see changes."
    ;;
  4)
    echo "Changing to Spaceship theme..."
    sed -i '' 's/ZSH_THEME="powerlevel10k\/powerlevel10k"/ZSH_THEME="spaceship"/' ~/.zshrc
    echo "Theme changed! Restart your terminal to see changes."
    ;;
  5)
    echo "Adding more useful aliases..."
    cat >> ~/.zshrc << 'EOF'

# Additional useful aliases
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
alias ll="ls -la"
alias la="ls -a"
alias c="clear"
alias h="history"
alias j="jobs -l"
alias pu="pushd"
alias po="popd"
alias d="dirs -v"
alias 1="cd -"
alias 2="cd -2"
alias 3="cd -3"
alias 4="cd -4"
alias 5="cd -5"
alias 6="cd -6"
alias 7="cd -7"
alias 8="cd -8"
alias 9="cd -9"

# Git aliases
alias gs="git status"
alias ga="git add ."
alias gc="git commit -m"
alias gp="git push origin main"
alias gl="git log --oneline --graph --decorate"
alias gco="git checkout"
alias gcb="git checkout -b"
alias gb="git branch"
alias gd="git diff"
alias gdc="git diff --cached"

# Development aliases
alias dev="npm run dev"
alias build="npm run build"
alias start="npm start"
alias test="npm test"
alias lint="npm run lint"

# Database aliases
alias mongo="mongod --dbpath ~/mongodb-data"
alias redis="redis-server"

# Project specific
alias chat-app="cd ~/My\ Stuff/Software\ Development/Chat-App"
alias chat-dev="cd ~/My\ Stuff/Software\ Development/Chat-App && npm run dev"

# System aliases
alias ports="lsof -i -P -n | grep LISTEN"
alias myip="curl -s https://ipinfo.io/ip"
alias weather="curl -s wttr.in"
alias speedtest="curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python -"

EOF
    echo "Aliases added! Restart your terminal to use them."
    ;;
  6)
    echo "Installing Starship..."
    curl -sS https://starship.rs/install.sh | sh
    echo 'eval "$(starship init zsh)"' >> ~/.zshrc
    echo "Starship installed! Restart your terminal to see it."
    ;;
  7)
    echo "Current configuration:"
    echo "====================="
    grep "ZSH_THEME" ~/.zshrc
    echo ""
    echo "Current aliases:"
    grep "alias" ~/.zshrc | head -10
    ;;
  8)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo "Invalid option. Please choose 1-8."
    ;;
esac

echo ""
echo "🔄 Remember to restart your terminal to see changes!"
echo "💡 You can also run 'source ~/.zshrc' to reload without restarting." 