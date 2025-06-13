import { RCSClient } from '../../src/client.js';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Longears Integration Tests', () => {
  // Mock axios create to return our own mocked instance
  const mockAxiosInstance = {
    interceptors: {
      request: { use: jest.fn((callback) => callback) },
      response: { use: jest.fn((successCallback) => successCallback) }
    },
    request: jest.fn()
  };
  
  mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initialize client with Longears provider', async () => {
    // Mock the API calls
    mockAxiosInstance.request.mockImplementation((config: any) => {
      if (config.url.includes('/status')) {
        return Promise.resolve({ data: { status: 'ok' } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${config.url}`));
    });
    
    const client = new RCSClient({
      provider: 'longears',
      auth: {
        type: 'longears',
        credentials: {
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret'
        }
      },
      options: {
        apiEndpoint: 'https://api.test.longears.mobi/v1'
      }
    });
    
    await client.initialize();
    
    expect(client.isInitialized()).toBe(true);
    expect(client.getProvider()).toBe('longears');
    expect(mockAxiosInstance.request).toHaveBeenCalled();
  });
  
  it('should send a message', async () => {
    // Mock the API calls
    mockAxiosInstance.request.mockImplementation((config: any) => {
      if (config.url.includes('/status')) {
        return Promise.resolve({ data: { status: 'ok' } });
      }
      if (config.url.includes('/messages') && config.method === 'POST') {
        return Promise.resolve({
          data: {
            messageId: 'msg-123456',
            status: 'success',
            timestamp: new Date().toISOString()
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${config.url}`));
    });
    
    const client = new RCSClient({
      provider: 'longears',
      auth: {
        type: 'longears',
        credentials: {
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret'
        }
      },
      options: {
        apiEndpoint: 'https://api.test.longears.mobi/v1'
      }
    });
    
    await client.initialize();
    
    const response = await client.sendMessage({
      to: '+12345678901',
      content: {
        text: 'Hello from integration test!'
      }
    });
    
    expect(response.messageId).toBe('msg-123456');
    expect(response.status).toBe('sent');
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2); // status + message
  });
  
  
  it('should check RCS capabilities for a phone number', async () => {
    // Mock the API calls
    mockAxiosInstance.request.mockImplementation((config: any) => {
      if (config.url.includes('/status')) {
        return Promise.resolve({ data: { status: 'ok' } });
      }
      if (config.url.includes('/capabilities')) {
        return Promise.resolve({
          data: {
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
            countryCode: 'US',
            carrier: 'Test Carrier'
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${config.url}`));
    });
    
    const client = new RCSClient({
      provider: 'longears',
      auth: {
        type: 'longears',
        credentials: {
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret'
        }
      },
      options: {
        apiEndpoint: 'https://api.test.longears.mobi/v1'
      }
    });
    
    await client.initialize();
    
    const result = await client.validatePhoneNumber('+12345678901');
    
    expect(result.success).toBe(true);
    expect(result.capability).toBeDefined();
    expect(result.capability?.phoneNumber).toBe('+12345678901');
    expect(result.capability?.isCapable).toBe(true);
    expect(Array.isArray(result.capability?.features)).toBe(true);
    expect(result.capability?.features.length).toBeGreaterThan(0);
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2); // status + capabilities
  });
});