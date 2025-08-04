package cmd

import (
	"os"
)

// getWebAppURL gets the web app URL from environment or uses default
func getWebAppURL() string {
	webURL := os.Getenv("ASYNCSTATUS_WEB_URL")
	if webURL == "" {
		webURL = "https://app.asyncstatus.com"
	}
	return webURL
}