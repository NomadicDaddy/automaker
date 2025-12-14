import { useState, useCallback } from "react";

interface UseCliStatusOptions {
  cliType: "claude";
  statusApi: () => Promise<any>;
  setCliStatus: (status: any) => void;
  setAuthStatus: (status: any) => void;
}

export function useCliStatus({
  cliType,
  statusApi,
  setCliStatus,
  setAuthStatus,
}: UseCliStatusOptions) {
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    console.log(`[${cliType} Setup] Starting status check...`);
    setIsChecking(true);
    try {
      const result = await statusApi();
      console.log(`[${cliType} Setup] Raw status result:`, result);

      if (result.success) {
        const cliStatus = {
          installed: result.status === "installed",
          path: result.path || null,
          version: result.version || null,
          method: result.method || "none",
        };
        console.log(`[${cliType} Setup] CLI Status:`, cliStatus);
        setCliStatus(cliStatus);

        if (result.auth) {
          // Validate method is one of the expected values, default to "none"
          const validMethods = [
            "oauth_token_env",
            "oauth_token",
            "api_key",
            "api_key_env",
            "credentials_file",
            "cli_authenticated",
            "none",
          ] as const;
          type AuthMethod = (typeof validMethods)[number];
          const method: AuthMethod = validMethods.includes(
            result.auth.method as AuthMethod
          )
            ? (result.auth.method as AuthMethod)
            : "none";
          const authStatus = {
            authenticated: result.auth.authenticated,
            method,
            hasCredentialsFile: false,
            oauthTokenValid:
              result.auth.hasStoredOAuthToken ||
              result.auth.hasEnvOAuthToken,
            apiKeyValid:
              result.auth.hasStoredApiKey || result.auth.hasEnvApiKey,
            hasEnvOAuthToken: result.auth.hasEnvOAuthToken,
            hasEnvApiKey: result.auth.hasEnvApiKey,
          };
          setAuthStatus(authStatus);
        }
      }
    } catch (error) {
      console.error(`[${cliType} Setup] Failed to check status:`, error);
    } finally {
      setIsChecking(false);
    }
  }, [cliType, statusApi, setCliStatus, setAuthStatus]);

  return { isChecking, checkStatus };
}
