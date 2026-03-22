/**
 * Centralized storage keys.
 * Use these constants to avoid key collisions and simplify migration.
 */

export const STORAGE_KEYS = {
  // User data (secure)
  USER_PROFILE: 'antislot_user_profile',
  USER_ADDICTIONS: 'antislot_user_addictions',
  EMERGENCY_CONTACTS: 'antislot_emergency_contacts',

  // Progress data (secure)
  PROGRESS: 'antislot_progress',
  PROGRESS_EXTRAS: 'antislot_progress_extras',
  SESSIONS_COMPLETED: 'antislot_sessions_completed',

  // Urge system (secure)
  URGE_LOGS: 'antislot_urge_logs',
  URGE_PATTERNS: 'antislot_urge_patterns',
  URGE_SETTINGS: 'antislot_urge_settings',
  URGE_FEEDBACK: 'antislot_urge_feedback',
  URGE_ACTIVE: 'antislot_urge_active',
  URGE_LAST_SYNC_AT: 'antislot_urge_last_sync_at',
  INTERVENTION_HISTORY: 'antislot_intervention_history',

  // App state (standard)
  CLIENT_ID: 'antislot_client_id',
  ONBOARDING_DONE: 'antislot_onboarding_done',
  WELCOME_SHOWN: 'antislot_welcome_shown',
  THEME: 'antislot_theme',
  LANGUAGE: 'antislot_language',

  // Blocker data (standard)
  BLOCKLIST_DOMAINS: 'antislot_blocklist_domains',
  BLOCKLIST_PATTERNS: 'antislot_blocklist_patterns',
  BLOCKER_HARDENING_POLICY: 'antislot_blocker_hardening_policy',

  // Session data (secure)
  SESSION_THERAPY: 'antislot_sessions_therapy',
  SESSION_MINDFULNESS: 'antislot_sessions_mindfulness',

  // Premium (secure)
  PREMIUM_STATE: 'antislot_premium_state',

  // SMS Filter (standard)
  SMS_FILTER_STATS: 'antislot_sms_filter_stats',
  SMS_FILTER_SETTINGS: 'antislot_sms_filter_settings',

  // Privacy preferences (standard)
  PRIVACY_PREFERENCES: 'antislot_privacy_preferences',
  PRIVACY_LAST_TELEMETRY_AT: 'antislot_privacy_last_telemetry_at',

  // Money protection (standard)
  MONEY_PROTECTION_STATE: 'antislot_money_protection_state',
  MONEY_PROTECTION_LAST_SYNC_AT: 'antislot_money_protection_last_sync_at',

  // Accessibility (standard)
  ACCESSIBILITY_PREFERENCES: 'antislot_accessibility_preferences',

  // Accountability (secure)
  ACCOUNTABILITY_POLICY: 'antislot_accountability_policy',

  // 🔔 Notifications (standard)
  NOTIFICATION_PREFS: 'antislot_notification_prefs',
  NOTIFICATION_SCHEDULED_IDS: 'antislot_notification_scheduled_ids',
  LAST_APP_OPENED_AT: 'antislot_last_app_opened_at',
} as const;
