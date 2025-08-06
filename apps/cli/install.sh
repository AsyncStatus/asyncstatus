#!/usr/bin/env bash

set -e

# GitHub repository information
GITHUB_REPO="AsyncStatus/asyncstatus"  # Update this to your actual repo
BINARY_NAME="asyncstatus"

# Default installation directory
DEFAULT_INSTALL_DIR="$HOME/.asyncstatus/cli"
INSTALL_DIR="${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to detect operating system
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "darwin";;
        CYGWIN*|MINGW*|MSYS*) echo "windows";;
        *)          echo "unknown";;
    esac
}

# Function to detect architecture
detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64) echo "amd64";;
        arm64|aarch64) echo "arm64";;
        *) echo "unknown";;
    esac
}

# Function to get the latest release version
get_latest_version() {
    local repo=$1
    
    # Try to get the latest release tag from GitHub API
    if command -v curl >/dev/null 2>&1; then
        curl -s "https://api.github.com/repos/${repo}/releases/latest" | \
            grep '"tag_name":' | \
            sed -E 's/.*"([^"]+)".*/\1/'
    elif command -v wget >/dev/null 2>&1; then
        wget -qO- "https://api.github.com/repos/${repo}/releases/latest" | \
            grep '"tag_name":' | \
            sed -E 's/.*"([^"]+)".*/\1/'
    else
        log_error "Neither curl nor wget is available. Please install one of them." >&2
        exit 1
    fi
}

# Function to download file
download_file() {
    local url=$1
    local output=$2
    
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$url" -o "$output"
    elif command -v wget >/dev/null 2>&1; then
        wget -q "$url" -O "$output"
    else
        log_error "Neither curl nor wget is available. Please install one of them."
        exit 1
    fi
}

# Function to check if running as root
is_root() {
    [ "$EUID" -eq 0 ]
}

# Function to check if directory is writable
is_writable() {
    [ -w "$1" ]
}

# Main installation function
install_binary() {
    local os=$1
    local arch=$2
    local version=$3
    
    # Construct binary name based on OS and architecture
    local binary_suffix=""
    if [ "$os" = "windows" ]; then
        binary_suffix="-${os}-${arch}.exe"
    else
        binary_suffix="-${os}-${arch}"
    fi
    
    local binary_name="${BINARY_NAME}${binary_suffix}"
    local download_url="https://github.com/${GITHUB_REPO}/releases/download/${version}/${binary_name}"
    
    log_info "Downloading ${binary_name} from ${download_url}..."
    
    # Create temporary directory
    local temp_dir=$(mktemp -d)
    local temp_file="${temp_dir}/${binary_name}"
    
    # Download the binary
    if ! download_file "$download_url" "$temp_file"; then
        log_error "Failed to download binary from $download_url"
        log_error "Please check if the release exists and the URL is correct."
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # Verify the download
    if [ ! -f "$temp_file" ] || [ ! -s "$temp_file" ]; then
        log_error "Downloaded file is empty or does not exist."
        rm -rf "$temp_dir"
        exit 1
    fi
    
    log_success "Binary downloaded successfully."
    
    # Check if installation directory exists and is writable
    if [ ! -d "$INSTALL_DIR" ]; then
        log_info "Creating installation directory: $INSTALL_DIR"
        if ! mkdir -p "$INSTALL_DIR" 2>/dev/null; then
            log_error "Cannot create installation directory: $INSTALL_DIR"
            log_error "Try running with sudo or choose a different directory with INSTALL_DIR environment variable."
            rm -rf "$temp_dir"
            exit 1
        fi
    fi
    
    if ! is_writable "$INSTALL_DIR"; then
        log_error "Installation directory is not writable: $INSTALL_DIR"
        if ! is_root; then
            log_error "Try running with sudo or choose a different directory with INSTALL_DIR environment variable."
            log_error "Example: INSTALL_DIR=\$HOME/.local/bin $0"
            log_error "Example: INSTALL_DIR=/usr/local/bin sudo $0"
        fi
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # Install the binary
    local install_path="${INSTALL_DIR}/${BINARY_NAME}"
    log_info "Installing binary to $install_path..."
    
    if ! cp "$temp_file" "$install_path"; then
        log_error "Failed to copy binary to $install_path"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # Make it executable
    if ! chmod +x "$install_path"; then
        log_error "Failed to make binary executable"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # Clean up
    rm -rf "$temp_dir"
    
    log_success "Successfully installed $BINARY_NAME to $install_path"
    
    # Create aliases for the CLI
    log_info "Creating aliases..."
    local aliases=("⧗" "async")
    for alias in "${aliases[@]}"; do
        local alias_path="${INSTALL_DIR}/${alias}"
        if ln -sf "$install_path" "$alias_path" 2>/dev/null; then
            log_success "Created alias: $alias"
        else
            log_warning "Failed to create alias: $alias (this is optional)"
        fi
    done
    
    # Check if the installation directory is in PATH
    if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
        log_warning "Installation directory $INSTALL_DIR is not in your PATH."
        log_warning "Add it to your PATH or run the binary directly: $install_path"
        log_warning "To add to PATH, add this line to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
        log_warning "  export PATH=\"$INSTALL_DIR:\$PATH\""
    else
        log_success "You can now run: $BINARY_NAME, ⧗, or async"
    fi
}

# Function to uninstall
uninstall_binary() {
    local install_path="${INSTALL_DIR}/${BINARY_NAME}"
    
    if [ ! -f "$install_path" ]; then
        log_warning "AsyncStatus CLI not found at $install_path"
        return 0
    fi
    
    log_info "Removing AsyncStatus CLI from $install_path..."
    
    if rm "$install_path"; then
        log_success "Successfully removed AsyncStatus CLI"
        
        # Remove aliases
        log_info "Removing aliases..."
        local aliases=("⧗" "async")
        for alias in "${aliases[@]}"; do
            local alias_path="${INSTALL_DIR}/${alias}"
            if [ -f "$alias_path" ] || [ -L "$alias_path" ]; then
                if rm "$alias_path" 2>/dev/null; then
                    log_success "Removed alias: $alias"
                else
                    log_warning "Failed to remove alias: $alias"
                fi
            fi
        done
        
        # Check if directory is empty and remove it
        if [ -d "$INSTALL_DIR" ] && [ -z "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
            if rmdir "$INSTALL_DIR" 2>/dev/null; then
                log_info "Removed empty directory: $INSTALL_DIR"
            fi
        fi
        
        log_info "You may want to remove $INSTALL_DIR from your PATH if you added it"
    else
        log_error "Failed to remove AsyncStatus CLI"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "⧗ AsyncStatus CLI Installer"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -v, --version VERSION   Install specific version (default: latest)"
    echo "  -d, --dir DIRECTORY     Installation directory (default: ~/.asyncstatus/cli)"
    echo "  -u, --uninstall         Uninstall AsyncStatus CLI"
    echo ""
    echo "Environment variables:"
    echo "  INSTALL_DIR             Installation directory"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Install latest version to ~/.asyncstatus/cli"
    echo "  $0 --version v1.0.0                  # Install specific version"
    echo "  $0 --dir /usr/local/bin              # Install to system directory (requires sudo)"
    echo "  $0 --dir \$HOME/.local/bin            # Install to user's local bin"
    echo "  $0 --uninstall                       # Remove AsyncStatus CLI"
    echo "  INSTALL_DIR=\$HOME/bin $0             # Install using environment variable"
    echo ""
    echo "Note: Installation creates aliases 'async' and '⧗' for convenience."
}

# Parse command line arguments
VERSION=""
UNINSTALL=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -d|--dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        -u|--uninstall)
            UNINSTALL=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main script execution
main() {
    echo "AsyncStatus CLI Installer"
    echo "========================="
    echo ""
    
    # Handle uninstall
    if [ "$UNINSTALL" = true ]; then
        log_info "Uninstalling AsyncStatus CLI from: $INSTALL_DIR"
        uninstall_binary
        exit 0
    fi
    
    # Detect platform
    local os=$(detect_os)
    local arch=$(detect_arch)
    
    if [ "$os" = "unknown" ] || [ "$arch" = "unknown" ]; then
        log_error "Unsupported platform: $os/$arch"
        log_error "Supported platforms:"
        log_error "  - Linux (amd64)"
        log_error "  - macOS (amd64, arm64)"
        log_error "  - Windows (amd64)"
        exit 1
    fi
    
    log_info "Detected platform: $os/$arch"
    log_info "Installation directory: $INSTALL_DIR"
    
    # Get version
    if [ -z "$VERSION" ]; then
        log_info "Fetching latest release information..."
        VERSION=$(get_latest_version "$GITHUB_REPO")
        if [ -z "$VERSION" ]; then
            log_error "Failed to fetch latest version. Please specify a version manually."
            exit 1
        fi
        log_info "Latest version: $VERSION"
    else
        log_info "Installing version: $VERSION"
    fi
    
    # Install the binary
    install_binary "$os" "$arch" "$VERSION"
    
    echo ""
    log_success "Installation completed!"
    
    echo ""
    log_info "You can now use any of these commands:"
    log_info "  asyncstatus --help"
    log_info "  async --help"
    log_info "  ⧗ --help"
}

# Run main function
main "$@"