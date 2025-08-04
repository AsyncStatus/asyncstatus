package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

// blockerCmd represents the blocker command
var blockerCmd = &cobra.Command{
	Use:   "blocker [message]",
	Short: "Add a blocker status update",
	Long: `Add a status update indicating something is blocking your progress.

Examples:
  asyncstatus blocker "waiting for API approval"
  asyncstatus blocker "external dependency issue"`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		if err := handleBlockerStatus(args[0]); err != nil {
			color.New(color.FgRed).Printf("⧗ failed: %v\n", err)
			color.New(color.FgHiBlack).Println("  run:", color.New(color.FgWhite).Sprint("asyncstatus login"), "first")
		}
	},
}

func init() {
	rootCmd.AddCommand(blockerCmd)
}

// handleBlockerStatus processes adding a blocker status update
func handleBlockerStatus(message string) error {
	color.New(color.FgRed).Print("⧗ blocked: ")
	color.New(color.FgWhite).Println(message)
	
	// Create the request payload
	payload := StatusUpdateRequest{
		Type:    "blocker",
		Message: message,
	}
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to prepare request: %v", err)
	}
	
	// Make authenticated request to the new CLI endpoint
	endpoint := "/cli/status-updates"
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
	
	color.New(color.FgRed).Println("  ✗ saved")
	return nil
}