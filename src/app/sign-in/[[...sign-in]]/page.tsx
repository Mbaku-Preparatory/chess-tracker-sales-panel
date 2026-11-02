import { SignIn } from "@clerk/nextjs";

// Optional catch-all ([[...sign-in]]) because Clerk routes its multi-step flows
// — factor-two, SSO callbacks, password reset — as sub-paths of this page.
export default function SignInPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <SignIn />
    </div>
  );
}
