import type { Adapter } from "next-auth/adapters";
import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { AUTH_SUCCESS_REDIRECT } from "@/lib/constants";

const providers: NextAuthConfig["providers"] = [];
const runtime = process.env.NEXT_RUNTIME ?? "nodejs";
const emailConfigPresent = Boolean(env.SMTP_HOST && env.SMTP_FROM);
const emailAllowed = runtime !== "edge" && emailConfigPresent;

if (emailAllowed) {
  providers.push(
    EmailProvider({
      server: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      },
      from: env.SMTP_FROM!,
      async sendVerificationRequest({ identifier, url, provider }) {
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.createTransport(provider.server);
        const { host } = new URL(url);
        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Sign in to ${env.APP_NAME}`,
          text: `Click the link to sign in to ${env.APP_NAME} at ${host}: ${url}`,
          html: `
            <div style="font-family: Inter, system-ui, -apple-system, sans-serif; padding: 16px;">
              <h2 style="margin-bottom: 12px;">Finish signing in</h2>
              <p style="margin-bottom: 24px;">Click the secure button below to open ${env.APP_NAME}.</p>
              <p style="text-align: center;">
                <a href="${url}" style="background:#8b7ad1;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;">Open ${env.APP_NAME}</a>
              </p>
              <p style="margin-top:24px;font-size:12px;color:#666;">If you did not request this email, you can safely ignore it.</p>
            </div>
          `,
        });
      },
    })
  );
} else if (emailConfigPresent) {
  console.warn("Email SMTP creds detected but feature is disabled in the edge runtime. Move auth to a Node runtime to enable it.");
} else {
  console.info("Email sign-in disabled (SMTP settings missing)");
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (providers.length === 0) {
  throw new Error("No authentication providers configured. Add Google or SMTP credentials.");
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "database" },
  secret: env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl);
        const pathname = target.pathname;
        if (pathname.startsWith("/api/auth/signout")) {
          return baseUrl;
        }
        if (pathname.startsWith("/api/auth") || pathname === "/" || pathname === AUTH_SUCCESS_REDIRECT) {
          return `${baseUrl}${AUTH_SUCCESS_REDIRECT}`;
        }
        if (target.origin === baseUrl) {
          return target.toString();
        }
      } catch {
        // fall through to default redirect below
      }
      return `${baseUrl}${AUTH_SUCCESS_REDIRECT}`;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request?.nextUrl?.pathname ?? "";
      const protectedRoutes = ["/dashboard", "/notes", "/quizzes"];
      const shouldProtect = protectedRoutes.some((route) => pathname.startsWith(route));
      if (shouldProtect) {
        return isLoggedIn;
      }
      return true;
    },
  },
  events: {
    createUser({ user }) {
      console.info(`New user created: ${user.email}`);
    },
  },
};
