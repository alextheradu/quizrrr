"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { buttonClassNames, type ButtonVariant } from "./button-classes";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={buttonClassNames(variant, className)} {...props} />;
}

export function PrimaryButton(props: PropsWithChildren<ButtonProps>) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: PropsWithChildren<ButtonProps>) {
  return <Button {...props} variant="secondary" />;
}

export function GhostButton(props: PropsWithChildren<ButtonProps>) {
  return <Button {...props} variant="ghost" />;
}

export function DangerButton(props: PropsWithChildren<ButtonProps>) {
  return <Button {...props} variant="danger" />;
}
