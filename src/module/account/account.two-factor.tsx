"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import z from "zod/v3";
import { twoFactor } from "@/core/auth/auth.client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/common/form";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

const twoFactorAuthSchema = z.object({
  password: z.string().min(1),
});

type TwoFactorAuthForm = z.infer<typeof twoFactorAuthSchema>;
type TwoFactorData = {
  totpURI: string;
  backupCodes: string[];
};

export function TwoFactorAuthForm({ isEnabled }: { isEnabled: boolean }) {
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null);
  const router = useRouter();
  const form = useForm<TwoFactorAuthForm>({
    resolver: zodResolver(twoFactorAuthSchema),
    defaultValues: { password: "" },
  });

  const { isSubmitting } = form.formState;

  async function handleDisableTwoFactorAuth(data: TwoFactorAuthForm) {
    await twoFactor.disable(
      {
        password: data.password,
      },
      {
        onError: (error: { error: { message: string } }) => {
          toast.error(error.error.message || "Failed to disable 2FA");
        },
        onSuccess: () => {
          form.reset();
          router.refresh();
        },
      },
    );
  }

  async function handleEnableTwoFactorAuth(data: TwoFactorAuthForm) {
    const result = await twoFactor.enable({
      password: data.password,
    });

    if (result.error) {
      toast.error(result.error.message || "Failed to enable 2FA");
    }
    if (result.data?.method === "totp") {
      setTwoFactorData({
        totpURI: result.data.totpURI,
        backupCodes: result.data.backupCodes,
      });
    }
    form.reset();
  }

  if (twoFactorData != null) {
    return (
      <QRCodeVerify
        {...twoFactorData}
        onDone={() => {
          setTwoFactorData(null);
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={void form.handleSubmit(isEnabled ? handleDisableTwoFactorAuth : handleEnableTwoFactorAuth)}
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          variant={isEnabled ? "destructive" : "default"}
        >
          {isSubmitting ? "Loading..." : isEnabled ? "Disable 2FA" : "Enable 2FA"}
        </Button>
      </form>
    </Form>
  );
}

const qrSchema = z.object({
  token: z.string().length(6),
});

type QrForm = z.infer<typeof qrSchema>;

function QRCodeVerify({ totpURI, backupCodes, onDone }: TwoFactorData & { onDone: () => void }) {
  const [successfullyEnabled, setSuccessfullyEnabled] = useState(false);
  const router = useRouter();
  const form = useForm<QrForm>({
    resolver: zodResolver(qrSchema),
    defaultValues: { token: "" },
  });

  const { isSubmitting } = form.formState;

  async function handleQrCode(data: QrForm) {
    await twoFactor.verifyTotp(
      {
        code: data.token,
      },
      {
        onError: (error: { error: { message: string } }) => {
          toast.error(error.error.message || "Failed to verify code");
        },
        onSuccess: () => {
          setSuccessfullyEnabled(true);
          router.refresh();
        },
      },
    );
  }

  if (successfullyEnabled) {
    return (
      <>
        <p className="text-muted-foreground mb-2 text-sm">
          Save these backup codes in a safe place. You can use them to access your account.
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {backupCodes.map((code, index) => (
            <div key={index} className="font-mono text-sm">
              {code}
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={onDone}>
          Done
        </Button>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Scan this QR code with your authenticator app and enter the code below:</p>

      <Form {...form}>
        <form className="space-y-4" onSubmit={void form.handleSubmit(handleQrCode)}>
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Loading..." : "Submit Code"}
          </Button>
        </form>
      </Form>
      <div className="w-fit bg-white p-4">
        <QRCode size={256} value={totpURI} />
      </div>
    </div>
  );
}
