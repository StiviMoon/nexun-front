/**
 * ===========================================
 * USER STATUS COMPONENT
 * ===========================================
 *
 * Displays a visual indicator of the user's current connection state
 * in the chat application. Handles three distinct statuses:
 * connecting, online (connected), and offline (disconnected).
 *
 * Main responsibilities:
 * - Show a small circular indicator with color corresponding to the status.
 * - Display a textual label describing the status.
 * - Support additional CSS classes via the `className` prop for flexible styling.
 *
 * Props:
 * typedef {Object} UserStatusProps
 * property {boolean} isConnected - True if the user is currently connected.
 * property {boolean} isConnecting - True if the user is in the process of connecting.
 * property {string} [className] - Optional additional classes to customize the container.
 *
 * Behavior:
 * - If `isConnecting` is true, a pulsing muted dot appears with label "Connecting".
 * - If `isConnected` is true, a solid green dot appears with label "Online".
 * - Otherwise, a muted gray dot appears with label "Offline".
 *
 * Accessibility & UX Notes:
 * - Designed to be visually compact (dot + text) for display in headers, room lists, or user profiles.
 * - Uses color and motion (pulse) to indicate dynamic states.
 */
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

