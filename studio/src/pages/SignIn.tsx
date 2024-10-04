import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
export function SignIn() {
  return <div className="flex items-center justify-center h-full">
    <ClerkSignIn />
  </div>
}
