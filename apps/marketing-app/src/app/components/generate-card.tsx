"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";

// Status update types
type StatusUpdate = {
  id: number;
  content: string;
  type: "update" | "blocker";
  person: string;
};

// Person data
const people = [
  { id: "sarah", name: "Sarah", color: "bg-blue-100 text-blue-700" },
  { id: "alex", name: "Alex", color: "bg-green-100 text-green-700" },
  { id: "michael", name: "Michael", color: "bg-purple-100 text-purple-700" },
  { id: "jessica", name: "Jessica", color: "bg-orange-100 text-orange-700" },
  { id: "david", name: "David", color: "bg-red-100 text-red-700" },
  { id: "emma", name: "Emma", color: "bg-indigo-100 text-indigo-700" },
  { id: "james", name: "James", color: "bg-teal-100 text-teal-700" },
  { id: "olivia", name: "Olivia", color: "bg-amber-100 text-amber-700" },
  { id: "noah", name: "Noah", color: "bg-cyan-100 text-cyan-700" },
  { id: "sophia", name: "Sophia", color: "bg-pink-100 text-pink-700" },
  { id: "ethan", name: "Ethan", color: "bg-lime-100 text-lime-700" },
  { id: "ava", name: "Ava", color: "bg-rose-100 text-rose-700" },
  { id: "lucas", name: "Lucas", color: "bg-fuchsia-100 text-fuchsia-700" },
];

// Animation variants
const itemVariants = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      duration: 0.6,
      opacity: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1.0], // Custom cubic-bezier curve for smooth easing
      },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: {
      duration: 0.6,
      opacity: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1], // Smooth exit fade
      },
    },
  },
};

// Custom transition for entry with staggered delay by slot
const getCustomTransition = (slot: number) => ({
  type: "spring",
  stiffness: 400,
  damping: 30,
  duration: 0.6,
  delay: 0.08 * slot, // Slight stagger based on slot position
  opacity: {
    duration: 0.8,
    ease: [0.25, 0.1, 0.25, 1.0],
  },
  backgroundColor: {
    duration: 1.2,
    ease: "easeInOut",
  },
});

// Animation variants for status update items
const updateVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 15,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -15,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

// Status updates collection - extracted outside the component
const statusUpdates: StatusUpdate[] = [
  // Original 30 updates
  {
    id: 1,
    content: "Fixed navigation sidebar alignment issues (8 commits)",
    type: "update",
    person: "sarah",
  },
  {
    id: 2,
    content: "Opened PR for dashboard charts feature (#42)",
    type: "update",
    person: "alex",
  },
  {
    id: 3,
    content: "Commented on issue #23, working on a fix",
    type: "update",
    person: "michael",
  },
  {
    id: 4,
    content: "Planning to deploy changes after lunch",
    type: "update",
    person: "jessica",
  },
  {
    id: 5,
    content: "Need design assistance with icon sizing",
    type: "update",
    person: "david",
  },
  {
    id: 6,
    content: "Created documentation for new API endpoints",
    type: "update",
    person: "emma",
  },
  {
    id: 7,
    content: "Updated user authentication flow in staging",
    type: "update",
    person: "james",
  },
  {
    id: 8,
    content: "Added test cases for notification system",
    type: "update",
    person: "olivia",
  },
  {
    id: 9,
    content: "Waiting for design feedback on icons",
    type: "blocker",
    person: "sarah",
  },
  {
    id: 10,
    content: "CI pipeline failing on test branch",
    type: "blocker",
    person: "michael",
  },
  {
    id: 11,
    content: "Refactored authentication module (12 commits)",
    type: "update",
    person: "noah",
  },
  {
    id: 12,
    content: "Added mobile responsive layout for dashboard",
    type: "update",
    person: "sophia",
  },
  {
    id: 13,
    content: "Fixed cross-browser compatibility issues in Firefox",
    type: "update",
    person: "ethan",
  },
  {
    id: 14,
    content: "Updated npm dependencies to latest versions",
    type: "update",
    person: "ava",
  },
  {
    id: 15,
    content: "Optimized database queries for better performance",
    type: "update",
    person: "lucas",
  },
  {
    id: 16,
    content: "Implemented dark mode for user preferences",
    type: "update",
    person: "sarah",
  },
  {
    id: 17,
    content: "Fixed memory leak in chart rendering component",
    type: "update",
    person: "alex",
  },
  {
    id: 18,
    content: "Added error boundary to prevent UI crashes",
    type: "update",
    person: "michael",
  },
  {
    id: 19,
    content: "Writing unit tests for new authentication flow",
    type: "update",
    person: "jessica",
  },
  {
    id: 20,
    content: "Created new component library documentation",
    type: "update",
    person: "david",
  },
  {
    id: 21,
    content: "Implemented rate limiting for API endpoints",
    type: "update",
    person: "emma",
  },
  {
    id: 22,
    content: "Migrated state management to Redux Toolkit",
    type: "update",
    person: "james",
  },
  {
    id: 23,
    content: "Set up performance monitoring with Sentry",
    type: "update",
    person: "olivia",
  },
  {
    id: 24,
    content: "Blocked by backend API changes needed for user profile",
    type: "blocker",
    person: "noah",
  },
  {
    id: 25,
    content: "Waiting for legal approval on privacy policy changes",
    type: "blocker",
    person: "sophia",
  },
  {
    id: 26,
    content: "Integration tests failing in CI environment",
    type: "blocker",
    person: "ethan",
  },
  {
    id: 27,
    content: "Need access to production logs for debugging",
    type: "blocker",
    person: "ava",
  },
  {
    id: 28,
    content: "Deployed hotfix for critical security vulnerability",
    type: "update",
    person: "lucas",
  },
  {
    id: 29,
    content: "Improved accessibility for screen readers across app",
    type: "update",
    person: "sarah",
  },
  {
    id: 30,
    content: "Reduced bundle size by code splitting large components",
    type: "update",
    person: "alex",
  },
  {
    id: 31,
    content: "Configured CDN for faster static asset delivery",
    type: "update",
    person: "michael",
  },
  {
    id: 32,
    content: "Implemented client-side caching for API responses",
    type: "update",
    person: "jessica",
  },
  {
    id: 33,
    content: "Refactored form validation logic for better UX",
    type: "update",
    person: "david",
  },
  {
    id: 34,
    content: "Added real-time notification system using WebSockets",
    type: "update",
    person: "emma",
  },
  {
    id: 35,
    content: "Updated privacy policy to comply with new regulations",
    type: "update",
    person: "james",
  },
  {
    id: 36,
    content: "Created automated deployment pipeline using GitHub Actions",
    type: "update",
    person: "olivia",
  },
  {
    id: 37,
    content: "Stuck due to incompatible third-party library",
    type: "blocker",
    person: "noah",
  },
  {
    id: 38,
    content: "Unable to progress without design assets for new feature",
    type: "blocker",
    person: "sophia",
  },
  {
    id: 39,
    content: "Optimized image processing for faster page load times",
    type: "update",
    person: "ethan",
  },
  {
    id: 40,
    content: "Added support for multi-language translations",
    type: "update",
    person: "ava",
  },
  {
    id: 41,
    content: "Migrated database from MongoDB to PostgreSQL",
    type: "update",
    person: "lucas",
  },
  {
    id: 42,
    content: "Fixed edge case in payment processing workflow",
    type: "update",
    person: "sarah",
  },
  {
    id: 43,
    content: "Blocked by network connectivity issues in dev environment",
    type: "blocker",
    person: "alex",
  },
  {
    id: 44,
    content: "Updated Docker configuration for development environment",
    type: "update",
    person: "michael",
  },
  {
    id: 45,
    content: "Improved SEO by adding structured data markup",
    type: "update",
    person: "jessica",
  },
  {
    id: 46,
    content: "Added automated E2E tests for critical user journeys",
    type: "update",
    person: "david",
  },
  {
    id: 47,
    content: "Implemented infinite scrolling for feed component",
    type: "update",
    person: "emma",
  },
  {
    id: 48,
    content: "Fixed performance issues in data visualization charts",
    type: "update",
    person: "james",
  },
  {
    id: 49,
    content: "Added keyboard navigation for improved accessibility",
    type: "update",
    person: "olivia",
  },
  {
    id: 50,
    content: "Configured SSL certificates for custom domain",
    type: "update",
    person: "noah",
  },
];

// Organize updates by slots to ensure no duplicates appear in the same slot cycle
// This divides all updates into 3 non-overlapping groups
const slotUpdateGroups: number[][] = [
  // Updates for slot 0 (indices 0-16)
  Array.from({ length: 17 }, (_, i) => i),

  // Updates for slot 1 (indices 17-33)
  Array.from({ length: 17 }, (_, i) => i + 17),

  // Updates for slot 2 (indices 34-49)
  Array.from({ length: 16 }, (_, i) => i + 34),
];

export function GenerateCard() {
  // Animation state
  const [initialized, setInitialized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Track updates by slot (we show 3 at a time)
  const [slotIndices, setSlotIndices] = useState<{ [key: number]: number }>({
    0: -1, // top slot
    1: -1, // middle slot
    2: -1, // bottom slot
  });

  // Keys to force remount of animations
  const [slotKeys, setSlotKeys] = useState<{ [key: number]: number }>({
    0: 0,
    1: 0,
    2: 0,
  });

  // Track which updates have been shown recently to avoid repeats
  const [recentlyShown, setRecentlyShown] = useState<number[]>([]);

  // Track the previous indices for each slot to avoid consecutive repeats
  const [prevSlotIndices, setPrevSlotIndices] = useState<{
    [key: number]: number;
  }>({
    0: -1,
    1: -1,
    2: -1,
  });

  // Track the available update indices for each slot
  const [slotAvailableIndices, setSlotAvailableIndices] = useState<{
    [key: number]: number[];
  }>({
    0: [...slotUpdateGroups[0]],
    1: [...slotUpdateGroups[1]],
    2: [...slotUpdateGroups[2]],
  });

  // Get formatted current date (e.g., "Tuesday, May 28")
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Find person data
  const getPerson = (id: string) => {
    return people.find((p) => p.id === id) || people[0];
  };

  // Get the update for a particular slot
  const getSlotUpdate = (slot: number) => {
    const index = slotIndices[slot];
    return index >= 0 && index < statusUpdates.length ? statusUpdates[index] : null;
  };

  // Initialize animation sequence
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);

      // Start animation sequence
      setTimeout(() => {
        setIsGenerating(true);

        // Start with random updates from each slot's designated group
        const getRandomFromGroup = (slot: number) => {
          const group = slotUpdateGroups[slot];
          return group[Math.floor(Math.random() * group.length)];
        };

        // Stagger the start of each slot
        setTimeout(() => updateSlot(0, getRandomFromGroup(0)), 800);
        setTimeout(() => updateSlot(1, getRandomFromGroup(1)), 2000);
        setTimeout(() => updateSlot(2, getRandomFromGroup(2)), 3200);
      }, 800);
    }
  }, [initialized]);

  // Update a specific slot with the next update
  const updateSlot = (slot: number, specificIndex?: number) => {
    // Get the current index for this slot
    const currentIndex = slotIndices[slot];
    const previousIndex = prevSlotIndices[slot];

    // Get available indices for this slot
    let availableIndices = [...slotAvailableIndices[slot]];

    // If we've shown all updates for this slot, reset the available indices
    if (availableIndices.length === 0) {
      availableIndices = [...slotUpdateGroups[slot]];
      setSlotAvailableIndices((prev) => ({
        ...prev,
        [slot]: [...slotUpdateGroups[slot]],
      }));
    }

    // Choose next index - either specified or random from available
    const nextIndex =
      specificIndex !== undefined
        ? specificIndex
        : availableIndices[Math.floor(Math.random() * availableIndices.length)];

    // Remove the chosen index from available indices
    const updatedAvailableIndices = availableIndices.filter((idx) => idx !== nextIndex);
    setSlotAvailableIndices((prev) => ({
      ...prev,
      [slot]: updatedAvailableIndices,
    }));

    // Save current as previous
    setPrevSlotIndices((prev) => ({
      ...prev,
      [slot]: currentIndex,
    }));

    // Update the slot with new index
    setSlotIndices((prev) => ({
      ...prev,
      [slot]: nextIndex,
    }));

    // Add current to recentlyShown
    if (currentIndex >= 0) {
      setRecentlyShown((prev) => {
        const updated = [...prev, currentIndex];
        return updated.length > 15 ? updated.slice(-15) : updated;
      });
    }

    // Update key to force remount
    setSlotKeys((prev) => ({
      ...prev,
      [slot]: prev[slot] + 1,
    }));

    // Schedule next update for this slot with some variation in timing
    const nextDelay = 2400 + Math.random() * 900; // Between 2.4 and 3.3 seconds
    setTimeout(() => updateSlot(slot), nextDelay);
  };

  return (
    <div className="border-border bg-background rounded-lg border p-5 transition-all hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-primary rounded-full border border-current px-2.5 py-0.5 text-sm font-medium">
          3
        </span>
      </div>
      <div className="bg-background relative mt-3 aspect-video w-full overflow-hidden rounded-md border max-sm:h-[320px]">
        <div className="h-full w-full p-3">
          {/* Date header */}
          <div className="mb-2 text-left text-sm font-medium">{formattedDate}</div>

          {/* Generation status */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-1">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-blue-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                  />
                  Generating...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status update container */}
          <div className="h-[calc(100%-2rem)] overflow-hidden rounded-md border border-gray-100 bg-white p-3 text-sm">
            <div className="flex h-full flex-col gap-2.5">
              {/* Three slots for updates with min height */}
              {[0, 1, 2].map((slot) => (
                <div key={`slot-${slot}`} className="flex min-h-[66px] items-stretch">
                  <AnimatePresence mode="popLayout">
                    {getSlotUpdate(slot) && (
                      <motion.div
                        key={`item-${slotKeys[slot]}`}
                        className="w-full"
                        variants={updateVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layout="position"
                      >
                        <div
                          className={`flex min-h-[66px] items-center gap-2 rounded-lg p-3 ${
                            getSlotUpdate(slot)?.type === "blocker" ? "bg-red-50" : "bg-gray-50"
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-2 overflow-hidden">
                            {getSlotUpdate(slot) && (
                              <>
                                <div
                                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                                    getSlotUpdate(slot)?.type === "blocker"
                                      ? "bg-red-100 text-red-700"
                                      : getPerson(getSlotUpdate(slot)?.person || "").color
                                  }`}
                                >
                                  {getSlotUpdate(slot)?.type === "blocker" ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="h-3 w-3"
                                    >
                                      <title>Blocker</title>
                                      <path
                                        fillRule="evenodd"
                                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="h-3 w-3"
                                    >
                                      <title>Update</title>
                                      <path
                                        fillRule="evenodd"
                                        d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>

                                <div className="overflow-hidden">
                                  <span
                                    className={`mr-1 text-base leading-tight font-medium ${
                                      getSlotUpdate(slot)?.type === "blocker"
                                        ? "text-red-700"
                                        : "text-gray-800"
                                    }`}
                                  >
                                    {getPerson(getSlotUpdate(slot)?.person || "").name}
                                  </span>
                                  <span
                                    className={`text-base leading-tight ${
                                      getSlotUpdate(slot)?.type === "blocker"
                                        ? "text-red-700"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {getSlotUpdate(slot)?.type === "blocker" && "⚠️ "}
                                    {getSlotUpdate(slot)?.content}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <h4 className="mt-4 text-base font-medium">Generate</h4>
      <p className="text-muted-foreground text-sm">Actions are compiled into status updates</p>
    </div>
  );
}
