import { SMSClassifier } from './classifier';
import { SMSMessage, SpamDetectionResult } from './types';

export { SMSClassifier } from './classifier';
export {
  SpamCategory,
  type SpamDetectionResult,
  type SMSMessage,
  type FilterSettings,
  type SmsAction,
  type JunkSubtype,
} from './types';
export {
  GAMBLING_KEYWORDS,
  SCAM_KEYWORDS,
  POLITICAL_KEYWORDS,
  PROMOTION_KEYWORDS,
  TRANSACTION_KEYWORDS,
  getAllKeywords,
  getJunkSignalKeywords,
} from './keywords';
export { SPAM_PATTERNS, analyzeSenderPattern } from './patterns';

export interface SMSFilterServiceOptions {
  customKeywords?: string[];
  communityKeywords?: string[];
  strictMode?: boolean;
}

export class SMSFilterService {
  private classifier: SMSClassifier;

  constructor(opts: SMSFilterServiceOptions = {}) {
    this.classifier = new SMSClassifier(opts);
  }

  updateSettings(opts: SMSFilterServiceOptions): void {
    this.classifier = new SMSClassifier(opts);
  }

  classify(message: SMSMessage): SpamDetectionResult {
    return this.classifier.classify(message);
  }

  classifyBatch(messages: SMSMessage[]): SpamDetectionResult[] {
    return this.classifier.classifyBatch(messages);
  }
}
