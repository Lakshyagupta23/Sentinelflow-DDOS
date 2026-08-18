export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  
  // If we are in a public deployment without OAuth configured, redirect to the pre-built mock-login
  if (!oauthPortalUrl || oauthPortalUrl === "undefined" || oauthPortalUrl === "null" || !oauthPortalUrl.startsWith("http")) {
    return "/api/oauth/mock-login";
  }

  const appId = import.meta.env.VITE_APP_ID || "1";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (e) {
    console.error("Invalid OAuth portal URL configuration:", e);
    return "/api/oauth/mock-login";
  }
};
