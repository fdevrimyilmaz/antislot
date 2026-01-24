export { SMSClassifier } from './classifier';
export { SpamCategory, type SpamDetectionResult, type SMSMessage, type FilterSettings } from './types';
export { GAMBLING_KEYWORDS, SCAM_KEYWORDS, ADVERTISEMENT_KEYWORDS, getAllKeywords } from './keywords';
export { SPAM_PATTERNS, analyzeSenderPattern } from './patterns';

import { SMSClassifier } from './classifier';
import { SMSMessage, SpamDetectionResult } from './types';

export class SMSFilterService {
  private classifier: SMSClassifier;

  constructor(keywords: string[] = [], strictMode: boolean = false) {
    this.classifier = new SMSClassifier({ customKeywords: keywords, strictMode });
  }

  updateSettings(keywords: string[], strictMode: boolean) {
    this.classifier = new SMSClassifier({ customKeywords: keywords, strictMode });
  }

  classify(message: SMSMessage): SpamDetectionResult {
    return this.classifier.classify(message);
  }

  classifyBatch(messages: SMSMessage[]): SpamDetectionResult[] {
    return this.classifier.classifyBatch(messages);
  }
}
