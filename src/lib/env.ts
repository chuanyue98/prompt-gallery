const REQUIRED_VARS = ['APP_ID', 'PRIVATE_KEY', 'INSTALLATION_ID'] as const;
type RequiredVar = (typeof REQUIRED_VARS)[number];

function loadEnv(): Record<RequiredVar, string> {
  const missing = REQUIRED_VARS.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return Object.fromEntries(REQUIRED_VARS.map(k => [k, process.env[k]!])) as Record<RequiredVar, string>;
}

export const env = loadEnv();
