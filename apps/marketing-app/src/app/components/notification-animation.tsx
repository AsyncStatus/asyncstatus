"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface Notification {
  id: string;
  type: "slack" | "github" | "jira" | "email" | "calendar" | "figma" | "discord" | "zoom" | 
        "linear" | "notion" | "twitter" | "linkedin" | "whatsapp" | "telegram" | 
        "teams" | "asana" | "trello" | "spotify" | "youtube" | "drive" | "dropbox" | "salesforce" |
        "intercom" | "hubspot" | "stripe" | "shopify" | "airtable" | "clickup" | "monday" |
        "phone" | "sms";
  title: string;
  message: string;
  time: string;
  visible: boolean;
  x: number;
  y: number;
}

const NOTIFICATION_POOL = [
  // Slack notifications (expanded)
  {
    type: "slack" as const,
    title: "Sarah posted in #general",
    message: "Login flow redesign is complete 🎉",
  },
  {
    type: "slack" as const, 
    title: "Mike posted in #dev-team",
    message: "API endpoints ready for testing",
  },
  {
    type: "slack" as const,
    title: "Emma posted in #random",
    message: "Coffee machine is broken again",
  },
  {
    type: "slack" as const,
    title: "Alex posted in #frontend",
    message: "New component library released",
  },
  {
    type: "slack" as const,
    title: "Lisa posted in #design",
    message: "Prototype review tomorrow",
  },
  {
    type: "slack" as const,
    title: "David mentioned you",
    message: "Can you review the analytics code?",
  },
  {
    type: "slack" as const,
    title: "New message in #marketing",
    message: "Campaign results are looking great",
  },
  {
    type: "slack" as const,
    title: "Jake posted in #bugs",
    message: "Found a critical issue in production",
  },
  {
    type: "slack" as const,
    title: "Anna shared a file",
    message: "Updated brand guidelines.pdf",
  },
  {
    type: "slack" as const,
    title: "Thread reply from Tom",
    message: "I agree with the proposed changes",
  },

  // GitHub notifications (expanded)
  {
    type: "github" as const,
    title: "Pull request merged",
    message: "Fix navigation alignment issues",
  },
  {
    type: "github" as const,
    title: "New commit pushed",
    message: "Add OAuth integration with Google",
  },
  {
    type: "github" as const,
    title: "Issue opened",
    message: "Button styles are inconsistent",
  },
  {
    type: "github" as const,
    title: "PR review requested",
    message: "Feature branch needs approval",
  },
  {
    type: "github" as const,
    title: "Build failed",
    message: "Tests are failing on main branch",
  },
  {
    type: "github" as const,
    title: "Security alert",
    message: "Dependency vulnerability detected",
  },
  {
    type: "github" as const,
    title: "New issue assigned",
    message: "Mobile responsive layout bug",
  },
  {
    type: "github" as const,
    title: "Release published",
    message: "Version 2.3.1 is now available",
  },
  {
    type: "github" as const,
    title: "Repository starred",
    message: "Your project gained 5 new stars",
  },
  {
    type: "github" as const,
    title: "Discussion started",
    message: "New architecture proposal posted",
  },
  {
    type: "github" as const,
    title: "Workflow completed",
    message: "Deploy to staging successful",
  },
  {
    type: "github" as const,
    title: "PR comment added",
    message: "Code review feedback provided",
  },

  // Jira notifications (expanded)
  {
    type: "jira" as const,
    title: "AS-142 updated",
    message: "User onboarding flow - Ready for QA",
  },
  {
    type: "jira" as const,
    title: "AS-89 in progress",
    message: "Performance optimization ticket",
  },
  {
    type: "jira" as const,
    title: "AS-234 created",
    message: "Mobile responsive design needed",
  },
  {
    type: "jira" as const,
    title: "AS-156 completed",
    message: "User authentication improvements",
  },
  {
    type: "jira" as const,
    title: "AS-99 blocked",
    message: "Waiting for design assets",
  },
  {
    type: "jira" as const,
    title: "AS-178 assigned to you",
    message: "Fix checkout payment flow",
  },
  {
    type: "jira" as const,
    title: "Sprint started",
    message: "Sprint 24 - Q2 Goals active",
  },
  {
    type: "jira" as const,
    title: "AS-203 commented",
    message: "Additional requirements added",
  },
  {
    type: "jira" as const,
    title: "Epic progress update",
    message: "User Dashboard Epic 75% complete",
  },
  {
    type: "jira" as const,
    title: "AS-167 resolved",
    message: "API rate limiting implemented",
  },

  // Email notifications (expanded)
  {
    type: "email" as const,
    title: "Client feedback received",
    message: "Love the new dashboard! Small tweaks needed",
  },
  {
    type: "email" as const,
    title: "Meeting reminder",
    message: "Weekly sync starts in 30 minutes",
  },
  {
    type: "email" as const,
    title: "Invoice received",
    message: "Monthly subscription payment due",
  },
  {
    type: "email" as const,
    title: "Security alert",
    message: "Unusual login activity detected",
  },
  {
    type: "email" as const,
    title: "System maintenance",
    message: "Scheduled downtime this weekend",
  },
  {
    type: "email" as const,
    title: "Newsletter signup",
    message: "Welcome to our weekly updates",
  },
  {
    type: "email" as const,
    title: "Password reset request",
    message: "Someone requested to reset your password",
  },
  {
    type: "email" as const,
    title: "Team announcement",
    message: "New office policies effective Monday",
  },
  {
    type: "email" as const,
    title: "Support ticket updated",
    message: "Your issue #4567 has been resolved",
  },
  {
    type: "email" as const,
    title: "Document shared",
    message: "Q2 Performance Review shared with you",
  },

  // Calendar notifications (expanded)
  {
    type: "calendar" as const,
    title: "Standup meeting",
    message: "Daily sync starts in 15 minutes",
  },
  {
    type: "calendar" as const,
    title: "Demo preparation",
    message: "Client presentation in 1 hour",
  },
  {
    type: "calendar" as const,
    title: "Code review",
    message: "PR review session starting now",
  },
  {
    type: "calendar" as const,
    title: "All hands meeting",
    message: "Company wide update in 45 minutes",
  },
  {
    type: "calendar" as const,
    title: "1:1 with manager",
    message: "Weekly check-in scheduled",
  },
  {
    type: "calendar" as const,
    title: "Sprint planning",
    message: "Next sprint planning in 2 hours",
  },
  {
    type: "calendar" as const,
    title: "Client call rescheduled",
    message: "Moved to 3 PM today",
  },
  {
    type: "calendar" as const,
    title: "Birthday reminder",
    message: "Sarah's birthday is today",
  },

  // Figma notifications (expanded)
  {
    type: "figma" as const,
    title: "Design updated",
    message: "New mockups uploaded to project",
  },
  {
    type: "figma" as const,
    title: "Comment added",
    message: "Anna left feedback on homepage design",
  },
  {
    type: "figma" as const,
    title: "File shared",
    message: "Mobile wireframes ready for review",
  },
  {
    type: "figma" as const,
    title: "Version published",
    message: "Design system v2.1 is live",
  },
  {
    type: "figma" as const,
    title: "Prototype updated",
    message: "Interactive demo ready for testing",
  },
  {
    type: "figma" as const,
    title: "Component created",
    message: "New button component added",
  },

  // Discord notifications (expanded)
  {
    type: "discord" as const,
    title: "Community message",
    message: "New feature suggestion posted",
  },
  {
    type: "discord" as const,
    title: "Bug report",
    message: "User experiencing login issues",
  },
  {
    type: "discord" as const,
    title: "General chat",
    message: "Anyone free for a quick call?",
  },
  {
    type: "discord" as const,
    title: "Direct message",
    message: "Quick question about the API",
  },
  {
    type: "discord" as const,
    title: "Voice channel active",
    message: "Team standup voice chat started",
  },
  {
    type: "discord" as const,
    title: "File shared",
    message: "Screen recording uploaded",
  },

  // Zoom notifications (expanded)
  {
    type: "zoom" as const,
    title: "Meeting starting",
    message: "Weekly team meeting is starting",
  },
  {
    type: "zoom" as const,
    title: "Recording available",
    message: "Yesterday's meeting recording is ready",
  },
  {
    type: "zoom" as const,
    title: "Meeting reminder",
    message: "Client call starts in 10 minutes",
  },
  {
    type: "zoom" as const,
    title: "Waiting room",
    message: "3 participants waiting for approval",
  },
  {
    type: "zoom" as const,
    title: "Meeting ended",
    message: "Daily standup concluded",
  },

  // Linear notifications (expanded)
  {
    type: "linear" as const,
    title: "New issue created",
    message: "Fix mobile navigation overflow",
  },
  {
    type: "linear" as const,
    title: "Issue completed",
    message: "Dashboard performance improvements",
  },
  {
    type: "linear" as const,
    title: "Sprint planning",
    message: "Q2 roadmap items added",
  },
  {
    type: "linear" as const,
    title: "Issue assigned",
    message: "Payment integration bug assigned to you",
  },
  {
    type: "linear" as const,
    title: "Priority changed",
    message: "Critical bug escalated to urgent",
  },
  {
    type: "linear" as const,
    title: "Cycle completed",
    message: "Development cycle 12 finished",
  },

  // Notion notifications (expanded)
  {
    type: "notion" as const,
    title: "Page updated",
    message: "API documentation revised",
  },
  {
    type: "notion" as const,
    title: "Comment added",
    message: "Team member left feedback on spec",
  },
  {
    type: "notion" as const,
    title: "Database updated",
    message: "Customer feedback entries added",
  },
  {
    type: "notion" as const,
    title: "Page shared",
    message: "Meeting notes shared with team",
  },
  {
    type: "notion" as const,
    title: "Template created",
    message: "New project template available",
  },
  {
    type: "notion" as const,
    title: "Reminder set",
    message: "Review quarterly goals tomorrow",
  },

  // More notification types with expanded examples...
  {
    type: "twitter" as const,
    title: "New mention",
    message: "@user mentioned your company",
  },
  {
    type: "twitter" as const,
    title: "Tweet performance",
    message: "Your post got 100+ likes",
  },
  {
    type: "twitter" as const,
    title: "New follower",
    message: "TechInfluencer started following you",
  },
  {
    type: "twitter" as const,
    title: "Retweet notification",
    message: "Your tweet was retweeted 15 times",
  },

  {
    type: "linkedin" as const,
    title: "Connection request",
    message: "John Doe wants to connect",
  },
  {
    type: "linkedin" as const,
    title: "Post engagement",
    message: "Your article has 50+ comments",
  },
  {
    type: "linkedin" as const,
    title: "Job alert",
    message: "New senior developer position posted",
  },
  {
    type: "linkedin" as const,
    title: "Profile view",
    message: "5 people viewed your profile today",
  },

  {
    type: "whatsapp" as const,
    title: "Team chat",
    message: "Project deadline discussion",
  },
  {
    type: "whatsapp" as const,
    title: "Client message",
    message: "Quick question about the proposal",
  },
  {
    type: "whatsapp" as const,
    title: "Group message",
    message: "Office lunch plans at 12:30",
  },
  {
    type: "whatsapp" as const,
    title: "Status update",
    message: "Sarah updated their status",
  },

  {
    type: "telegram" as const,
    title: "Channel update",
    message: "New announcement posted",
  },
  {
    type: "telegram" as const,
    title: "Group message",
    message: "Development team discussion",
  },
  {
    type: "telegram" as const,
    title: "Bot notification",
    message: "Deployment status: successful",
  },
  {
    type: "telegram" as const,
    title: "File received",
    message: "Document shared in group chat",
  },

  {
    type: "teams" as const,
    title: "Meeting invite",
    message: "Weekly standup scheduled",
  },
  {
    type: "teams" as const,
    title: "File shared",
    message: "Project specs uploaded",
  },
  {
    type: "teams" as const,
    title: "Chat message",
    message: "Quick sync needed on API changes",
  },
  {
    type: "teams" as const,
    title: "Call started",
    message: "Emergency bug fix discussion",
  },

  {
    type: "asana" as const,
    title: "Task assigned",
    message: "Website redesign - Due Friday",
  },
  {
    type: "asana" as const,
    title: "Project update",
    message: "Marketing campaign 80% complete",
  },
  {
    type: "asana" as const,
    title: "Task completed",
    message: "User research phase finished",
  },
  {
    type: "asana" as const,
    title: "Deadline reminder",
    message: "2 tasks due tomorrow",
  },

  {
    type: "trello" as const,
    title: "Card moved",
    message: "Bug fix moved to Done",
  },
  {
    type: "trello" as const,
    title: "Comment added",
    message: "Lisa added feedback on design card",
  },
  {
    type: "trello" as const,
    title: "Due date set",
    message: "Feature implementation due next week",
  },
  {
    type: "trello" as const,
    title: "Member added",
    message: "New team member joined the board",
  },

  {
    type: "spotify" as const,
    title: "Playlist updated",
    message: "Work Focus playlist has new songs",
  },
  {
    type: "spotify" as const,
    title: "Friend activity",
    message: "Alex is listening to Deep Focus",
  },
  {
    type: "spotify" as const,
    title: "New release",
    message: "Your favorite artist released new music",
  },
  {
    type: "spotify" as const,
    title: "Wrapped available",
    message: "Your 2024 music summary is ready",
  },

  {
    type: "youtube" as const,
    title: "New subscriber",
    message: "Channel gained 10 new subscribers",
  },
  {
    type: "youtube" as const,
    title: "Video performance",
    message: "Tutorial video reached 1K views",
  },
  {
    type: "youtube" as const,
    title: "Comment received",
    message: "New comment on coding tutorial",
  },
  {
    type: "youtube" as const,
    title: "Video uploaded",
    message: "Weekly tech update is live",
  },

  {
    type: "drive" as const,
    title: "File shared",
    message: "Q2 Budget Spreadsheet shared with you",
  },
  {
    type: "drive" as const,
    title: "Comment added",
    message: "Feedback on presentation slides",
  },
  {
    type: "drive" as const,
    title: "Storage warning",
    message: "Account is 95% full",
  },
  {
    type: "drive" as const,
    title: "Sync completed",
    message: "All files backed up successfully",
  },

  {
    type: "dropbox" as const,
    title: "File uploaded",
    message: "Design assets folder updated",
  },
  {
    type: "dropbox" as const,
    title: "Share link created",
    message: "Client presentation ready for sharing",
  },
  {
    type: "dropbox" as const,
    title: "Version conflict",
    message: "Multiple versions of report.docx detected",
  },
  {
    type: "dropbox" as const,
    title: "Folder shared",
    message: "Project files shared with client",
  },

  {
    type: "salesforce" as const,
    title: "Lead assigned",
    message: "New enterprise lead requires follow-up",
  },
  {
    type: "salesforce" as const,
    title: "Deal closed",
    message: "Q2 target 25% achieved",
  },
  {
    type: "salesforce" as const,
    title: "Opportunity updated",
    message: "TechCorp deal moved to negotiation",
  },
  {
    type: "salesforce" as const,
    title: "Task reminder",
    message: "Follow up with prospect tomorrow",
  },

  {
    type: "intercom" as const,
    title: "New conversation",
    message: "Customer needs help with setup",
  },
  {
    type: "intercom" as const,
    title: "Support ticket",
    message: "Bug report from premium user",
  },
  {
    type: "intercom" as const,
    title: "Customer satisfaction",
    message: "5-star rating received",
  },
  {
    type: "intercom" as const,
    title: "Auto-reply sent",
    message: "Customer inquiry acknowledged",
  },

  {
    type: "hubspot" as const,
    title: "Contact updated",
    message: "Lead status changed to qualified",
  },
  {
    type: "hubspot" as const,
    title: "Email opened",
    message: "Newsletter campaign 65% open rate",
  },
  {
    type: "hubspot" as const,
    title: "Form submission",
    message: "New demo request received",
  },
  {
    type: "hubspot" as const,
    title: "Deal stage changed",
    message: "Proposal sent to decision maker",
  },

  {
    type: "stripe" as const,
    title: "Payment received",
    message: "$299 subscription payment processed",
  },
  {
    type: "stripe" as const,
    title: "Payment failed",
    message: "Customer card declined - retry needed",
  },
  {
    type: "stripe" as const,
    title: "Payout scheduled",
    message: "$5,432 will be deposited tomorrow",
  },
  {
    type: "stripe" as const,
    title: "Dispute opened",
    message: "Customer disputed $150 charge",
  },

  {
    type: "shopify" as const,
    title: "New order",
    message: "Order #1234 - Premium package",
  },
  {
    type: "shopify" as const,
    title: "Inventory low",
    message: "Product XYZ has 5 units remaining",
  },
  {
    type: "shopify" as const,
    title: "Review received",
    message: "5-star review on bestselling item",
  },
  {
    type: "shopify" as const,
    title: "Abandoned cart",
    message: "Customer left $89 cart incomplete",
  },

  {
    type: "airtable" as const,
    title: "Record updated",
    message: "Customer database entry modified",
  },
  {
    type: "airtable" as const,
    title: "Form submission",
    message: "New feedback form response",
  },
  {
    type: "airtable" as const,
    title: "Base shared",
    message: "Project tracker shared with team",
  },
  {
    type: "airtable" as const,
    title: "Automation triggered",
    message: "Weekly report generated",
  },

  {
    type: "clickup" as const,
    title: "Task completed",
    message: "Website optimization task finished",
  },
  {
    type: "clickup" as const,
    title: "Due date reminder",
    message: "3 tasks due tomorrow",
  },
  {
    type: "clickup" as const,
    title: "Time tracked",
    message: "4 hours logged on development",
  },
  {
    type: "clickup" as const,
    title: "Comment added",
    message: "Feedback on user story requirements",
  },

  {
    type: "monday" as const,
    title: "Status update",
    message: "Project timeline updated",
  },
  {
    type: "monday" as const,
    title: "Board shared",
    message: "Development board shared with team",
  },
  {
    type: "monday" as const,
    title: "Pulse notification",
    message: "Weekly progress summary ready",
  },
  {
    type: "monday" as const,
    title: "Item assigned",
    message: "Bug fix task assigned to you",
  },

  {
    type: "phone" as const,
    title: "Incoming call",
    message: "Client calling about project update",
  },
  {
    type: "phone" as const,
    title: "Missed call",
    message: "Sarah called - Left voicemail",
  },
  {
    type: "phone" as const,
    title: "Conference call",
    message: "Team standup starting in 5 minutes",
  },
  {
    type: "phone" as const,
    title: "Voicemail received",
    message: "New voicemail from unknown number",
  },
  {
    type: "phone" as const,
    title: "Call ended",
    message: "45-minute client call concluded",
  },

  {
    type: "sms" as const,
    title: "New text message",
    message: "Can we reschedule the meeting?",
  },
  {
    type: "sms" as const,
    title: "SMS notification",
    message: "Deployment successful - all systems green",
  },
  {
    type: "sms" as const,
    title: "Client message",
    message: "Quick question about the invoice",
  },
  {
    type: "sms" as const,
    title: "2FA code",
    message: "Your verification code is 123456",
  },
  {
    type: "sms" as const,
    title: "Delivery update",
    message: "Your package will arrive today",
  },
];

export function NotificationAnimation() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const getRandomNotification = (): Notification => {
    const pool = NOTIFICATION_POOL.filter(n => 
      !notifications.some(existing => existing.title === n.title)
    );
    const baseNotification = pool.length === 0 ? NOTIFICATION_POOL[0] : pool[Math.floor(Math.random() * pool.length)];
    
    const timeAgo = Math.floor(Math.random() * 30) + 1;
    
    return {
      ...baseNotification,
      id: `${baseNotification.type}-${Date.now()}-${Math.random()}`,
      time: `${timeAgo}m ago`,
      visible: true,
      x: Math.random() * 60 + 5, // 5% to 65% from left
      y: Math.random() * 80 + 5, // 5% to 85% from top
    };
  };

  // Function to add a notification and schedule its removal
  const addNotification = () => {
    // Limit to 30 notifications for performance
    if (notifications.length >= 30) {
      return;
    }

    const notification = getRandomNotification();
    setNotifications(prev => [...prev, notification]);
    
    // Remove notification after 4-8 seconds (variable lifetime for more organic feel)
    const lifetime = Math.random() * 4000 + 4000; // 4-8 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, lifetime);
  };

  // Function to add multiple notifications with staggered timing
  const addMultipleNotifications = (count: number, delay: number = 50) => {
    for (let i = 0; i < count && notifications.length + i < 30; i++) {
      setTimeout(() => {
        addNotification();
      }, i * delay);
    }
  };

  // Calculate current speed based on elapsed time (gradual acceleration that continues indefinitely)
  const getCurrentSpeed = (elapsedMs: number): { interval: number; burstSize: number; staggerDelay: number } => {
    const elapsedSeconds = elapsedMs / 1000;
    
    // Continuous acceleration that levels off at maximum chaos
    const maxSpeedSeconds = 30; // Reach max chaos at 30 seconds
    const speedFactor = Math.min(elapsedSeconds / maxSpeedSeconds, 1);
    const accelerationCurve = Math.pow(speedFactor, 1.5); // Smooth acceleration curve
    
    // Interval: starts at 2000ms, gradually reduces to 150ms for maximum chaos
    const interval = 2000 - (1850 * accelerationCurve);
    
    // Burst size: starts at 1, gradually increases to 6 (considering our 30 limit)
    const burstSize = Math.ceil(1 + (5 * accelerationCurve));
    
    // Stagger delay: starts at 100ms, reduces to 5ms
    const staggerDelay = 100 - (95 * accelerationCurve);
    
    return { interval, burstSize, staggerDelay };
  };

  // Start the gradual acceleration system
  useEffect(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setStartTime(Date.now());
    
    // Add first notification immediately
    setTimeout(() => {
      addNotification();
    }, 500);
  }, []);

  // Continuous gradual acceleration system that never ends
  useEffect(() => {
    if (!isRunning || !startTime) return;
    
    const scheduleNextBurst = () => {
      const elapsed = Date.now() - startTime;
      const { interval, burstSize, staggerDelay } = getCurrentSpeed(elapsed);
      
      // Add some randomness to make it feel more organic
      const randomizedBurstSize = Math.max(1, burstSize + Math.floor(Math.random() * 3) - 1); // ±1 variation
      const randomizedStaggerDelay = staggerDelay + Math.random() * 20 - 10; // ±10ms variation
      const randomizedInterval = interval + Math.random() * 200 - 100; // ±100ms variation
      
      // Add the burst of notifications (respecting our 30 limit)
      const remainingSlots = 30 - notifications.length;
      const actualBurstSize = Math.min(randomizedBurstSize, remainingSlots);
      
      if (actualBurstSize > 0) {
        addMultipleNotifications(actualBurstSize, Math.max(5, randomizedStaggerDelay));
      }
      
      // Occasionally add extra bursts for chaos (more frequent as speed increases)
      const speedFactor = Math.min(elapsed / 30000, 1);
      if (Math.random() < 0.3 + (speedFactor * 0.4)) { // 30% to 70% chance
        setTimeout(() => {
          const extraSlots = 30 - notifications.length;
          const extraSize = Math.min(Math.ceil(Math.random() * actualBurstSize * 0.8), extraSlots);
          if (extraSize > 0) {
            addMultipleNotifications(extraSize, Math.max(3, randomizedStaggerDelay * 0.5));
          }
        }, Math.random() * randomizedInterval * 0.3);
      }
      
      // Schedule next burst (never stop)
      setTimeout(scheduleNextBurst, Math.max(100, randomizedInterval));
    };
    
    // Start the acceleration loop after initial delay
    setTimeout(scheduleNextBurst, 1000);
  }, [isRunning, startTime]);



  const getServiceIcon = (type: string) => {
    switch (type) {
      case "slack":
        return (
          <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
        );
      case "github":
        return (
          <div className="w-4 h-4 bg-gray-900 rounded flex items-center justify-center text-white text-xs">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
        );
      case "jira":
        return (
          <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
            J
          </div>
        );
      case "email":
        return (
          <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center text-white text-xs">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-20.728c-.904 0-1.636-.732-1.636-1.636v-13.909c0-.904.732-1.636 1.636-1.636h20.728c.904 0 1.636.732 1.636 1.636zm-1.636-1.636h-20.728l10.364 6.545 10.364-6.545zm0 2.909l-10.364 6.545-10.364-6.545v11h20.728v-11z"/>
            </svg>
          </div>
        );
      case "calendar":
        return (
          <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
            C
          </div>
        );
      case "figma":
        return (
          <div className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">
            F
          </div>
        );
      case "discord":
        return (
          <div className="w-4 h-4 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold">
            D
          </div>
        );
      case "zoom":
        return (
          <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
            Z
          </div>
        );
      case "linear":
        return (
          <div className="w-4 h-4 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
            L
          </div>
        );
      case "notion":
        return (
          <div className="w-4 h-4 bg-gray-800 rounded flex items-center justify-center text-white text-xs font-bold">
            N
          </div>
        );
      case "twitter":
        return (
          <div className="w-4 h-4 bg-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
            T
          </div>
        );
      case "linkedin":
        return (
          <div className="w-4 h-4 bg-blue-700 rounded flex items-center justify-center text-white text-xs font-bold">
            L
          </div>
        );
      case "whatsapp":
        return (
          <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
            W
          </div>
        );
      case "telegram":
        return (
          <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
            T
          </div>
        );
      case "teams":
        return (
          <div className="w-4 h-4 bg-purple-700 rounded flex items-center justify-center text-white text-xs font-bold">
            T
          </div>
        );
      case "asana":
        return (
          <div className="w-4 h-4 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
        );
      case "trello":
        return (
          <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
            T
          </div>
        );
      case "spotify":
        return (
          <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
        );
      case "youtube":
        return (
          <div className="w-4 h-4 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
            Y
          </div>
        );
      case "drive":
        return (
          <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
            D
          </div>
        );
      case "dropbox":
        return (
          <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
            D
          </div>
        );
      case "salesforce":
        return (
          <div className="w-4 h-4 bg-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
        );
      case "intercom":
        return (
          <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
            I
          </div>
        );
      case "hubspot":
        return (
          <div className="w-4 h-4 bg-orange-600 rounded flex items-center justify-center text-white text-xs font-bold">
            H
          </div>
        );
      case "stripe":
        return (
          <div className="w-4 h-4 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
        );
      case "shopify":
        return (
          <div className="w-4 h-4 bg-green-700 rounded flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
        );
      case "airtable":
        return (
          <div className="w-4 h-4 bg-yellow-600 rounded flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
        );
      case "clickup":
        return (
          <div className="w-4 h-4 bg-pink-600 rounded flex items-center justify-center text-white text-xs font-bold">
            C
          </div>
        );
      case "monday":
        return (
          <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
            M
          </div>
        );
      case "phone":
        return (
          <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
            P
          </div>
        );
      case "sms":
        return (
          <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
        );
      default:
        return (
          <div className="w-4 h-4 bg-gray-500 rounded flex items-center justify-center text-white text-xs">
            •
          </div>
        );
    }
  };

  const getNotificationStyle = (notification: Notification) => {
    return "bg-white border-gray-200 text-gray-900 shadow-lg";
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h4 className="text-lg font-medium mb-6 text-center text-gray-700">
        Old way: Scattered notifications flood your attention
      </h4>
      
      <div className="space-y-3 min-h-[280px] relative">
        <motion.div 
          className="relative w-full h-[500px] overflow-hidden"
        >
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, index) => {
              // Add dramatic shaking effect to some notifications based on chaos level
              const elapsedSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
              const chaosLevel = Math.min(elapsedSeconds / 30, 1); // 0 to 1 over 30 seconds
              const shouldShake = Math.random() < chaosLevel * 0.6; // Up to 60% of notifications shake at max chaos
              const shakeIntensity = chaosLevel * (2 + Math.random() * 3); // Variable shake intensity
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ 
                    opacity: 0,
                    scale: 0.8,
                    position: "absolute",
                    left: `${notification.x}%`,
                    top: `${notification.y}%`,
                  }}
                  animate={{ 
                    opacity: 1,
                    scale: 1,
                    position: "absolute",
                    left: `${notification.x}%`,
                    top: `${notification.y}%`,
                    // Add shaking animation for drama
                    x: shouldShake ? [0, -shakeIntensity, shakeIntensity, -shakeIntensity, shakeIntensity, 0] : 0,
                    y: shouldShake ? [0, -shakeIntensity*0.5, shakeIntensity*0.5, -shakeIntensity*0.5, shakeIntensity*0.5, 0] : 0,
                    rotate: shouldShake ? [0, -1, 1, -1, 1, 0] : 0,
                    transition: {
                      type: "spring",
                      damping: 25,
                      stiffness: 500,
                      delay: index * 0.03,
                      // Shaking animation properties
                      x: shouldShake ? {
                        duration: 0.6 + Math.random() * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : {},
                      y: shouldShake ? {
                        duration: 0.8 + Math.random() * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : {},
                      rotate: shouldShake ? {
                        duration: 1.0 + Math.random() * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : {}
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8,
                    transition: { 
                      duration: 0.3,
                      ease: "easeInOut"
                    }
                  }}
                  whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  className={`p-3 rounded-lg border ${getNotificationStyle(notification)} 
                             backdrop-blur-sm cursor-pointer w-56`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getServiceIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          {notification.type}
                        </span>
                        <span className="text-xs text-gray-500">{notification.time}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {/* Edge blur gradient overlays */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top edge fade */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white via-white/80 to-transparent"></div>
            {/* Bottom edge fade */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
            {/* Left edge fade */}
            <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
            {/* Right edge fade */}
            <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 