"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { AUTH_SUCCESS_REDIRECT } from "@/lib/constants";

interface SignInButtonsProps {
  emailEnabled?: boolean;
}

export function SignInButtons({ emailEnabled = false }: SignInButtonsProps) {
  const [isGooglePending, startGoogle] = useTransition();
  const [isEmailPending, startEmail] = useTransition();

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <PrimaryButton
        type="button"
        onClick={() =>
          startGoogle(() => {
            void signIn("google", { callbackUrl: AUTH_SUCCESS_REDIRECT });
          })
        }
        disabled={isGooglePending}
        className="gap-2"
      >
        <GoogleMark />
        <span>{isGooglePending ? "Opening Google…" : "Sign in with Google"}</span>
      </PrimaryButton>
      {emailEnabled && (
        <SecondaryButton
          type="button"
          onClick={() =>
            startEmail(() => {
              void signIn("email", { callbackUrl: AUTH_SUCCESS_REDIRECT });
            })
          }
          disabled={isEmailPending}
        >
          {isEmailPending ? "Sending magic link…" : "Email me a magic link"}
        </SecondaryButton>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.84h5.42c-.22 1.27-.87 2.35-1.86 3.07l3 2.33c1.74-1.6 2.74-3.95 2.74-6.74 0-.65-.06-1.27-.18-1.87H12z"
      />
      <path fill="#FBBC05" d="M6.53 13.72a6.59 6.59 0 0 1 0-3.44l-3-2.33a10.17 10.17 0 0 0 0 8.1z" />
      <path
        fill="#4285F4"
        d="M12 5.3c1.5 0 2.83.52 3.88 1.54l2.9-2.9C16.77 1.74 14.59.8 12 .8A10.2 10.2 0 0 0 3.53 7.95l3 2.33A6.12 6.12 0 0 1 12 5.3z"
      />
      <path
        fill="#34A853"
        d="M12 21.2c2.59 0 4.82-.85 6.44-2.33l-3-2.33A6.11 6.11 0 0 1 6.53 13.7l-3 2.33A10.19 10.19 0 0 0 12 21.2z"
      />
      <path fill="none" d="M2 2h20v20H2z" />
    </svg>
  );
}
