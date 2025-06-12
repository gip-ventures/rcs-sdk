import { LongearsAuth } from '../../src/auth/longears.js';
import { RCSError } from '../../src/utils/errors.js';

describe('LongearsAuth', () => {
  const validCredentials = {
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret'
  };

  it('should initialize with valid credentials', () => {
    const auth = new LongearsAuth(validCredentials);
    expect(auth).toBeInstanceOf(LongearsAuth);
    expect(auth.type).toBe('custom');
  });

  it('should throw error when missing credentials', () => {
    expect(() => {
      new LongearsAuth({ apiKey: 'test-key' } as any);
    }).toThrow(RCSError);

    expect(() => {
      new LongearsAuth({ apiSecret: 'test-secret' } as any);
    }).toThrow(RCSError);

    expect(() => {
      new LongearsAuth({} as any);
    }).toThrow(RCSError);
  });

  it('should generate a valid auth token', async () => {
    const auth = new LongearsAuth(validCredentials);
    const token = await auth.authenticate();
    
    expect(token).toBeDefined();
    expect(token.token).toBeDefined();
    expect(token.type).toBe('Custom');
    expect(token.expiresAt).toBeInstanceOf(Date);
    
    // Token should have format: {apiKey}:{timestamp}:{signature}
    const parts = token.token.split(':');
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe(validCredentials.apiKey);
    
    // Timestamp should be a number
    expect(Number.isNaN(Number(parts[1]))).toBe(false);
    
    // Signature should be a hex string (64 chars for SHA-256)
    expect(parts[2].length).toBe(64);
  });

  it('should validate token expiration', async () => {
    const auth = new LongearsAuth(validCredentials);
    
    // Initially not valid
    expect(auth.isValid()).toBe(false);
    
    // Get token
    await auth.authenticate();
    
    // Should be valid after authentication
    expect(auth.isValid()).toBe(true);
    
    // Mock the expiresAt to be in the past
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() - 10); // 10 minutes in the past
    
    // Use private property access for testing
    (auth as any).tokenExpiresAt = tokenExpiresAt;
    
    // Should be invalid when expired
    expect(auth.isValid()).toBe(false);
  });

  it('should refresh token', async () => {
    const auth = new LongearsAuth(validCredentials);
    
    // Get initial token
    const token1 = await auth.authenticate();
    
    // Small delay to ensure timestamp is different
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Refresh token
    const token2 = await auth.refresh();
    
    expect(token2).toBeDefined();
    expect(token2.token).not.toBe(token1.token);
  });
});