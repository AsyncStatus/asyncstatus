package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

var (
	forceUpgrade bool
	checkOnly    bool
)

// upgradeCmd represents the upgrade command
var upgradeCmd = &cobra.Command{
	Use:   "upgrade",
	Short: "Check for updates and upgrade the AsyncStatus CLI",
	Long: `Check for the latest version of AsyncStatus CLI and upgrade if a newer version is available.

This command will:
1. Check the current version
2. Fetch the latest version from GitHub releases
3. Compare versions and prompt for upgrade if needed
4. Download and install the latest version

Examples:
  asyncstatus upgrade              # Check and upgrade if newer version available
  asyncstatus upgrade --check      # Only check for updates, don't install
  asyncstatus upgrade --force      # Force upgrade even if already on latest version`,
	Args: cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		if err := handleUpgrade(); err != nil {
			color.New(color.FgRed).Printf("⧗ upgrade failed: %v\n", err)
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.AddCommand(upgradeCmd)
	upgradeCmd.Flags().BoolVar(&forceUpgrade, "force", false, "Force upgrade even if already on latest version")
	upgradeCmd.Flags().BoolVar(&checkOnly, "check", false, "Only check for updates, don't install")
}

// GitHubRelease represents a GitHub release
type GitHubRelease struct {
	TagName string `json:"tag_name"`
	Name    string `json:"name"`
	Draft   bool   `json:"draft"`
	PreRelease bool `json:"prerelease"`
	Assets  []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
	} `json:"assets"`
}

// handleUpgrade processes the upgrade flow
func handleUpgrade() error {
	// Get current version
	currentVersion := Version
	if currentVersion == "dev" && !forceUpgrade {
		color.New(color.FgYellow).Println("⧗ development build detected, use --force to upgrade")
		return nil
	}
	
	// Get latest version from GitHub
	latestVersion, err := getLatestVersion()
	if err != nil {
		return fmt.Errorf("failed to check latest version: %v", err)
	}
	
	// Compare versions
	if !forceUpgrade && isVersionCurrent(currentVersion, latestVersion) {
		color.New(color.FgGreen).Println("⧗ already on latest version")
		return nil
	}
	
	if checkOnly {
		if isVersionCurrent(currentVersion, latestVersion) {
			color.New(color.FgGreen).Println("⧗ already on latest version")
		} else {
			color.New(color.FgYellow).Printf("⧗ newer version available: %s\n", latestVersion)
		}
		return nil
	}
	
	// Prompt for upgrade
	if !forceUpgrade {
		color.New(color.FgYellow).Printf("⧗ upgrade to %s? [y/N]: ", latestVersion)
		
		var response string
		if _, err := fmt.Scanln(&response); err != nil {
			return fmt.Errorf("failed to read input: %v", err)
		}
		
		response = strings.ToLower(strings.TrimSpace(response))
		if response != "y" && response != "yes" {
			return nil
		}
	}
	
	// Perform upgrade
	return performUpgrade(latestVersion)
}

// getLatestVersion fetches the latest release version from GitHub
func getLatestVersion() (string, error) {
	const githubAPI = "https://api.github.com/repos/AsyncStatus/asyncstatus/releases/latest"
	
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	
	req, err := http.NewRequest("GET", githubAPI, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}
	
	req.Header.Set("User-Agent", "AsyncStatus-CLI/"+Version)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch release info: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("GitHub API error (status %d): %s", resp.StatusCode, string(body))
	}
	
	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", fmt.Errorf("failed to parse release info: %v", err)
	}
	
	return release.TagName, nil
}

// isVersionCurrent checks if current version is the same as latest
func isVersionCurrent(current, latest string) bool {
	// Normalize versions by removing prefixes
	currentNorm := normalizeVersion(current)
	latestNorm := normalizeVersion(latest)
	
	// For development builds, always consider outdated unless forced
	if current == "dev" {
		return false
	}
	
	return currentNorm == latestNorm
}

// normalizeVersion removes common version prefixes
func normalizeVersion(version string) string {
	// Remove cli/ prefix if present
	version = strings.TrimPrefix(version, "cli/")
	// Remove v prefix if present
	version = strings.TrimPrefix(version, "v")
	return version
}

// performUpgrade downloads and runs the install script
func performUpgrade(version string) error {
	color.New(color.FgBlue).Printf("⧗ upgrading to %s...\n", version)
	
	// Download install script
	installScript, err := downloadInstallScript()
	if err != nil {
		return fmt.Errorf("failed to download installer: %v", err)
	}
	
	// Create temporary file for install script
	tmpFile, err := os.CreateTemp("", "asyncstatus-install-*.sh")
	if err != nil {
		return fmt.Errorf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()
	
	// Write install script to temp file
	if _, err := tmpFile.Write(installScript); err != nil {
		return fmt.Errorf("failed to write install script: %v", err)
	}
	tmpFile.Close()
	
	// Make script executable
	if err := os.Chmod(tmpFile.Name(), 0755); err != nil {
		return fmt.Errorf("failed to make install script executable: %v", err)
	}
	
	// Get current install directory
	installDir, err := getCurrentInstallDir()
	if err != nil {
		return fmt.Errorf("failed to determine install directory: %v", err)
	}
	
	// Run install script with version
	cmd := exec.Command("bash", tmpFile.Name(), "--version", version)
	cmd.Env = append(os.Environ(), "INSTALL_DIR="+installDir)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("install script failed: %v", err)
	}
	
	color.New(color.FgGreen).Printf("⧗ upgraded to %s\n", version)
	return nil
}

// downloadInstallScript downloads the install script from GitHub
func downloadInstallScript() ([]byte, error) {
	const installScriptURL = "https://raw.githubusercontent.com/AsyncStatus/asyncstatus/main/apps/cli/install.sh"
	
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	
	req, err := http.NewRequest("GET", installScriptURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}
	
	req.Header.Set("User-Agent", "AsyncStatus-CLI/"+Version)
	
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to download install script: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("failed to download install script (status %d)", resp.StatusCode)
	}
	
	return io.ReadAll(resp.Body)
}

// getCurrentInstallDir determines where the current binary is installed
func getCurrentInstallDir() (string, error) {
	// Get the path of the current executable
	execPath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("failed to get executable path: %v", err)
	}
	
	// Get the directory containing the executable
	installDir := strings.TrimSuffix(execPath, "/asyncstatus")
	
	// Handle cases where binary might be symlinked (like aliases)
	if strings.HasSuffix(execPath, "/⧗") || strings.HasSuffix(execPath, "/async") {
		// These are aliases, get the directory they're in
		installDir = strings.TrimSuffix(strings.TrimSuffix(execPath, "/⧗"), "/async")
	}
	
	// Default fallback
	if installDir == "" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("failed to get home directory: %v", err)
		}
		installDir = homeDir + "/.asyncstatus/cli"
	}
	
	return installDir, nil
}