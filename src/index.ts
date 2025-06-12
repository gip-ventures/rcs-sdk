// Main exports for @longears-mobile/rcs-sdk
export { RCSClient } from './client.js';

// Interfaces
export type {
  RCSProvider,
  RCSMessage,
  MessageContent,
  MediaContent,
  Suggestion,
  SuggestionAction,
  RCSCapabilities,
  MessageResponse,
  ValidationResult,
  SendMessageOptions,
  MessageMetadata,
  RichCard,
  StandaloneCard,
  CarouselCard,
  ProviderConfig
} from './interfaces/index.js';

// Configuration
export type {
  SDKConfig,
  AuthConfig,
  SDKOptions
} from './interfaces/config.js';

// Authentication
export type {
  AuthProvider,
  AuthToken
} from './interfaces/auth.js';

// Errors
export { RCSError, RCSErrorCode } from './utils/errors.js';

// Utilities
export {
  formatPhoneNumber,
  isValidE164,
  MessageBuilder,
  SuggestionBuilder
} from './utils/index.js';