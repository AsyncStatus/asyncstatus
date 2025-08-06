package cmd

import (
	"fmt"
	"os"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

var (
	// Version will be set during build
	Version = "dev"
	// BuildTime will be set during build
	BuildTime = "unknown"
	// GitCommit will be set during build
	GitCommit = "unknown"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "asyncstatus",
	Short: "⧗ CLI for async status updates",
	Aliases: []string{"⧗", "async"},
	Long: `⧗ AsyncStatus CLI - minimalistic status tracking from the terminal.
	
Examples:
  asyncstatus                           # Show current status update
  asyncstatus login                     # Login to AsyncStatus
  asyncstatus logout                    # Logout from AsyncStatus
  asyncstatus "did something"           # Add a done status (default)
  asyncstatus done "did something"      # Add a done status (explicit)
  asyncstatus blocker "something"       # Add a blocker status
  asyncstatus progress "did something"  # Add a progress status
  asyncstatus edit                      # Edit today's status update interactively
  asyncstatus show                      # Show current status update
  asyncstatus list                      # List today's status updates
  asyncstatus list 7                    # List status updates from past 7 days
  asyncstatus undo                      # Remove the previous status update
  
 Links:
  - https://asyncstatus.com
  - https://github.com/asyncstatus/asyncstatus
  - https://github.com/asyncstatus/asyncstatus/issues
  - https://github.com/asyncstatus/asyncstatus/releases`,
	Version: Version,
	Args:    cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		// If no subcommand is provided but there's an argument,
		// treat it as a "done" status update
		if len(args) == 1 {
			if err := handleDoneStatus(args[0]); err != nil {
				color.New(color.FgRed).Printf("⧗ failed: %v\n", err)
				color.New(color.FgHiBlack).Println("  run:", color.New(color.FgWhite).Sprint("asyncstatus login"), "first")
			}
		} else {
			// Show current status update when no arguments provided
			if err := handleShowStatus(""); err != nil {
				color.New(color.FgRed).Printf("⧗ failed: %v\n", err)
				color.New(color.FgHiBlack).Println("  run:", color.New(color.FgWhite).Sprint("asyncstatus login"), "first")
			}
		}
	},
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	// Set custom version template
	versionTemplate := fmt.Sprintf(`{{printf "%%s version %%s\n" .Name .Version}}Build time: %s
Git commit: %s
`, BuildTime, GitCommit)
	rootCmd.SetVersionTemplate(versionTemplate)
	
	// Custom version flag that shows build info
	rootCmd.Flags().BoolP("version", "v", false, "version for asyncstatus")
}

// Note: handleDoneStatus is now implemented in done.go