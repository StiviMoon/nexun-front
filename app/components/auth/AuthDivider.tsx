/**
 * ===========================================
 * AUTH DIVIDER COMPONENT
 * ===========================================
 *
 * A visual divider component used in authentication pages to separate
 * different sections, such as standard login forms and social login options.
 *
 * Main responsibilities:
 * - Render a horizontal line as a separator.
 * - Optionally display centered text over the line.
 * - Maintain proper styling and spacing to fit within authentication layouts.
 *
 * Props:
 * typedef {Object} AuthDividerProps
 * property {string} [text="O continúa con"] - The text to display at the center of the divider.
 *
 * Usage Notes:
 * - Designed for authentication forms to visually separate sections.
 * - The default text is localized in Spanish but can be overridden.
 * - Uses the shared `Separator` component from the UI library.
 */

"use client";

import { Separator } from "@/components/ui/separator";

type AuthDividerProps = {
  text?: string;
};

const AuthDivider = ({ text = "O continúa con" }: AuthDividerProps) => {
  return (
    <div className="relative">
      <Separator className="bg-border" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs font-medium text-muted-foreground">
        {text}
      </span>
    </div>
  );
};

export default AuthDivider;
