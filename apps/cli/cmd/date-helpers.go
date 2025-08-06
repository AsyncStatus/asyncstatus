package cmd

import (
	"fmt"
	"regexp"
	"strconv"
	"time"
)

// parseDate parses various date formats into ISO date string
func parseDate(dateStr string) (string, error) {
	if dateStr == "" {
		// Return today's date in ISO format
		return time.Now().Format("2006-01-02"), nil
	}

	// Handle relative dates
	if parsedDate, err := parseRelativeDate(dateStr); err == nil {
		return parsedDate.Format("2006-01-02"), nil
	}

	// Handle absolute dates (ISO format YYYY-MM-DD)
	if matched, _ := regexp.MatchString(`^\d{4}-\d{2}-\d{2}$`, dateStr); matched {
		// Validate the date can be parsed
		if _, err := time.Parse("2006-01-02", dateStr); err != nil {
			return "", fmt.Errorf("invalid date format: %s", dateStr)
		}
		return dateStr, nil
	}

	return "", fmt.Errorf("unsupported date format: %s. Use YYYY-MM-DD, 'yesterday', or 'N days ago'", dateStr)
}

// parseRelativeDate parses relative date expressions like "yesterday", "2 days ago"
func parseRelativeDate(dateStr string) (time.Time, error) {
	now := time.Now()
	
	// Handle "yesterday"
	if dateStr == "yesterday" {
		return now.AddDate(0, 0, -1), nil
	}

	// Handle "today" (for completeness)
	if dateStr == "today" {
		return now, nil
	}

	// Handle patterns like "N days ago", "N weeks ago", etc.
	patterns := []struct {
		regex *regexp.Regexp
		unit  string
	}{
		{regexp.MustCompile(`^(\d+)\s+days?\s+ago$`), "days"},
		{regexp.MustCompile(`^(\d+)\s+weeks?\s+ago$`), "weeks"},
		{regexp.MustCompile(`^(\d+)\s+months?\s+ago$`), "months"},
	}

	for _, pattern := range patterns {
		if matches := pattern.regex.FindStringSubmatch(dateStr); len(matches) == 2 {
			num, err := strconv.Atoi(matches[1])
			if err != nil {
				continue
			}

			switch pattern.unit {
			case "days":
				return now.AddDate(0, 0, -num), nil
			case "weeks":
				return now.AddDate(0, 0, -num*7), nil
			case "months":
				return now.AddDate(0, -num, 0), nil
			}
		}
	}

	return time.Time{}, fmt.Errorf("unrecognized relative date format: %s", dateStr)
}

// formatDateForDisplay formats a date string for user-friendly display
func formatDateForDisplay(date string) string {
	if date == "" {
		return "today"
	}

	// Parse the date to show a friendly format
	if parsedDate, err := time.Parse("2006-01-02", date); err == nil {
		if parsedDate.Format("2006-01-02") == time.Now().Format("2006-01-02") {
			return "today"
		} else if parsedDate.Format("2006-01-02") == time.Now().AddDate(0, 0, -1).Format("2006-01-02") {
			return "yesterday"
		} else {
			return parsedDate.Format("Monday, January 2, 2006")
		}
	}

	return date
}