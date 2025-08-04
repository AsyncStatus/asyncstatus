package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"

	"github.com/fatih/color"
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
			color.New(color.FgRed).Printf("⧗ failed: %v\n", err)
			color.New(color.FgHiBlack).Println("  run:", color.New(color.FgWhite).Sprint("asyncstatus login"), "first")
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
	color.New(color.FgGreen).Print("⧗ done: ")
	color.New(color.FgWhite).Println(message)
	
	// Get active organization slug
	orgSlug, err := getActiveOrganizationSlug()
	if err != nil {
		return err
	}

	// Create the request payload
	payload := StatusUpdateRequest{
		Type:    "done",
		Message: message,
	}
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to prepare request: %v", err)
	}
	
	endpoint := fmt.Sprintf("/organizations/%s/cli/status-updates", orgSlug)
	client, req, err := makeAuthenticatedJSONRequest("POST", endpoint)
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
	
	color.New(color.FgGreen).Println("  ✓ saved")
	return nil
}