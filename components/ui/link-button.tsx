import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClassNames, type ButtonVariant } from "./button-classes";

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
}

export function LinkButton({ variant = "primary", className, children, ...props }: LinkButtonProps) {
  return (
    <Link {...props} className={buttonClassNames(variant, className)}>
      {children}
    </Link>
  );
}

export function PrimaryLinkButton(props: Omit<LinkButtonProps, "variant">) {
  return <LinkButton {...props} variant="primary" />;
}

export function SecondaryLinkButton(props: Omit<LinkButtonProps, "variant">) {
  return <LinkButton {...props} variant="secondary" />;
}

export function GhostLinkButton(props: Omit<LinkButtonProps, "variant">) {
  return <LinkButton {...props} variant="ghost" />;
}
