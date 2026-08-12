import { adminApiClient } from "./admin-api"

export async function getIdToken(): Promise<string> {
  const storedKey = adminApiClient.getStoredApiKey()
  if (storedKey) {
    return storedKey
  }
  return "superadmin_local_token"
}
