"use client";

import { Ban, Calendar, Mail, Shield, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";

interface UserProfileProps {
  user?: {
    name?: string;
    email?: string;
    emailVerified?: boolean;
    image?: string | null;
    createdAt?: Date;
    twoFactorEnabled?: boolean;
    role?: string;
    banned?: boolean;
    banReason?: string | null;
  };
}

export function ProfileCard({ user }: UserProfileProps) {
  const name = user?.name ?? "Anonymous User";
  const email = user?.email ?? "No email provided";
  const avatar = user?.image ?? "/fallback.png";
  const created = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown date";
  const verified = user?.emailVerified;
  const role = user?.role ?? "customer";
  const banned = user?.banned ?? false;
  const reason = user?.banReason ?? "No reason provided";

  return (
    <Card>
      <CardHeader>
        <div className="border-border relative h-20 w-20 overflow-hidden rounded-full border">
          <Image src={avatar} alt={`${name}'s avatar`} fill sizes="80px" className="object-cover" />
        </div>
        <CardTitle className="text-lg font-semibold">{name}</CardTitle>
        <CardDescription className="text-muted-foreground flex items-center gap-2 text-sm">
          <Mail size={14} /> {email}
        </CardDescription>
      </CardHeader>
      <Separator />

      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Type</span>
          <Badge variant="secondary" className="capitalize">
            {role}
          </Badge>
        </div>
        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Email Verified</span>
          <Badge variant={verified ? "default" : "destructive"}>{verified ? "Yes" : "No"}</Badge>
        </div>
        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">2FA</span>
          <Badge variant={user?.twoFactorEnabled ? "default" : "secondary"}>
            {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar size={14} /> Joined
          </span>
          <span>{created}</span>
        </div>
        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar size={14} /> Status
          </span>
          <div className="flex justify-start">
            {banned ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Shield size={14} /> Access Restricted
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <UserIcon size={14} /> Active User
              </Badge>
            )}
          </div>
        </div>
        <Separator />
        {banned && (
          <div className="border-destructive/40 bg-destructive/10 flex items-start gap-2 rounded-md border p-3">
            <Ban size={16} className="text-destructive shrink-0" />
            <div>
              <p className="text-destructive text-sm font-medium">Banned</p>
              <p className="text-muted-foreground text-xs">{reason}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
