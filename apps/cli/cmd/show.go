package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

// showCmd represents the show command
var showCmd = &cobra.Command{
	Use:   "show",
	Short: "Display the current status update",
	Long: `Display the current status update for today, showing all progress items, 
blockers, completed tasks, and a link to view it online.

Examples:
  asyncstatus show`,
	Args: cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		if err := handleShowStatus(); err != nil {
			fmt.Printf("❌ Failed to retrieve status update: %v\n", err)
			fmt.Println("   Make sure you're logged in: asyncstatus login")
		}
	},
}

func init() {
	rootCmd.AddCommand(showCmd)
}

// StatusUpdateResponse represents the API response for retrieving a status update
type StatusUpdateResponse struct {
	StatusUpdate *StatusUpdate `json:"statusUpdate"`
	Message      string        `json:"message"`
}

// StatusUpdate represents a status update with items
type StatusUpdate struct {
	ID             string              `json:"id"`
	MemberID       string              `json:"memberId"`
	OrganizationID string              `json:"organizationId"`
	TeamID         *string             `json:"teamId"`
	EffectiveFrom  time.Time           `json:"effectiveFrom"`
	EffectiveTo    time.Time           `json:"effectiveTo"`
	Mood           *string             `json:"mood"`
	Emoji          *string             `json:"emoji"`
	Notes          *string             `json:"notes"`
	IsDraft        bool                `json:"isDraft"`
	Timezone       string              `json:"timezone"`
	CreatedAt      time.Time           `json:"createdAt"`
	UpdatedAt      time.Time           `json:"updatedAt"`
	Items          []StatusUpdateItem  `json:"items"`
	Member         Member              `json:"member"`
	Team           *Team               `json:"team"`
}

// StatusUpdateItem represents a single item in a status update
type StatusUpdateItem struct {
	ID             string    `json:"id"`
	StatusUpdateID string    `json:"statusUpdateId"`
	Content        string    `json:"content"`
	IsBlocker      bool      `json:"isBlocker"`
	IsInProgress   bool      `json:"isInProgress"`
	Order          int       `json:"order"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// Member represents a member with user information
type Member struct {
	ID             string `json:"id"`
	OrganizationID string `json:"organizationId"`
	UserID         string `json:"userId"`
	User           User   `json:"user"`
}

// User represents user information
type User struct {
	ID       string  `json:"id"`
	Email    string  `json:"email"`
	Name     string  `json:"name"`
	Timezone *string `json:"timezone"`
}

// Team represents team information
type Team struct {
	ID             string `json:"id"`
	OrganizationID string `json:"organizationId"`
	Name           string `json:"name"`
	Slug           string `json:"slug"`
}

// handleShowStatus processes retrieving the current status update
func handleShowStatus() error {
	endpoint := "/cli/status-updates/current"
	client, req, err := makeAuthenticatedRequest("GET", endpoint)
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
	var response StatusUpdateResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return fmt.Errorf("failed to parse response: %v", err)
	}

	// Display the status update
	if response.StatusUpdate == nil {
		color.New(color.FgHiBlack).Println("⧗ no updates found for today")
		color.New(color.FgHiBlack).Println("  run:", color.New(color.FgWhite).Sprint("asyncstatus done \"your task\""), "to create one")
		return nil
	}

	displayStatusUpdate(response.StatusUpdate)
	return nil
}

// displayStatusUpdate formats and displays a status update
func displayStatusUpdate(statusUpdate *StatusUpdate) {
	// Header with logo
	headerColor := color.New(color.FgWhite, color.Bold)
	dateColor := color.New(color.FgWhite)
	userColor := color.New(color.FgCyan)
	emailColor := color.New(color.FgHiBlack)
	teamColor := color.New(color.FgMagenta)
	
	headerColor.Print("⧗ ")
	dateColor.Println(statusUpdate.EffectiveFrom.Format("Monday, January 2, 2006"))
	
	userColor.Print("  ")
	userColor.Print(statusUpdate.Member.User.Name)
	emailColor.Printf(" (%s)\n", statusUpdate.Member.User.Email)
	
	if statusUpdate.Team != nil {
		teamColor.Print("  ")
		teamColor.Println(statusUpdate.Team.Name)
	}
	
	// TODO: Add web URL link when organization slug is available in response
	
	fmt.Println()

	if len(statusUpdate.Items) == 0 {
		color.New(color.FgHiBlack).Println("  (empty)")
		return
	}

	// Group items by type
	var completedItems []StatusUpdateItem
	var progressItems []StatusUpdateItem
	var blockerItems []StatusUpdateItem

	for _, item := range statusUpdate.Items {
		if item.IsBlocker {
			blockerItems = append(blockerItems, item)
		} else if item.IsInProgress {
			progressItems = append(progressItems, item)
		} else {
			completedItems = append(completedItems, item)
		}
	}

	// Display completed items
	if len(completedItems) > 0 {
		color.New(color.FgGreen).Println("  ✓ completed")
		for _, item := range completedItems {
			color.New(color.FgWhite).Printf("    %s\n", item.Content)
		}
		fmt.Println()
	}

	// Display in-progress items
	if len(progressItems) > 0 {
		color.New(color.FgYellow).Println("  → in progress")
		for _, item := range progressItems {
			color.New(color.FgWhite).Printf("    %s\n", item.Content)
		}
		fmt.Println()
	}

	// Display blockers
	if len(blockerItems) > 0 {
		color.New(color.FgRed).Println("  ✗ blocked")
		for _, item := range blockerItems {
			color.New(color.FgWhite).Printf("    %s\n", item.Content)
		}
		fmt.Println()
	}

	// Display mood if present
	if statusUpdate.Mood != nil && *statusUpdate.Mood != "" {
		fmt.Println()
		moodColor := color.New(color.FgMagenta)
		moodColor.Print("  mood ")
		
		// Handle multiline mood with proper indentation
		moodLines := strings.Split(*statusUpdate.Mood, "\n")
		for i, line := range moodLines {
			if i == 0 {
				color.New(color.FgWhite).Println(line)
			} else {
				color.New(color.FgWhite).Printf("       %s\n", line)
			}
		}
	}

	// Display notes if present
	if statusUpdate.Notes != nil && *statusUpdate.Notes != "" {
		fmt.Println()
		notesColor := color.New(color.FgBlue)
		notesColor.Print("  notes ")
		
		// Handle multiline notes with proper indentation
		notesLines := strings.Split(*statusUpdate.Notes, "\n")
		for i, line := range notesLines {
			if i == 0 {
				color.New(color.FgWhite).Println(line)
			} else {
				color.New(color.FgWhite).Printf("        %s\n", line)
			}
		}
	}

	fmt.Println()
	timeColor := color.New(color.FgHiBlack)
	timeColor.Printf("  updated %s\n", statusUpdate.UpdatedAt.Format("15:04"))
}