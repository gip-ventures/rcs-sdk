import { RCSProvider, SendMessageOptions, MessageResponse, ValidationResult } from './interfaces/index.js';
import { SDKConfig } from './interfaces/config.js';
import { AuthProvider } from './interfaces/auth.js';
import { createProvider } from './providers/factory.js';
import { createAuthProvider } from './auth/factory.js';
import { RCSError, RCSErrorCode } from './utils/errors.js';
import { logger } from './utils/logger.js';

export class RCSClient {
  private provider: RCSProvider;
  private auth: AuthProvider;
  private config: SDKConfig;
  private initialized = false;

  constructor(config: SDKConfig) {
    this.config = config;
    this.auth = createAuthProvider(config.auth);
    this.provider = createProvider(config.provider, this.auth, config.options || {});
  }

  /**
   * Initialize the RCS client and authenticate with the provider
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      logger.info(`Initializing RCS client with provider: ${this.config.provider}`);
      
      // Authenticate first
      await this.auth.authenticate();
      
      // Initialize provider
      await this.provider.initialize(this.config.options || {});
      
      this.initialized = true;
      logger.info('RCS client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize RCS client:', error);
      throw new RCSError(
        'Failed to initialize RCS client',
        RCSErrorCode.INITIALIZATION_FAILED,
        this.config.provider,
        error
      );
    }
  }

  /**
   * Send an RCS message
   */
  async sendMessage(options: SendMessageOptions): Promise<MessageResponse> {
    this.ensureInitialized();

    try {
      logger.debug('Sending RCS message:', { to: options.to, provider: this.config.provider });
      
      const response = await this.provider.sendMessage({
        to: options.to,
        content: options.content,
        suggestions: options.suggestions,
        metadata: options.metadata
      });

      logger.info('Message sent successfully:', { messageId: response.messageId });
      return response;
    } catch (error) {
      logger.error('Failed to send message:', error);
      
      if (error instanceof RCSError) {
        throw error;
      }
      
      throw new RCSError(
        'Failed to send message',
        RCSErrorCode.MESSAGE_SEND_FAILED,
        this.config.provider,
        error
      );
    }
  }


  /**
   * Check if a phone number is capable of receiving RCS messages
   * @param phoneNumber The phone number to check in E.164 format
   * @param options Optional parameters including agentId for Google RBM
   */
  async validatePhoneNumber(
    phoneNumber: string, 
    options?: { agentId?: string }
  ): Promise<ValidationResult> {
    this.ensureInitialized();

    try {
      // Use either provided agentId or the one from config
      const agentId = options?.agentId || this.config.options?.agentId;
      
      logger.debug('Checking RCS capability for phone number:', phoneNumber, 
                  agentId ? { agentId } : {});
      
      return await this.provider.validatePhoneNumber(phoneNumber, { agentId });
    } catch (error) {
      logger.error('Failed to check RCS capability:', error);
      
      if (error instanceof RCSError) {
        throw error;
      }
      
      return {
        success: false,
        error: `Failed to check RCS capability: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get the current provider name
   */
  getProvider(): string {
    return this.provider.name;
  }

  /**
   * Check if the client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Ensure the client is initialized before making calls
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new RCSError(
        'RCS client not initialized. Call initialize() first.',
        RCSErrorCode.NOT_INITIALIZED,
        this.config.provider
      );
    }
  }
}