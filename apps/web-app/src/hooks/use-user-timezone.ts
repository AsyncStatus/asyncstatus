import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/rpc/rpc";

/**
 * Hook to get the current user's timezone
 * @returns The user's timezone or 'UTC' as fallback
 */
export function useUserTimezone() {
  const { data: userProfile } = useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      const response = await rpc.user.me.$get();
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  return userProfile?.timezone || "UTC";
}

/**
 * Hook to get a specific user's timezone from status update data
 * @param user The user object from a status update
 * @returns The user's timezone or 'UTC' as fallback
 */
export function useStatusUpdateUserTimezone(user?: { timezone?: string }) {
  return user?.timezone || "UTC";
}