"use client";

import { useState, useEffect } from "react";

export function GmailNotification() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification after a short delay when component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    // Hide notification after 7 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 8500); // 1500ms delay + 7000ms visible = 8500ms total

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      className={`fixed top-20 right-2 z-[60] transition-all duration-300 ease-out max-sm:mx-3 ${
        isVisible
          ? "translate-x-0 max-sm:translate-x-0 max-sm:translate-y-0 opacity-100"
          : "translate-x-full max-sm:translate-x-0 max-sm:-translate-y-full opacity-0"
      }`}
    >
      {/* macOS notification container - glass effect with Apple-inspired squircle */}
      <div className="bg-white/20 dark:bg-black/40 backdrop-blur-3xl shadow-2xl w-96 max-sm:w-full overflow-hidden border border-white/20 dark:border-white/10 ring-1 ring-black/5" style={{ 
        borderRadius: '28px 28px 28px 28px / 20px 20px 20px 20px'
      }}>
        {/* Main content */}
        <div className="px-4 pb-3 pt-3">
          <div className="flex items-center gap-3">
            {/* Gmail logo with Apple-inspired squircle */}
            <div className="w-12 h-12 bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm" style={{ 
              borderRadius: '16px 16px 16px 16px / 12px 12px 12px 12px'
            }}>
              <img 
                src="/gmail-icon.png" 
                alt="Gmail"
                className="w-8 h-8 object-contain"
              />
            </div>
            
            {/* Email content */}
            <div className="flex-1 min-w-0">
              <div className="mb-0.5">
                <span className="text-black dark:text-white font-medium text-sm">What have you done this week?</span>
              </div>
              
              <p className="text-black/80 dark:text-white/80 text-sm leading-snug">
              Manager here. It's time for the annoying progress status questions, or avoid this shit and use AsyncStatus.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
