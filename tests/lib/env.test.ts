import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('lib/env', () => {
  const KEYS = ['APP_ID', 'PRIVATE_KEY', 'INSTALLATION_ID'] as const;
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    KEYS.forEach((k) => {
      savedEnv[k] = process.env[k];
    });
    vi.resetModules();
  });

  afterEach(() => {
    KEYS.forEach((k) => {
      if (savedEnv[k] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = savedEnv[k];
      }
    });
    vi.resetModules();
  });

  it('throws listing all missing vars when none are set', async () => {
    KEYS.forEach((k) => delete process.env[k]);
    const { loadEnv } = await import('@/lib/env');
    expect(loadEnv).toThrow('Missing required environment variables: APP_ID, PRIVATE_KEY, INSTALLATION_ID');
  });

  it('throws listing only the missing vars', async () => {
    process.env.APP_ID = '123';
    delete process.env.PRIVATE_KEY;
    delete process.env.INSTALLATION_ID;
    const { loadEnv } = await import('@/lib/env');
    expect(loadEnv).toThrow('Missing required environment variables: PRIVATE_KEY, INSTALLATION_ID');
  });

  it('returns validated env when all required vars are set', async () => {
    process.env.APP_ID = '123';
    process.env.PRIVATE_KEY = 'key';
    process.env.INSTALLATION_ID = '456';
    const { loadEnv } = await import('@/lib/env');
    expect(loadEnv()).toEqual({
      APP_ID: '123',
      PRIVATE_KEY: 'key',
      INSTALLATION_ID: '456',
    });
  });
});
