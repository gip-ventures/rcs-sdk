// Authentication interfaces
export interface AuthProvider {
  type: 'custom';
  authenticate(): Promise<AuthToken>;
  refresh(): Promise<AuthToken>;
  isValid(): boolean;
  revoke?(): Promise<void>;
}

export interface AuthToken {
  token: string;
  type?: 'Bearer' | 'Basic' | 'Custom';
  expiresAt?: Date;
  refreshToken?: string;
}

export interface AuthOptions {
  autoRefresh?: boolean;
  refreshThreshold?: number; // minutes before expiry to refresh
}