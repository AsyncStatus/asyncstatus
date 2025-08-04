package cmd

import (
	"fmt"
	"os"
	"time"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
)

// BetterAuthSession represents the BetterAuth session response
type BetterAuthSession struct {
	Session *BetterAuthSessionData `json:"session"`
	User    *BetterAuthUser        `json:"user"`
}

// BetterAuthSessionData represents the session data from BetterAuth
type BetterAuthSessionData struct {
	ActiveOrganizationSlug *string `json:"activeOrganizationSlug"`
}

// BetterAuthUser represents user information from BetterAuth
type BetterAuthUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	ActiveOrganizationSlug *string `json:"activeOrganizationSlug"`
}

// JWTPayload represents the JWT token payload
type JWTPayload struct {
	jwt.RegisteredClaims
	Session *BetterAuthSessionData `json:"session"`
	User    *BetterAuthUser        `json:"user"`
}

// validateToken validates a JWT token using the JWKS endpoint
func validateToken(token string) (*JWTPayload, error) {
	apiURL := os.Getenv("ASYNCSTATUS_API_URL")
	if apiURL == "" {
		apiURL = "https://api.asyncstatus.com"
	}
	
	jwksURL := apiURL + "/auth/jwks"
	
	options := keyfunc.Options{
		Ctx: nil,
		RefreshErrorHandler: func(err error) {
			fmt.Printf("There was an error with the jwt.Keyfunc\nError: %s", err.Error())
		},
		RefreshInterval:   time.Hour,
		RefreshRateLimit:  time.Minute * 5,
		RefreshTimeout:    time.Second * 10,
		RefreshUnknownKID: true,
	}
	
	jwks, err := keyfunc.Get(jwksURL, options)
	if err != nil {
		return nil, fmt.Errorf("failed to create JWKS from resource at the given URL: %v", err)
	}
	defer jwks.EndBackground()
	
	parsedToken, err := jwt.ParseWithClaims(token, &JWTPayload{}, jwks.Keyfunc)
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %v", err)
	}
	
	if !parsedToken.Valid {
		return nil, fmt.Errorf("token is invalid")
	}
	
	claims, ok := parsedToken.Claims.(*JWTPayload)
	if !ok {
		return nil, fmt.Errorf("failed to parse claims")
	}
	
	expectedIssuer := apiURL
	expectedAudience := apiURL
	
	if claims.Issuer != expectedIssuer {
		return nil, fmt.Errorf("invalid issuer: expected %s, got %s", expectedIssuer, claims.Issuer)
	}
	
	if len(claims.Audience) == 0 || claims.Audience[0] != expectedAudience {
		return nil, fmt.Errorf("invalid audience: expected %s", expectedAudience)
	}
	
	return claims, nil
}

// getActiveOrganizationSlug gets the user's active organization slug
func getActiveOrganizationSlug() (string, error) {
	token := getCurrentToken()
	
	payload, err := validateToken(token)
	if err != nil {
		return "", fmt.Errorf("failed to validate token: %v", err)
	}
	
	activeOrgSlug := payload.User.ActiveOrganizationSlug
	if activeOrgSlug == nil || *activeOrgSlug == "" {
		return "", fmt.Errorf("no active organization found. Please log in to the web app and select an organization")
	}
	
	return *activeOrgSlug, nil
}

// getWebAppURL gets the web app URL from environment or uses default
func getWebAppURL() string {
	webURL := os.Getenv("ASYNCSTATUS_WEB_URL")
	if webURL == "" {
		webURL = "https://app.asyncstatus.com"
	}
	return webURL
}