"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export function GuestOrderAccessForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <form
      className="mx-auto flex max-w-md flex-col gap-4 rounded-[var(--radius)] border border-border bg-muted/20 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams({ email: email.trim() });
        router.push(`/orders/${orderId}?${params.toString()}` as Route);
      }}
    >
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">View your order</h2>
        <p className="text-muted-foreground text-sm">
          Enter the email you used at checkout, or open the link from your confirmation email.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="guest-order-email">Email</Label>
        <Input
          id="guest-order-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-11"
        />
      </div>
      <Button type="submit" className="min-h-11 w-full">
        Continue
      </Button>
    </form>
  );
}
