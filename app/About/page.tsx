/**
 * #documentacion
 * SobreNexunPage Component
 *
 * This page renders the "About Nexun" section, including:
 * - A navigation bar with links to About, Login, and Sign Up pages.
 * - The main informational components: `SobreNexun` and `EquipoDesarrollo`.
 * - A footer displayed at the bottom of the page.
 *
 * Layout details:
 * The components are positioned using utility classes to create spacing effects
 * and background structure, ensuring a clean visual presentation.
 *
 * component
 * returns {JSX.Element} The rendered page containing Nexun's information sections.
 */

import SobreNexun from '@/components/ui/AboutUs/SobreNex';
import EquipoDesarrollo from '@/components/ui/AboutUs/teamNex';
import Footer from '@/components/ui/Footer';
import Image from 'next/image';
import Link from 'next/link';

export default function SobreNexunPage() {
  return (
    <>
      <nav className="border-b border-border bg-card/90 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl">
              <Image
                src="/logo.svg"
                alt="Nexun Logo"
                width={80}
                height={80}
                className="h-20 w-20"
                priority
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-medium">
            <Link
              className="shine-effect rounded-xl px-4 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              href="/About"
            >
              <span className="relative z-10">Sobre Nosotros</span>
            </Link>
            <Link
              className="shine-effect rounded-xl px-4 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              href="/login"
            >
              <span className="relative z-10">Iniciar sesión</span>
            </Link>
            <Link
              className="btn-shine group relative rounded-xl px-6 py-2.5 font-semibold text-white shadow-lg shadow-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/60 hover:scale-105"
              href="/sign"
            >
              <span className="relative z-10">Crear cuenta</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="bg-background min-h-screen flex flex-col items-stretch justify-center gap-6 p-6">
        <div className="-mt-40">
          <SobreNexun />
        </div>
        <div className="-mt-60">
          <EquipoDesarrollo />
        </div>
        <Footer />
      </div>
    </>
  );
}
