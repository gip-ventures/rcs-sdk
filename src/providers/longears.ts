import { BaseProvider } from './base.js';
import { 
  RCSMessage, 
  MessageResponse, 
  ValidationResult, 
  ProviderConfig,
  StandaloneCard,
  CarouselCard,
} from '../interfaces/index.js';
import { AuthProvider } from '../interfaces/auth.js';
import { RCSError, RCSErrorCode } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { isValidE164, formatPhoneNumber } from '../utils/index.js';

interface LongearsMessageResponse {
  messageId: string;
  status: string;
  timestamp: string;
}

interface LongearsCapabilitiesResponse {
  phoneNumber: string;
  isRcsSupported: boolean;
  features: {
    richCards: boolean;
    carousels: boolean;
    suggestions: boolean;
    fileTransfer: boolean;
    supportedMediaTypes: string[];
    maxMessageLength: number;
    maxSuggestions: number;
    maxFileSize: number;
  };
  carrier?: string;
  countryCode?: string;
}


export class LongearsRCSProvider extends BaseProvider {
  name = 'longears';
  private apiEndpoint: string;
  private initialized = false;
  
  constructor(auth: AuthProvider, config: ProviderConfig) {
    super(auth, config);
    
    // Set API endpoint from config or use default
    this.apiEndpoint = config.apiEndpoint || 'https://api.longears.mobi/v1';
    
    // Remove trailing slash if present
    if (this.apiEndpoint.endsWith('/')) {
      this.apiEndpoint = this.apiEndpoint.slice(0, -1);
    }
  }
  
  /**
   * Initialize the provider
   */
  async initialize(config: ProviderConfig): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      logger.info('Initializing Longears RCS provider');
      
      // Update config if provided
      if (config.apiEndpoint) {
        this.apiEndpoint = config.apiEndpoint;
        if (this.apiEndpoint.endsWith('/')) {
          this.apiEndpoint = this.apiEndpoint.slice(0, -1);
        }
      }
      
      // Test connection to validate credentials
      await this.testConnection();
      
      this.initialized = true;
      logger.info('Longears RCS provider initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Longears RCS provider:', error);
      throw new RCSError(
        'Failed to initialize Longears RCS provider',
        RCSErrorCode.INITIALIZATION_FAILED,
        this.name,
        error
      );
    }
  }
  
  /**
   * Send an RCS message
   */
  async sendMessage(message: RCSMessage): Promise<MessageResponse> {
    if (!this.initialized) {
      throw new RCSError(
        'Provider not initialized. Call initialize() first.',
        RCSErrorCode.NOT_INITIALIZED,
        this.name
      );
    }
    
    // Validate phone number
    if (!isValidE164(message.to)) {
      throw new RCSError(
        'Invalid phone number format. Must be in E.164 format.',
        RCSErrorCode.INVALID_PHONE_NUMBER,
        this.name,
        { phoneNumber: message.to }
      );
    }
    
    try {
      logger.debug('Sending message via Longears RCS', { to: message.to });
      
      // Transform the message to Longears format
      const longearsMessage = this.transformMessage(message);
      
      // Send the message
      const response = await this.makeRequest<LongearsMessageResponse>(
        `${this.apiEndpoint}/messages`,
        {
          method: 'POST',
          data: longearsMessage
        }
      );
      
      logger.info('Message sent successfully via Longears RCS', { messageId: response.messageId });
      
      // Transform and return the response
      return {
        messageId: response.messageId,
        status: response.status === 'success' ? 'sent' : 'pending',
        timestamp: response.timestamp ? new Date(response.timestamp) : new Date(),
        providerResponse: response
      };
    } catch (error) {
      logger.error('Failed to send message via Longears RCS:', error);
      
      if (error instanceof RCSError) {
        throw error;
      }
      
      throw new RCSError(
        'Failed to send message via Longears RCS',
        RCSErrorCode.MESSAGE_SEND_FAILED,
        this.name,
        error
      );
    }
  }
  
  
  /**
   * Validate a phone number
   */
  async validatePhoneNumber(phoneNumber: string): Promise<ValidationResult> {
    if (!this.initialized) {
      throw new RCSError(
        'Provider not initialized. Call initialize() first.',
        RCSErrorCode.NOT_INITIALIZED,
        this.name
      );
    }
    
    try {
      logger.debug('Validating phone number via Longears RCS', { phoneNumber });
      
      // Try to format the number first
      const formattedNumber = formatPhoneNumber(phoneNumber) || phoneNumber;
      
      // Get capabilities for this phone number
      const response = await this.makeRequest<LongearsCapabilitiesResponse>(
        `${this.apiEndpoint}/capabilities?phoneNumber=${encodeURIComponent(formattedNumber)}`,
        {
          method: 'GET'
        }
      );
      
      logger.debug('Phone number capability result from Longears RCS', { 
        phoneNumber, 
        isRcsSupported: response.isRcsSupported
      });
      
      // Transform response to match the expected format
      const features = [];
      
      if (response.features) {
        // Rich card capabilities
        if (response.features.richCards) features.push('RICHCARD_STANDALONE');
        if (response.features.carousels) features.push('RICHCARD_CAROUSEL');
        
        // Action capabilities
        if (response.features.suggestions) {
          features.push('ACTION_DIAL');
          features.push('ACTION_OPEN_URL');
          features.push('ACTION_OPEN_URL_IN_WEBVIEW');
          features.push('ACTION_SHARE_LOCATION');
          features.push('ACTION_VIEW_LOCATION');
          features.push('ACTION_CREATE_CALENDAR_EVENT');
          
          // Note: ACTION_COMPOSE is being deprecated by June 2025
          // Only add if explicitly supported by the provider
          if (response.features.supportedMediaTypes?.includes('compose')) {
            features.push('ACTION_COMPOSE');
          }
        }
      }
      
      return {
        success: true,
        capability: {
          phoneNumber: formattedNumber,
          isCapable: response.isRcsSupported,
          features: features,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to validate phone number via Longears RCS:', error);
      
      if (error instanceof RCSError) {
        throw error;
      }
      
      return {
        success: false,
        error: `Failed to validate phone number: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Test connection to Longears API
   */
  private async testConnection(): Promise<void> {
    try {
      await this.makeRequest(
        `${this.apiEndpoint}/status`,
        {
          method: 'GET'
        }
      );
    } catch (error) {
      throw new RCSError(
        'Failed to connect to Longears API',
        RCSErrorCode.NETWORK_ERROR,
        this.name,
        error
      );
    }
  }
  
  /**
   * Transform RCS SDK message to Longears format
   */
  private transformMessage(message: RCSMessage): any {
    const longearsMessage: any = {
      destination: message.to,
      metadata: message.metadata || {}
    };
    
    // Add text content
    if (message.content.text) {
      longearsMessage.text = message.content.text;
    }
    
    // Add media content
    if (message.content.media) {
      longearsMessage.media = {
        url: message.content.media.url,
        type: message.content.media.type,
        thumbnailUrl: message.content.media.thumbnailUrl,
        mimeType: message.content.media.mimeType,
        fileName: message.content.media.fileName
      };
    }
    
    // Add rich card content
    if (message.content.richCard) {
      const richCard = message.content.richCard as (StandaloneCard | CarouselCard);
      
      if (richCard.type === 'standalone') {
        longearsMessage.richCard = {
          type: 'standalone',
          title: richCard.title,
          description: richCard.description,
          media: richCard.media,
          orientation: richCard.orientation || 'vertical',
          suggestions: richCard.suggestions
        };
      } else if (richCard.type === 'carousel') {
        longearsMessage.richCard = {
          type: 'carousel',
          cards: richCard.cards,
          width: richCard.width || 'medium'
        };
      }
    }
    
    // Add suggestions
    if (message.suggestions && message.suggestions.length > 0) {
      longearsMessage.suggestions = message.suggestions.map(suggestion => ({
        type: suggestion.type,
        text: suggestion.text,
        postbackData: suggestion.postbackData,
        action: suggestion.action
      }));
    }
    
    return longearsMessage;
  }
}