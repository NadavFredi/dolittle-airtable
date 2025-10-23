#!/bin/bash

# Script to deploy all local Supabase Edge Functions to remote
# Usage: ./scripts/deploy-functions.sh [function-name] (optional - deploy specific function)

set -e  # Exit on any error

echo "🚀 Starting Supabase Edge Functions deployment..."

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

# Check if functions directory exists
if [ ! -d "supabase/functions" ]; then
    print_error "supabase/functions directory not found. Please fetch functions first."
    exit 1
fi

# If a specific function is provided, deploy only that one
if [ $# -eq 1 ]; then
    FUNCTION_NAME=$1
    if [ ! -d "supabase/functions/$FUNCTION_NAME" ]; then
        print_error "Function '$FUNCTION_NAME' not found in supabase/functions/"
        exit 1
    fi
    
    print_status "Deploying specific function: $FUNCTION_NAME"
    if supabase functions deploy "$FUNCTION_NAME"; then
        print_success "Successfully deployed: $FUNCTION_NAME"
    else
        print_error "Failed to deploy: $FUNCTION_NAME"
        exit 1
    fi
    exit 0
fi

# Get list of local functions
print_status "Scanning local functions..."
cd supabase/functions
LOCAL_FUNCTIONS=($(ls -d */ 2>/dev/null | sed 's/\///' || echo ""))

if [ ${#LOCAL_FUNCTIONS[@]} -eq 0 ]; then
    print_warning "No local functions found in supabase/functions/"
    exit 0
fi

cd ../..

print_status "Found ${#LOCAL_FUNCTIONS[@]} local functions to deploy:"
for func in "${LOCAL_FUNCTIONS[@]}"; do
    echo "  - $func"
done

echo ""

# Deploy each function
SUCCESS_COUNT=0
FAILED_FUNCTIONS=()

for func in "${LOCAL_FUNCTIONS[@]}"; do
    print_status "Deploying function: $func"
    
    if supabase functions deploy "$func" >/dev/null 2>&1; then
        print_success "Deployed: $func"
        ((SUCCESS_COUNT++))
    else
        print_error "Failed to deploy: $func"
        FAILED_FUNCTIONS+=("$func")
    fi
done

echo ""
print_status "Deployment Summary:"
print_success "Successfully deployed: $SUCCESS_COUNT/${#LOCAL_FUNCTIONS[@]} functions"

if [ ${#FAILED_FUNCTIONS[@]} -gt 0 ]; then
    print_error "Failed to deploy: ${#FAILED_FUNCTIONS[@]} functions"
    echo "Failed functions:"
    for func in "${FAILED_FUNCTIONS[@]}"; do
        echo "  - $func"
    done
    echo ""
    print_warning "You can retry deploying failed functions individually:"
    for func in "${FAILED_FUNCTIONS[@]}"; do
        echo "  ./scripts/deploy-functions.sh $func"
    done
fi

echo ""
print_success "✅ Functions deployment completed!"
