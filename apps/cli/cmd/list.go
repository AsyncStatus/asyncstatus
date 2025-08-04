package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"strconv"

	"github.com/savioxavier/termlink"
	"github.com/spf13/cobra"
)

// listCmd represents the list command
var listCmd = &cobra.Command{
	Use:   "list [days]",
	Short: "List recent status updates",
	Long: `List recent status updates for the specified number of days (default: 1).
Shows your status updates from the past few days in reverse chronological order,
including links to view each one online.

Examples:
  asyncstatus list         # List status updates from today only
  asyncstatus list 3       # List status updates from the past 3 days
  asyncstatus list 7       # List status updates from the past 7 days`,
	Args: cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		days := 1 // default
		if len(args) == 1 {
			if d, err := strconv.Atoi(args[0]); err != nil {
				fmt.Printf("❌ Invalid number of days: %s\n", args[0])
				return
			} else {
				days = d
			}
		}

		if err := handleListStatus(days); err != nil {
			fmt.Printf("❌ Failed to retrieve status updates: %v\n", err)
			fmt.Println("   Make sure you're logged in: asyncstatus login")
		}
	},
}

func init() {
	rootCmd.AddCommand(listCmd)
}

// ListStatusUpdatesResponse represents the API response for listing status updates
type ListStatusUpdatesResponse struct {
	StatusUpdates []StatusUpdate `json:"statusUpdates"`
	Message       string         `json:"message"`
}

// handleListStatus processes retrieving recent status updates
func handleListStatus(days int) error {
	if days < 1 || days > 30 {
		return fmt.Errorf("days must be between 1 and 30")
	}

	// Get active organization slug
	orgSlug, err := getActiveOrganizationSlug()
	if err != nil {
		return err
	}

	endpoint := fmt.Sprintf("/organizations/%s/cli/status-updates/recent?days=%d", orgSlug, days)
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
	var response ListStatusUpdatesResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return fmt.Errorf("failed to parse response: %v", err)
	}

	// Display the status updates
	if len(response.StatusUpdates) == 0 {
		if days == 1 {
			fmt.Println("📝 No status updates found for today")
		} else {
			fmt.Printf("📝 No status updates found for the past %d days\n", days)
		}
		fmt.Println("   Add your first update with: asyncstatus done \"your task\"")
		return nil
	}

	if days == 1 {
		fmt.Println("📅 Today's Status Updates")
	} else {
		fmt.Printf("📅 Status Updates (Past %d days)\n", days)
	}
	fmt.Printf("Found %d status update(s)\n\n", len(response.StatusUpdates))

	for i, statusUpdate := range response.StatusUpdates {
		displayStatusUpdateSummary(&statusUpdate, i+1)
		if i < len(response.StatusUpdates)-1 {
			fmt.Println("─────────────────────────────────────────")
		}
	}

	return nil
}

// displayStatusUpdateSummary formats and displays a concise version of a status update
func displayStatusUpdateSummary(statusUpdate *StatusUpdate, index int) {
	fmt.Printf("%d. %s\n", index, statusUpdate.EffectiveFrom.Format("Monday, January 2, 2006"))
	fmt.Printf("   👤 %s (%s)\n", statusUpdate.Member.User.Name, statusUpdate.Member.User.Email)
	
	if statusUpdate.Team != nil {
		fmt.Printf("   👥 Team: %s\n", statusUpdate.Team.Name)
	}
	
	if len(statusUpdate.Items) == 0 {
		fmt.Println("   (No items)")
		fmt.Println()
		return
	}

	// Group items by type for summary display
	var completedCount, progressCount, blockerCount int
	for _, item := range statusUpdate.Items {
		if item.IsBlocker {
			blockerCount++
		} else if item.IsInProgress {
			progressCount++
		} else {
			completedCount++
		}
	}

	// Show summary counts
	var summaryParts []string
	if completedCount > 0 {
		summaryParts = append(summaryParts, fmt.Sprintf("✅ %d completed", completedCount))
	}
	if progressCount > 0 {
		summaryParts = append(summaryParts, fmt.Sprintf("🔄 %d in progress", progressCount))
	}
	if blockerCount > 0 {
		summaryParts = append(summaryParts, fmt.Sprintf("🚫 %d blockers", blockerCount))
	}

	if len(summaryParts) > 0 {
		fmt.Printf("   %s\n", joinStrings(summaryParts, " • "))
	}

	// Show first few items as preview
	maxPreviewItems := 3
	for i, item := range statusUpdate.Items {
		if i >= maxPreviewItems {
			remaining := len(statusUpdate.Items) - maxPreviewItems
			fmt.Printf("   ... and %d more\n", remaining)
			break
		}

		var icon string
		if item.IsBlocker {
			icon = "🚫"
		} else if item.IsInProgress {
			icon = "🔄"
		} else {
			icon = "✅"
		}

		// Truncate long content for summary view
		content := item.Content
		if len(content) > 50 {
			content = content[:47] + "..."
		}

		fmt.Printf("   %s %s\n", icon, content)
	}

	fmt.Printf("   Updated: %s\n", statusUpdate.UpdatedAt.Format("3:04 PM"))
	
	// Get organization slug and construct the web URL
	orgSlug, err := getActiveOrganizationSlug()
	if err == nil {
		webURL := getWebAppURL()
		statusUpdateURL := fmt.Sprintf("%s/%s/status-updates/%s", webURL, orgSlug, statusUpdate.ID)
		link := termlink.Link("View online", statusUpdateURL)
		fmt.Printf("   🔗 %s\n", link)
	}
	
	fmt.Println()
}

// joinStrings joins a slice of strings with a separator
func joinStrings(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	if len(strs) == 1 {
		return strs[0]
	}

	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}