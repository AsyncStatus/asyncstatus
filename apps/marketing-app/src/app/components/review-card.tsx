"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Define review editing sequence
type EditStep = {
  id: number;
  text: string;
  cursorTarget?:
    | "line"
    | "save"
    | "reset"
    | "markAsBlocker"
    | "delete"
    | "move_cursor"
    | "final_view";
  targetLine?: number;
  targetColumn?: number;
  action?:
    | "click"
    | "type"
    | "highlight"
    | "wait"
    | "delete"
    | "show_context_menu"
    | "click_button"
    | "click_delete"
    | "move_cursor"
    | "final_view";
  textToType?: string;
  deleteCount?: number;
  highlightLine?: number;
  duration?: number;
  typingInProgress?: boolean;
};

// Animation sequence for editing status updates
const editSequence: EditStep[] = [
  // Initial state
  {
    id: 0,
    text: "Fixed navigation sidebar alignment issues (8 commits)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\nPlanning to deploy changes after lunch\nNeed design assistance with icon sizing",
    action: "wait",
    duration: 1000,
  },
  // Move cursor to line 3 (Planning to deploy changes)
  {
    id: 1,
    text: "Fixed navigation sidebar alignment issues (8 commits)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\nPlanning to deploy changes after lunch\nNeed design assistance with icon sizing",
    cursorTarget: "line",
    targetLine: 3,
    targetColumn: 20,
    action: "wait",
    duration: 800,
    highlightLine: 3, // Highlight the line when hovering
  },
  // Show action buttons and hover over Delete button
  {
    id: 2,
    text: "Fixed navigation sidebar alignment issues (8 commits)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\nPlanning to deploy changes after lunch\nNeed design assistance with icon sizing",
    cursorTarget: "line",
    targetLine: 3,
    targetColumn: 20,
    action: "show_context_menu",
    highlightLine: 3,
    duration: 800,
  },
  // Click Delete button
  {
    id: 3,
    text: "Fixed navigation sidebar alignment issues (8 commits)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\nPlanning to deploy changes after lunch\nNeed design assistance with icon sizing",
    cursorTarget: "delete",
    targetLine: 3,
    targetColumn: 20,
    action: "click_delete",
    highlightLine: 3,
    duration: 400,
  },
  // Move cursor to line 3 (Need design assistance)
  {
    id: 5,
    text: "Fixed navigation sidebar alignment issues (8 commits)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\nNeed design assistance with icon sizing",
    cursorTarget: "line",
    targetLine: 3,
    targetColumn: 25,
    action: "wait",
    duration: 800,
    highlightLine: 3,
  },
  // Show action buttons and hover over Mark as blocker button
  {
    id: 6,
    text: "Fixed navigation sidebar alignment issues (8 commits)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\nNeed design assistance with icon sizing",
    cursorTarget: "line",
    targetLine: 3,
    targetColumn: 25,
    action: "show_context_menu",
    highlightLine: 3,
    duration: 800,
  },
  // Click "Mark as blocker" button
  {
    id: 7,
    text: "Fixed navigation sidebar alignment issues (8 commits)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\nNeed design assistance with icon sizing",
    cursorTarget: "markAsBlocker",
    targetLine: 3,
    targetColumn: 25,
    action: "click_button",
    highlightLine: 3,
    duration: 400,
  },
  // Continue moving to line 0
  {
    id: 10,
    text: "Fixed navigation sidebar alignment issues (8 commits)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\n⚠️ Blocked: Need design assistance with icon sizing",
    cursorTarget: "line",
    targetLine: 0,
    targetColumn: 37,
    action: "wait",
    duration: 600,
  },
  // Highlight '(8 commits)'
  {
    id: 11,
    text: "Fixed navigation sidebar alignment issues (8 commits)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\n⚠️ Blocked: Need design assistance with icon sizing",
    cursorTarget: "line",
    targetLine: 0,
    targetColumn: 37,
    action: "highlight",
    highlightLine: 0,
    duration: 900,
  },
  // Delete '(8 commits)'
  {
    id: 12,
    text: "Fixed navigation sidebar alignment issues (8 commits)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\n⚠️ Blocked: Need design assistance with icon sizing",
    cursorTarget: "line",
    targetLine: 0,
    targetColumn: 37,
    action: "delete",
    deleteCount: 11,
    duration: 340,
  },
  // Type '(merged to main)'
  {
    id: 13,
    text: "Fixed navigation sidebar alignment issues \nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\n⚠️ Blocked: Need design assistance with icon sizing",
    cursorTarget: "line",
    targetLine: 0,
    targetColumn: 37,
    action: "type",
    textToType: "(merged to main))",
    typingInProgress: true,
    duration: 80,
  },
  // Move cursor to the Save button
  {
    id: 15,
    text: "Fixed navigation sidebar alignment issues (merged to main)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\n⚠️ Blocked: Need design assistance with icon sizing",
    cursorTarget: "save",
    action: "wait",
    duration: 1200,
  },
  // Click save button
  {
    id: 16,
    text: "Fixed navigation sidebar alignment issues (merged to main)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\n⚠️ Blocked: Need design assistance with icon sizing",
    cursorTarget: "save",
    action: "click",
    duration: 800,
  },
  // Success state (brief pause)
  {
    id: 17,
    text: "Fixed navigation sidebar alignment issues (merged to main)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\n⚠️ Blocked: Need design assistance with icon sizing",
    action: "wait",
    duration: 100,
  },
  // Show final status view (real app mode)
  {
    id: 18,
    text: "Fixed navigation sidebar alignment issues (merged to main)\nOpened PR for dashboard charts feature (#42)\nCommented on issue #23, working on a fix\n⚠️ Blocked: Need design assistance with icon sizing",
    action: "final_view",
    duration: 8000,
  },
];

// Animation variants
const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95, backgroundColor: "rgb(37, 99, 235)" },
};

const lineVariants = {
  normal: { backgroundColor: "transparent" },
  highlight: { backgroundColor: "rgba(59, 130, 246, 0.1)" },
};

// Add refined button variants for action buttons
const actionButtonVariants = {
  initial: { opacity: 0, y: -5 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: 5, transition: { duration: 0.2, ease: "easeIn" } },
  hover: {
    scale: 1.05,
    backgroundColor: "rgba(249, 250, 251, 1)",
    transition: { duration: 0.2 },
  },
};

export function ReviewCard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(0);
  const [lineHeights, setLineHeights] = useState<number[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [typingText, setTypingText] = useState("");
  const [typingProgress, setTypingProgress] = useState(0);
  const [deletingProgress, setDeletingProgress] = useState(0);
  const [currentlyEditedText, setCurrentlyEditedText] = useState<string>("");
  const [isAnimatingText, setIsAnimatingText] = useState(false);

  // Cursor state
  const [cursorPosition, setCursorPosition] = useState({ left: 100, top: 100 });
  const [targetPosition, setTargetPosition] = useState({ left: 100, top: 100 });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Refs for action buttons
  const actionButtonRefs = useRef<{
    [key: string]: { [key: string]: HTMLButtonElement | null };
  }>({});

  // Get current text for display
  const getCurrentText = () => {
    return currentlyEditedText;
  };

  // Get current text and cursor action
  const currentStepData = editSequence[currentStep];
  const currentText = getCurrentText().split("\n");
  const isClicking = currentStepData.action === "click";
  const isHighlighting = currentStepData.action === "highlight";
  const highlightedLine = currentStepData.highlightLine;

  // Get current action states
  const isShowingContextMenu = currentStepData.action === "show_context_menu";
  const isClickingButton = currentStepData.action === "click_button";
  const isClickingDelete = currentStepData.action === "click_delete";
  const isShowingFinalView = currentStepData.action === "final_view";

  // Calculate positions of elements
  useEffect(() => {
    if (!containerRef.current || !initialized) return;

    const updateCursorTargetPosition = () => {
      const step = editSequence[currentStep];
      if (!step) return;

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      let newTarget = { ...targetPosition };

      switch (step.cursorTarget) {
        case "line":
          if (
            step.targetLine !== undefined &&
            lineRefs.current[step.targetLine]
          ) {
            const lineRef = lineRefs.current[step.targetLine];
            if (lineRef) {
              const lineRect = lineRef.getBoundingClientRect();
              const charWidth = 7; // Approximate character width in pixels

              newTarget = {
                left:
                  lineRect.left -
                  containerRect.left +
                  10 +
                  (step.targetColumn || 0) * charWidth,
                top:
                  lineRect.top - containerRect.top + lineRef.offsetHeight / 2,
              };
            }
          }
          break;

        case "save":
          if (saveButtonRef.current) {
            const buttonRect = saveButtonRef.current.getBoundingClientRect();
            newTarget = {
              left: buttonRect.left - containerRect.left + buttonRect.width / 2,
              top: buttonRect.top - containerRect.top + buttonRect.height / 2,
            };
          }
          break;

        case "reset":
          if (resetButtonRef.current) {
            const buttonRect = resetButtonRef.current.getBoundingClientRect();
            newTarget = {
              left: buttonRect.left - containerRect.left + buttonRect.width / 2,
              top: buttonRect.top - containerRect.top + buttonRect.height / 2,
            };
          }
          break;

        case "markAsBlocker":
          if (
            step.targetLine !== undefined &&
            actionButtonRefs.current[step.targetLine] &&
            actionButtonRefs.current[step.targetLine].markAsBlocker
          ) {
            const buttonRef =
              actionButtonRefs.current[step.targetLine].markAsBlocker;
            if (buttonRef) {
              const buttonRect = buttonRef.getBoundingClientRect();
              newTarget = {
                left:
                  buttonRect.left - containerRect.left + buttonRect.width / 2,
                top: buttonRect.top - containerRect.top + buttonRect.height / 2,
              };
            }
          }
          break;

        case "delete":
          if (
            step.targetLine !== undefined &&
            actionButtonRefs.current[step.targetLine] &&
            actionButtonRefs.current[step.targetLine].delete
          ) {
            const buttonRef = actionButtonRefs.current[step.targetLine].delete;
            if (buttonRef) {
              const buttonRect = buttonRef.getBoundingClientRect();
              newTarget = {
                left:
                  buttonRect.left - containerRect.left + buttonRect.width / 2,
                top: buttonRect.top - containerRect.top + buttonRect.height / 2,
              };
            }
          }
          break;
      }

      setTargetPosition(newTarget);
    };

    // Measure line heights and action button positions
    const updateElementPositions = () => {
      // Measure line heights
      const heights: number[] = [];
      lineRefs.current.forEach((lineRef, i) => {
        if (lineRef) {
          heights[i] = lineRef.offsetHeight;
        } else {
          heights[i] = 18; // Default line height
        }
      });
      setLineHeights(heights);

      // Update cursor target position after elements are measured
      updateCursorTargetPosition();
    };

    // Initial update
    updateElementPositions();

    // Update on window resize
    window.addEventListener("resize", updateElementPositions);

    return () => {
      window.removeEventListener("resize", updateElementPositions);
    };
  }, [currentStep, initialized]); // Remove targetPosition from dependencies

  // Update cursor target position when step changes
  useEffect(() => {
    const step = editSequence[currentStep];
    if (!step || !containerRef.current) return;

    // Set up a one-time position update when step changes
    const timer = setTimeout(() => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      let newTarget = { ...targetPosition };

      switch (step.cursorTarget) {
        case "line":
          if (
            step.targetLine !== undefined &&
            lineRefs.current[step.targetLine]
          ) {
            const lineRef = lineRefs.current[step.targetLine];
            if (lineRef) {
              const lineRect = lineRef.getBoundingClientRect();
              const charWidth = 7; // Approximate character width in pixels

              newTarget = {
                left:
                  lineRect.left -
                  containerRect.left +
                  10 +
                  (step.targetColumn || 0) * charWidth,
                top:
                  lineRect.top - containerRect.top + lineRef.offsetHeight / 2,
              };
            }
          }
          break;

        case "save":
          if (saveButtonRef.current) {
            const buttonRect = saveButtonRef.current.getBoundingClientRect();
            newTarget = {
              left: buttonRect.left - containerRect.left + buttonRect.width / 2,
              top: buttonRect.top - containerRect.top + buttonRect.height / 2,
            };
          }
          break;

        case "reset":
          if (resetButtonRef.current) {
            const buttonRect = resetButtonRef.current.getBoundingClientRect();
            newTarget = {
              left: buttonRect.left - containerRect.left + buttonRect.width / 2,
              top: buttonRect.top - containerRect.top + buttonRect.height / 2,
            };
          }
          break;

        case "markAsBlocker":
          if (
            step.targetLine !== undefined &&
            actionButtonRefs.current[step.targetLine] &&
            actionButtonRefs.current[step.targetLine].markAsBlocker
          ) {
            const buttonRef =
              actionButtonRefs.current[step.targetLine].markAsBlocker;
            if (buttonRef) {
              const buttonRect = buttonRef.getBoundingClientRect();
              newTarget = {
                left:
                  buttonRect.left - containerRect.left + buttonRect.width / 2,
                top: buttonRect.top - containerRect.top + buttonRect.height / 2,
              };
            }
          }
          break;

        case "delete":
          if (
            step.targetLine !== undefined &&
            actionButtonRefs.current[step.targetLine] &&
            actionButtonRefs.current[step.targetLine].delete
          ) {
            const buttonRef = actionButtonRefs.current[step.targetLine].delete;
            if (buttonRef) {
              const buttonRect = buttonRef.getBoundingClientRect();
              newTarget = {
                left:
                  buttonRect.left - containerRect.left + buttonRect.width / 2,
                top: buttonRect.top - containerRect.top + buttonRect.height / 2,
              };
            }
          }
          break;
      }

      setTargetPosition(newTarget);
      // We no longer need to set cursorPosition as it will be handled by the spring animation
    }, 50); // Small delay to ensure DOM is updated

    return () => clearTimeout(timer);
  }, [currentStep]);

  // Initialize content when component first mounts
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      // Set the initial text
      const initialText = editSequence[0].text;
      setCurrentlyEditedText(initialText);
    }
  }, [initialized]);

  // Auto-play through the animation sequence
  useEffect(() => {
    if (!initialized) {
      return;
    }

    // Blinking cursor effect
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 600);

    // Handle typing animation
    const currentStepData = editSequence[currentStep];

    if (
      currentStepData.action === "type" &&
      currentStepData.textToType &&
      currentStepData.typingInProgress
    ) {
      setIsAnimatingText(true);
      // Start character-by-character typing animation
      if (typingProgress < currentStepData.textToType.length) {
        const typingTimer = setTimeout(() => {
          setTypingProgress((prev) => prev + 1);
          setTypingText(
            currentStepData.textToType!.substring(0, typingProgress + 1),
          );

          // Update the edited text with current typing progress
          updateEditedTextWithTyping(currentStepData);
        }, 100);

        return () => {
          clearTimeout(typingTimer);
          clearInterval(cursorInterval);
        };
      } else {
        // Typing complete, move to next step
        setTimeout(() => {
          const finalText = getCurrentText();
          setCurrentlyEditedText(finalText);
          setTypingProgress(0);
          setTypingText("");
          setIsAnimatingText(false);
          setCurrentStep((prev) => prev + 1);
        }, 300);

        return () => {
          clearInterval(cursorInterval);
        };
      }
    }

    // Handle delete animation
    if (currentStepData.action === "delete" && currentStepData.deleteCount) {
      setIsAnimatingText(true);
      if (deletingProgress < currentStepData.deleteCount) {
        const deleteTimer = setTimeout(() => {
          setDeletingProgress((prev) => prev + 1);

          // Update the edited text with current deletion progress
          updateEditedTextWithDeletion(currentStepData);
        }, 50);

        return () => {
          clearTimeout(deleteTimer);
          clearInterval(cursorInterval);
        };
      } else {
        // Deleting complete, move to next step
        setTimeout(() => {
          const finalText = getCurrentText();
          setCurrentlyEditedText(finalText);
          setDeletingProgress(0);
          setIsAnimatingText(false);
          setCurrentStep((prev) => prev + 1);
        }, 200);

        return () => {
          clearInterval(cursorInterval);
        };
      }
    }

    // For other steps, just advance normally but also update text if needed
    const timer = setTimeout(() => {
      if (currentStep < editSequence.length - 1) {
        const nextStep = currentStep + 1;

        // If the next step has a different text that isn't due to editing,
        // update it immediately to avoid abrupt changes
        if (
          !isAnimatingText &&
          editSequence[nextStep].text !== currentlyEditedText &&
          !editSequence[nextStep].action?.includes("type") &&
          !editSequence[nextStep].action?.includes("delete")
        ) {
          setCurrentlyEditedText(editSequence[nextStep].text);
        }

        setCurrentStep(nextStep);
      } else {
        // Loop back to beginning
        setCurrentlyEditedText(editSequence[0].text);
        setCurrentStep(0);
        setTypingProgress(0);
        setTypingText("");
        setDeletingProgress(0);
        setIsAnimatingText(false);
      }
    }, currentStepData.duration || 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(cursorInterval);
    };
  }, [
    currentStep,
    initialized,
    typingProgress,
    deletingProgress,
    currentlyEditedText,
    isAnimatingText,
  ]);

  // Update the edited text when typing
  const updateEditedTextWithTyping = (currentStepData: EditStep) => {
    const line = currentStepData.targetLine ?? 0;
    const column = currentStepData.targetColumn ?? 0;
    const textLines = currentlyEditedText.split("\n");

    if (line >= 0 && line < textLines.length) {
      const lineText = textLines[line];
      const beforeCursor = lineText.substring(0, column);

      // For line 0 (the first line fix), handle differently
      if (line === 0 && column === 37) {
        // When editing the first line with parentheses, replace exactly what we need to
        const baseText = "Fixed navigation sidebar alignment issues ";
        textLines[line] = baseText + typingText;
      } else {
        // For other edits (like adding "⚠️ Blocked: ")
        textLines[line] =
          beforeCursor + typingText + lineText.substring(column);
      }

      setCurrentlyEditedText(textLines.join("\n"));
    }
  };

  // Update the edited text when deleting
  const updateEditedTextWithDeletion = (currentStepData: EditStep) => {
    const line = currentStepData.targetLine ?? 0;
    const column = currentStepData.targetColumn ?? 0;

    // Find the text before deletion started
    const prevStepWithText = editSequence
      .slice(0, currentStep)
      .reverse()
      .find((step) => !step.action || step.action !== "delete");

    if (prevStepWithText) {
      const textToModify = prevStepWithText.text.split("\n");
      const currentLines = currentlyEditedText.split("\n");

      if (line >= 0 && line < textToModify.length) {
        const lineToModify = textToModify[line];
        const charsToDelete = currentStepData.deleteCount || 0;

        // Calculate how much has been deleted so far
        const deletedSoFar = Math.min(deletingProgress, charsToDelete);

        // Special handling for first line
        if (line === 0 && column === 37) {
          // Get text before the deletion point
          const beforeText = "Fixed navigation sidebar alignment issues ";

          // For the deletion animation, show what remains of "(8 commits)"
          const remainingText = "(8 commits)".substring(deletedSoFar);

          currentLines[line] = beforeText + remainingText;
        } else {
          // Normal case for other edits
          const beforeDeletePos = lineToModify.substring(0, column);
          const textBeingDeleted = lineToModify.substring(
            column,
            column + charsToDelete,
          );
          const afterDeletePos = lineToModify.substring(column + charsToDelete);

          // Show remaining text that hasn't been deleted yet
          const remainingTextToDelete = textBeingDeleted.substring(
            0,
            textBeingDeleted.length - deletedSoFar,
          );

          currentLines[line] =
            beforeDeletePos + remainingTextToDelete + afterDeletePos;
        }

        setCurrentlyEditedText(currentLines.join("\n"));
      }
    }
  };

  // Get current text with typing animation applied
  const getCurrentTextWithAnimation = () => {
    const currentStepData = editSequence[currentStep];
    let text = currentStepData.text;

    // Handle typing animation
    if (
      currentStepData.action === "type" &&
      currentStepData.typingInProgress &&
      currentStepData.textToType
    ) {
      const textLines = text.split("\n");
      const line = currentStepData.targetLine ?? 0;
      const column = currentStepData.targetColumn ?? 0;

      if (line >= 0 && line < textLines.length) {
        // Replace the full text with partially typed text
        const lineText = textLines[line];
        const beforeCursor = lineText.substring(0, column);

        // For line 0 (the first line fix), handle differently to avoid strange behavior
        if (line === 0 && beforeCursor.endsWith("issues ")) {
          // When editing the first line, use a cleaner approach
          textLines[line] = beforeCursor + typingText;
        } else {
          // Normal case for other lines
          const afterTypingPoint =
            currentStepData.textToType.length > 0
              ? lineText.substring(column + currentStepData.textToType.length)
              : lineText.substring(column);
          textLines[line] = beforeCursor + typingText + afterTypingPoint;
        }

        return textLines.join("\n");
      }
    }

    // Handle delete animation
    if (currentStepData.action === "delete" && currentStepData.deleteCount) {
      const textLines = text.split("\n");
      const line = currentStepData.targetLine ?? 0;
      const column = currentStepData.targetColumn ?? 0;

      if (line >= 0 && line < textLines.length) {
        // Use the previous step's text (before deletion started)
        const prevStepWithText = editSequence
          .slice(0, currentStep)
          .reverse()
          .find((step) => !step.action || step.action !== "delete");

        if (prevStepWithText) {
          const prevLines = prevStepWithText.text.split("\n");

          if (line < prevLines.length) {
            const prevLineText = prevLines[line];
            const charsToDelete = currentStepData.deleteCount;

            // Calculate how much has been deleted so far
            const deletedSoFar = Math.min(deletingProgress, charsToDelete || 0);
            const remainingToDelete = (charsToDelete || 0) - deletedSoFar;

            // For the first line issue, special handling
            if (line === 0 && column === 37) {
              const beforeDeletePos = prevLineText.substring(0, column);
              const remainingText = prevLineText.substring(
                column + deletedSoFar,
              );
              textLines[line] = beforeDeletePos + remainingText;
            } else {
              // Normal case for other edits
              const beforeDeletePos = prevLineText.substring(0, column);
              const deletingPart = prevLineText.substring(
                column,
                column + remainingToDelete,
              );
              const afterDeletePos = prevLineText.substring(
                column + (charsToDelete || 0),
              );

              textLines[line] = beforeDeletePos + deletingPart + afterDeletePos;
            }

            return textLines.join("\n");
          }
        }
      }
    }

    return text;
  };

  return (
    <div className="border-border bg-background rounded-lg border p-5 transition-all hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-primary rounded-full border border-current px-2.5 py-0.5 text-sm font-medium">
          4
        </span>
      </div>
      <div
        ref={containerRef}
        className="bg-background relative mt-3 aspect-video w-full overflow-hidden rounded-md border max-sm:h-[300px]"
      >
        {/* Editor view (hidden in final view) */}
        {!isShowingFinalView && (
          <div className="h-full w-full p-3">
            <div className="mb-1 text-xs font-medium">Review update</div>

            <div
              ref={textareaRef}
              className="relative mt-1 h-[calc(100%-90px)] overflow-auto rounded-md border p-2"
            >
              {currentText.map((line, i) => (
                <div
                  key={`line-container-${i}`}
                  className="group relative mb-1"
                >
                  <motion.div
                    key={`line-${i}`}
                    ref={(el) => {
                      lineRefs.current[i] = el;
                      return undefined;
                    }}
                    className="rounded-md px-2 py-1 text-xs transition-colors"
                    variants={lineVariants}
                    initial="normal"
                    animate={
                      isHighlighting && highlightedLine === i
                        ? "highlight"
                        : "normal"
                    }
                    whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.5)" }}
                  >
                    {line}
                  </motion.div>

                  {/* Action buttons for status update */}
                  <AnimatePresence>
                    {(isHighlighting && highlightedLine === i) ||
                    (isShowingContextMenu && highlightedLine === i) ||
                    (isClickingButton && highlightedLine === i) ||
                    (isClickingDelete && highlightedLine === i) ? (
                      <motion.div
                        className="absolute -bottom-7 left-2 z-20 flex items-center gap-2"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={{
                          initial: { opacity: 0, y: -5 },
                          animate: { opacity: 1, y: 0 },
                          exit: { opacity: 0, y: -5 },
                        }}
                      >
                        <motion.button
                          ref={(el) => {
                            if (!actionButtonRefs.current[i]) {
                              actionButtonRefs.current[i] = {};
                            }
                            actionButtonRefs.current[i].markAsBlocker = el;
                            return undefined;
                          }}
                          className={`flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[10px] shadow-sm ${
                            isClickingButton && i === highlightedLine
                              ? "border-red-200 bg-red-50 text-red-600 shadow-inner"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                          variants={actionButtonVariants}
                          whileHover="hover"
                          animate={
                            isClickingButton &&
                            i === highlightedLine &&
                            currentStepData.action === "click_button"
                              ? {
                                  scale: 0.95,
                                  backgroundColor: "rgba(254, 226, 226, 0.8)",
                                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
                                }
                              : {}
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-3 w-3"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Mark as blocker
                        </motion.button>

                        <motion.button
                          ref={(el) => {
                            if (!actionButtonRefs.current[i]) {
                              actionButtonRefs.current[i] = {};
                            }
                            actionButtonRefs.current[i].delete = el;
                            return undefined;
                          }}
                          className={`flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[10px] shadow-sm ${
                            isClickingDelete && i === highlightedLine
                              ? "border-orange-200 bg-orange-50 text-orange-600 shadow-inner"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                          variants={actionButtonVariants}
                          whileHover="hover"
                          animate={
                            isClickingDelete &&
                            i === highlightedLine &&
                            currentStepData.action === "click_delete"
                              ? {
                                  scale: 0.95,
                                  backgroundColor: "rgba(255, 237, 213, 0.8)",
                                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
                                }
                              : {}
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-3 w-3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                          Delete
                        </motion.button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="mt-1 p-1 text-[11px] text-gray-500">
              Optional: Add blockers or notes
            </div>

            <div className="mt-1 flex justify-end gap-2">
              <motion.button
                ref={resetButtonRef}
                className="rounded-md border bg-gray-50 px-2.5 py-1 text-[10px] font-medium shadow-sm transition-colors hover:bg-gray-100"
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
              >
                Reset
              </motion.button>
              <motion.button
                ref={saveButtonRef}
                className="rounded-md bg-blue-500 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm transition-colors hover:bg-blue-600"
                variants={buttonVariants}
                initial="idle"
                animate={
                  isClicking && currentStepData.cursorTarget === "save"
                    ? "tap"
                    : "idle"
                }
                whileHover="hover"
              >
                Save
              </motion.button>
            </div>
          </div>
        )}

        {/* Final status view (real app mode) */}
        {isShowingFinalView && (
          <motion.div
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex h-full w-full flex-col bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4 text-indigo-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Sarah's Status</h3>
                    <p className="text-xs text-gray-500">Today at 2:45 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    Active
                  </span>
                </div>
              </div>

              <div className="mb-3 flex-grow rounded-lg bg-gray-50 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-blue-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium">
                    Fixed navigation sidebar alignment issues (merged to main)
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-1.5 text-blue-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium">
                    Opened PR for dashboard charts feature (#42)
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-1.5 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                  <span className="text-xs">
                    Commented on issue #23, working on a fix
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  <span className="text-xs font-medium">
                    ⚠️ Blocked: Need design assistance with icon sizing
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 ring-2 ring-white">
                      <span className="text-[8px] text-blue-600">JD</span>
                    </div>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 ring-2 ring-white">
                      <span className="text-[8px] text-green-600">TK</span>
                    </div>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 ring-2 ring-white">
                      <span className="text-[8px] text-purple-600">AL</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    Seen by 3 teammates
                  </span>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    whileHover={{ scale: 1.05 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-3 w-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                      />
                    </svg>
                    Comment
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Animated cursor with dynamic positioning */}
        <AnimatePresence>
          {currentStep > 0 && currentStep < editSequence.length - 1 && (
            <motion.div
              className="pointer-events-none absolute z-[9999]"
              initial={{ opacity: 0 }}
              animate={{
                opacity: cursorVisible ? 1 : 0.7,
                left: targetPosition.left,
                top: targetPosition.top,
                scale:
                  isClicking || isClickingButton || isClickingDelete ? 0.92 : 1,
              }}
              exit={{ opacity: 0 }}
              transition={{
                type: "spring",
                damping: currentStepData.action === "move_cursor" ? 12 : 20,
                stiffness:
                  currentStepData.action === "click" ||
                  currentStepData.action === "click_button" ||
                  currentStepData.action === "click_delete"
                    ? 250
                    : 150,
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

        {/* Success indicator (briefly shown after save) */}
        <AnimatePresence>
          {currentStep === 17 && (
            <motion.div
              className="absolute right-4 bottom-12 flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
              <span>Changes saved</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final status display overlay - showing highlights of changes */}
        <AnimatePresence>
          {currentStep === 17 && (
            <motion.div
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.2, type: "spring" }}
              >
                <svg
                  className="h-5 w-5 text-green-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              <motion.h3
                className="mb-2 text-center text-sm font-medium"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                Status Update Saved
              </motion.h3>

              <motion.div
                className="mb-4 w-full max-w-md rounded-md border bg-gray-50 p-3 text-xs"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.6 }}
              >
                <motion.div
                  className="flex items-center gap-1.5 text-blue-600"
                  initial={{ backgroundColor: "rgba(219, 234, 254, 0)" }}
                  animate={{
                    backgroundColor: [
                      "rgba(219, 234, 254, 0)",
                      "rgba(219, 234, 254, 0.8)",
                      "rgba(219, 234, 254, 0)",
                    ],
                  }}
                  transition={{
                    delay: 2.0,
                    duration: 1.5,
                    times: [0, 0.5, 1],
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    Fixed navigation sidebar alignment issues{" "}
                  </span>
                  <motion.span
                    className="font-medium text-green-600"
                    initial={{ backgroundColor: "rgba(220, 252, 231, 0)" }}
                    animate={{
                      backgroundColor: [
                        "rgba(220, 252, 231, 0)",
                        "rgba(220, 252, 231, 0.8)",
                        "rgba(220, 252, 231, 0)",
                      ],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      delay: 2.0,
                      duration: 1.5,
                      times: [0, 0.5, 1],
                    }}
                  >
                    (merged to main)
                  </motion.span>
                  <motion.span
                    className="font-medium text-red-400 line-through opacity-0"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 0.7, 0],
                    }}
                    transition={{
                      delay: 2.0,
                      duration: 1.5,
                      times: [0, 0.3, 1],
                    }}
                  >
                    (8 commits)
                  </motion.span>
                </motion.div>
                <div className="mt-1 flex items-center gap-1.5 text-blue-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    Opened PR for dashboard charts feature (#42)
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                  <span>Commented on issue #23, working on a fix</span>
                </div>
                <motion.div
                  className="mt-1 flex items-center gap-1.5 text-amber-600"
                  initial={{ backgroundColor: "rgba(254, 243, 199, 0)" }}
                  animate={{
                    backgroundColor: [
                      "rgba(254, 243, 199, 0)",
                      "rgba(254, 243, 199, 0.8)",
                      "rgba(254, 243, 199, 0)",
                    ],
                  }}
                  transition={{
                    delay: 2.5,
                    duration: 1.5,
                    times: [0, 0.5, 1],
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  <motion.span
                    className="font-medium"
                    initial={{ color: "#d97706" }}
                    animate={{
                      color: ["#d97706", "#b45309", "#d97706"],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      delay: 2.5,
                      duration: 1.5,
                      times: [0, 0.5, 1],
                    }}
                  >
                    ⚠️ Blocked: Need design assistance with icon sizing
                  </motion.span>
                </motion.div>
                <motion.div
                  className="mt-1 flex items-center gap-1.5 text-red-500"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    height: [0, 24, 0],
                  }}
                  transition={{
                    delay: 2.0,
                    duration: 1.5,
                    times: [0, 0.3, 1],
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="font-medium line-through">
                    Planning to deploy changes after lunch
                  </span>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex gap-2 text-[10px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
              >
                <span className="text-gray-400">Last updated:</span>
                <span className="font-medium">Just now</span>
              </motion.div>

              <motion.div
                className="mt-4 flex items-center justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.0 }}
              >
                <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-xs text-blue-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                  <span>Status update shared with team</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <h4 className="mt-4 text-base font-medium">Review</h4>
      <p className="text-muted-foreground text-sm">
        Edit if needed (most don't)
      </p>
    </div>
  );
}
