import { Button } from "@/components/ui/button";
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
        <h3 className="text-lg font-medium">User Profile</h3>
        <div className="bg-primary/10 text-blue-300/90 text-sm px-4 py-6 rounded-md">
          <h4 className="font-semibold mb-2">Anonymous User</h4>
          <p className="mb-4">
            Log in to access your personalized profile and enjoy additional
            features:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>View and manage your account details</li>
            <li>Track your AI request credits</li>
            <li>Access exclusive features and settings</li>
          </ul>
          <Button className="text-white">
            <Icon icon="lucide:log-in" className="mr-2 h-4 w-4" />
            Log In
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

function ProfileItem({
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
