package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"

	"github.com/spf13/cobra"
)

// progressCmd represents the progress command
var progressCmd = &cobra.Command{
	Use:   "progress [message]",
	Short: "Add a progress status update",
	Long: `Add a status update indicating work in progress.

Examples:
  asyncstatus progress "working on the user dashboard"
  asyncstatus progress "implementing OAuth integration"`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		if err := handleProgressStatus(args[0]); err != nil {
			fmt.Printf("❌ Failed to add progress update: %v\n", err)
			fmt.Println("   Make sure you're logged in: asyncstatus login")
		}
	},
}

func init() {
	rootCmd.AddCommand(progressCmd)
}

// handleProgressStatus processes adding a progress status update
func handleProgressStatus(message string) error {
	fmt.Printf("🔄 Adding progress update: %s\n", message)
	
	// Create the request payload
	payload := StatusUpdateRequest{
		Type:    "progress",
		Message: message,
	}
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to prepare request: %v", err)
	}
	
	// Make authenticated request
	client, req, err := makeAuthenticatedRequest("POST", "/api/status-updates")
	if err != nil {
		return err
	}
	
	// Set request body
	req.Body = io.NopCloser(bytes.NewBuffer(jsonData))
	
	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()
	
	// Check response
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("server error (status %d): %s", resp.StatusCode, string(body))
	}
	
	fmt.Println("✅ Progress update added successfully")
	return nil
}