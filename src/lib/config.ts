/** The backend's admin-only GraphQL endpoint. */
export const ADMIN_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_ADMIN_GRAPHQL_URL ?? "http://localhost:8000/admin-graphql/";

/** Where the Google sign-in is checked. It sits next to /admin-graphql/ on the
 * same backend, so it is worked out from that URL rather than being one more
 * variable to set on Vercel. */
export const ADMIN_SIGN_IN_URL = new URL("../admin-auth/google/", ADMIN_GRAPHQL_URL).toString();

/** Public: Google puts it in the page anyway. The same client as the main
 * website (chess-tracker-frontend), so the backend already accepts its tokens.
 * The panel's address must be listed under the client's Authorized JavaScript
 * origins in Google Cloud, or Google refuses to show the button. */
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "450683232233-n8v32rm3ldt2f9thkj2nkupaejh5h2ur.apps.googleusercontent.com";
