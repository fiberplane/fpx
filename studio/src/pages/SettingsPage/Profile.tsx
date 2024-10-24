import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
          <h3 className="text-lg font-medium">Your Account</h3>
        </div>
        <div>
          <ProfileItem
            icon="lucide:github"
            label="GitHub Username"
            value={
              <span className="text-muted-foreground italic">
                not logged in
              </span>
            }
          />
        </div>
        <div className="bg-primary/10 text-blue-300/90 text-sm px-6 py-8 rounded-lg shadow-md">
          <h4 className="font-semibold mb-3">Let's get acquainted</h4>
          <p className="mb-4">
            We're adding features to make it easier to use AI in your api
            testing workflows. Log in with GitHub to get 100 free AI generated
            requests per day.
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
        <RequestCreditsItem credits={user.aiRequestCredits} />
      </div>
    </div>
  );
}

export function RequestCreditsItem({
  credits,
}: {
  credits?: number;
}) {
  const value =
    credits !== undefined ? (
      <>
        {credits} requests remaining
        {credits === 100 ? (
          <>
            {" "}
            <span className="italic">&mdash; go make some requests!</span>
          </>
        ) : null}{" "}
        <span className="text-muted-foreground inline-block ml-1">
          (refreshes daily)
        </span>
      </>
    ) : (
      "N/A"
    );
  return (
    <ProfileItem icon="lucide:zap" label="AI Requests" value={value}>
      {typeof credits === "number" ? (
        <Progress className="mt-2" value={credits} />
      ) : null}
    </ProfileItem>
  );
}

export function ProfileItem({
  icon,
  label,
  value,
  children,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border p-4 flex items-center space-x-4")}>
      <Icon icon={icon} className="h-5 w-5 text-gray-400" />
      <div className="flex flex-col gap-1 flex-grow">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm">{value}</p>
        {children}
      </div>
    </div>
  );
}
