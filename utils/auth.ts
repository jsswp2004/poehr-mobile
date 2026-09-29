// utils/auth.ts
// Transparent JWT refresh for every API call.
//
// installAuthFetch() wraps the global fetch once at app start. When a request to
// our API that carried a Bearer token comes back 401, we exchange the stored
// refresh token for a new access token (one refresh at a time, shared by all
// concurrent requests), retry the original request once, and only sign the
// user out if the refresh itself fails.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { API_BASE_URL, API_ENDPOINTS } from "../config/api";

let installed = false;
let refreshInFlight: Promise<string | null> | null = null;

type FetchFn = typeof fetch;

async function refreshAccessToken(rawFetch: FetchFn): Promise<string | null> {
  const refresh = await AsyncStorage.getItem("refresh_token");
  if (!refresh) return null;

  try {
    const res = await rawFetch(API_ENDPOINTS.REFRESH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.access) return null;

    await AsyncStorage.setItem("access_token", data.access);
    // Some backends rotate the refresh token too.
    if (data.refresh) await AsyncStorage.setItem("refresh_token", data.refresh);
    return data.access as string;
  } catch {
    return null;
  }
}

async function endSession() {
  try {
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
  } finally {
    router.replace("/login");
  }
}

export function installAuthFetch() {
  if (installed) return;
  installed = true;

  const rawFetch: FetchFn = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (async (input: any, init?: any) => {
    const response = await rawFetch(input, init);

    if (response.status !== 401 || typeof input !== "string") return response;
    if (!input.startsWith(API_BASE_URL)) return response;
    if (input === API_ENDPOINTS.LOGIN || input === API_ENDPOINTS.REFRESH) {
      return response;
    }

    // Only requests that carried a token can be fixed by refreshing.
    const headers = new Headers(init?.headers);
    if (!headers.get("Authorization")) return response;

    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken(rawFetch).finally(() => {
        refreshInFlight = null;
      });
    }
    const newAccess = await refreshInFlight;

    if (!newAccess) {
      await endSession();
      return response; // callers still see the original 401
    }

    headers.set("Authorization", `Bearer ${newAccess}`);
    return rawFetch(input, { ...init, headers });
  }) as FetchFn;
}
