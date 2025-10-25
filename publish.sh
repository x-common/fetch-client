#!/bin/bash

# API Client Library - NPM Publish Script
# 
# This script automates the process of publishing the API client library to NPM
# with proper validation, building, and version management.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

print_success() {
    print_message "$1" "$GREEN"
}

print_error() {
    print_message "$1" "$RED"
}

print_warning() {
    print_message "$1" "$YELLOW"
}

print_info() {
    print_message "$1" "$BLUE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if user is logged in to NPM
check_npm_auth() {
    if ! npm whoami >/dev/null 2>&1; then
        print_error "❌ You are not logged in to NPM"
        print_info "Please run: npm login"
        exit 1
    fi
    local npm_user=$(npm whoami)
    print_success "✅ Logged in to NPM as: $npm_user"
}

# Function to validate package.json
validate_package() {
    if [ ! -f "package.json" ]; then
        print_error "❌ package.json not found"
        exit 1
    fi
    
    # Check required fields
    local name=$(node -p "require('./package.json').name" 2>/dev/null || echo "")
    local version=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
    
    if [ -z "$name" ] || [ -z "$version" ]; then
        print_error "❌ package.json is missing required fields (name, version)"
        exit 1
    fi
    
    print_success "✅ Package validation passed: $name@$version"
}

# Function to run tests
run_tests() {
    print_info "🧪 Running tests..."
    
    # Check if test script exists
    if npm run test --silent 2>/dev/null; then
        print_success "✅ All tests passed"
    else
        print_warning "⚠️  No test script found or tests failed"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "❌ Publish cancelled"
            exit 1
        fi
    fi
}

# Function to build the project
build_project() {
    print_info "🔨 Building project..."
    
    # Clean previous build
    if [ -d "dist" ]; then
        print_info "🗑️  Cleaning previous build..."
        rm -rf dist
    fi
    
    # Run build
    if npm run build; then
        print_success "✅ Build completed successfully"
    else
        print_error "❌ Build failed"
        exit 1
    fi
    
    # Verify build output
    if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
        print_error "❌ Build output is empty"
        exit 1
    fi
    
    print_success "✅ Build verification passed"
}

# Function to check for uncommitted changes
check_git_status() {
    if command_exists git && [ -d ".git" ]; then
        if [ -n "$(git status --porcelain)" ]; then
            print_warning "⚠️  You have uncommitted changes:"
            git status --short
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_error "❌ Publish cancelled"
                exit 1
            fi
        else
            print_success "✅ Git working directory is clean"
        fi
    fi
}

# Function to check if version already exists on NPM
check_version_exists() {
    local package_name=$(node -p "require('./package.json').name")
    local version=$(node -p "require('./package.json').version")
    
    print_info "🔍 Checking if version $version already exists..."
    
    if npm view "$package_name@$version" version >/dev/null 2>&1; then
        print_error "❌ Version $version already exists on NPM"
        print_info "Please update the version in package.json"
        exit 1
    fi
    
    print_success "✅ Version $version is available"
}

# Function to show package contents
show_package_contents() {
    print_info "📦 Package contents that will be published:"
    echo
    npm pack --dry-run 2>/dev/null | grep -E "^\d+\s+\S+" | head -20
    echo
    
    local total_files=$(npm pack --dry-run 2>/dev/null | grep -E "^\d+\s+\S+" | wc -l)
    print_info "Total files: $total_files"
    echo
}

# Function to prompt for confirmation
confirm_publish() {
    local package_name=$(node -p "require('./package.json').name")
    local version=$(node -p "require('./package.json').version")
    
    echo
    print_warning "🚀 Ready to publish $package_name@$version"
    show_package_contents
    
    read -p "Do you want to continue with publishing? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "❌ Publish cancelled"
        exit 1
    fi
}

# Function to publish to NPM
publish_package() {
    print_info "🚀 Publishing to NPM..."
    
    # Determine publish command based on arguments
    local publish_cmd="npm publish"
    
    # Check for specific publish options
    if [[ "$1" == "--dry-run" ]]; then
        publish_cmd="npm publish --dry-run"
        print_info "🧪 Running dry-run publish..."
    elif [[ "$1" == "--beta" ]]; then
        publish_cmd="npm publish --tag beta"
        print_info "🧪 Publishing as beta version..."
    elif [[ "$1" == "--alpha" ]]; then
        publish_cmd="npm publish --tag alpha"
        print_info "🧪 Publishing as alpha version..."
    fi
    
    # Execute publish command
    if $publish_cmd; then
        if [[ "$1" != "--dry-run" ]]; then
            local package_name=$(node -p "require('./package.json').name")
            local version=$(node -p "require('./package.json').version")
            print_success "🎉 Successfully published $package_name@$version to NPM!"
            print_info "📦 View at: https://www.npmjs.com/package/$package_name"
        else
            print_success "✅ Dry-run completed successfully"
        fi
    else
        print_error "❌ Publish failed"
        exit 1
    fi
}

# Function to create git tag
create_git_tag() {
    if command_exists git && [ -d ".git" ]; then
        local version=$(node -p "require('./package.json').version")
        local tag="v$version"
        
        if git rev-parse "$tag" >/dev/null 2>&1; then
            print_warning "⚠️  Git tag $tag already exists"
        else
            print_info "🏷️  Creating git tag: $tag"
            if git tag -a "$tag" -m "Release $tag"; then
                print_success "✅ Git tag created: $tag"
                print_info "💡 Don't forget to push the tag: git push origin $tag"
            else
                print_warning "⚠️  Failed to create git tag"
            fi
        fi
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [option]"
    echo
    echo "Options:"
    echo "  --dry-run    Run publish in dry-run mode (test without actually publishing)"
    echo "  --beta       Publish with beta tag"
    echo "  --alpha      Publish with alpha tag"
    echo "  --help       Show this help message"
    echo
    echo "Examples:"
    echo "  $0                # Normal publish"
    echo "  $0 --dry-run      # Test publish without uploading"
    echo "  $0 --beta         # Publish as beta version"
}

# Main function
main() {
    print_info "🚀 API Client Library - NPM Publish Script"
    print_info "=========================================="
    echo
    
    # Handle help option
    if [[ "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    # Check prerequisites
    print_info "🔍 Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "❌ Node.js is not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "❌ NPM is not installed"
        exit 1
    fi
    
    print_success "✅ Node.js and NPM are available"
    
    # Run all checks and steps
    check_npm_auth
    validate_package
    check_git_status
    check_version_exists
    run_tests
    build_project
    
    # Only ask for confirmation if not doing dry-run
    if [[ "$1" != "--dry-run" ]]; then
        confirm_publish
    fi
    
    publish_package "$1"
    
    # Create git tag only for actual publishes (not dry-runs)
    if [[ "$1" != "--dry-run" ]]; then
        create_git_tag
    fi
    
    print_success "🎉 Publish process completed!"
}

# Run main function with all arguments
main "$@"