
"use client";

import Link from "next/link";
import { ArrowRight, Globe, Shield, Sparkles, Zap } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <nav className="border-b border-neutral-200 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/60 dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
              <span className="text-lg font-semibold">N</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Nexun</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link
              className="rounded-xl px-4 py-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              href="/login"
            >
              Iniciar sesión
            </Link>
            <Link
              className="rounded-xl bg-neutral-900 px-4 py-2 text-white shadow-sm transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              href="/sign"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="rounded-3xl border border-neutral-200 bg-white/90 p-10 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
              <Sparkles className="h-4 w-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
              Nexun Meet
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              Videoconferencias seguras para equipos modernos
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
              Conecta a tu organización con enlaces protegidos, salas persistentes y accesos controlados desde un panel limpio y familiar.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                href="/sign"
              >
                <span>Comenzar ahora</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex items-center rounded-xl border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                href="/login"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
              <Shield className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Seguridad avanzada
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Integraciones con proveedores confiables, controles de acceso y sesión garantizada con Firebase Authentication.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
              <Zap className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Flujo inmediato
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Login y registro optimizados con grillas claras y acceso rápido a tu panel operativo.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
              <Globe className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Experiencia global
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Accede desde cualquier dispositivo con un look consistente entre landing, login y dashboard.
            </p>
          </article>
        </section>

        <section className="mt-16 grid gap-6 text-center sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">99.99%</div>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
              Disponibilidad
            </p>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Respaldo en tiempo real y redundancia global.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">2M+</div>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
              Usuarios activos
            </p>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Organizaciones que confían en la infraestructura Nexun.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">&lt;100ms</div>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
              Tiempo de respuesta
            </p>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Inicio de sesión sin fricción en cualquier región.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white/80 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
        © {new Date().getFullYear()} Nexun. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default HomePage;
