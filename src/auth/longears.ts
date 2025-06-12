import { AuthProvider, AuthToken } from '../interfaces/auth.js';
import { LongearsAuthCredentials } from '../interfaces/config.js';
import { RCSError, RCSErrorCode } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

export class LongearsAuth implements AuthProvider {
  public readonly type = 'custom';
  private credentials: LongearsAuthCredentials;
  private token: AuthToken | null = null;
  private tokenExpiresAt: Date | null = null;
  
  constructor(credentials: LongearsAuthCredentials) {
    if (!credentials.apiKey || !credentials.apiSecret) {
      throw new RCSError(
        'Longears authentication requires apiKey and apiSecret',
        RCSErrorCode.AUTH_INVALID,
        'longears'
      );
    }
    
    this.credentials = credentials;
  }
  
  /**
   * Authenticate with Longears API
   * This implementation uses HMAC authentication
   */
  async authenticate(): Promise<AuthToken> {
    try {
      logger.debug('Authenticating with Longears');
      
      // If we already have a valid token, return it
      if (this.isValid()) {
        logger.debug('Using existing Longears token');
        return this.token!;
      }
      
      // Generate a timestamp for the request
      const timestamp = Date.now().toString();
      
      // Create HMAC signature
      const signature = this.generateSignature(timestamp);
      
      // Create token object with expiration date
      const expiresAt = new Date(Date.now() + 3600 * 1000); // Token valid for 1 hour
      
      this.token = {
        token: signature,
        type: 'Custom',
        expiresAt
      };
      
      this.tokenExpiresAt = expiresAt;
      
      logger.debug('Longears authentication successful');
      return this.token;
    } catch (error) {
      logger.error('Longears authentication failed:', error);
      throw new RCSError(
        'Failed to authenticate with Longears',
        RCSErrorCode.AUTH_FAILED,
        'longears',
        error
      );
    }
  }
  
  /**
   * Refresh the token
   * For Longears, we simply regenerate the signature
   */
  async refresh(): Promise<AuthToken> {
    logger.debug('Refreshing Longears authentication');
    this.token = null;
    this.tokenExpiresAt = null;
    return this.authenticate();
  }
  
  /**
   * Check if the current token is valid
   */
  isValid(): boolean {
    if (!this.token || !this.tokenExpiresAt) {
      return false;
    }
    
    // Token is valid if it expires in the future
    const now = new Date();
    return now < this.tokenExpiresAt;
  }
  
  /**
   * Generate HMAC signature for Longears authentication
   */
  private generateSignature(timestamp: string): string {
    // The message to sign is the API key combined with the timestamp
    const message = `${this.credentials.apiKey}:${timestamp}`;
    
    // Create HMAC signature using the API secret
    const hmac = crypto.createHmac('sha256', this.credentials.apiSecret);
    hmac.update(message);
    const signature = hmac.digest('hex');
    
    // Format as a header value: {apiKey}:{timestamp}:{signature}
    return `${this.credentials.apiKey}:${timestamp}:${signature}`;
  }
  
  /**
   * Get authentication headers for requests
   */
  getAuthHeaders(): Record<string, string> {
    if (!this.token) {
      throw new RCSError(
        'No valid token available. Call authenticate() first.',
        RCSErrorCode.AUTH_FAILED,
        'longears'
      );
    }
    
    return {
      'X-Longears-Auth': this.token.token
    };
  }
}