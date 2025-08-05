package cmd

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/spf13/cobra"
)

// logoutCmd represents the logout command
var logoutCmd = &cobra.Command{
	Use:   "logout",
	Short: "Logout from AsyncStatus",
	Long: `Logout from your AsyncStatus account and clear stored credentials.

Examples:
  asyncstatus logout`,
	Args: cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		handleLogout()
	},
}

func init() {
	rootCmd.AddCommand(logoutCmd)
}

// handleLogout processes the logout flow
func handleLogout() {
	// Check if user is logged in
	if !isLoggedIn() {
		fmt.Println("ℹ️  You are not currently logged in")
		return
	}
	
	// Get current user info for confirmation
	email := getCurrentUserEmail()
	
	// Perform logout
	if err := performLogout(); err != nil {
		fmt.Printf("❌ Logout failed: %v\n", err)
		os.Exit(1)
	}
	
	fmt.Printf("✅ Successfully logged out %s\n", email)
}

// performLogout handles the actual logout process
func performLogout() error {
	fmt.Println("🔓 Clearing stored credentials...")
	
	// Try to invalidate token on server before clearing local storage
	if err := invalidateTokenOnServer(); err != nil {
		fmt.Printf("⚠️  Warning: Failed to invalidate token on server: %v\n", err)
		fmt.Println("   Continuing with local logout...")
	}
	
	return clearConfig()
}

// invalidateTokenOnServer attempts to invalidate the JWT token on the server
func invalidateTokenOnServer() error {
	// Get the current token - this will exit if not authenticated
	token := getCurrentToken()
	
	// Get API URL from environment or use default
	apiURL := os.Getenv("ASYNCSTATUS_API_URL")
	if apiURL == "" {
		apiURL = "https://api.asyncstatus.com"
	}
	
	// Create HTTP client
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	
	// Make logout request to Better Auth
	logoutURL := apiURL + "/auth/sign-out"
	req, err := http.NewRequest("POST", logoutURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create logout request: %v", err)
	}
	
	// Add JWT token to authorization header
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("User-Agent", "AsyncStatus-CLI/"+Version)
	
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to connect to server: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode >= 400 {
		return fmt.Errorf("server returned status %d", resp.StatusCode)
	}
	
	fmt.Println("✅ Token invalidated on server")
	return nil
}