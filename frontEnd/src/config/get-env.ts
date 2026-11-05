function normalizeApiUrl(raw: string | undefined): string {
  const value = raw?.trim()

  // A missing value used to be interpolated into template literals, producing the
  // literal path "undefined/auth/google". The browser then resolved that relative
  // to the current route, which is how /auth/undefined/auth/google appeared.
  if (!value || value === "undefined") {
    if (import.meta.env.DEV) return "http://localhost:8000"

    throw new Error(
      "VITE_API_URL is not set. Add it in Vercel -> Settings -> Environment Variables " +
        "and redeploy: Vite inlines VITE_* values at build time, so a saved variable " +
        "does not apply until the next build.",
    )
  }

  return value.replace(/\/+$/, "")
}

export const apiUrl = normalizeApiUrl(import.meta.env.VITE_API_URL)

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
export const developerKey = import.meta.env.VITE_DEVELOPPER_KEY
