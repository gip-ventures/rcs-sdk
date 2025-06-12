import { LongearsRCSProvider } from '../../src/providers/longears.js';
import { RCSError, RCSErrorCode } from '../../src/utils/errors.js';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LongearsRCSProvider', () => {
  const mockAuth = {
    type: 'custom',
    authenticate: jest.fn().mockResolvedValue({
      token: 'test-token',
      type: 'Custom',
      expiresAt: new Date(Date.now() + 3600 * 1000)
    }),
    refresh: jest.fn(),
    isValid: jest.fn().mockReturnValue(true)
  };

  const defaultConfig = {
    apiEndpoint: 'https://api.test.longears.mobi/v1',
    timeout: 5000
  };

  // Mock axios create
  mockedAxios.create.mockReturnValue({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    request: jest.fn()
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with valid config', () => {
    const provider = new LongearsRCSProvider(mockAuth as any, defaultConfig);
    expect(provider).toBeInstanceOf(LongearsRCSProvider);
    expect(provider.name).toBe('longears');
  });

  it('should initialize the provider successfully', async () => {
    const provider = new LongearsRCSProvider(mockAuth as any, defaultConfig);
    
    // Mock successful status request
    (provider as any).makeRequest = jest.fn().mockResolvedValue({ status: 'ok' });
    
    await provider.initialize(defaultConfig);
    
    expect((provider as any).initialized).toBe(true);
    expect((provider as any).makeRequest).toHaveBeenCalledWith(
      `${defaultConfig.apiEndpoint}/status`,
      { method: 'GET' }
    );
  });

  it('should handle initialization errors', async () => {
    const provider = new LongearsRCSProvider(mockAuth as any, defaultConfig);
    
    // Mock failed status request
    (provider as any).makeRequest = jest.fn().mockRejectedValue(new Error('Connection failed'));
    
    await expect(provider.initialize(defaultConfig)).rejects.toThrow(RCSError);
    expect((provider as any).initialized).toBe(false);
  });

  it('should validate initialization before operations', async () => {
    const provider = new LongearsRCSProvider(mockAuth as any, defaultConfig);
    
    // Methods should check for initialization
    await expect(provider.sendMessage({
      to: '+12345678901',
      content: { text: 'Test message' }
    })).rejects.toThrow(expect.objectContaining({
      code: RCSErrorCode.NOT_INITIALIZED
    }));
    
    await expect(provider.getCapabilities('+12345678901')).rejects.toThrow(expect.objectContaining({
      code: RCSErrorCode.NOT_INITIALIZED
    }));
    
    await expect(provider.validatePhoneNumber('+12345678901')).rejects.toThrow(expect.objectContaining({
      code: RCSErrorCode.NOT_INITIALIZED
    }));
  });

  it('should send a message successfully', async () => {
    const provider = new LongearsRCSProvider(mockAuth as any, defaultConfig);
    (provider as any).initialized = true;
    
    const messageResponse = {
      messageId: 'msg-123456',
      status: 'success',
      timestamp: '2023-01-01T12:00:00Z'
    };
    
    // Mock successful message request
    (provider as any).makeRequest = jest.fn().mockResolvedValue(messageResponse);
    
    const response = await provider.sendMessage({
      to: '+12345678901',
      content: {
        text: 'Test message',
        media: {
          url: 'https://example.com/image.jpg',
          type: 'image'
        }
      },
      suggestions: [
        { type: 'reply', text: 'Yes' },
        { type: 'reply', text: 'No' }
      ]
    });
    
    expect(response.messageId).toBe(messageResponse.messageId);
    expect(response.status).toBe('sent');
    expect(response.timestamp).toBeInstanceOf(Date);
    expect((provider as any).makeRequest).toHaveBeenCalledWith(
      `${defaultConfig.apiEndpoint}/messages`,
      expect.objectContaining({
        method: 'POST',
        data: expect.objectContaining({
          destination: '+12345678901',
          text: 'Test message'
        })
      })
    );
  });

  it('should validate phone numbers', async () => {
    const provider = new LongearsRCSProvider(mockAuth as any, defaultConfig);
    (provider as any).initialized = true;
    
    // Invalid number format
    await expect(provider.sendMessage({
      to: 'invalid-number',
      content: { text: 'Test' }
    })).rejects.toThrow(expect.objectContaining({
      code: RCSErrorCode.INVALID_PHONE_NUMBER
    }));
    
    await expect(provider.getCapabilities('invalid-number')).rejects.toThrow(expect.objectContaining({
      code: RCSErrorCode.INVALID_PHONE_NUMBER
    }));
  });

  it('should get capabilities successfully', async () => {
    const provider = new LongearsRCSProvider(mockAuth as any, defaultConfig);
    (provider as any).initialized = true;
    
    const capabilitiesResponse = {
      phoneNumber: '+12345678901',
      isRcsSupported: true,
      features: {
        richCards: true,
        carousels: true,
        suggestions: true,
        fileTransfer: true,
        supportedMediaTypes: ['image/jpeg', 'image/png'],
        maxMessageLength: 1000,
        maxSuggestions: 4,
        maxFileSize: 1048576
      },
      carrier: 'Test Carrier',
      countryCode: 'US'
    };
    
    // Mock successful capabilities request
    (provider as any).makeRequest = jest.fn().mockResolvedValue(capabilitiesResponse);
    
    const capabilities = await provider.getCapabilities('+12345678901');
    
    expect(capabilities.supportsRichCards).toBe(true);
    expect(capabilities.supportsCarousels).toBe(true);
    expect(capabilities.supportsSuggestions).toBe(true);
    expect(capabilities.supportsFileTransfer).toBe(true);
    expect(capabilities.supportedMediaTypes).toEqual(['image/jpeg', 'image/png']);
    expect(capabilities.maxMessageLength).toBe(1000);
    expect(capabilities.maxSuggestions).toBe(4);
    expect(capabilities.maxFileSize).toBe(1048576);
    
    expect((provider as any).makeRequest).toHaveBeenCalledWith(
      `${defaultConfig.apiEndpoint}/capabilities?phoneNumber=%2B12345678901`,
      { method: 'GET' }
    );
  });

  it('should validate phone number successfully', async () => {
    const provider = new LongearsRCSProvider(mockAuth as any, defaultConfig);
    (provider as any).initialized = true;
    
    const validationResponse = {
      valid: true,
      formatted: '+12345678901',
      countryCode: 'US',
      carrier: 'Test Carrier',
      capabilities: {
        richCards: true,
        carousels: true,
        suggestions: true,
        fileTransfer: true,
        supportedMediaTypes: ['image/jpeg', 'image/png'],
        maxMessageLength: 1000,
        maxSuggestions: 4,
        maxFileSize: 1048576
      }
    };
    
    // Mock successful validation request
    (provider as any).makeRequest = jest.fn().mockResolvedValue(validationResponse);
    
    const validation = await provider.validatePhoneNumber('+12345678901');
    
    expect(validation.valid).toBe(true);
    expect(validation.formatted).toBe('+12345678901');
    expect(validation.countryCode).toBe('US');
    expect(validation.carrier).toBe('Test Carrier');
    expect(validation.capabilities).toBeDefined();
    expect(validation.capabilities?.supportsRichCards).toBe(true);
    
    expect((provider as any).makeRequest).toHaveBeenCalledWith(
      `${defaultConfig.apiEndpoint}/validate?phoneNumber=%2B12345678901`,
      { method: 'GET' }
    );
  });

  it('should transform messages correctly', () => {
    const provider = new LongearsRCSProvider(mockAuth as any, defaultConfig);
    
    // Test with text message
    const textMessage = {
      to: '+12345678901',
      content: { text: 'Test message' }
    };
    
    const transformedTextMessage = (provider as any).transformMessage(textMessage);
    expect(transformedTextMessage.destination).toBe('+12345678901');
    expect(transformedTextMessage.text).toBe('Test message');
    
    // Test with rich card
    const richCardMessage = {
      to: '+12345678901',
      content: {
        richCard: {
          type: 'standalone',
          title: 'Card Title',
          description: 'Card description',
          media: {
            url: 'https://example.com/image.jpg',
            type: 'image'
          },
          orientation: 'vertical'
        }
      }
    };
    
    const transformedRichCardMessage = (provider as any).transformMessage(richCardMessage);
    expect(transformedRichCardMessage.richCard).toBeDefined();
    expect(transformedRichCardMessage.richCard.type).toBe('standalone');
    expect(transformedRichCardMessage.richCard.title).toBe('Card Title');
    
    // Test with carousel
    const carouselMessage = {
      to: '+12345678901',
      content: {
        richCard: {
          type: 'carousel',
          cards: [
            {
              title: 'Card 1',
              description: 'Description 1'
            },
            {
              title: 'Card 2',
              description: 'Description 2'
            }
          ],
          width: 'medium'
        }
      }
    };
    
    const transformedCarouselMessage = (provider as any).transformMessage(carouselMessage);
    expect(transformedCarouselMessage.richCard).toBeDefined();
    expect(transformedCarouselMessage.richCard.type).toBe('carousel');
    expect(transformedCarouselMessage.richCard.cards.length).toBe(2);
    
    // Test with suggestions
    const suggestionMessage = {
      to: '+12345678901',
      content: { text: 'Test message' },
      suggestions: [
        { type: 'reply', text: 'Yes' },
        { type: 'action', text: 'Call', action: { type: 'dial', data: '+19876543210' } }
      ]
    };
    
    const transformedSuggestionMessage = (provider as any).transformMessage(suggestionMessage);
    expect(transformedSuggestionMessage.suggestions).toBeDefined();
    expect(transformedSuggestionMessage.suggestions.length).toBe(2);
    expect(transformedSuggestionMessage.suggestions[0].type).toBe('reply');
    expect(transformedSuggestionMessage.suggestions[1].type).toBe('action');
    expect(transformedSuggestionMessage.suggestions[1].action.type).toBe('dial');
  });
});