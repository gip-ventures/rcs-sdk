export enum RCSErrorCode {
  // General errors
  UNKNOWN = 'UNKNOWN',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  
  // Provider errors
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  
  // Authentication errors
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  
  // Message errors
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',
  INVALID_CONTENT = 'INVALID_CONTENT',
  
  // Phone number errors
  INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
  RCS_NOT_SUPPORTED = 'RCS_NOT_SUPPORTED',
  
  // Capability errors
  CAPABILITY_CHECK_FAILED = 'CAPABILITY_CHECK_FAILED',
  FEATURE_NOT_SUPPORTED = 'FEATURE_NOT_SUPPORTED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
}

export class RCSError extends Error {
  public readonly code: RCSErrorCode;
  public readonly provider?: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: RCSErrorCode = RCSErrorCode.UNKNOWN,
    provider?: string,
    details?: any
  ) {
    super(message);
    this.name = 'RCSError';
    this.code = code;
    this.provider = provider;
    this.details = details;
    this.timestamp = new Date();

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, RCSError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      provider: this.provider,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  static fromProviderError(provider: string, error: any): RCSError {
    // Map provider-specific errors to RCS error codes
    let code = RCSErrorCode.PROVIDER_ERROR;
    let message = error.message || 'Provider error occurred';

    // Generic HTTP status code mapping
    if (error.code) {
      switch (error.code) {
        case 404:
          code = RCSErrorCode.RCS_NOT_SUPPORTED;
          message = 'Phone number does not support RCS';
          break;
        case 401:
        case 403:
          code = RCSErrorCode.AUTH_FAILED;
          message = 'Authentication failed';
          break;
        case 429:
          code = RCSErrorCode.RATE_LIMIT_EXCEEDED;
          message = 'Rate limit exceeded';
          break;
        case 400:
          if (error.message?.includes('phone')) {
            code = RCSErrorCode.INVALID_PHONE_NUMBER;
          } else if (error.message?.includes('content')) {
            code = RCSErrorCode.INVALID_CONTENT;
          }
          break;
      }
    }

    return new RCSError(message, code, provider, error);
  }

  static isRCSError(error: any): error is RCSError {
    return error instanceof RCSError;
  }
}