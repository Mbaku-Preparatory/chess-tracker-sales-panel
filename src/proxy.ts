import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// The only route a signed-out visitor may reach. Everything else in this app is
// admin-only.
const isSignInRoute = createRouteMatcher(["/sign-in(.*)"]);

export const proxy = clerkMiddleware(async (auth, req) => {
  if (isSignInRoute(req)) return;

  // unauthenticatedUrl is passed explicitly rather than relying on
  // NEXT_PUBLIC_CLERK_SIGN_IN_URL, so the redirect target can't silently break
  // by forgetting an env var in a new deployment environment. Without a target,
  // protect() rewrites signed-out requests to a 404 (Clerk's "protect-rewrite"),
  // which is what a deployed development instance does when the dev-browser
  // handshake is missing — a confusing dead end rather than a sign-in page.
  await auth.protect({
    unauthenticatedUrl: new URL("/sign-in", req.url).toString(),
  });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
