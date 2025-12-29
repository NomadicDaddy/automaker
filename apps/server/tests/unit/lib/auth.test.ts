import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockExpressContext } from '../../utils/mocks.js';

/**
 * Note: auth.ts reads AUTOMAKER_API_KEY at module load time.
 * We need to reset modules and reimport for each test to get fresh state.
 */
describe('auth.ts', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('authMiddleware', () => {
    it('should reject request without any authentication', async () => {
      const { authMiddleware } = await import('@/lib/auth.js');
      const { req, res, next } = createMockExpressContext();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid API key', async () => {
      process.env.AUTOMAKER_API_KEY = 'test-secret-key';

      const { authMiddleware } = await import('@/lib/auth.js');
      const { req, res, next } = createMockExpressContext();
      req.headers['x-api-key'] = 'wrong-key';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid API key.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() with valid API key', async () => {
      process.env.AUTOMAKER_API_KEY = 'test-secret-key';

      const { authMiddleware } = await import('@/lib/auth.js');
      const { req, res, next } = createMockExpressContext();
      req.headers['x-api-key'] = 'test-secret-key';

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('isAuthEnabled', () => {
    it('should always return true (auth is always required)', async () => {
      const { isAuthEnabled } = await import('@/lib/auth.js');
      expect(isAuthEnabled()).toBe(true);
    });
  });

  describe('getAuthStatus', () => {
    it('should return enabled status with api_key_or_session method', async () => {
      const { getAuthStatus } = await import('@/lib/auth.js');
      const status = getAuthStatus();

      expect(status).toEqual({
        enabled: true,
        method: 'api_key_or_session',
      });
    });
  });
});
