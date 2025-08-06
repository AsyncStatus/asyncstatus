package cmd

import (
	"fmt"
	"strings"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

// versionCmd represents the version command
var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Show version information",
	Long: `Display the current version of AsyncStatus CLI along with build information.
Also checks for available updates from GitHub releases.

Examples:
  asyncstatus version
  asyncstatus --version`,
	Args: cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		handleVersion()
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}

// handleVersion displays version information and checks for updates
func handleVersion() {
	// Display current version info
	fmt.Printf("asyncstatus version %s\n", Version)
	fmt.Printf("Build time: %s\n", BuildTime)
	fmt.Printf("Git commit: %s\n", GitCommit)
	
	// Check for updates
	checkForUpdatesInVersion()
}

// checkForUpdatesInVersion checks for updates and displays info if available
func checkForUpdatesInVersion() {
	color.New(color.FgHiBlack).Print("\nChecking for updates...")
	
	// Get latest version from GitHub (reuse function from upgrade.go)
	latestVersion, err := getLatestVersion()
	if err != nil {
		color.New(color.FgHiBlack).Printf(" failed (%v)\n", err)
		return
	}
	
	color.New(color.FgHiBlack).Println(" done")
	
	// Compare versions
	if isVersionCurrent(Version, latestVersion) {
		color.New(color.FgGreen).Println("✓ You're running the latest version")
	} else {
		color.New(color.FgYellow).Printf("→ Newer version available: %s\n", latestVersion)
		
		// Provide upgrade suggestion
		if Version == "dev" {
			color.New(color.FgHiBlack).Println("  Run 'asyncstatus upgrade --force' to upgrade from development build")
		} else {
			color.New(color.FgHiBlack).Println("  Run 'asyncstatus upgrade' to update")
		}
		
		// Show what's new if we can parse the version
		showVersionDifference(Version, latestVersion)
	}
}

// showVersionDifference provides helpful context about the version gap
func showVersionDifference(current, latest string) {
	// Clean up version strings for comparison
	currentClean := strings.TrimPrefix(current, "v")
	latestClean := strings.TrimPrefix(latest, "v")
	
	// Skip detailed comparison for dev builds
	if current == "dev" {
		return
	}
	
	// Simple comparison message
	if currentClean != latestClean {
		color.New(color.FgHiBlack).Printf("  View changes: https://github.com/AsyncStatus/asyncstatus/releases/tag/%s\n", latest)
	}
}