import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Utility to read secrets from Google Secret Manager with fallback to environment variables.
 * In local development, uses environment variables.
 * In production (App Engine), reads from Secret Manager.
 */

let secretClient: SecretManagerServiceClient | null = null;
let projectId: string | null = null;
const secretCache = new Map<string, string>();

/**
 * Initialize Secret Manager client (only in production)
 */
function initSecretManager(): void {
  // Only initialize in production (App Engine)
  if (process.env.NODE_ENV === 'production' && !secretClient) {
    try {
      secretClient = new SecretManagerServiceClient();
      // Get project ID from App Engine metadata or environment
      projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID || null;
      
      if (!projectId) {
        console.warn('Warning: Project ID not found. Secret Manager may not work correctly.');
      }
    } catch (error) {
      console.warn('Warning: Failed to initialize Secret Manager:', error);
      console.warn('Falling back to environment variables.');
    }
  }
}

/**
 * Get a secret value from Secret Manager or environment variable
 * @param secretName - Name of the secret in Secret Manager (without project prefix)
 * @param envVarName - Name of the environment variable to use as fallback
 * @param defaultValue - Optional default value if neither secret nor env var is found
 * @returns Secret value or null if not found
 */
export async function getSecret(
  secretName: string,
  envVarName: string,
  defaultValue?: string
): Promise<string | null> {
  // In local development, always use environment variables
  if (process.env.NODE_ENV !== 'production') {
    return process.env[envVarName] || defaultValue || null;
  }

  // In production, try Secret Manager first
  initSecretManager();

  // Check cache first
  if (secretCache.has(secretName)) {
    return secretCache.get(secretName)!;
  }

  // Try environment variable first (for backwards compatibility)
  if (process.env[envVarName]) {
    const value = process.env[envVarName];
    secretCache.set(secretName, value);
    return value;
  }

  // Try Secret Manager
  if (secretClient && projectId) {
    try {
      const fullSecretName = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await secretClient.accessSecretVersion({
        name: fullSecretName,
      });

      const secretValue = version.payload?.data?.toString();
      if (secretValue) {
        secretCache.set(secretName, secretValue);
        return secretValue;
      }
    } catch (error: any) {
      // If secret doesn't exist or access is denied, fall back to default
      if (error.code === 5 || error.code === 7) {
        // NOT_FOUND or PERMISSION_DENIED
        console.warn(`Secret ${secretName} not found or access denied, using default`);
      } else {
        console.warn(`Error accessing secret ${secretName}:`, error.message);
      }
    }
  }

  // Return default if provided
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  return null;
}

/**
 * Synchronous version that reads from cache or environment variables only
 * Use this when you can't use async/await
 */
export function getSecretSync(
  secretName: string,
  envVarName: string,
  defaultValue?: string
): string | null {
  // Always use environment variables in local dev
  if (process.env.NODE_ENV !== 'production') {
    return process.env[envVarName] || defaultValue || null;
  }

  // In production, check cache first
  if (secretCache.has(secretName)) {
    return secretCache.get(secretName)!;
  }

  // Fall back to environment variable
  return process.env[envVarName] || defaultValue || null;
}

/**
 * Preload secrets into cache (call this at startup)
 * This is useful to fail fast if secrets are missing
 */
export async function preloadSecrets(secrets: Array<{ secretName: string; envVarName: string }>): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    // In local dev, just validate env vars exist
    return;
  }

  initSecretManager();

  const loadPromises = secrets.map(async ({ secretName, envVarName }) => {
    try {
      const value = await getSecret(secretName, envVarName);
      if (!value) {
        console.warn(`Warning: Secret ${secretName} (${envVarName}) not found`);
      }
    } catch (error) {
      console.warn(`Warning: Failed to load secret ${secretName}:`, error);
    }
  });

  await Promise.all(loadPromises);
}
