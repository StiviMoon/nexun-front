/**
 * ===========================================
 * SOCIAL AUTH BUTTON COMPONENT
 * ===========================================
 *
 * A reusable button component for social authentication providers (e.g., Google, GitHub).
 * It handles loading and disabled states and displays the corresponding provider icon.
 *
 * Main responsibilities:
 * - Render a button for social login providers.
 * - Show the provider's icon and label.
 * - Indicate loading state when authentication is in progress.
 * - Properly handle accessibility attributes (aria-label, aria-disabled, aria-busy).
 *
 * Props:
 * typedef {Object} SocialAuthButtonProps
 * property {"google" | "github"} provider - The social authentication provider.
 * property {() => void} onClick - Callback triggered when the button is clicked.
 * property {boolean} [disabled] - Whether the button is disabled.
   property {boolean} [isLoading] - Whether the button is in a loading state.
 * property {string} [className] - Additional CSS classes for custom styling.
 *
 * Usage Notes:
 * - Supports multiple providers by specifying the `provider` prop.
 * - Can display a spinning loader while waiting for authentication.
 * - Integrates with your existing Button component for consistent styling.
 */
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SocialProvider = "google" | "github";

type SocialAuthButtonProps = {
  provider: SocialProvider;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
};

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" fill="#EA4335" />
  </svg>
);

const GitHubIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
  </svg>
);

const providerConfig = {
  google: {
    label: "Google",
    icon: <GoogleIcon />,
    ariaLabel: "Continue with Google"
  },
  github: {
    label: "GitHub",
    icon: <GitHubIcon />,
    ariaLabel: "Continue with GitHub"
  }
};

const SocialAuthButton = ({ provider, onClick, disabled = false, isLoading = false, className }: SocialAuthButtonProps) => {
  const config = providerConfig[provider];

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={config.ariaLabel}
      className={cn("h-11 rounded-xl text-sm font-medium", className)}
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-transparent" />
      ) : (
        <>
          {config.icon}
          {config.label}
        </>
      )}
    </Button>
  );
};

export default SocialAuthButton;
