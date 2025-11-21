"use client";

import { useEffect } from "react";
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
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";
import { AppLayout } from "@/components/ui/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
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

const PerfilPage = () => {
  const { 
    currentUser, 
    authErrors, 
    isSignOutLoading,
    signOutUser,
    clearAuthError,
    isLogoutPending
  } = useAuthWithQuery();

  useEffect(() => {
    clearAuthError("signOut");
  }, [clearAuthError]);

  if (!currentUser) {
    return null;
  }

  const userName = currentUser.displayName || currentUser.email || "Usuario";

  const formattedLastSignIn = currentUser.updatedAt
    ? new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(currentUser.updatedAt))
    : "";

  const formattedCreationTime = currentUser.createdAt
    ? new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium"
      }).format(new Date(currentUser.createdAt))
    : "";

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-black">
        {/* Header unificado */}
        <PageHeader
          title="Mi Perfil"
          subtitle="Gestiona tu información personal y configuración de cuenta"
        />

        {/* Contenido principal */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Información de la cuenta */}
            <Card className="border border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <CardDescription className="text-xs uppercase tracking-wider text-zinc-400">
                    Información de la cuenta
                  </CardDescription>
                  <CardTitle className="text-2xl font-semibold text-white">
                    Detalles del perfil
                  </CardTitle>
                  <p className="text-sm text-zinc-400">
                    Información relevante sobre tu perfil y actividad en la plataforma
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg px-6 border-zinc-700 hover:bg-zinc-800"
                  onClick={() => signOutUser()}
                  aria-label="Cerrar sesión"
                  aria-busy={isSignOutLoading || isLogoutPending}
                  disabled={isSignOutLoading || isLogoutPending}
                >
                  {isSignOutLoading || isLogoutPending ? "Cerrando sesión..." : "Cerrar sesión"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {authErrors.signOut && (
                  <Alert variant="destructive" className="border-red-500/20 bg-red-500/10">
                    <AlertDescription>{authErrors.signOut}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-[260px,1fr]">
                  {/* Perfil lateral */}
                  <Card className="border-zinc-800/50 bg-zinc-900/30">
                    <CardContent className="flex flex-col items-center gap-4 pt-6">
                      <div className="relative">
                        {currentUser.photoURL ? (
                          <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-zinc-700/50">
                            <Image
                              src={currentUser.photoURL}
                              alt={currentUser.displayName ?? "Foto de perfil"}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              width={96}
                              height={96}
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center ring-2 ring-zinc-700/50 text-3xl font-semibold text-white">
                            {getInitials(currentUser.displayName, currentUser.email)}
                          </div>
                        )}
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-lg font-semibold text-white">
                          {currentUser.displayName ?? "Usuario sin nombre"}
                        </p>
                        <p className="text-sm text-zinc-400 truncate max-w-[240px]">
                          {currentUser.email}
                        </p>
                      </div>
                      <Separator className="bg-zinc-800/50" />
                      <div className="w-full rounded-lg border border-dashed border-zinc-800/50 bg-zinc-900/30 p-3 text-center">
                        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                          Miembro desde
                        </p>
                        <p className="text-sm font-medium text-zinc-300">
                          {formattedCreationTime || "Fecha no disponible"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detalles de la cuenta */}
                  <Card className="border-zinc-800/50 bg-zinc-900/30">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-white">
                        Información de la cuenta
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        Detalles relevantes sobre tu perfil y actividad
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                            Correo principal
                          </p>
                          <p className="text-sm font-medium text-zinc-300 truncate">
                            {currentUser.email ?? "No disponible"}
                          </p>
                        </div>

                        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                            Último acceso
                          </p>
                          <p className="text-sm font-medium text-zinc-300">
                            {formattedLastSignIn || "No disponible"}
                          </p>
                        </div>

                        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3 sm:col-span-2">
                          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                            ID de usuario
                          </p>
                          <p className="text-xs font-mono break-all text-zinc-400">
                            {currentUser.uid}
                          </p>
                        </div>

                        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3 sm:col-span-2">
                          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                            Proveedores conectados
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {currentUser.providerIds.length > 0
                              ? currentUser.providerIds.map((providerId) => (
                                  <span
                                    className="rounded-md border border-zinc-800/50 bg-zinc-950/50 px-2.5 py-1 text-xs font-medium text-zinc-400"
                                    key={providerId}
                                  >
                                    {providerId
                                      .replace(".com", "")
                                      .replace("google.com", "Google")
                                      .replace("password", "Email")}
                                  </span>
                                ))
                              : "No disponible"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PerfilPage;

