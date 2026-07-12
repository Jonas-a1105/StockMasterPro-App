/**
 * Validates that all required environment variables are set.
 * Must be called BEFORE NestFactory.create() to fail fast.
 */
export function validateRequiredEnvVars(): void {
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'FRONTEND_URL',
    'LICENSE_JWT_PRIVATE_KEY',
    'LICENSE_JWT_PUBLIC_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}. ` +
        'Please check your .env file.',
    );
  }
}
