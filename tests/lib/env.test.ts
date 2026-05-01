import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('lib/env', () => {
  const KEYS = ['APP_ID', 'PRIVATE_KEY', 'INSTALLATION_ID'] as const;
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    KEYS.forEach(k => { savedEnv[k] = process.env[k]; });
    vi.resetModules();
  });

  afterEach(() => {
    KEYS.forEach(k => {
      if (savedEnv[k] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = savedEnv[k];
      }
    });
    vi.resetModules();
  });

  it('throws listing all missing vars when none are set', async () => {
    KEYS.forEach(k => delete process.env[k]);
    await expect(import('@/lib/env')).rejects.toThrow(
      'Missing required environment variables: APP_ID, PRIVATE_KEY, INSTALLATION_ID',
    );
  });

  it('throws listing only the missing vars', async () => {
    process.env.APP_ID = '123';
    delete process.env.PRIVATE_KEY;
    delete process.env.INSTALLATION_ID;
    await expect(import('@/lib/env')).rejects.toThrow(
      'Missing required environment variables: PRIVATE_KEY, INSTALLATION_ID',
    );
  });

  it('exports validated env when all required vars are set', async () => {
    process.env.APP_ID = '123';
    process.env.PRIVATE_KEY = 'key';
    process.env.INSTALLATION_ID = '456';
    const { env } = await import('@/lib/env');
    expect(env.APP_ID).toBe('123');
    expect(env.PRIVATE_KEY).toBe('key');
    expect(env.INSTALLATION_ID).toBe('456');
  });
});
