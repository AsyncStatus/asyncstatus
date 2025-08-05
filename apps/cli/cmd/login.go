package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"os"
	"strings"
	"syscall"
	"time"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"golang.org/x/term"
)

var (
	loginEmail  string
	authBaseURL string
)

// loginCmd represents the login command
var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Login to AsyncStatus",
	Long: `Login to your AsyncStatus account using your email and password.

Examples:
  asyncstatus login
  asyncstatus login --email user@example.com
  asyncstatus login --api-url https://dev.api.asyncstatus.com`,
	Args: cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		handleLogin()
	},
}

func init() {
	rootCmd.AddCommand(loginCmd)
	loginCmd.Flags().StringVarP(&loginEmail, "email", "e", "", "Email address")
	loginCmd.Flags().StringVar(&authBaseURL, "api-url", getDefaultAPIURL(), "API base URL")
}

// getDefaultAPIURL returns the default API URL based on environment
func getDefaultAPIURL() string {
	// Check if custom URL is set via environment variable
	if url := os.Getenv("ASYNCSTATUS_API_URL"); url != "" {
		return url
	}
	
	// Default to production
	return "https://api.asyncstatus.com"
}

// handleLogin processes the login flow
func handleLogin() {
	email := loginEmail
	
	// Prompt for email if not provided
	if email == "" {
		fmt.Print("email: ")
		fmt.Scanln(&email)
	}
	
	// Validate email
	email = strings.TrimSpace(email)
	if email == "" {
		color.New(color.FgRed).Println("⧗ email is required")
		os.Exit(1)
	}
	
	if !isValidEmail(email) {
		color.New(color.FgRed).Println("⧗ please enter a valid email address")
		os.Exit(1)
	}
	
	fmt.Print("password: ")
	passwordBytes, err := term.ReadPassword(int(syscall.Stdin))
	fmt.Println()
	
	if err != nil {
		color.New(color.FgRed).Printf("⧗ error reading password: %v\n", err)
		os.Exit(1)
	}
	
	password := string(passwordBytes)
	if strings.TrimSpace(password) == "" {
		color.New(color.FgRed).Println("⧗ password is required")
		os.Exit(1)
	}
	
	// Perform login
	if err := performLogin(email, password); err != nil {
		color.New(color.FgRed).Printf("⧗ login failed: %v\n", err)
		os.Exit(1)
	}
	
	color.New(color.FgGreen).Print("⧗ logged in as ")
	color.New(color.FgCyan).Println(email)
}

// isValidEmail performs basic email validation
func isValidEmail(email string) bool {
	// Basic email validation - contains @ and at least one dot after @
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}
	
	domain := parts[1]
	return strings.Contains(domain, ".") && len(parts[0]) > 0 && len(domain) > 3
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	User struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
	} `json:"user"`
	Session struct {
		ID        string `json:"id"`
		ExpiresAt string `json:"expiresAt"`
	} `json:"session"`
}

// performLogin handles the actual authentication
func performLogin(email, password string) error {
	color.New(color.FgHiBlack).Print("⧗ authenticating ")
	color.New(color.FgCyan).Print(email)
	color.New(color.FgHiBlack).Println("...")
	
	// Prepare login request
	loginReq := LoginRequest{
		Email:    email,
		Password: password,
	}
	
	jsonData, err := json.Marshal(loginReq)
	if err != nil {
		return fmt.Errorf("failed to prepare login request: %v", err)
	}
	
	// Create HTTP client with cookie jar and timeout
	jar, err := cookiejar.New(nil)
	if err != nil {
		return fmt.Errorf("failed to create cookie jar: %v", err)
	}
	
	client := &http.Client{
		Timeout: 30 * time.Second,
		Jar:     jar, // This will store session cookies from Better Auth
	}
	
	// Make login request to Better Auth
	loginURL := authBaseURL + "/auth/sign-in/email"
	req, err := http.NewRequest("POST", loginURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create login request: %v", err)
	}
	
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "AsyncStatus-CLI/"+Version)
	
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to connect to AsyncStatus: %v", err)
	}
	defer resp.Body.Close()
	
	// Check for authentication errors
	if resp.StatusCode == 401 {
		return fmt.Errorf("invalid email or password")
	} else if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("authentication failed (status %d): %s", resp.StatusCode, string(body))
	}
	
	// Parse login response
	var loginResp LoginResponse
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		return fmt.Errorf("failed to parse login response: %v", err)
	}
	
	color.New(color.FgGreen).Print("  ✓ authenticated ")
	color.New(color.FgCyan).Println(loginResp.User.Email)
	color.New(color.FgHiBlack).Println("  retrieving token...")
	
	// Now get the JWT token from the session (uses the same client with cookies)
	jwtToken, err := getJWTToken(client)
	if err != nil {
		return fmt.Errorf("login successful but failed to get JWT token: %v", err)
	}
	
	// Store credentials with JWT token
	return storeCredentials(email, jwtToken)
}

// getJWTToken retrieves the JWT token from the /auth/token endpoint
func getJWTToken(client *http.Client) (string, error) {
	tokenURL := authBaseURL + "/auth/token"
	req, err := http.NewRequest("GET", tokenURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %v", err)
	}
	
	req.Header.Set("User-Agent", "AsyncStatus-CLI/"+Version)
	
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get JWT token: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to get JWT token (status %d): %s", resp.StatusCode, string(body))
	}
	
	// Check for JWT token in set-auth-jwt header (as per Better Auth docs)
	jwtToken := resp.Header.Get("set-auth-jwt")
	if jwtToken != "" {
		color.New(color.FgHiBlack).Println("  ✓ token received via header")
		return jwtToken, nil
	}
	
	// Also check alternative header names
	if token := resp.Header.Get("authorization"); token != "" && strings.HasPrefix(token, "Bearer ") {
		jwtToken = strings.TrimPrefix(token, "Bearer ")
		color.New(color.FgHiBlack).Println("  ✓ token received via authorization header")
		return jwtToken, nil
	}
	
	// Fallback: parse JSON response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read token response: %v", err)
	}
	
	var tokenResp struct {
		Token string `json:"token"`
		JWT   string `json:"jwt"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("failed to parse token response: %v", err)
	}
	
	if tokenResp.Token != "" {
		color.New(color.FgHiBlack).Println("  ✓ token received via json response (token field)")
		return tokenResp.Token, nil
	}
	
	if tokenResp.JWT != "" {
		color.New(color.FgHiBlack).Println("  ✓ token received via json response (jwt field)")
		return tokenResp.JWT, nil
	}
	
	// Debug: show response headers and body
	color.New(color.FgHiBlack).Printf("  no jwt token found. response headers: %v\n", resp.Header)
	color.New(color.FgHiBlack).Printf("  response body: %s\n", string(body))
	
	return "", fmt.Errorf("no JWT token received from server")
}

// storeCredentials stores authentication credentials
func storeCredentials(email, token string) error {
	color.New(color.FgHiBlack).Print("  storing credentials for ")
	color.New(color.FgCyan).Print(email)
	color.New(color.FgHiBlack).Println("...")
	
	config := &Config{
		Email: email,
		Token: token,
	}
	
	return saveConfig(config)
}