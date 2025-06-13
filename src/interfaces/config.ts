// Configuration interfaces
export interface SDKConfig {
  provider: 'longears' | string;
  auth: AuthConfig;
  options?: SDKOptions;
}

export interface AuthConfig {
  type: 'longears';
  credentials: LongearsAuthCredentials;
}

export interface SDKOptions {
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  region?: string;
  apiEndpoint?: string;
  webhookUrl?: string;
  userAgent?: string;
  debug?: boolean;
  agentId?: string; // For Google RCS Business Messaging
}

export interface LongearsAuthCredentials {
  apiKey: string;
  apiSecret: string;
}