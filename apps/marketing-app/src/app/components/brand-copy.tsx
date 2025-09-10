/**
 * Brand Copy Components
 * 
 * Centralized brand voice and messaging components that enforce our marketing culture guidelines.
 * Use these components to ensure consistent tone and messaging across the marketing site.
 */

import React from 'react';

// Primary value propositions
export const PrimaryHeadlines = {
  MainHero: "Automate status updates",
  AlternativeHero: "Drop your standups",
  ProblemFocused: "Done with standups?",
} as const;

// Descriptive copy that explains our solution
export const ValueDescriptions = {
  AutomaticUpdates: "Generate status updates by monitoring your team's activity in code, Slack, and others. Or write them yourself.",
  TimeSavings: "See how much time and money your team saves by dropping standups for async updates.",
} as const;

// Call-to-action copy
export const CTACopy = {
  Primary: "Turn activity into updates",
  Secondary: "Connect to your work", 
  Specific: "Drop your standups",
} as const;

// Audience-specific descriptions
export const AudienceDescriptions = {
  Engineers: "Less reporting, more coding.",
  ProductManagers: "Instant clarity, zero chasing.",
  Founders: "See progress, skip meetings.",
} as const;

// Brand taglines
export const Taglines = {
  Primary: "Drop your standups. Keep your team aligned.",
  Secondary: "Built for remote teams that value focus time.",
  ValueFocused: "Remote teams are already saving hundreds of hours by dropping standups.",
} as const;

// Component for consistent button copy
export function BrandCTA({ 
  variant = "Primary", 
  children,
  ...props 
}: { 
  variant?: keyof typeof CTACopy;
  children?: React.ReactNode;
} & React.ComponentProps<'span'>) {
  if (children) {
    return <span {...props}>{children}</span>;
  }
  
  return <span {...props}>{CTACopy[variant]}</span>;
}

// Component for audience-specific headlines
export function AudienceHeadline({ 
  audience 
}: { 
  audience: keyof typeof AudienceDescriptions 
}) {
  return <span>{AudienceDescriptions[audience]}</span>;
}

// Component for primary headlines with consistent styling
export function PrimaryHeadline({ 
  variant = "MainHero",
  className = "",
}: { 
  variant?: keyof typeof PrimaryHeadlines;
  className?: string;
}) {
  return (
    <h1 className={className}>
      {PrimaryHeadlines[variant]}
    </h1>
  );
}

// Brand voice validation utility
export function validateCopy(text: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for marketing jargon
  const jargonWords = [
    'revolutionary', 'game-changing', 'best-in-class', 'industry-leading',
    'synergize', 'optimize', 'disrupt', 'transform', 'leverage', 'cutting-edge',
    'unlock', 'seamless', 'innovative', 'next-generation'
  ];
  
  jargonWords.forEach(word => {
    if (lowerText.includes(word)) {
      issues.push(`Avoid marketing jargon: "${word}"`);
    }
  });
  
  // Check for overly long sentences (over 25 words)
  const sentences = text.split(/[.!?]+/);
  sentences.forEach((sentence, index) => {
    const wordCount = sentence.trim().split(/\s+/).length;
    if (wordCount > 25) {
      issues.push(`Sentence ${index + 1} is too long (${wordCount} words). Keep under 25 words.`);
    }
  });
  
  // Check if it addresses a problem or outcome first
  const startsWithValue = /^(no more|stop|drop|skip|save|get|see|build|turn|generate|automatic)/i.test(text.trim());
  if (!startsWithValue && text.length > 50) {
    issues.push('Consider starting with the problem or outcome');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// Type exports for external use
export type PrimaryHeadlineVariant = keyof typeof PrimaryHeadlines;
export type CTAVariant = keyof typeof CTACopy;
export type AudienceType = keyof typeof AudienceDescriptions;
