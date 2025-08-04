package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"time"

	"github.com/savioxavier/termlink"
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
	// Get active organization slug
	orgSlug, err := getActiveOrganizationSlug()
	if err != nil {
		return err
	}

	endpoint := fmt.Sprintf("/organizations/%s/cli/status-updates/current", orgSlug)
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
		fmt.Println("📝 No status update found for today")
		fmt.Println("   Add your first update with: asyncstatus done \"your task\"")
		return nil
	}

	displayStatusUpdate(response.StatusUpdate)
	return nil
}

// displayStatusUpdate formats and displays a status update
func displayStatusUpdate(statusUpdate *StatusUpdate) {
	fmt.Printf("📅 Status Update for %s\n", statusUpdate.EffectiveFrom.Format("Monday, January 2, 2006"))
	fmt.Printf("👤 %s (%s)\n", statusUpdate.Member.User.Name, statusUpdate.Member.User.Email)
	
	if statusUpdate.Team != nil {
		fmt.Printf("👥 Team: %s\n", statusUpdate.Team.Name)
	}
	
	// Get organization slug and construct the web URL
	orgSlug, err := getActiveOrganizationSlug()
	if err == nil {
		webURL := getWebAppURL()
		statusUpdateURL := fmt.Sprintf("%s/%s/status-updates/%s", webURL, orgSlug, statusUpdate.ID)
		link := termlink.Link("View online", statusUpdateURL)
		fmt.Printf("🔗 %s\n", link)
	}
	
	fmt.Println()

	if len(statusUpdate.Items) == 0 {
		fmt.Println("   No items in status update")
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
		fmt.Println("✅ Completed:")
		for _, item := range completedItems {
			fmt.Printf("   • %s\n", item.Content)
		}
		fmt.Println()
	}

	// Display in-progress items
	if len(progressItems) > 0 {
		fmt.Println("🔄 In Progress:")
		for _, item := range progressItems {
			fmt.Printf("   • %s\n", item.Content)
		}
		fmt.Println()
	}

	// Display blockers
	if len(blockerItems) > 0 {
		fmt.Println("🚫 Blockers:")
		for _, item := range blockerItems {
			fmt.Printf("   • %s\n", item.Content)
		}
		fmt.Println()
	}

	fmt.Printf("Last updated: %s\n", statusUpdate.UpdatedAt.Format("3:04 PM"))
}