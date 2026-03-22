/**
 * Urge Intervention System Types
 * 
 * Core types for the urge detection, intervention, and regulation flow.
 * 
 * Design principles:
 * - Non-judgmental language
 * - Trauma-informed
 * - Safety-first
 * - Privacy-preserving
 * - Learning-oriented
 */

/**
 * Urge intensity scale (1-10)
 * Used for self-assessment and tracking
 */
export type UrgeIntensity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Urge trigger categories
 * Helps identify patterns without judgment
 */
export type UrgeTrigger =
  | 'emotional' // Stress, sadness, anxiety, boredom
  | 'environmental' // Location, time of day, social situation
  | 'cognitive' // Thoughts, memories, associations
  | 'physical' // Restlessness, tension, discomfort
  | 'social' // Peer pressure, isolation, conflict
  | 'financial' // Money-related thoughts, financial stress
  | 'unknown'; // User doesn't know or prefer not to specify

/**
 * Intervention type
 * Different micro-interventions available
 */
export type InterventionType =
  | 'breathing' // Breathing regulation exercises
  | 'grounding' // 5-4-3-2-1 grounding technique
  | 'reframing' // Cognitive reframing prompts
  | 'redirection' // Micro-task redirection
  | 'support' // Connect to support resources
  | 'delay' // Delay technique (urge surfing)
  | 'sos'; // Emergency support routing

/**
 * Intervention effectiveness rating
 * User feedback on what worked
 */
export type InterventionEffectiveness = 'very_helpful' | 'helpful' | 'neutral' | 'not_helpful';

/**
 * Urge log entry
 * Records a single urge episode for learning
 */
export interface UrgeLog {
  id: string;
  timestamp: number;
  intensity: UrgeIntensity;
  trigger?: UrgeTrigger;
  context?: string; // Optional user note
  interventions: InterventionRecord[];
  outcome?: {
    finalIntensity: UrgeIntensity;
    effectiveness: InterventionEffectiveness;
    note?: string;
  };
  duration: number; // Duration in seconds
}

/**
 * Intervention record
 * Tracks which interventions were used during an urge
 */
export interface InterventionRecord {
  type: InterventionType;
  startedAt: number;
  completedAt?: number;
  duration?: number; // Duration in seconds
  effectiveness?: InterventionEffectiveness;
  note?: string;
}

/**
 * Urge pattern
 * Identified patterns from logged urges
 */
export interface UrgePattern {
  id: string;
  trigger: UrgeTrigger;
  commonIntensity: UrgeIntensity;
  timeOfDay?: string; // e.g., "evening", "morning"
  dayOfWeek?: string; // e.g., "weekend", "weekday"
  effectiveInterventions: InterventionType[];
  frequency: number; // How often this pattern occurs
  lastSeen: number;
}

/**
 * Active urge state
 * Current urge being managed
 */
export interface ActiveUrge {
  id: string;
  startedAt: number;
  initialIntensity: UrgeIntensity;
  currentIntensity: UrgeIntensity;
  trigger?: UrgeTrigger;
  context?: string;
  interventions: InterventionRecord[];
  currentIntervention?: InterventionType;
  /** Set when user is routed to crisis screen (safety override). */
  crisisViewed?: boolean;
}

/**
 * Intervention configuration
 * Settings for each intervention type
 */
export interface InterventionConfig {
  type: InterventionType;
  enabled: boolean;
  defaultDuration?: number; // Default duration in seconds
  preferences?: Record<string, unknown>; // Type-specific preferences
}

/**
 * Urge system settings
 * User preferences for the urge system
 */
export interface UrgeSettings {
  enabled: boolean;
  defaultInterventions: InterventionType[];
  interventionConfigs: InterventionConfig[];
  autoLog: boolean; // Automatically log urges
  reminderEnabled: boolean; // Remind to log urges
  patternAnalysisEnabled: boolean; // Analyze patterns
}

/**
 * Safety level
 * Determines routing and available options
 */
export type SafetyLevel = 'safe' | 'moderate' | 'high' | 'crisis';

/**
 * Crisis detection result
 * Assesses if immediate support is needed
 */
export interface CrisisAssessment {
  level: SafetyLevel;
  recommendedAction: 'continue' | 'sos' | 'helpline' | 'contact';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message?: string; // Non-triggering guidance message
}
