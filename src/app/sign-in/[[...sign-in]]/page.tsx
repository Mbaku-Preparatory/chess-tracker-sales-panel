import { SignIn } from "@clerk/nextjs";

// Optional catch-all ([[...sign-in]]) because Clerk routes its multi-step flows
// — factor-two, SSO callbacks, password reset — as sub-paths of this page.
export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-10">
      <SignIn />
    </div>
  );
}
