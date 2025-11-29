"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type AuthLinkProps = {
  href: string;
  text: string;
  linkText: string;
  className?: string;
};

const AuthLink = ({ href, text, linkText, className }: AuthLinkProps) => {
  return (
    <p className={cn("w-full text-center text-sm text-muted-foreground", className)}>
      {text}{" "}
      <Link
        className="font-medium text-white underline-offset-4 transition-colors hover:underline"
        href={href}
      >
        {linkText}
      </Link>
    </p>
  );
};

export default AuthLink;

