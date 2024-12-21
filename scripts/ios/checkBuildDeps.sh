#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    local name=$1
    local version=$2
    local path=$3
    local status=$4
    
    printf "${BOLD}%-12s${NC}" "$name"
    
    if [ "$status" = "OK" ]; then
        printf "${GREEN}✓${NC} "
    else
        printf "${RED}✗${NC} "
    fi
    
    printf "%-45s" "$version"
    echo "$path"
}

echo -e "\n${BOLD}Checking iOS build dependencies...${NC}\n"

# Check Ruby
if command_exists ruby; then
    RUBY_VERSION=$(ruby -v)
    RUBY_PATH=$(which ruby)
    print_status "RUBY" "$RUBY_VERSION" "$RUBY_PATH" "OK"
else
    print_status "RUBY" "Not installed" "N/A" "ERROR"
fi

# Check Bundler
if command_exists bundle; then
    BUNDLER_VERSION=$(bundle -v)
    BUNDLER_PATH=$(which bundle)
    print_status "BUNDLER" "$BUNDLER_VERSION" "$BUNDLER_PATH" "OK"
else
    print_status "BUNDLER" "Not installed" "N/A" "ERROR"
fi

# Check CocoaPods
if command_exists pod; then
    POD_VERSION=$(pod --version)
    POD_PATH=$(which pod)
    print_status "COCOAPODS" "v$POD_VERSION" "$POD_PATH" "OK"
else
    print_status "COCOAPODS" "Not installed" "N/A" "ERROR"
fi

# Print Gem environment
echo -e "\n${BOLD}Ruby Gem Environment:${NC}"
echo "GEM HOME: $(gem env home)"
echo "GEM PATH: $(gem env gempath)"

# Check Gemfile configuration
if [ -f "ios/Gemfile" ]; then
    echo -e "\n${BOLD}Gemfile Configuration:${NC}"
    echo "Ruby Version: $(grep "ruby '" ios/Gemfile | cut -d"'" -f2)"
    echo "Bundler Version: $(grep "bundler" ios/Gemfile | grep -v "#" | head -n1)"
else
    echo -e "\n${RED}Warning: ios/Gemfile not found${NC}"
fi

echo -e "\nDone checking dependencies.\n" 