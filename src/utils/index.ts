import { Suggestion, SuggestionAction, RCSMessage } from '../interfaces/index.js';

// Phone number validation regex patterns
const PHONE_PATTERNS = {
  E164: /^\+[1-9]\d{1,14}$/,
  US: /^(\+1)?[2-9]\d{2}[2-9](?!11)\d{6}$/,
  GENERAL: /^[\d\s\-\(\)\+]+$/
};

/**
 * Validates if a phone number is in E.164 format
 */
export function isValidE164(phoneNumber: string): boolean {
  return PHONE_PATTERNS.E164.test(phoneNumber);
}

/**
 * Formats a phone number to E.164 format
 */
export function formatPhoneNumber(phoneNumber: string, countryCode = 'US'): string | null {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If already in E.164 format, return as is
  if (isValidE164(cleaned)) {
    return cleaned;
  }
  
  // Handle US numbers
  if (countryCode === 'US') {
    const digitsOnly = cleaned.replace(/^\+/, '');
    
    // US number without country code
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    
    // US number with country code
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    }
  }
  
  return null;
}

/**
 * Message builder for creating RCS messages
 */
export class MessageBuilder {
  private message: Partial<RCSMessage> = {};

  constructor(to?: string) {
    if (to) {
      this.message.to = to;
    }
    this.message.content = {};
  }

  to(phoneNumber: string): this {
    this.message.to = phoneNumber;
    return this;
  }

  setText(text: string): this {
    if (!this.message.content) {
      this.message.content = {};
    }
    this.message.content.text = text;
    return this;
  }

  addMedia(url: string, type: 'image' | 'video' | 'audio' | 'file', thumbnailUrl?: string): this {
    if (!this.message.content) {
      this.message.content = {};
    }
    this.message.content.media = {
      url,
      type,
      thumbnailUrl
    };
    return this;
  }

  addReply(text: string, postbackData?: string): this {
    if (!this.message.suggestions) {
      this.message.suggestions = [];
    }
    this.message.suggestions.push({
      type: 'reply',
      text,
      postbackData: postbackData || text
    });
    return this;
  }

  addAction(text: string, actionType: SuggestionAction['type'], data?: string): this {
    if (!this.message.suggestions) {
      this.message.suggestions = [];
    }
    
    const suggestion: Suggestion = {
      type: 'action',
      text,
      action: {
        type: actionType,
        data
      }
    };
    
    this.message.suggestions.push(suggestion);
    return this;
  }

  setMetadata(metadata: any): this {
    this.message.metadata = metadata;
    return this;
  }

  build(): RCSMessage {
    if (!this.message.to) {
      throw new Error('Recipient phone number is required');
    }
    if (!this.message.content || (!this.message.content.text && !this.message.content.media && !this.message.content.richCard)) {
      throw new Error('Message must have content');
    }
    return this.message as RCSMessage;
  }
}

/**
 * Suggestion builder for creating suggestions
 */
export class SuggestionBuilder {
  static reply(text: string, postbackData?: string): Suggestion {
    return {
      type: 'reply',
      text,
      postbackData: postbackData || text
    };
  }

  static action(text: string, actionType: SuggestionAction['type'], data?: string): Suggestion {
    return {
      type: 'action',
      text,
      action: {
        type: actionType,
        data
      }
    };
  }

  static dial(text: string, phoneNumber: string): Suggestion {
    return this.action(text, 'dial', phoneNumber);
  }

  static openUrl(text: string, url: string): Suggestion {
    return this.action(text, 'openUrl', url);
  }

  static shareLocation(text: string): Suggestion {
    return this.action(text, 'shareLocation');
  }

  static createCalendarEvent(text: string, eventData?: string): Suggestion {
    return this.action(text, 'createCalendarEvent', eventData);
  }
}