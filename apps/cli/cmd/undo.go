package cmd

import (
	"fmt"
	"io"

	"github.com/spf13/cobra"
)

// undoCmd represents the undo command
var undoCmd = &cobra.Command{
	Use:   "undo",
	Short: "Remove the previous status update",
	Long: `Remove the most recent status update that was added.

Examples:
  asyncstatus undo`,
	Args: cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		if err := handleUndoStatus(); err != nil {
			fmt.Printf("❌ Failed to undo status update: %v\n", err)
			fmt.Println("   Make sure you're logged in: asyncstatus login")
		}
	},
}

func init() {
	rootCmd.AddCommand(undoCmd)
}

// handleUndoStatus processes removing the last status update
func handleUndoStatus() error {
	fmt.Println("🔙 Removing previous status update...")
	
	// Get active organization slug
	orgSlug, err := getActiveOrganizationSlug()
	if err != nil {
		return err
	}
	
	endpoint := fmt.Sprintf("/organizations/%s/cli/status-updates/last", orgSlug)
	client, req, err := makeAuthenticatedRequest("DELETE", endpoint)
	if err != nil {
		return err
	}
	
	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()
	
	// Check response
	if resp.StatusCode == 404 {
		fmt.Println("ℹ️  No status updates found to remove")
		return nil
	} else if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("server error (status %d): %s", resp.StatusCode, string(body))
	}
	
	fmt.Println("✅ Previous status update removed successfully")
	return nil
}