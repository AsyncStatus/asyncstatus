package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"

	"github.com/spf13/cobra"
)

// doneCmd represents the done command
var doneCmd = &cobra.Command{
	Use:   "done [message]",
	Short: "Add a completed task status update",
	Long: `Add a status update indicating a task has been completed.

Examples:
  asyncstatus done "finished the API endpoint"
  asyncstatus done "fixed the bug in user authentication"`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		if err := handleDoneStatus(args[0]); err != nil {
			fmt.Printf("❌ Failed to add status update: %v\n", err)
			fmt.Println("   Make sure you're logged in: asyncstatus login")
		}
	},
}

func init() {
	rootCmd.AddCommand(doneCmd)
}

// StatusUpdateRequest represents the API request for creating a status update
type StatusUpdateRequest struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

// handleDoneStatus processes adding a done status update
func handleDoneStatus(message string) error {
	fmt.Printf("📝 Adding done status: %s\n", message)
	
	// Create the request payload
	payload := StatusUpdateRequest{
		Type:    "done",
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
	
	fmt.Println("✅ Status update added successfully")
	return nil
}