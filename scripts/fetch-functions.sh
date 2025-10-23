#!/bin/bash

# Script to fetch all Supabase Edge Functions from remote to local
# Usage: ./scripts/fetch-functions.sh

set -e  # Exit on any error

echo "🚀 Starting Supabase Edge Functions fetch..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    print_error "supabase/config.toml not found. Please run this script from your project root."
    exit 1
fi

# Create functions directory if it doesn't exist
if [ ! -d "supabase/functions" ]; then
    print_status "Creating supabase/functions directory..."
    mkdir -p supabase/functions
fi

# Get list of functions from remote
print_status "Fetching list of remote functions..."
FUNCTIONS_LIST=$(supabase functions list 2>/dev/null | grep -E '[a-zA-Z0-9-]+[[:space:]]+\|[[:space:]]+[a-zA-Z0-9-]+' | awk -F'|' '{print $2}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$' | grep -v '^NAME$' || echo "")

if [ -z "$FUNCTIONS_LIST" ]; then
    print_error "Failed to get functions list. Please check your Supabase connection."
    exit 1
fi

# Convert to array
FUNCTIONS_ARRAY=($FUNCTIONS_LIST)

if [ ${#FUNCTIONS_ARRAY[@]} -eq 0 ]; then
    print_warning "No functions found on remote."
    exit 0
fi

print_status "Found ${#FUNCTIONS_ARRAY[@]} functions to download:"
for func in "${FUNCTIONS_ARRAY[@]}"; do
    echo "  - $func"
done

echo ""

# Download each function
SUCCESS_COUNT=0
FAILED_FUNCTIONS=()

for func in "${FUNCTIONS_ARRAY[@]}"; do
    print_status "Downloading function: $func"
    
    if supabase functions download "$func" >/dev/null 2>&1; then
        print_success "Downloaded: $func"
        ((SUCCESS_COUNT++))
    else
        print_error "Failed to download: $func"
        FAILED_FUNCTIONS+=("$func")
    fi
done

echo ""
print_status "Download Summary:"
print_success "Successfully downloaded: $SUCCESS_COUNT/${#FUNCTIONS_ARRAY[@]} functions"

if [ ${#FAILED_FUNCTIONS[@]} -gt 0 ]; then
    print_error "Failed to download: ${#FAILED_FUNCTIONS[@]} functions"
    echo "Failed functions:"
    for func in "${FAILED_FUNCTIONS[@]}"; do
        echo "  - $func"
    done
    echo ""
    print_warning "You can retry downloading failed functions individually:"
    for func in "${FAILED_FUNCTIONS[@]}"; do
        echo "  supabase functions download $func"
    done
fi

echo ""
print_success "✅ Functions fetch completed!"
print_status "Your functions are now available in: supabase/functions/"
