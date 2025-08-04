package cmd

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/fatih/color"
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
			color.New(color.FgRed).Printf("⧗ failed: %v\n", err)
			color.New(color.FgHiBlack).Println("  run:", color.New(color.FgWhite).Sprint("asyncstatus login"), "first")
		}
	},
}

func init() {
	rootCmd.AddCommand(undoCmd)
}

// UndoResponse represents the API response for removing a status update item
type UndoResponse struct {
	Success             bool   `json:"success"`
	DeletedStatusUpdate bool   `json:"deletedStatusUpdate"`
	Message             string `json:"message"`
}

// handleUndoStatus processes removing the last status update item
func handleUndoStatus() error {
	color.New(color.FgHiBlack).Println("⧗ undoing last item...")
	
	endpoint := "/cli/status-updates/last"
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

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %v", err)
	}
	
	// Check response status
	if resp.StatusCode >= 400 {
		return fmt.Errorf("server error (status %d): %s", resp.StatusCode, string(body))
	}

	// Parse response
	var response UndoResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return fmt.Errorf("failed to parse response: %v", err)
	}
	
	// Display result message
	if response.Success {
		if response.DeletedStatusUpdate {
			color.New(color.FgHiBlack).Println("  ✓ removed entire status update")
		} else {
			color.New(color.FgHiBlack).Println("  ✓ removed last item")
		}
	} else {
		color.New(color.FgHiBlack).Printf("  %s\n", response.Message)
	}
	
	return nil
}