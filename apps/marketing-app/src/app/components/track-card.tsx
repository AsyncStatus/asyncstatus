"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

type Activity = {
  id: string;
  content: string;
  subtext: string;
  type: "commit" | "pr" | "issue" | "message";
  source: "github" | "slack";
  channel?: string;
  time?: string;
  user: string;
  collaborators?: string[]; // Additional users for PRs, issues, etc.
};

export function TrackCard() {
  // Container refs for scroll animation
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Combined activities data for unified stream
  const activities: Activity[] = [
    // GitHub Activities
    {
      id: "g1",
      content: "Fixed navigation sidebar alignment",
      subtext: "3 commits to main",
      type: "commit",
      source: "github",
      user: "sarah_dev",
    },
    {
      id: "s1",
      content: "Pushed navigation fix to staging",
      subtext: "#frontend",
      type: "message",
      source: "slack",
      time: "10:15 AM",
      user: "Sarah",
    },
    {
      id: "g2",
      content: "Add user profile dropdown",
      subtext: "PR #42 opened",
      type: "pr",
      source: "github",
      user: "alex_ui",
      collaborators: ["mike_dev", "sarah_dev", "julia_code"],
    },
    {
      id: "s2",
      content: "Anyone available to review PR #42?",
      subtext: "#code-review",
      type: "message",
      source: "slack",
      time: "11:20 AM",
      user: "Alex",
    },
    {
      id: "g3",
      content: "Fix button styling on mobile",
      subtext: "Issue #23 commented",
      type: "issue",
      source: "github",
      user: "julia_code",
      collaborators: ["mike_dev"],
    },
    {
      id: "s3",
      content: "Team standup in 10 minutes",
      subtext: "#general",
      type: "message",
      source: "slack",
      time: "9:50 AM",
      user: "Mike",
    },
    {
      id: "g4",
      content: "Update dependencies to latest",
      subtext: "1 commit to main",
      type: "commit",
      source: "github",
      user: "mike_dev",
    },
    {
      id: "s4",
      content: "New design assets available",
      subtext: "#design",
      type: "message",
      source: "slack",
      time: "2:30 PM",
      user: "Lisa",
    },
    {
      id: "g5",
      content: "Add pagination to dashboard",
      subtext: "PR #44 opened",
      type: "pr",
      source: "github",
      user: "sarah_dev",
    },
    {
      id: "s5",
      content: "Deployment scheduled for 4PM",
      subtext: "#devops",
      type: "message",
      source: "slack",
      time: "3:15 PM",
      user: "Chris",
    },
    {
      id: "g6",
      content: "Fix memory leak in useEffect",
      subtext: "Issue #28 closed",
      type: "issue",
      source: "github",
      user: "mike_dev",
      collaborators: ["julia_code", "alex_ui", "sarah_dev", "chris_dev"],
    },
    {
      id: "s6",
      content: "Found a bug in the checkout flow",
      subtext: "#bugs",
      type: "message",
      source: "slack",
      time: "1:45 PM",
      user: "Julia",
    },
  ];

  // Display users with ellipsis for multiple collaborators
  const formatUsers = (activity: Activity) => {
    if (!activity.collaborators || activity.collaborators.length === 0) {
      return activity.user;
    }

    if (activity.collaborators.length === 1) {
      return `${activity.user} with ${activity.collaborators[0]}`;
    }

    if (activity.collaborators.length === 2) {
      return `${activity.user} with ${activity.collaborators[0]} and ${activity.collaborators[1]}`;
    }

    return `${activity.user} with ${activity.collaborators[0]} and ${activity.collaborators.length} others`;
  };

  // Double the activities for seamless infinite scrolling
  const doubledActivities = [...activities, ...activities];

  // Setup the scrolling animation
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let startTime: number;
    const totalScrollDuration = 40000; // 40 seconds for one complete cycle

    // Continuous scrolling animation
    const scrollAnimation = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Calculate scroll position based on time elapsed
      const scrollHeight = scrollContainer.scrollHeight / 2; // Only need to scroll through first set
      const scrollPosition = ((elapsed % totalScrollDuration) / totalScrollDuration) * scrollHeight;

      // Set scroll position
      scrollContainer.scrollTop = scrollPosition;

      // Continue animation
      animationFrameId = requestAnimationFrame(scrollAnimation);
    };

    // Start animation
    animationFrameId = requestAnimationFrame(scrollAnimation);

    // Cleanup animation on unmount
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Helper function for activity icons
  const getActivityIcon = (activity: Activity) => {
    if (activity.source === "github") {
      switch (activity.type) {
        case "commit":
          return (
            <svg className="size-3 text-emerald-500" viewBox="0 0 16 16" fill="currentColor">
              <title>Commit</title>
              <path d="M8 16a2 2 0 001.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 008 16z"></path>
              <path
                fillRule="evenodd"
                d="M8 1.5A3.5 3.5 0 004.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.018.018 0 00-.003.01l.001.006c0 .002.002.004.004.006a.017.017 0 00.006.004l.007.001h10.964l.007-.001a.016.016 0 00.006-.004.016.016 0 00.004-.006l.001-.007a.017.017 0 00-.003-.01l-1.703-2.554a1.75 1.75 0 01-.294-.97V5A3.5 3.5 0 008 1.5"
              ></path>
            </svg>
          );
        case "pr":
          return (
            <svg className="size-3 text-blue-500" viewBox="0 0 16 16" fill="currentColor">
              <title>PR</title>
              <path
                fillRule="evenodd"
                d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
              ></path>
            </svg>
          );
        case "issue":
          return (
            <svg className="size-3 text-purple-500" viewBox="0 0 16 16" fill="currentColor">
              <title>Issue</title>
              <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
              <path
                fillRule="evenodd"
                d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"
              ></path>
            </svg>
          );
        default:
          return null;
      }
    } else {
      // Message icon instead of Slack icon
      return (
        <svg
          className="size-3 text-neutral-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Slack</title>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    }
  };

  return (
    <div className="border-border bg-background rounded-lg border p-5 transition-all hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-primary rounded-full border border-current px-2.5 py-0.5 text-sm font-medium">
          2
        </span>
      </div>
      <div className="bg-background relative mt-3 aspect-video w-full overflow-hidden rounded-md border">
        <div className="flex h-full flex-col">
          {/* Scrolling content container with relative positioning for the gradient overlays */}
          <div className="relative h-full w-full">
            {/* Top gradient overlay with progressive blur effect */}
            <div
              className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-8 w-full"
              style={{
                background:
                  "linear-gradient(to bottom, var(--background) 20%, rgba(255,255,255,0.8) 65%, rgba(255,255,255,0) 100%)",
                backdropFilter: "blur(0px)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)",
              }}
            ></div>

            {/* Scrolling container */}
            <div ref={scrollContainerRef} className="h-full w-full overflow-hidden p-3">
              <div className="space-y-2">
                {doubledActivities.map((activity, index) => (
                  <div
                    key={`${activity.id}-${index}`}
                    className="flex items-start gap-2 rounded-md bg-white p-2 shadow-sm"
                  >
                    <div className="mt-0.5">{getActivityIcon(activity)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">
                          {activity.source === "github" ? "GitHub" : "Slack"}
                        </span>
                        {activity.source === "slack" && activity.time && (
                          <span className="text-muted-foreground">{activity.time}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{activity.content}</p>
                      <div className="flex flex-wrap items-center gap-x-1 text-xs">
                        <span className="text-muted-foreground max-w-[180px] truncate">
                          {activity.subtext}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span
                          className="text-muted-foreground max-w-[180px] truncate"
                          title={formatUsers(activity)}
                        >
                          {formatUsers(activity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom gradient overlay with progressive blur effect */}
            <div
              className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 w-full"
              style={{
                background:
                  "linear-gradient(to top, var(--background) 20%, rgba(255,255,255,0.8) 65%, rgba(255,255,255,0) 100%)",
                backdropFilter: "blur(0px)",
                WebkitMaskImage:
                  "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)",
              }}
            ></div>
          </div>
        </div>
      </div>
      <h4 className="mt-4 text-base font-medium">Track</h4>
      <p className="text-muted-foreground text-sm">We track commits, PRs, issues, and messages</p>
    </div>
  );
}
