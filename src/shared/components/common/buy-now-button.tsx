"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiClient } from "@/core/api/api.client";
import { useSession } from "@/core/auth/auth.client";
import { Button } from "@/shared/components/ui/button";
import { PATH } from "@/shared/config/routes";
import { getOrGenerateSessionId } from "@/shared/utils/lib/sessionId";
import { cn } from "@/shared/utils/lib/utils";

type BuyNowButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variantId: string;
};

export function BuyNowButton({ variantId, className, disabled, ...props }: BuyNowButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const utils = apiClient.useUtils();
  const sessionId = typeof window !== "undefined" ? getOrGenerateSessionId() : undefined;

  const addMutation = apiClient.cart.add.useMutation({
    onSuccess: async (res) => {
      if (res.status === "success") {
        await Promise.all([utils.cart.get.invalidate(), utils.cart.getTotals.invalidate()]);
        router.push(PATH.CHECKOUT.ROOT);
        return;
      }
      toast.error(res.message || "Failed to add to cart");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      disabled={disabled || addMutation.isPending}
      className={cn("shrink-0", className)}
      onClick={() =>
        addMutation.mutate({
          body: { variantId, quantity: 1, sessionId: session?.user?.id ? undefined : sessionId },
        })
      }
      {...props}
    >
      {addMutation.isPending ? "Please wait…" : "Buy Now"}
    </Button>
  );
}
