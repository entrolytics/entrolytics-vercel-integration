import { z } from 'zod';

const envSchema = z.object({
  INTEGRATION_CLIENT_ID: z.string().min(1),
  INTEGRATION_CLIENT_SECRET: z.string().min(1),
  ENTROLYTICS_API_URL: z.string().url().default('https://ng.entrolytics.click'),
  ENTROLYTICS_INTEGRATION_SECRET: z.string().min(1),
});

// Edge-compatible environment variable access
// In edge runtime, process.env is available but we handle it safely
function getEnv(key: string): string | undefined {
  // @ts-ignore - process.env is available in both Node.js and edge runtime
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    return process.env[key];
  }
  return undefined;
}

// Lazy validation - only validate when env is accessed, not at module evaluation
// This allows the build to succeed without env vars
let cachedEnv: z.infer<typeof envSchema> | null = null;

function getValidatedEnv(): z.infer<typeof envSchema> {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse({
      INTEGRATION_CLIENT_ID: getEnv('INTEGRATION_CLIENT_ID'),
      INTEGRATION_CLIENT_SECRET: getEnv('INTEGRATION_CLIENT_SECRET'),
      ENTROLYTICS_API_URL: getEnv('ENTROLYTICS_API_URL'),
      ENTROLYTICS_INTEGRATION_SECRET: getEnv('ENTROLYTICS_INTEGRATION_SECRET'),
    });
  }
  return cachedEnv;
}

// Export a proxy that validates on access
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop) {
    const validated = getValidatedEnv();
    return validated[prop as keyof typeof validated];
  },
});
