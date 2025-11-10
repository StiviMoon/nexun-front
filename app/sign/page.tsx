"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import AuthCard from "@/app/components/auth/AuthCard";
import AuthShell from "@/app/components/auth/AuthShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth, useAuthAction } from "@/app/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PASSWORD_REQUIREMENTS, RegisterFormSchema } from "@/types/forms";

const RegisterPage = () => {
  const router = useRouter();
  const { authErrors, isEmailSignUpLoading, isGoogleLoading } = useAuth();

  const registerWithEmailPassword = useAuthAction((state) => state.registerWithEmailPassword);
  const signInWithGoogle = useAuthAction((state) => state.signInWithGoogle);
  const setAuthError = useAuthAction((state) => state.setAuthError);
  const clearAuthError = useAuthAction((state) => state.clearAuthError);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    clearAuthError("signUp");
    clearAuthError("google");
  }, [clearAuthError]);

  const passwordStrength = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map((requirement) => ({
      ...requirement,
      met: requirement.regex.test(formData.password)
    }));
  }, [formData.password]);

  const passwordsMatch = useMemo(() => {
    if (!formData.password || !formData.confirmPassword) {
      return false;
    }

    return formData.password === formData.confirmPassword;
  }, [formData.confirmPassword, formData.password]);

  const isSubmitDisabled = useMemo(() => {
    if (isEmailSignUpLoading || isGoogleLoading) {
      return true;
    }

    const validation = RegisterFormSchema.safeParse(formData);
    return !validation.success;
  }, [formData, isEmailSignUpLoading, isGoogleLoading]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    clearAuthError("signUp");
    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isEmailSignUpLoading || isGoogleLoading) {
      return;
    }

    const validationResult = RegisterFormSchema.safeParse(formData);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      setAuthError("signUp", firstIssue?.message ?? "Revisa los datos del formulario.");
      return;
    }

    try {
      const { name, email, password } = validationResult.data;
      await registerWithEmailPassword(name, email, password);
      router.push("/dashboard");
    } catch {
    }
  };

  const handleGoogleSignIn = async () => {
    if (isEmailSignUpLoading || isGoogleLoading) {
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
        title="Crea tu cuenta en Nexun"
        description="Registra tu espacio en segundos y organiza videoconferencias seguras."
      >
        {authErrors.signUp || authErrors.google ? (
          <Alert variant="destructive" className="rounded-xl border border-destructive/40 bg-destructive/10">
            <AlertCircle className="text-destructive" aria-hidden="true" />
            <AlertDescription className="text-sm text-destructive/90">
              {authErrors.signUp ?? authErrors.google}
            </AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                Nombre completo
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                  aria-label="Nombre completo"
                  className="h-12 rounded-xl border-input bg-background pl-11 text-sm"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
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

              {formData.password ? (
                <div className="space-y-1 rounded-lg border border-input bg-muted/30 p-3 text-xs">
                  {passwordStrength.map((requirement) => (
                    <div className="flex items-center gap-2" key={requirement.text}>
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full",
                          requirement.met ? "bg-emerald-500 text-emerald-100" : "bg-border text-muted-foreground"
                        )}
                      >
                        {requirement.met ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
                      </span>
                      <span className={requirement.met ? "text-emerald-600" : "text-muted-foreground"}>
                        {requirement.text}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  aria-label="Confirmar contraseña"
                  className={cn(
                    "h-12 rounded-xl border-input bg-background pl-11 pr-12 text-sm",
                    formData.confirmPassword
                      ? passwordsMatch
                        ? "border-emerald-500"
                        : "border-destructive"
                      : ""
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted"
                  aria-label={
                    showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"
                  }
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </div>
              {formData.confirmPassword ? (
                <p className={cn("text-xs font-medium", passwordsMatch ? "text-emerald-600" : "text-destructive")}
                >
                  {passwordsMatch ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
                </p>
              ) : null}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            aria-disabled={isSubmitDisabled}
            aria-busy={isEmailSignUpLoading}
            aria-label="Crear cuenta"
            className="h-12 w-full rounded-xl text-sm font-semibold"
          >
            {isEmailSignUpLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <span>Crear cuenta</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>

        <div className="relative">
          <Separator className="bg-border" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs font-medium text-muted-foreground">
            O regístrate con
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isEmailSignUpLoading}
            aria-disabled={isGoogleLoading || isEmailSignUpLoading}
            aria-busy={isGoogleLoading}
            aria-label="Registrarse con Google"
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

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/login">
            Inicia sesión
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
};

export default RegisterPage;

