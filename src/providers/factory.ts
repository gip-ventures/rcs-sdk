import { RCSProvider } from '../interfaces/index.js';
import { AuthProvider } from '../interfaces/auth.js';
import { ProviderConfig } from '../interfaces/index.js';
import { RCSError, RCSErrorCode } from '../utils/errors.js';
import { LongearsRCSProvider } from './longears.js';

/**
 * Factory function to create provider instances
 */
export function createProvider(
  providerName: string,
  auth: AuthProvider,
  config: ProviderConfig
): RCSProvider {
  switch (providerName.toLowerCase()) {
    case 'longears':
    case 'longears-rcs':
      return new LongearsRCSProvider(auth, config);

    default:
      throw new RCSError(
        `Unknown provider: ${providerName}`,
        RCSErrorCode.PROVIDER_NOT_FOUND,
        providerName
      );
  }
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): string[] {
  return ['longears'];
}

/**
 * Check if a provider is supported
 */
export function isProviderSupported(providerName: string): boolean {
  return getAvailableProviders().includes(providerName.toLowerCase());
}