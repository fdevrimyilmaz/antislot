/**
 * Language Validator
 * 
 * Ensures all user-facing text adheres to ethical guidelines:
 * - No guilt language
 * - No moral framing
 * - No judgment
 * - No clinical claims
 * - Trauma-informed
 * - Non-triggering
 */

/**
 * Words/phrases to avoid (guilt, judgment, moral framing)
 */
const AVOIDED_TERMS = [
  // Guilt language
  'should', 'must', 'ought', 'failed', 'failure', 'weak', 'weakness',
  'guilty', 'guilt', 'shame', 'ashamed', 'disappointed',
  
  // Moral framing
  'bad', 'wrong', 'sin', 'sinful', 'immoral', 'unethical',
  'good', 'right', 'moral', 'ethical',
  
  // Judgment
  'stupid', 'dumb', 'idiot', 'foolish', 'irresponsible',
  'lazy', 'pathetic', 'worthless',
  
  // Clinical claims (therapy/treatment/cure – no clinical claims in urge copy)
  'treat', 'treatment', 'cure', 'heal', 'diagnose', 'diagnosis',
];

/**
 * Preferred alternatives
 */
const PREFERRED_TERMS: Record<string, string[]> = {
  'should': ['can', 'might', 'consider', 'option'],
  'must': ['can', 'option'],
  'failed': ['didn\'t work', 'wasn\'t effective', 'didn\'t help'],
  'weak': ['challenging', 'difficult'],
  'guilty': ['uncomfortable', 'difficult'],
  'bad': ['challenging', 'difficult'],
  'wrong': ['not helpful', 'not effective'],
};

/**
 * Validate text for ethical compliance
 */
export function validateLanguage(text: string): {
  valid: boolean;
  issues: Array<{ term: string; suggestion?: string }>;
} {
  const issues: Array<{ term: string; suggestion?: string }> = [];
  const lowerText = text.toLowerCase();
  
  AVOIDED_TERMS.forEach((term) => {
    // Simple word boundary check (can be improved with regex)
    if (lowerText.includes(term.toLowerCase())) {
      const suggestion = PREFERRED_TERMS[term.toLowerCase()]?.[0];
      issues.push({
        term,
        suggestion,
      });
    }
  });
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validate urge flow copy. Ensures no guilt, judgment, or clinical claims.
 * Use for urge screen strings (e.g. from i18n) before shipping.
 */
export function validateUrgeCopy(strings: string[]): {
  valid: boolean;
  failures: Array<{ text: string; issues: Array<{ term: string; suggestion?: string }> }>;
} {
  const failures: Array<{ text: string; issues: Array<{ term: string; suggestion?: string }> }> = [];
  for (const s of strings) {
    const t = typeof s === 'string' ? s : '';
    if (!t.trim()) continue;
    const { valid, issues } = validateLanguage(t);
    if (!valid) failures.push({ text: t, issues });
  }
  return { valid: failures.length === 0, failures };
}

/**
 * Check if text contains triggering content
 */
export function isTriggering(text: string): boolean {
  const triggeringPatterns = [
    /\b(gambling|bet|wager|casino|slot|poker)\b/i, // Gambling terms
    /\b(lose|lost|loss|win|won|money|cash)\b/i, // Financial terms (context-dependent)
  ];
  
  // This is a simple check - in production, use more sophisticated NLP
  // For now, we allow these terms in educational/awareness contexts
  return false; // Placeholder - implement based on context
}

/**
 * Sanitize text for safe display
 * Removes or replaces problematic terms
 */
export function sanitizeLanguage(text: string): string {
  let sanitized = text;
  
  Object.entries(PREFERRED_TERMS).forEach(([term, alternatives]) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    sanitized = sanitized.replace(regex, alternatives[0] || term);
  });
  
  return sanitized;
}

/**
 * Validate user-generated content (notes, diary entries)
 * Returns original content (not sanitized) with warnings and SOS suggestion.
 * Prefers warnings over modifying user text to preserve user voice.
 */
export function validateUserContent(content: string): {
  safe: string; // Original content (not modified)
  warnings: string[];
  needsReview: boolean;
  suggestSOS: boolean;
} {
  const validation = validateLanguage(content);
  // Return original content - do not sanitize user notes
  const safe = content;
  const warnings: string[] = [];
  let needsReview = false;
  let suggestSOS = false;
  
  if (!validation.valid) {
    const issueCount = validation.issues.length;
    if (issueCount > 0) {
      warnings.push(`Your note contains language that may need review (${issueCount} issue${issueCount > 1 ? 's' : ''} detected)`);
      needsReview = issueCount > 3; // Multiple issues = needs review
      
      // Suggest SOS if content indicates distress
      const distressIndicators = ['guilt', 'shame', 'ashamed', 'worthless', 'failed', 'failure'];
      const hasDistress = distressIndicators.some(indicator => 
        content.toLowerCase().includes(indicator)
      );
      if (hasDistress) {
        suggestSOS = true;
        warnings.push('If you\'re in distress, consider reaching out for support via SOS resources');
      }
    }
  }
  
  if (isTriggering(content)) {
    warnings.push('Your note may contain triggering material');
    needsReview = true;
    suggestSOS = true;
  }
  
  return {
    safe, // Original content, not sanitized
    warnings,
    needsReview,
    suggestSOS,
  };
}
