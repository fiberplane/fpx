import { SignedIn, SignedOut, UserProfile } from "@clerk/clerk-react";
export function Account() {
  return (
    <div className="flex items-center justify-center h-full">
      <SignedIn>
        <UserProfile />
      </SignedIn>
      <SignedOut>
        <div className="text-gray-300">Please sign in to view your account.</div>
      </SignedOut>
    </div>
  );
}
