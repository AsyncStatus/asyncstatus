"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function ConnectCard() {
  const [animationStep, setAnimationStep] = useState(0);
  const githubButtonRef = useRef<HTMLButtonElement>(null);
  const slackButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonPositions, setButtonPositions] = useState({
    github: { x: 0, y: 0 },
    slack: { x: 0, y: 0 },
  });

  // Update button positions on resize
  useEffect(() => {
    function updateButtonPositions() {
      if (
        containerRef.current &&
        githubButtonRef.current &&
        slackButtonRef.current
      ) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const githubRect = githubButtonRef.current.getBoundingClientRect();
        const slackRect = slackButtonRef.current.getBoundingClientRect();

        setButtonPositions({
          github: {
            x: githubRect.left - containerRect.left + githubRect.width / 2,
            y: githubRect.top - containerRect.top + githubRect.height / 2,
          },
          slack: {
            x: slackRect.left - containerRect.left + slackRect.width / 2,
            y: slackRect.top - containerRect.top + slackRect.height / 2,
          },
        });
      }
    }

    // Initial update
    updateButtonPositions();

    // Update on window resize
    window.addEventListener("resize", updateButtonPositions);

    return () => window.removeEventListener("resize", updateButtonPositions);
  }, []);

  // Control the animation sequence
  useEffect(() => {
    const timings = [
      1000, // Initial pause
      1000, // Move to GitHub
      300, // Click GitHub
      800, // Show GitHub checkmark
      1000, // Move to Slack
      300, // Click Slack
      800, // Show Slack checkmark
      1500, // Reset pause
    ];

    if (animationStep <= 7) {
      const timer = setTimeout(() => {
        setAnimationStep((prev) => prev + 1);
      }, timings[animationStep]);

      return () => clearTimeout(timer);
    } else {
      // Reset animation after completion
      const resetTimer = setTimeout(() => setAnimationStep(0), 1000);
      return () => clearTimeout(resetTimer);
    }
  }, [animationStep]);

  // Get cursor position based on animation step
  const getCursorPosition = () => {
    const initialPos = {
      left: buttonPositions.github.x / 2,
      top: buttonPositions.github.y / 2,
    };

    switch (animationStep) {
      case 1:
      case 2:
      case 3:
        return {
          left: buttonPositions.github.x,
          top: buttonPositions.github.y,
        };
      case 4:
      case 5:
      case 6:
      case 7:
        return { left: buttonPositions.slack.x, top: buttonPositions.slack.y };
      default:
        return initialPos;
    }
  };

  // Is cursor clicking
  const isClicking = animationStep === 2 || animationStep === 5;

  return (
    <div className="border-border bg-background flex h-full flex-col rounded-lg border p-5 transition-all hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-primary rounded-full border border-current px-2.5 py-0.5 text-sm font-medium">
          1
        </span>
      </div>
      <div
        ref={containerRef}
        className="bg-background relative mt-3 aspect-video w-full overflow-hidden rounded-md border"
      >
        <div className="h-full w-full p-3">
          <div className="flex h-full items-center justify-center gap-4">
            {/* GitHub Integration */}
            <div className="relative flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-neutral-100">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div className="mt-0.5 text-xs font-medium">GitHub</div>
              <div className="relative">
                <motion.button
                  ref={githubButtonRef}
                  className="mt-0.5 rounded-md bg-blue-500 px-4 py-1.5 text-xs text-white"
                  animate={
                    animationStep === 2
                      ? {
                          scale: 0.95,
                          backgroundColor: "rgb(37, 99, 235)",
                          transition: { duration: 0.1 },
                        }
                      : {
                          scale: 1,
                          backgroundColor: "rgb(59, 130, 246)",
                          transition: { duration: 0.2 },
                        }
                  }
                >
                  Connect
                </motion.button>

                {/* Green checkmark overlay for GitHub */}
                <AnimatePresence>
                  {animationStep >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-sm"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Slack Integration */}
            <div className="relative flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-neutral-100">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7"
                  fill="currentColor"
                >
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                </svg>
              </div>
              <div className="mt-0.5 text-xs font-medium">Slack</div>
              <div className="relative">
                <motion.button
                  ref={slackButtonRef}
                  className="mt-0.5 rounded-md bg-blue-500 px-4 py-1.5 text-xs text-white"
                  animate={
                    animationStep === 5
                      ? {
                          scale: 0.95,
                          backgroundColor: "rgb(37, 99, 235)",
                          transition: { duration: 0.1 },
                        }
                      : {
                          scale: 1,
                          backgroundColor: "rgb(59, 130, 246)",
                          transition: { duration: 0.2 },
                        }
                  }
                >
                  Connect
                </motion.button>

                {/* Green checkmark overlay for Slack */}
                <AnimatePresence>
                  {animationStep >= 6 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-sm"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Animated cursor */}
        <AnimatePresence>
          {animationStep > 0 && animationStep <= 7 && (
            <motion.div
              className="pointer-events-none absolute z-30"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                scale: isClicking ? 0.92 : 1,
                ...getCursorPosition(),
              }}
              exit={{ opacity: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
                mass: 0.5,
              }}
            >
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                viewBox="0 0 28 28"
                width="30"
                height="30"
                enableBackground="new 0 0 28 28"
                style={{
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.6))",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <polygon
                  fill="#FFFFFF"
                  points="8.2,20.9 8.2,4.9 19.8,16.5 13,16.5 12.6,16.6 "
                />
                <polygon
                  fill="#FFFFFF"
                  points="17.3,21.6 13.7,23.1 9,12 12.7,10.5 "
                />
                <rect
                  x="12.5"
                  y="13.6"
                  transform="matrix(0.9221 -0.3871 0.3871 0.9221 -5.7605 6.5909)"
                  width="2"
                  height="8"
                />
                <polygon points="9.2,7.3 9.2,18.5 12.2,15.6 12.6,15.5 17.4,15.5 " />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <h4 className="mt-4 text-base font-medium">Connect</h4>
      <p className="text-muted-foreground text-sm">Add your GitHub and Slack</p>
    </div>
  );
}
