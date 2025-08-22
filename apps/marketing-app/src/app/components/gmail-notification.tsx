"use client";

import { useState, useEffect } from "react";

export function GmailNotification() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification after a short delay when component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className={`fixed top-20 right-2 z-[60] transition-all duration-500 ease-out p-2 ${
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      {/* macOS notification container - glass effect */}
      <div className="bg-black/20 backdrop-blur-3xl rounded-xl shadow-2xl w-96 overflow-hidden border border-white/10 ring-1 ring-black/5">
        {/* Main content */}
        <div className="px-4 pb-4 pt-4">
          <div className="flex items-center gap-3">
            {/* Gmail logo */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <img 
                src="/gmail-icon.png" 
                alt="Gmail"
                className="w-12 h-12 object-contain"
              />
            </div>
            
            {/* Email content */}
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <span className="text-white font-medium text-sm">What has been done this week?</span>
              </div>
              
              <p className="text-white/80 text-sm leading-relaxed">
                Hi, I'm your manager. It's time for portion of annoying questions about your work that has been done, or avoid this shit and use AsyncStatus.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
