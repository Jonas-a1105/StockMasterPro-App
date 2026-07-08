/**
 * Validates that all required environment variables are set.
 * Must be called BEFORE NestFactory.create() to fail fast.
 */
export function validateRequiredEnvVars(): void {
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
  ];

  const optional = [
    'LICENSE_JWT_SECRET', // Falls back to JWT_SECRET if missing
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}. ` +
      'Please check your .env file.',
    );
  }

  // Warn about optional vars
  const missingOptional = optional.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(
      `⚠️  Optional environment variables not set: ${missingOptional.join(', ')}`,
    );
  }
}
