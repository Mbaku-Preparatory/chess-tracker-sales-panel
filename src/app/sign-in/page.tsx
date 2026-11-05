import { GoogleSignIn } from "@/components/GoogleSignIn";

export default function SignInPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-xs dark:border-dark-border dark:bg-dark-surface">
        <h1 className="text-center text-xl font-semibold text-gray-900 dark:text-gray-100">
          Sign in to the Sales Panel
        </h1>
        <p className="mt-2 mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          For Chess Preparatory admins only.
        </p>
        <GoogleSignIn />
      </div>
    </div>
  );
}
