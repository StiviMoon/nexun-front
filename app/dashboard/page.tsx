"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth, useAuthAction } from "@/app/hooks/useAuth";
import Image from "next/image";

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
  const { currentUser, isAuthInitializing, authErrors, isSignOutLoading } = useAuth();

  const signOutUser = useAuthAction((state) => state.signOutUser);
  const clearAuthError = useAuthAction((state) => state.clearAuthError);

  useEffect(() => {
    clearAuthError("signOut");
  }, [clearAuthError]);

  useEffect(() => {
    if (!isAuthInitializing && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, isAuthInitializing, router]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.replace("/login");
    } catch {
    }
  };

  if (isAuthInitializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 dark:bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
          Cargando tu panel...
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  const formattedLastSignIn = currentUser.metadata.lastSignInTime
    ? new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(currentUser.metadata.lastSignInTime))
    : "";

  const formattedCreationTime = currentUser.metadata.creationTime
    ? new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium"
      }).format(new Date(currentUser.metadata.creationTime))
    : "";

  const initials = getInitials(currentUser.displayName, currentUser.email);

  return (
    <main className="relative min-h-screen bg-muted/20 px-4 py-16 dark:bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-20" />
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Card className="border-border/60 bg-background/95 shadow-xl backdrop-blur">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <CardDescription className="uppercase tracking-[0.3em] text-muted-foreground">
                Panel personal
              </CardDescription>
              <CardTitle className="text-3xl font-semibold">
                Hola, {currentUser.displayName ?? "bienvenido"} 👋
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Este es tu punto de partida para gestionar tu cuenta y próximas actividades.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-6"
              onClick={handleSignOut}
              aria-label="Cerrar sesión"
              aria-busy={isSignOutLoading}
              disabled={isSignOutLoading}
            >
              {isSignOutLoading ? "Cerrando sesión..." : "Cerrar sesión"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {authErrors.signOut ? (
              <Alert variant="destructive" className="rounded-xl border border-destructive/40 bg-destructive/10">
                <AlertDescription>{authErrors.signOut}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-6 md:grid-cols-[280px,1fr]">
              <Card className="h-full items-center text-center">
                <CardContent className="flex flex-col items-center gap-4 pt-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-foreground">
                    {currentUser.photoURL ? (
                      <Image
                        src={currentUser.photoURL}
                        alt={currentUser.displayName ?? "Foto de perfil"}
                        className="h-full w-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        width={80}
                        height={80}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">{currentUser.displayName ?? "Usuario sin nombre"}</p>
                    <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  </div>
                  <Separator />
                  <div className="w-full rounded-xl border border-dashed border-border/60 bg-muted/40 p-4 text-left">
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Miembro desde</p>
                    <p className="mt-2 text-sm font-medium">
                      {formattedCreationTime || "Fecha no disponible"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full bg-background/90">
                <CardHeader>
                  <CardTitle className="text-lg">Detalles de la cuenta</CardTitle>
                  <CardDescription>
                    Información relevante sobre tu perfil y último acceso.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        Correo principal
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {currentUser.email ?? "No disponible"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        Último acceso
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {formattedLastSignIn || "No disponible"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        ID de usuario
                      </p>
                      <p className="mt-2 break-all text-sm font-medium">
                        {currentUser.uid}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        Proveedores conectados
                      </p>
                      <p className="mt-2 flex flex-wrap gap-2 text-sm font-medium">
                        {currentUser.providerData.length > 0
                          ? currentUser.providerData.map((provider) => (
                              <span
                                className="rounded-lg bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                key={provider.providerId}
                              >
                                {provider.providerId.replace(".com", "")}
                              </span>
                            ))
                          : "No disponible"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                    Próximamente podrás ver métricas y accesos directos personalizados aquí.
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default DashboardPage;