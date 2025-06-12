import { AuthProvider } from '../interfaces/auth.js';
import { AuthConfig } from '../interfaces/config.js';
import { RCSError, RCSErrorCode } from '../utils/errors.js';
import { LongearsAuth } from './longears.js';

/**
 * Factory function to create auth provider instances
 */
export function createAuthProvider(config: AuthConfig): AuthProvider {
  switch (config.type) {
    case 'longears':
      return new LongearsAuth(config.credentials);

    default:
      throw new RCSError(
        `Unknown auth type: ${config.type}`,
        RCSErrorCode.AUTH_INVALID,
        config.type
      );
  }
}

/**
 * Get list of available auth types
 */
export function getAvailableAuthTypes(): string[] {
  return ['longears'];
}

/**
 * Check if an auth type is supported
 */
export function isAuthTypeSupported(authType: string): boolean {
  return getAvailableAuthTypes().includes(authType);
}