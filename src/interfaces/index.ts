// Core RCS interfaces
export interface RCSProvider {
  name: string;
  initialize(config: ProviderConfig): Promise<void>;
  sendMessage(message: RCSMessage): Promise<MessageResponse>;
  validatePhoneNumber(phoneNumber: string): Promise<ValidationResult>;
}

export interface RCSMessage {
  to: string;
  content: MessageContent;
  suggestions?: Suggestion[];
  metadata?: MessageMetadata;
}

export interface SendMessageOptions {
  to: string;
  content: MessageContent;
  suggestions?: Suggestion[];
  metadata?: MessageMetadata;
}

export interface MessageContent {
  text?: string;
  media?: MediaContent;
  richCard?: RichCard;
}

export interface MediaContent {
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
  thumbnailUrl?: string;
  mimeType?: string;
  fileName?: string;
}

export interface Suggestion {
  type: 'reply' | 'action';
  text: string;
  postbackData?: string;
  action?: SuggestionAction;
}

export interface SuggestionAction {
  type: 'dial' | 'openUrl' | 'shareLocation' | 'createCalendarEvent';
  data?: string;
  parameters?: Record<string, any>;
}

export interface RCSCapabilities {
  supportsRichCards: boolean;
  supportsCarousels: boolean;
  supportsSuggestions: boolean;
  supportsFileTransfer: boolean;
  supportedMediaTypes: string[];
  maxMessageLength: number;
  maxSuggestions?: number;
  maxFileSize?: number;
}

export interface MessageResponse {
  messageId: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  timestamp?: Date;
  error?: string;
  providerResponse?: any;
}

export interface ValidationResult {
  success: boolean;
  capability?: {
    phoneNumber: string;
    isCapable: boolean;
    features: string[];
    timestamp: string;
  };
  error?: string;
}

export interface MessageMetadata {
  expiryTime?: string;
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
  customData?: Record<string, any>;
}

export interface RichCard {
  title?: string;
  description?: string;
  media?: MediaContent;
  suggestions?: Suggestion[];
}

export interface StandaloneCard extends RichCard {
  type: 'standalone';
  orientation?: 'horizontal' | 'vertical';
}

export interface CarouselCard {
  type: 'carousel';
  cards: RichCard[];
  width?: 'small' | 'medium';
}

export interface ProviderConfig {
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  region?: string;
  apiEndpoint?: string;
  webhookUrl?: string;
  [key: string]: any;
}