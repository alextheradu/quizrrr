"use client";

import { signIn } from "next-auth/react";
import { PrimaryButton } from "@/components/ui/button";
import { AUTH_SUCCESS_REDIRECT } from "@/lib/constants";
import type { HTMLAttributes } from "react";

type LoginButtonProps = Pick<HTMLAttributes<HTMLButtonElement>, "className">;

export function LoginButton({ className }: LoginButtonProps = {}) {
  const handleSignIn = () => {
    void signIn(undefined, { callbackUrl: AUTH_SUCCESS_REDIRECT });
  };

  return (
    <PrimaryButton type="button" onClick={handleSignIn} className={className}>
      Sign in
    </PrimaryButton>
  );
}
