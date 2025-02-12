export function isSensitiveEnvVar(key: string) {
  if (!key) {
    return false;
  }

  return (
    key.includes("APIKEY") ||
    key.includes("API_KEY") ||
    key.includes("ACCESS") ||
    key.includes("AUTH_") ||
    key.includes("CREDENTIALS") ||
    key.includes("CERTIFICATE") ||
    key.includes("PASSPHRASE") ||
    key.includes("DATABASE_URL") ||
    key.includes("CONNECTION_STRING") ||
    key.includes("SECRET") ||
    key.includes("PASSWORD") ||
    key.includes("PRIVATE") ||
    key.includes("TOKEN")
  );
}
