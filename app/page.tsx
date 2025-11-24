import { redirect } from "next/navigation";

/**
 * Redirect Page Component
 *
 * This page automatically redirects users to the "/inicio" route.
 *
 * returns {void} Redirects immediately upon render
 */
export default function Page() {
  redirect("/inicio");
}
