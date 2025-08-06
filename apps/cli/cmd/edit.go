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
  asyncstatus edit                # Edit today's status update
  asyncstatus edit yesterday      # Edit yesterday's status update
  asyncstatus edit today          # Edit today's status update (explicit)
  asyncstatus edit "2 days ago"   # Edit status update from 2 days ago
  asyncstatus edit "1 week ago"   # Edit status update from 1 week ago
  asyncstatus edit "3 weeks ago"  # Edit status update from 3 weeks ago
  asyncstatus edit 2024-01-15     # Edit status update for specific date
  
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
	Mood  *string                `json:"mood"`
	Notes *string                `json:"notes"`
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
	// Parse and normalize the date
	normalizedDate, err := parseDate(date)
	if err != nil {
		return fmt.Errorf("invalid date format: %v", err)
	}

	// Get current status update
	statusUpdate, err := getCurrentStatusUpdateForDate(normalizedDate)
	if err != nil {
		return fmt.Errorf("failed to fetch status update: %v", err)
	}

	// Create temporary file with editable content
	tempFile, err := createEditableFile(statusUpdate, normalizedDate)
	if err != nil {
		return fmt.Errorf("failed to create temporary file: %v", err)
	}
	defer os.Remove(tempFile.Name())

	// Open editor
	if err := openEditor(tempFile.Name()); err != nil {
		return fmt.Errorf("failed to open editor: %v", err)
	}

	// Parse edited file
	parsed, err := parseEditedFile(tempFile.Name())
	if err != nil {
		return fmt.Errorf("failed to parse edited file: %v", err)
	}

	// Check if there were any changes
	if !hasChanges(statusUpdate, parsed) {
		color.New(color.FgHiBlack).Println("⧗ no changes made")
		return nil
	}

	// Send updates to API
	if err := updateStatusUpdate(parsed, normalizedDate); err != nil {
		return fmt.Errorf("failed to update status: %v", err)
	}

	color.New(color.FgGreen).Println("⧗ status update saved")
	return nil
}



// getCurrentStatusUpdateForDate fetches the status update for a specific date
func getCurrentStatusUpdateForDate(date string) (*StatusUpdate, error) {
	// Always use the by-date endpoint for consistency
	return getStatusUpdateByDate(date)
}



// createEditableFile creates a temporary file with the current status items
func createEditableFile(statusUpdate *StatusUpdate, date string) (*os.File, error) {
	tempFile, err := os.CreateTemp("", "asyncstatus-edit-*.txt")
	if err != nil {
		return nil, err
	}

	var content strings.Builder
	
	// Add header with instructions
	targetDate := formatDateForDisplay(date)
	if targetDate == "today" && statusUpdate != nil {
		targetDate = statusUpdate.EffectiveFrom.Format("Monday, January 2, 2006")
	}
	
	content.WriteString(fmt.Sprintf("# Edit your status update for %s\n", targetDate))
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

	// Add mood and notes section
	content.WriteString("\n")
	if statusUpdate != nil && statusUpdate.Mood != nil && *statusUpdate.Mood != "" {
		// Split multiline mood into separate mood lines
		moodLines := strings.Split(*statusUpdate.Mood, "\n")
		for _, line := range moodLines {
			if strings.TrimSpace(line) != "" {
				content.WriteString(fmt.Sprintf("mood %s\n", strings.TrimSpace(line)))
			}
		}
	}
	if statusUpdate != nil && statusUpdate.Notes != nil && *statusUpdate.Notes != "" {
		// Split multiline notes into separate notes lines
		notesLines := strings.Split(*statusUpdate.Notes, "\n")
		for _, line := range notesLines {
			if strings.TrimSpace(line) != "" {
				content.WriteString(fmt.Sprintf("notes %s\n", strings.TrimSpace(line)))
			}
		}
	}

	// Add help section at the bottom
	content.WriteString("\n")
	content.WriteString("#\n")
	content.WriteString("# Commands:\n")
	content.WriteString("#   done <text>     = completed task\n")
	content.WriteString("#   progress <text> = work in progress\n")
	content.WriteString("#   blocker <text>  = blocked task\n")
	content.WriteString("#\n")
	content.WriteString("# Special fields:\n")
	content.WriteString("#   mood <mood>      = your current mood\n")
	content.WriteString("#   notes <text>    = additional notes\n")
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
	content.WriteString("#   mood productive\n")
	content.WriteString("#   notes Great progress today, team collaboration was excellent\n")

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

// ParsedStatusUpdate represents the parsed content from the editor
type ParsedStatusUpdate struct {
	Items []EditStatusUpdateItem
	Mood  *string
	Notes *string
}

// parseEditedFile parses the edited file and returns the status items with mood and notes
func parseEditedFile(filename string) (*ParsedStatusUpdate, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	result := &ParsedStatusUpdate{
		Items: []EditStatusUpdateItem{},
	}
	scanner := bufio.NewScanner(file)
	order := 1

	// Regex to parse different line types
	itemRegex := regexp.MustCompile(`^\s*(done|progress|blocker)\s+(.+)$`)
	moodRegex := regexp.MustCompile(`^\s*mood\s+(.+)$`)
	notesRegex := regexp.MustCompile(`^\s*notes\s+(.+)$`)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		
		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Try to match item types (done, progress, blocker)
		if matches := itemRegex.FindStringSubmatch(line); len(matches) == 3 {
			itemType := matches[1]
			content := strings.TrimSpace(matches[2])

			if content == "" {
				return nil, fmt.Errorf("empty content for item: %s", line)
			}

			result.Items = append(result.Items, EditStatusUpdateItem{
				Content: content,
				Type:    itemType,
				Order:   order,
			})
			order++
			continue
		}

		// Try to match mood
		if matches := moodRegex.FindStringSubmatch(line); len(matches) == 2 {
			mood := strings.TrimSpace(matches[1])
			if mood != "" {
				if result.Mood == nil {
					result.Mood = &mood
				} else {
					combined := *result.Mood + "\n" + mood
					result.Mood = &combined
				}
			}
			continue
		}

		// Try to match notes
		if matches := notesRegex.FindStringSubmatch(line); len(matches) == 2 {
			notes := strings.TrimSpace(matches[1])
			if notes != "" {
				if result.Notes == nil {
					result.Notes = &notes
				} else {
					combined := *result.Notes + "\n" + notes
					result.Notes = &combined
				}
			}
			continue
		}

		// If no patterns match, return an error
		return nil, fmt.Errorf("invalid line format: %s\nExpected format: 'done|progress|blocker <description>', 'mood <mood>', or 'notes <text>'", line)
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %v", err)
	}

	return result, nil
}

// hasChanges checks if the edited content differs from the original
func hasChanges(statusUpdate *StatusUpdate, parsed *ParsedStatusUpdate) bool {
	// Check if there are any items or special fields to save
	hasContent := len(parsed.Items) > 0 || parsed.Mood != nil || parsed.Notes != nil
	
	if statusUpdate == nil || len(statusUpdate.Items) == 0 {
		// Also check if mood or notes are different from nil/empty
		if statusUpdate != nil {
			originalMood := ""
			if statusUpdate.Mood != nil {
				originalMood = *statusUpdate.Mood
			}
			originalNotes := ""
			if statusUpdate.Notes != nil {
				originalNotes = *statusUpdate.Notes
			}
			
			newMood := ""
			if parsed.Mood != nil {
				newMood = *parsed.Mood
			}
			newNotes := ""
			if parsed.Notes != nil {
				newNotes = *parsed.Notes
			}
			
			if originalMood != newMood || originalNotes != newNotes {
				return true
			}
		}
		return hasContent
	}

	// Check if item count changed
	if len(statusUpdate.Items) != len(parsed.Items) {
		return true
	}

	// Check if any items changed
	for i, item := range statusUpdate.Items {
		if i >= len(parsed.Items) {
			return true
		}

		editedItem := parsed.Items[i]
		
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

	// Check if mood changed
	originalMood := ""
	if statusUpdate.Mood != nil {
		originalMood = *statusUpdate.Mood
	}
	newMood := ""
	if parsed.Mood != nil {
		newMood = *parsed.Mood
	}
	if originalMood != newMood {
		return true
	}

	// Check if notes changed
	originalNotes := ""
	if statusUpdate.Notes != nil {
		originalNotes = *statusUpdate.Notes
	}
	newNotes := ""
	if parsed.Notes != nil {
		newNotes = *parsed.Notes
	}
	if originalNotes != newNotes {
		return true
	}

	return false
}

// updateStatusUpdate sends the edited content to the API
func updateStatusUpdate(parsed *ParsedStatusUpdate, date string) error {
	payload := EditStatusUpdateRequest{
		Items: parsed.Items,
		Date:  date,
		Mood:  parsed.Mood,
		Notes: parsed.Notes,
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