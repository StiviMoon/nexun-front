"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import AuthCard from "@/app/components/auth/AuthCard";
import AuthShell from "@/app/components/auth/AuthShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth, useAuthAction } from "@/app/hooks/useAuth";
import { LoginFormSchema } from "@/types/forms";

const LoginPage = () => {
  const router = useRouter();
  const { authErrors, isEmailSignInLoading, isGoogleLoading } = useAuth();

  const signInWithEmailPassword = useAuthAction((state) => state.signInWithEmailPassword);
  const signInWithGoogle = useAuthAction((state) => state.signInWithGoogle);
  const setAuthError = useAuthAction((state) => state.setAuthError);
  const clearAuthError = useAuthAction((state) => state.clearAuthError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearAuthError("signIn");
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearAuthError("signIn");
    setPassword(event.target.value);
  };

  useEffect(() => {
    clearAuthError("signIn");
    clearAuthError("google");
  }, [clearAuthError]);

  const isSubmitDisabled = useMemo(() => {
    if (isEmailSignInLoading || isGoogleLoading) {
      return true;
    }

    const validation = LoginFormSchema.safeParse({ email, password });
    return !validation.success;
  }, [email, isEmailSignInLoading, isGoogleLoading, password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isEmailSignInLoading || isGoogleLoading) {
      return;
    }

    const validationResult = LoginFormSchema.safeParse({ email, password });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      setAuthError("signIn", firstIssue?.message ?? "Revisa los datos ingresados.");
      return;
    }

    try {
      await signInWithEmailPassword(validationResult.data.email, validationResult.data.password);
      router.push("/dashboard");
    } catch {
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isEmailSignInLoading) {
      return;
    }

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch {
    }
  };

  return (
    <AuthShell>
      <AuthCard
        title="Bienvenido a Nexun"
        description="Inicia sesión para acceder a tus reuniones y espacios guardados."
      >
        {authErrors.signIn || authErrors.google ? (
          <Alert variant="destructive" className="rounded-xl border border-destructive/40 bg-destructive/10">
            <AlertCircle className="text-destructive" />
            <AlertDescription className="text-sm text-destructive/90">
              {authErrors.signIn ?? authErrors.google}
            </AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="nombre@empresa.com"
                  autoComplete="email"
                  required
                  aria-label="Correo electrónico"
                  className="h-12 rounded-xl border-input bg-background pl-11 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  aria-label="Contraseña"
                  className="h-12 rounded-xl border-input bg-background pl-11 pr-12 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((previous) => !previous)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            aria-disabled={isSubmitDisabled}
            aria-busy={isEmailSignInLoading}
            aria-label="Iniciar sesión"
            className="h-12 w-full rounded-xl text-sm font-semibold"
          >
            {isEmailSignInLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <span>Iniciar sesión</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>

        <div className="relative">
          <Separator className="bg-border" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs font-medium text-muted-foreground">
            O continúa con
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isEmailSignInLoading}
            aria-disabled={isGoogleLoading || isEmailSignInLoading}
            aria-busy={isGoogleLoading}
            aria-label="Continuar con Google"
            className="h-11 rounded-xl text-sm font-medium"
          >
            {isGoogleLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-transparent" />
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            aria-disabled="true"
            className="h-11 rounded-xl text-sm font-medium opacity-70"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
            </svg>
            GitHub
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/sign">
            Regístrate aquí
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
};

export default LoginPage;
