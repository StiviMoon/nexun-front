"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/utils/firabase";

const getInitials = (displayName?: string | null, email?: string | null) => {
  if (displayName) {
    const names = displayName.trim().split(" ").filter(Boolean);

    if (names.length >= 2) {
      return `${names[0][0] ?? ""}${names[1][0] ?? ""}`.toUpperCase();
    }

    if (names.length === 1) {
      return names[0][0]?.toUpperCase() ?? "N";
    }
  }

  if (email) {
    return email[0]?.toUpperCase() ?? "N";
  }

  return "N";
};

const DashboardPage = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    setErrorMessage("");

    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      setErrorMessage("No fue posible cerrar sesión. Inténtalo de nuevo.");
    }
  };

  const formattedLastSignIn = useMemo(() => {
    if (!currentUser?.metadata.lastSignInTime) {
      return "";
    }

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(currentUser.metadata.lastSignInTime));
  }, [currentUser?.metadata.lastSignInTime]);

  const formattedCreationTime = useMemo(() => {
    if (!currentUser?.metadata.creationTime) {
      return "";
    }

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium"
    }).format(new Date(currentUser.metadata.creationTime));
  }, [currentUser?.metadata.creationTime]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-neutral-950">
        <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-400 dark:bg-neutral-500" />
          Cargando tu panel...
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  const initials = getInitials(currentUser.displayName, currentUser.email);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-neutral-950">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-20" />
      <section className="relative z-10 w-full max-w-4xl space-y-8 rounded-3xl border border-neutral-200 bg-white/90 p-10 shadow-lg backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
        <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
              Panel personal
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Hola, {currentUser.displayName ?? "bienvenido"} 👋
            </h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Este es tu punto de partida para gestionar tu cuenta y próximas actividades.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:focus-visible:ring-neutral-100/15"
            type="button"
            onClick={handleSignOut}
            aria-label="Cerrar sesión"
          >
            Cerrar sesión
          </button>
        </header>

        {errorMessage ? (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400"
            role="alert"
            aria-live="assertive"
          >
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-6 md:grid-cols-[280px,1fr]">
          <article className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-2xl font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {currentUser.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName ?? "Foto de perfil"}
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                initials
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {currentUser.displayName ?? "Usuario sin nombre"}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {currentUser.email}
            </p>
            <div className="mt-6 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
                Miembro desde
              </p>
              <p className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {formattedCreationTime || "Fecha no disponible"}
              </p>
            </div>
          </article>

          <article className="space-y-6 rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Detalles de la cuenta
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Información relevante sobre tu perfil y último acceso.
              </p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <dt className="text-xs uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
                  Correo principal
                </dt>
                <dd className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {currentUser.email ?? "No disponible"}
                </dd>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <dt className="text-xs uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
                  Último acceso
                </dt>
                <dd className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formattedLastSignIn || "No disponible"}
                </dd>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <dt className="text-xs uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
                  ID de usuario
                </dt>
                <dd className="mt-2 text-sm font-medium text-neutral-900 break-all dark:text-neutral-100">
                  {currentUser.uid}
                </dd>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <dt className="text-xs uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
                  Proveedores conectados
                </dt>
                <dd className="mt-2 flex flex-wrap gap-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {currentUser.providerData.length > 0
                    ? currentUser.providerData.map((provider) => (
                        <span
                          className="rounded-lg bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
                          key={provider.providerId}
                        >
                          {provider.providerId.replace(".com", "")}
                        </span>
                      ))
                    : "No disponible"}
                </dd>
              </div>
            </dl>

            <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              Próximamente podrás ver métricas y accesos directos personalizados aquí.
            </div>
          </article>
        </section>
      </section>
    </main>
  );
};

export default DashboardPage;