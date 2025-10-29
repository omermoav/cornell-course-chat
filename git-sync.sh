#!/bin/bash
# Git Sync Helper Script for Cornell Course Chat
# Makes syncing between local and Replit easier

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Show current status
show_status() {
    print_info "Current Git Status:"
    git status --short
    echo ""
    
    # Check if there are changes
    if [[ -z $(git status --short) ]]; then
        print_success "Working directory is clean!"
    else
        print_warning "You have uncommitted changes"
    fi
}

# Pull latest changes from GitHub
pull_changes() {
    print_info "Pulling latest changes from GitHub..."
    git pull origin main
    print_success "Successfully pulled changes!"
}

# Push changes to GitHub
push_changes() {
    # Check if there are changes
    if [[ -z $(git status --short) ]]; then
        print_warning "No changes to push"
        return
    fi
    
    print_info "Staging all changes..."
    git add .
    
    # Get commit message
    if [ -z "$1" ]; then
        echo -e "${BLUE}Enter commit message:${NC}"
        read -r commit_message
    else
        commit_message="$1"
    fi
    
    if [ -z "$commit_message" ]; then
        print_error "Commit message cannot be empty"
        exit 1
    fi
    
    print_info "Committing changes..."
    git commit -m "$commit_message"
    
    print_info "Pushing to GitHub..."
    git push origin main
    
    print_success "Successfully pushed changes!"
}

# Sync: Pull then show status
sync() {
    print_info "Syncing with GitHub..."
    pull_changes
    echo ""
    show_status
}

# Show help
show_help() {
    echo -e "${BLUE}Git Sync Helper Script${NC}"
    echo ""
    echo "Usage: ./git-sync.sh [command]"
    echo ""
    echo "Commands:"
    echo "  status              Show current git status"
    echo "  pull                Pull latest changes from GitHub"
    echo "  push [message]      Commit and push changes (will prompt for message if not provided)"
    echo "  sync                Pull changes and show status"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./git-sync.sh status"
    echo "  ./git-sync.sh pull"
    echo "  ./git-sync.sh push \"Fix bug in parser\""
    echo "  ./git-sync.sh sync"
}

# Main script logic
case "${1:-help}" in
    status)
        show_status
        ;;
    pull)
        pull_changes
        ;;
    push)
        push_changes "$2"
        ;;
    sync)
        sync
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

