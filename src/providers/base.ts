import { RCSProvider, RCSMessage, MessageResponse, RCSCapabilities, ValidationResult, ProviderConfig } from '../interfaces/index.js';
import { AuthProvider } from '../interfaces/auth.js';
import { RCSError, RCSErrorCode } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export abstract class BaseProvider implements RCSProvider {
  protected auth: AuthProvider;
  protected config: ProviderConfig;
  protected http: AxiosInstance;
  
  abstract name: string;
  
  constructor(auth: AuthProvider, config: ProviderConfig) {
    this.auth = auth;
    this.config = config;
    
    // Create axios instance with default config
    this.http = axios.create({
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `@longears-mobile/rcs-sdk/${process.env.npm_package_version || '0.1.0'}`
      }
    });
    
    // Add request interceptor for authentication
    this.http.interceptors.request.use(async (config) => {
      try {
        // Get auth token
        const token = await this.auth.authenticate();
        
        // Add auth header based on token type
        if (token.type && token.type === 'Bearer') {
          config.headers.Authorization = `Bearer ${token.token}`;
        } else if (token.type && token.type === 'Basic') {
          config.headers.Authorization = `Basic ${token.token}`;
        } else {
          config.headers.Authorization = token.token;
        }
        
        return config;
      } catch (error) {
        logger.error('Authentication failed:', error);
        throw new RCSError(
          'Failed to authenticate request',
          RCSErrorCode.AUTH_FAILED,
          this.name,
          error
        );
      }
    });
    
    // Add response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error(`HTTP request failed for ${this.name} provider:`, error);
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const status = error.response.status;
          const data = error.response.data;
          
          switch (status) {
            case 401:
            case 403:
              throw new RCSError(
                'Authentication failed',
                RCSErrorCode.AUTH_FAILED,
                this.name,
                { status, data }
              );
            case 404:
              throw new RCSError(
                'Resource not found',
                RCSErrorCode.PROVIDER_ERROR,
                this.name,
                { status, data }
              );
            case 429:
              throw new RCSError(
                'Rate limit exceeded',
                RCSErrorCode.RATE_LIMIT_EXCEEDED,
                this.name,
                { status, data }
              );
            default:
              throw RCSError.fromProviderError(this.name, { 
                code: status,
                message: data?.error || 'Provider request failed',
                details: data
              });
          }
        } else if (error.request) {
          // The request was made but no response was received
          throw new RCSError(
            'No response received from provider',
            RCSErrorCode.NETWORK_ERROR,
            this.name,
            error
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new RCSError(
            'Request setup failed',
            RCSErrorCode.PROVIDER_ERROR,
            this.name,
            error
          );
        }
      }
    );
  }
  
  abstract initialize(config: ProviderConfig): Promise<void>;
  abstract sendMessage(message: RCSMessage): Promise<MessageResponse>;
  abstract getCapabilities(phoneNumber: string): Promise<RCSCapabilities>;
  abstract validatePhoneNumber(phoneNumber: string): Promise<ValidationResult>;
  
  /**
   * Make an authenticated HTTP request
   */
  protected async makeRequest<T = any>(
    url: string,
    options: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response = await this.http.request<T>({
        url,
        ...options
      });
      
      return response.data;
    } catch (error) {
      // Axios interceptors will handle this error
      throw error;
    }
  }
}