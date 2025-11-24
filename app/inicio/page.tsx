"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Globe, Shield, Sparkles, Zap, Menu, X } from "lucide-react";
import Footer from "@/components/ui/Footer";

/**
 * HomePage component
 *
 * Displays the main landing page for the Nexun platform, including:
 * - Responsive navigation bar with mobile menu toggle
 * - Hero section with call-to-action buttons
 * - Feature highlights
 * - Metrics/statistics section
 * - Footer
 *
 * component
 * returns {JSX.Element} The rendered home page
 */
const HomePage = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Navigation bar */}
      <nav className="relative border-b border-border bg-card/90 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
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

          {/* Desktop navigation links */}
          <div className="hidden md:flex items-center gap-3 text-sm font-medium">
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

          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <button
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-purple-400 hover:bg-muted"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-card border-t border-border shadow-lg p-4">
            <div className="mx-auto max-w-6xl px-6">
              <div className="flex flex-col gap-2">
                <Link
                  href="/About"
                  className="block w-full rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted text-left"
                  onClick={() => setMobileOpen(false)}
                >
                  Sobre Nosotros
                </Link>
                <Link
                  href="/login"
                  className="block w-full rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted text-left"
                  onClick={() => setMobileOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/sign"
                  className="btn-shine block w-full text-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="relative z-10">Crear cuenta</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* Hero section */}
        <section className="rounded-3xl border border-border bg-card/90 p-10 shadow-sm backdrop-blur">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Nexun Meet
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              Videoconferencias seguras para equipos modernos
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">
              Conecta a tu organización con enlaces protegidos, salas persistentes y accesos controlados desde un panel limpio y familiar.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                className="btn-shine group inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/60 hover:scale-105"
                href="/sign"
              >
                <span className="relative z-10">Comenzar ahora</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                className="shine-effect inline-flex items-center rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:border-border/60 hover:bg-muted"
                href="/login"
              >
                <span className="relative z-10">Ya tengo cuenta</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="mt-16 grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-border/60 text-center">
            <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Seguridad avanzada
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Integraciones con proveedores confiables, controles de acceso y sesión garantizada con Firebase Authentication.
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-border/60 text-center">
            <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Flujo inmediato
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Login y registro optimizados con grillas claras y acceso rápido a tu panel operativo.
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-border/60 text-center">
            <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Globe className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Experiencia global
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Accede desde cualquier dispositivo con un look consistente entre landing, login y dashboard.
            </p>
          </article>
        </section>

        {/* Metrics section */}
        <section className="mt-16 grid gap-6 text-center sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-3xl font-semibold text-foreground">99.99%</div>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Disponibilidad
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Respaldo en tiempo real y redundancia global.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-3xl font-semibold text-foreground">2M+</div>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Usuarios activos
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Organizaciones que confían en la infraestructura Nexun.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-3xl font-semibold text-foreground">&lt;100ms</div>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Tiempo de respuesta
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Inicio de sesión sin fricción en cualquier región.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
