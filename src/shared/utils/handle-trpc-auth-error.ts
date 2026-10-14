import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import { signInUrlWithCallback } from "@/shared/utils/auth-callback";

/** User-facing copy when redirecting from a protected URL to sign-in. */
export function authRedirectHint(callbackPath: string): string {
  const path = callbackPath.split("?")[0] ?? callbackPath;
  if (path.startsWith("/account")) {
    return "Sign in to access your account, orders, and saved addresses.";
  }
  if (path.includes("/checkout/pay") || path.includes("/store/checkout/pay")) {
    return "Sign in to complete payment for your order.";
  }
  if (path.includes("/checkout/confirmation") || path.includes("/store/checkout/confirmation")) {
    return "Sign in to view your order confirmation and details.";
  }
  if (path.startsWith("/store/order/")) {
    return "Sign in to view this order and tracking.";
  }
  return "Sign in to continue where you left off.";
}

export function isTrpcUnauthorizedError(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) return false;
  const shape = error.shape as { code?: string } | undefined;
  if (shape?.code === "UNAUTHORIZED") return true;
  const data = error.data as { code?: string } | undefined;
  return data?.code === "UNAUTHORIZED";
}

/**
 * If `error` is a tRPC UNAUTHORIZED, shows a clear toast and sends the user to sign-in with return URL.
 * Call from mutation/query `onError` before generic error toasts.
 * @returns true if the error was handled (caller should skip generic handling)
 */
export function handleTrpcAuthClientError(error: unknown, contextMessage?: string): boolean {
  if (!isTrpcUnauthorizedError(error)) return false;
  if (typeof window === "undefined") return true;

  const pathname = window.location.pathname;
  if (pathname.startsWith("/auth")) return true;

  const msg = contextMessage ?? "Your session ended or you need to sign in. You will be redirected to sign in.";
  toast.error(msg);

  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.assign(signInUrlWithCallback(returnTo));
  return true;
}
