import { Button } from "@/components/ui/button";
import { FP_SERVICES_LOGIN_URL } from "@/constants";
import { useLogout, useUserInfo } from "@/queries";
import { cn } from "@/utils";
import type { Settings } from "@fiberplane/fpx-types";
import { Icon } from "@iconify/react";

export function Profile({ settings: _settings }: { settings: Settings }) {
  const logout = useLogout();
  const user = useUserInfo();

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">User Profile</h3>
        </div>
        <div className="bg-primary/20 text-blue-300/90 text-sm px-6 py-8 rounded-lg shadow-md">
          <h4 className="font-semibold mb-3">Anonymous User</h4>
          <p className="mb-4">
            We're adding features to make it easier to use AI in your workflows.
            Log in with GitHub to get 50 free AI generated requests per day.
          </p>
          <Button
            className="bg-blue-600 text-white w-full py-2 rounded-md"
            variant="link"
            asChild
          >
            <a
              href={FP_SERVICES_LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon icon="lucide:github" className="mr-2 h-5 w-5" />
              Sign in with GitHub
            </a>
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    !logout.isPending && logout.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">User Profile</h3>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="text-muted-foreground"
        >
          <Icon icon="lucide:log-out" className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
      <div className="space-y-4">
        <ProfileItem icon="lucide:mail" label="Email" value={user.email} />
        <ProfileItem
          icon="lucide:github"
          label="GitHub Username"
          value={user.githubUsername}
        />
        <ProfileItem
          icon="lucide:zap"
          label="AI Request Credits"
          value={
            user.aiRequestCredits !== undefined
              ? `${user.aiRequestCredits} credits`
              : "N/A"
          }
        />
      </div>
    </div>
  );
}

export function ProfileItem({
  icon,
  label,
  value,
}: { icon: string; label: string; value: string }) {
  return (
    <div className={cn("rounded-lg border p-4 flex items-center space-x-4")}>
      <Icon icon={icon} className="h-5 w-5 text-gray-400" />
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base">{value}</p>
      </div>
    </div>
  );
}
