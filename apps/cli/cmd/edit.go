package cmd

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"regexp"
	"strings"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

// editCmd represents the edit command
var editCmd = &cobra.Command{
	Use:   "edit [date]",
	Short: "Edit status update items interactively",
	Long: `Edit status update items in your default editor, similar to git rebase -i.
Opens a temporary file with your current status items that you can modify, reorder, 
add to, or remove. Changes are saved when you close the editor.

Editor detection (in order of preference):
  1. ASYNCSTATUS_EDITOR environment variable
  2. GIT_EDITOR environment variable
  3. VISUAL environment variable  
  4. EDITOR environment variable
  5. git config core.editor (local, then global)
  6. Git's built-in fallback (typically vi)
  7. System fallbacks: vi, vim, nano (if git unavailable)

Examples:
  asyncstatus edit           # Edit today's status update
  asyncstatus edit 2024-01-15   # Edit status update for specific date
  
Configuration:
  export ASYNCSTATUS_EDITOR=code  # Use VS Code for AsyncStatus only
  export ASYNCSTATUS_EDITOR="code -w"  # Use VS Code with wait flag`,
	Args: cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		var date string
		if len(args) == 1 {
			date = args[0]
		}
		
		if err := handleEditStatus(date); err != nil {
			color.New(color.FgRed).Printf("⧗ failed: %v\n", err)
			color.New(color.FgHiBlack).Println("  run:", color.New(color.FgWhite).Sprint("asyncstatus login"), "first")
		}
	},
}

func init() {
	rootCmd.AddCommand(editCmd)
}

// EditStatusUpdateRequest represents the API request for editing a status update
type EditStatusUpdateRequest struct {
	Items []EditStatusUpdateItem `json:"items"`
	Date  string                 `json:"date,omitempty"`
}

// EditStatusUpdateItem represents a single item in the edit request
type EditStatusUpdateItem struct {
	Content string `json:"content"`
	Type    string `json:"type"`
	Order   int    `json:"order"`
}

// EditStatusUpdateResponse represents the API response for editing a status update
type EditStatusUpdateResponse struct {
	StatusUpdate *StatusUpdate `json:"statusUpdate"`
	Message      string        `json:"message"`
}

// handleEditStatus processes editing a status update interactively
func handleEditStatus(date string) error {
	// Get current status update
	statusUpdate, err := getCurrentStatusUpdate()
	if err != nil {
		return fmt.Errorf("failed to fetch current status update: %v", err)
	}

	// Create temporary file with editable content
	tempFile, err := createEditableFile(statusUpdate, date)
	if err != nil {
		return fmt.Errorf("failed to create temporary file: %v", err)
	}
	defer os.Remove(tempFile.Name())

	// Open editor
	if err := openEditor(tempFile.Name()); err != nil {
		return fmt.Errorf("failed to open editor: %v", err)
	}

	// Parse edited file
	editedItems, err := parseEditedFile(tempFile.Name())
	if err != nil {
		return fmt.Errorf("failed to parse edited file: %v", err)
	}

	// Check if there were any changes
	if !hasChanges(statusUpdate, editedItems) {
		color.New(color.FgHiBlack).Println("⧗ no changes made")
		return nil
	}

	// Send updates to API
	if err := updateStatusUpdate(editedItems, date); err != nil {
		return fmt.Errorf("failed to update status: %v", err)
	}

	color.New(color.FgGreen).Println("⧗ status update saved")
	return nil
}

// getCurrentStatusUpdate fetches the current status update
func getCurrentStatusUpdate() (*StatusUpdate, error) {
	endpoint := "/cli/status-updates/current"
	client, req, err := makeAuthenticatedRequest("GET", endpoint)
	if err != nil {
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("server error (status %d): %s", resp.StatusCode, string(body))
	}

	var response StatusUpdateResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	return response.StatusUpdate, nil
}

// createEditableFile creates a temporary file with the current status items
func createEditableFile(statusUpdate *StatusUpdate, date string) (*os.File, error) {
	tempFile, err := os.CreateTemp("", "asyncstatus-edit-*.txt")
	if err != nil {
		return nil, err
	}

	var content strings.Builder
	
	// Add header with instructions
	targetDate := "today"
	if date != "" {
		targetDate = date
	} else if statusUpdate != nil {
		targetDate = statusUpdate.EffectiveFrom.Format("Monday, January 2, 2006")
	}
	
	content.WriteString(fmt.Sprintf("# Edit your status update for %s\n", targetDate))
	content.WriteString("#\n")
	content.WriteString("# Commands:\n")
	content.WriteString("#   done <text>     = completed task\n")
	content.WriteString("#   progress <text> = work in progress\n")
	content.WriteString("#   blocker <text>  = blocked task\n")
	content.WriteString("#\n")
	content.WriteString("# Lines starting with # are ignored\n")
	content.WriteString("# You can reorder lines to change the order\n")
	content.WriteString("# Delete lines to remove items\n")
	content.WriteString("# Add new lines to add items\n")
	content.WriteString("#\n")
	content.WriteString("# Example:\n")
	content.WriteString("#   done Implemented user authentication\n")
	content.WriteString("#   progress Working on payment integration\n")
	content.WriteString("#   blocker Waiting for API keys\n")
	content.WriteString("\n")

	// Add existing items
	if statusUpdate != nil && len(statusUpdate.Items) > 0 {
		for _, item := range statusUpdate.Items {
			var itemType string
			if item.IsBlocker {
				itemType = "blocker"
			} else if item.IsInProgress {
				itemType = "progress"
			} else {
				itemType = "done"
			}
			content.WriteString(fmt.Sprintf("%s %s\n", itemType, item.Content))
		}
	} else {
		// Add example items for new status updates
		content.WriteString("# No existing items. Add your status items below:\n")
		content.WriteString("# done Example completed task\n")
		content.WriteString("# progress Example work in progress\n")
	}

	if _, err := tempFile.WriteString(content.String()); err != nil {
		tempFile.Close()
		os.Remove(tempFile.Name())
		return nil, err
	}

	if err := tempFile.Close(); err != nil {
		os.Remove(tempFile.Name())
		return nil, err
	}

	return tempFile, nil
}

// openEditor opens the user's preferred editor
func openEditor(filename string) error {
	editor := getEditor()
	if editor == "" {
		return fmt.Errorf("no editor found. Please install vi, vim, or nano, or set ASYNCSTATUS_EDITOR/EDITOR/VISUAL/GIT_EDITOR environment variable")
	}

	cmd := exec.Command(editor, filename)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}

// getEditor returns the user's preferred editor
func getEditor() string {
	// Check environment variables in order of preference
	for _, env := range []string{"ASYNCSTATUS_EDITOR", "GIT_EDITOR", "VISUAL", "EDITOR"} {
		if editor := os.Getenv(env); editor != "" {
			return editor
		}
	}
	
	// Check git config for core.editor
	if gitEditor := getGitConfigEditor(); gitEditor != "" {
		return gitEditor
	}
	
	// Use git's own editor detection as the most reliable fallback
	if gitEditor := getGitVarEditor(); gitEditor != "" {
		return gitEditor
	}
	
	// Final fallback to common editors (in case git isn't available)
	for _, editor := range []string{"vi", "vim", "nano"} {
		if _, err := exec.LookPath(editor); err == nil {
			return editor
		}
	}
	
	return ""
}

// getGitConfigEditor gets the editor from git config
func getGitConfigEditor() string {
	// Try local config first, then global
	for _, scope := range []string{"", "--global"} {
		var cmd *exec.Cmd
		if scope == "" {
			cmd = exec.Command("git", "config", "--get", "core.editor")
		} else {
			cmd = exec.Command("git", "config", scope, "--get", "core.editor")
		}
		
		output, err := cmd.Output()
		if err == nil {
			editor := strings.TrimSpace(string(output))
			if editor != "" {
				return editor
			}
		}
	}
	
	return ""
}

// getGitVarEditor uses git var GIT_EDITOR to get Git's final editor choice
func getGitVarEditor() string {
	cmd := exec.Command("git", "var", "GIT_EDITOR")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
	
	editor := strings.TrimSpace(string(output))
	return editor
}

// parseEditedFile parses the edited file and returns the status items
func parseEditedFile(filename string) ([]EditStatusUpdateItem, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var items []EditStatusUpdateItem
	scanner := bufio.NewScanner(file)
	order := 1

	// Regex to parse lines like "done some task" or "progress working on something"
	lineRegex := regexp.MustCompile(`^\s*(done|progress|blocker)\s+(.+)$`)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		
		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		matches := lineRegex.FindStringSubmatch(line)
		if len(matches) != 3 {
			return nil, fmt.Errorf("invalid line format: %s\nExpected format: 'done|progress|blocker <description>'", line)
		}

		itemType := matches[1]
		content := strings.TrimSpace(matches[2])

		if content == "" {
			return nil, fmt.Errorf("empty content for item: %s", line)
		}

		items = append(items, EditStatusUpdateItem{
			Content: content,
			Type:    itemType,
			Order:   order,
		})
		order++
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %v", err)
	}

	return items, nil
}

// hasChanges checks if the edited items differ from the original
func hasChanges(statusUpdate *StatusUpdate, editedItems []EditStatusUpdateItem) bool {
	if statusUpdate == nil || len(statusUpdate.Items) == 0 {
		return len(editedItems) > 0
	}

	if len(statusUpdate.Items) != len(editedItems) {
		return true
	}

	for i, item := range statusUpdate.Items {
		if i >= len(editedItems) {
			return true
		}

		editedItem := editedItems[i]
		
		var originalType string
		if item.IsBlocker {
			originalType = "blocker"
		} else if item.IsInProgress {
			originalType = "progress"
		} else {
			originalType = "done"
		}

		if originalType != editedItem.Type || item.Content != editedItem.Content {
			return true
		}
	}

	return false
}

// updateStatusUpdate sends the edited items to the API
func updateStatusUpdate(items []EditStatusUpdateItem, date string) error {
	payload := EditStatusUpdateRequest{
		Items: items,
		Date:  date,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to prepare request: %v", err)
	}

	endpoint := "/cli/status-updates/edit"
	client, req, err := makeAuthenticatedJSONRequest("PUT", endpoint)
	if err != nil {
		return err
	}

	req.Body = io.NopCloser(bytes.NewBuffer(jsonData))

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("server error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}