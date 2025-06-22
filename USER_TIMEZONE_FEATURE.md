# User Timezone Feature Implementation

## Overview
This document describes the implementation of the user timezone feature in AsyncStatus.

## Changes Made

### Database Schema
1. **Added timezone field to user table** (`apps/api/src/db/schema.ts`)
   - Field: `timezone` (text, default: "UTC")
   - Stores IANA timezone identifiers (e.g., "America/New_York")

2. **Generated migration** (`apps/api/drizzle/0001_natural_rumiko_fujikawa.sql`)
   - SQL: `ALTER TABLE user ADD timezone text DEFAULT 'UTC';`

### Backend API
1. **Created user router** (`apps/api/src/routers/user.ts`)
   - `GET /user/me` - Get current user profile with timezone
   - `PATCH /user/me` - Update user profile including timezone
   - `GET /user/timezones` - Get list of supported timezones

2. **Created user schema** (`apps/api/src/schema/user.ts`)
   - `zUserProfileUpdate` - Validation schema for profile updates

3. **Updated main API router** (`apps/api/src/index.ts`)
   - Added user router to the main app routes

### Frontend UI
1. **Created profile page** (`apps/web-app/src/routes/$organizationSlug/_layout.profile.tsx`)
   - User can view and update their name, timezone, and profile image
   - Includes a dropdown with common timezone options
   - Form validation and error handling

2. **Updated user menu** (`apps/web-app/src/components/user-menu.tsx`)
   - Added "Profile settings" link to the user dropdown menu

3. **Created timezone utilities** (`apps/web-app/src/lib/timezone.ts`)
   - `formatDateInTimezone()` - Format dates in user's timezone
   - `getTimezoneOffset()` - Get human-readable timezone offset
   - `getBrowserTimezone()` - Detect browser's timezone
   - `TIMEZONE_OPTIONS` - Common timezone options for dropdowns

## Usage

### For Users
1. Click on your profile picture in the sidebar
2. Select "Profile settings" from the dropdown
3. Choose your timezone from the dropdown list
4. Click "Save changes"

### For Developers
To use the user's timezone when displaying dates:

```typescript
import { formatDateInTimezone } from "@/lib/timezone";

// Format a date in the user's timezone
const formattedDate = formatDateInTimezone(
  new Date(), 
  user.timezone || "UTC",
  "yyyy-MM-dd HH:mm:ss zzz"
);
```

## Migration Instructions
1. Navigate to the API directory: `cd apps/api`
2. Run the migration: `bun run migrate`

## Status Update Timezone Support

### Backend
The status update API endpoints already include user data with timezone when returning status updates. Since we added the timezone field to the user table, all status update queries that include `member: { with: { user: true } }` will automatically include the timezone.

### Frontend Updates
1. **Status Update Card** (`apps/web-app/src/components/status-update-card.tsx`)
   - Updated to display effective dates in the status update author's timezone
   - Uses `formatDateInTimezone()` to format dates correctly

2. **Status Update Detail View** (`apps/web-app/src/routes/$organizationSlug/_layout.status-update/$statusUpdateId.tsx`)
   - Updated all date displays to use the status update author's timezone
   - Shows dates in the correct timezone for the person who created the status update

3. **Timezone Utilities** (`apps/web-app/src/lib/timezone.ts`)
   - Added `date-fns-tz` library for timezone formatting
   - Created utility functions for formatting dates in specific timezones

4. **User Timezone Hook** (`apps/web-app/src/hooks/use-user-timezone.ts`)
   - Created hooks to easily access user timezone throughout the app
   - `useUserTimezone()` - Gets current user's timezone
   - `useStatusUpdateUserTimezone()` - Gets timezone from status update user data

## How It Works
1. When a user creates a status update, it's stored in UTC (start of day)
2. When displaying status updates, dates are converted to the author's timezone
3. Each user sees status update dates in the timezone of the person who created them
4. This ensures consistency - if someone in New York creates a status update for "Monday", everyone sees it as their Monday, regardless of their own timezone

## Next Steps
- Add timezone to user onboarding flow
- Consider adding automatic timezone detection on signup
- Add timezone display in user profiles
- Consider allowing viewers to toggle between author's timezone and their own
- Add more timezone options if needed