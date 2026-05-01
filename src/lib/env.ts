const REQUIRED_VARS = ['APP_ID', 'PRIVATE_KEY', 'INSTALLATION_ID'] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

export function loadEnv(): Record<RequiredVar, string> {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return Object.fromEntries(REQUIRED_VARS.map((key) => [key, process.env[key]!])) as Record<RequiredVar, string>;
}
