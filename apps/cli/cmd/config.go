package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

// Config represents the stored configuration
type Config struct {
	Email string `json:"email"`
	Token string `json:"token"`
}

// getConfigPath returns the path to the config file
func getConfigPath() string {
	return os.ExpandEnv("$HOME/.asyncstatus/config.json")
}

// getConfigDir returns the path to the config directory
func getConfigDir() string {
	return os.ExpandEnv("$HOME/.asyncstatus")
}

// isLoggedIn checks if the user is currently logged in
func isLoggedIn() bool {
	_, err := os.Stat(getConfigPath())
	return err == nil
}

// loadConfig loads the current configuration
func loadConfig() (*Config, error) {
	content, err := os.ReadFile(getConfigPath())
	if err != nil {
		return nil, err
	}
	
	var config Config
	if err := json.Unmarshal(content, &config); err != nil {
		return nil, fmt.Errorf("invalid config file format: %v", err)
	}
	
	return &config, nil
}

// saveConfig saves the configuration to disk
func saveConfig(config *Config) error {
	// Create config directory with restricted permissions (700 = rwx------)
	if err := os.MkdirAll(getConfigDir(), 0700); err != nil {
		return fmt.Errorf("failed to create config directory: %v", err)
	}
	
	// Convert to JSON
	jsonData, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %v", err)
	}
	
	// Write file with restricted permissions (600 = rw-------)
	// This ensures only the current user can read/write the file
	if err := os.WriteFile(getConfigPath(), jsonData, 0600); err != nil {
		return fmt.Errorf("failed to save config: %v", err)
	}
	
	return nil
}

// clearConfig removes the configuration file
func clearConfig() error {
	if err := os.Remove(getConfigPath()); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to clear config: %v", err)
	}
	return nil
}

// getCurrentUserEmail retrieves the currently logged in user's email
// If no user is found, it shows an authentication error and exits
func getCurrentUserEmail() string {
	config, err := loadConfig()
	if err != nil {
		fmt.Println("❌ You are not authenticated.")
		fmt.Println("   Please run: asyncstatus login")
		os.Exit(1)
	}
	
	if config.Email == "" {
		fmt.Println("❌ No user email found.")
		fmt.Println("   Please run: asyncstatus login")
		os.Exit(1)
	}
	
	return config.Email
}

// getCurrentToken retrieves the currently stored auth token
// If no token is found, it shows an authentication error and exits
func getCurrentToken() string {
	config, err := loadConfig()
	if err != nil {
		fmt.Println("❌ You are not authenticated.")
		fmt.Println("   Please run: asyncstatus login")
		os.Exit(1)
	}
	
	if config.Token == "" {
		fmt.Println("❌ No authentication token found.")
		fmt.Println("   Please run: asyncstatus login")
		os.Exit(1)
	}
	
	return config.Token
}

// makeAuthenticatedRequest creates an HTTP client and request with JWT authentication
func makeAuthenticatedRequest(method, endpoint string) (*http.Client, *http.Request, error) {
	token := getCurrentToken()
	apiURL := os.Getenv("ASYNCSTATUS_API_URL")
	if apiURL == "" {
		apiURL = "https://api.asyncstatus.com"
	}
	
	// Create HTTP client
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	
	// Create request
	url := apiURL + endpoint
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create request: %v", err)
	}
	
	// Add authentication headers
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("User-Agent", "AsyncStatus-CLI/"+Version)
	
	return client, req, nil
}

// makeAuthenticatedJSONRequest creates an HTTP client and request with JWT authentication and JSON content type
func makeAuthenticatedJSONRequest(method, endpoint string) (*http.Client, *http.Request, error) {
	client, req, err := makeAuthenticatedRequest(method, endpoint)
	if err != nil {
		return nil, nil, err
	}
	
	// Set JSON content type for requests with body
	req.Header.Set("Content-Type", "application/json")
	
	return client, req, nil
}