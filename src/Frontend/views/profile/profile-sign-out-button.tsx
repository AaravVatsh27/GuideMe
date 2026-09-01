"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/Frontend/components/ui/button";

type ProfileSignOutButtonProps = {
  redirectTo: string;
};

export function ProfileSignOutButton({
  redirectTo,
}: ProfileSignOutButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => signOut({ redirectTo })}
      className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100"
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
