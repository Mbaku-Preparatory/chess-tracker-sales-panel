import { clerkMiddleware } from "@clerk/nextjs/server";

// Everything in this app is admin-only — protect every route by default.
export const proxy = clerkMiddleware(async (auth) => {
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
