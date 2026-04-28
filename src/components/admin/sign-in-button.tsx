"use client";

import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <Button
      onClick={() => {
        void authClient.signIn.social({ provider: "google", callbackURL: "/admin" });
      }}
    >
      <LogIn className="mr-2 size-4" />
      Continue with Google
    </Button>
  );
}
