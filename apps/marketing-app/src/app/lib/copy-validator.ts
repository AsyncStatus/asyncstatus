/**
 * Copy Validation Utility
 * 
 * Validates marketing copy against our culture guidelines to ensure consistent brand voice.
 * Use in development to check new copy before deployment.
 */

export interface CopyValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'jargon' | 'length' | 'clarity' | 'tone' | 'structure';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

// Marketing jargon to avoid
const JARGON_WORDS = [
  'revolutionary', 'game-changing', 'best-in-class', 'industry-leading',
  'synergize', 'optimize', 'disrupt', 'transform', 'leverage', 'cutting-edge',
  'unlock', 'seamless', 'innovative', 'next-generation', 'solution',
  'platform', 'ecosystem', 'holistic', 'paradigm', 'strategic'
];

// Words that align with our brand voice
const BRAND_WORDS = [
  'drop', 'skip', 'no more', 'stop', 'save', 'focus', 'async', 'remote',
  'standup', 'meeting', 'time', 'clear', 'simple', 'direct', 'honest'
];

// Problem-focused sentence starters
const PROBLEM_STARTERS = [
  'no more', 'stop', 'drop', 'skip', 'done with', 'tired of', 'sick of',
  'save', 'get back', 'reclaim', 'see', 'understand', 'know'
];

export function validateCopy(text: string, type: 'headline' | 'description' | 'cta' | 'benefit' = 'description'): CopyValidationResult {
  const issues: ValidationIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const lowerText = text.toLowerCase();
  const words = text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Check for marketing jargon
  JARGON_WORDS.forEach(jargon => {
    if (lowerText.includes(jargon)) {
      issues.push({
        type: 'jargon',
        severity: 'error',
        message: `Avoid marketing jargon: "${jargon}"`,
        suggestion: `Use direct, specific language instead of "${jargon}"`
      });
      score -= 15;
    }
  });

  // Check sentence length based on copy type
  const maxWords = type === 'headline' ? 8 : type === 'cta' ? 6 : 25;
  sentences.forEach((sentence, index) => {
    const sentenceWords = sentence.trim().split(/\s+/).length;
    if (sentenceWords > maxWords) {
      issues.push({
        type: 'length',
        severity: type === 'headline' || type === 'cta' ? 'error' : 'warning',
        message: `${type === 'headline' ? 'Headline' : type === 'cta' ? 'CTA' : 'Sentence'} ${index + 1} is too long (${sentenceWords} words). Keep under ${maxWords} words.`,
        suggestion: 'Break into shorter, punchier sentences'
      });
      score -= type === 'headline' || type === 'cta' ? 20 : 10;
    }
  });

  // Check for problem-first approach (headlines and descriptions)
  if ((type === 'headline' || type === 'description') && text.length > 20) {
    const startsWithProblem = PROBLEM_STARTERS.some(starter => 
      lowerText.startsWith(starter.toLowerCase())
    );
    
    if (!startsWithProblem) {
      issues.push({
        type: 'structure',
        severity: 'warning',
        message: 'Consider starting with the problem or outcome',
        suggestion: 'Lead with what pain you solve or benefit you provide'
      });
      score -= 10;
    }
  }

  // Check for brand voice alignment
  const brandWordCount = BRAND_WORDS.filter(word => lowerText.includes(word)).length;
  const brandScore = Math.min(brandWordCount * 5, 20);
  
  if (brandWordCount === 0 && type !== 'cta') {
    suggestions.push('Consider using brand-aligned language like "drop standups", "focus time", or "async updates"');
    score -= 10;
  }

  // Check for action verbs in CTAs
  if (type === 'cta') {
    const actionWords = ['turn', 'generate', 'drop', 'skip', 'get', 'save', 'start', 'try'];
    const hasActionWord = actionWords.some(action => lowerText.includes(action));
    
    if (!hasActionWord) {
      issues.push({
        type: 'tone',
        severity: 'warning',
        message: 'CTAs should start with action verbs',
        suggestion: 'Use verbs like "turn", "generate", "drop", or "save"'
      });
      score -= 15;
    }
  }

  // Check for passive voice
  const passiveIndicators = ['was', 'were', 'been', 'being', 'be'];
  const hasPassiveVoice = passiveIndicators.some(indicator => 
    lowerText.includes(` ${indicator} `) || lowerText.includes(`${indicator} `)
  );
  
  if (hasPassiveVoice) {
    issues.push({
      type: 'tone',
      severity: 'info',
      message: 'Consider using active voice for more direct communication',
      suggestion: 'Rewrite to make the subject perform the action'
    });
    score -= 5;
  }

  // Bonus points for brand alignment
  score += brandScore;
  
  // Cap score at 100
  score = Math.min(Math.max(score, 0), 100);

  return {
    isValid: issues.filter(issue => issue.severity === 'error').length === 0,
    score,
    issues,
    suggestions
  };
}

// Utility to validate multiple copy elements
export function validateCopySet(copySet: Record<string, { text: string; type?: 'headline' | 'description' | 'cta' | 'benefit' }>): Record<string, CopyValidationResult> {
  const results: Record<string, CopyValidationResult> = {};
  
  Object.entries(copySet).forEach(([key, { text, type = 'description' }]) => {
    results[key] = validateCopy(text, type);
  });
  
  return results;
}

// Get overall brand voice score for a page
export function getPageBrandScore(results: Record<string, CopyValidationResult>): number {
  const scores = Object.values(results).map(r => r.score);
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
}
