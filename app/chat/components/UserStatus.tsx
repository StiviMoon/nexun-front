"use client";

import { cn } from "@/lib/utils";

interface UserStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  className?: string;
}

export const UserStatus = ({ isConnected, isConnecting, className }: UserStatusProps) => {
  if (isConnecting) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
        <span className="text-[10px] text-muted-foreground/60">Conectando</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span className="text-[10px] text-muted-foreground/60">En línea</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
      <span className="text-[10px] text-muted-foreground/60">Desconectado</span>
    </div>
  );
};
