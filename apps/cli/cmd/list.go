package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"strconv"

	"github.com/fatih/color"
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
			color.New(color.FgHiBlack).Println("⧗ no updates found for today")
		} else {
			color.New(color.FgHiBlack).Printf("⧗ no updates found for the past %d days\n", days)
		}
		color.New(color.FgHiBlack).Println("  run:", color.New(color.FgWhite).Sprint("asyncstatus done \"your task\""), "to create one")
		return nil
	}

	headerColor := color.New(color.FgWhite, color.Bold)
	countColor := color.New(color.FgCyan)
	
	headerColor.Print("⧗ ")
	if days == 1 {
		headerColor.Println("today's updates")
	} else {
		headerColor.Printf("past %d days\n", days)
	}
	countColor.Printf("  %d update(s)\n\n", len(response.StatusUpdates))

	for i, statusUpdate := range response.StatusUpdates {
		displayStatusUpdateSummary(&statusUpdate, i+1)
		if i < len(response.StatusUpdates)-1 {
			color.New(color.FgHiBlack).Println("  ────────────────────────────────────")
		}
	}

	return nil
}

// displayStatusUpdateSummary formats and displays a concise version of a status update
func displayStatusUpdateSummary(statusUpdate *StatusUpdate, index int) {
	indexColor := color.New(color.FgHiBlack)
	dateColor := color.New(color.FgWhite, color.Bold)
	userColor := color.New(color.FgCyan)
	emailColor := color.New(color.FgHiBlack)
	teamColor := color.New(color.FgMagenta)
	
	indexColor.Printf("  %d. ", index)
	dateColor.Println(statusUpdate.EffectiveFrom.Format("Monday, January 2"))
	
	userColor.Print("     ")
	userColor.Print(statusUpdate.Member.User.Name)
	emailColor.Printf(" (%s)\n", statusUpdate.Member.User.Email)
	
	if statusUpdate.Team != nil {
		teamColor.Print("     ")
		teamColor.Println(statusUpdate.Team.Name)
	}
	
	if len(statusUpdate.Items) == 0 {
		color.New(color.FgHiBlack).Println("     (empty)")
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
		summaryParts = append(summaryParts, color.New(color.FgGreen).Sprintf("✓%d", completedCount))
	}
	if progressCount > 0 {
		summaryParts = append(summaryParts, color.New(color.FgYellow).Sprintf("→%d", progressCount))
	}
	if blockerCount > 0 {
		summaryParts = append(summaryParts, color.New(color.FgRed).Sprintf("✗%d", blockerCount))
	}

	if len(summaryParts) > 0 {
		fmt.Printf("     %s\n", joinStrings(summaryParts, " "))
	}

	// Show all items
	for _, item := range statusUpdate.Items {
		var itemColor *color.Color
		if item.IsBlocker {
			itemColor = color.New(color.FgRed)
		} else if item.IsInProgress {
			itemColor = color.New(color.FgYellow)
		} else {
			itemColor = color.New(color.FgGreen)
		}

		fmt.Print("     ")
		itemColor.Printf("• %s\n", item.Content)
	}

	timeColor := color.New(color.FgHiBlack)
	timeColor.Printf("     %s", statusUpdate.UpdatedAt.Format("15:04"))
	
	// Get organization slug and construct the web URL
	orgSlug, err := getActiveOrganizationSlug()
	if err == nil {
		webURL := getWebAppURL()
		statusUpdateURL := fmt.Sprintf("%s/%s/status-updates/%s", webURL, orgSlug, statusUpdate.ID)
		link := termlink.Link("view", statusUpdateURL)
		linkColor := color.New(color.FgBlue)
		linkColor.Printf(" • %s", link)
	}
	fmt.Println()
	
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