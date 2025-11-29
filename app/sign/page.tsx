"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Mail, User } from "lucide-react";
import React from "react";
import AuthCard from "@/app/components/auth/AuthCard";
import AuthShell from "@/app/components/auth/AuthShell";
import FormField from "@/app/components/auth/FormField";
import PasswordField from "@/app/components/auth/PasswordField";
import PasswordStrengthIndicator from "@/app/components/auth/PasswordStrengthIndicator";
import SocialAuthButton from "@/app/components/auth/SocialAuthButton";
import ErrorAlert from "@/app/components/auth/ErrorAlert";
import AuthDivider from "@/app/components/auth/AuthDivider";
import SubmitButton from "@/app/components/auth/SubmitButton";
import AuthLink from "@/app/components/auth/AuthLink";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";
import useAuthForm from "@/app/hooks/useAuthForm";
import useSocialAuth from "@/app/hooks/useSocialAuth";
import { cn } from "@/lib/utils";
import { RegisterFormSchema } from "@/types/forms";

const RegisterPage = () => {
  const router = useRouter();
  const { 
    authErrors, 
    isEmailSignUpLoading, 
    isGoogleLoading,
    isGithubLoading,
    registerWithEmailPassword,
    clearAuthError,
    isRegisterPending,
    isGoogleAuthPending,
    isGithubAuthPending
  } = useAuthWithQuery();

  const { formData, handleChange, handleSubmit, isSubmitDisabled } = useAuthForm({
    schema: RegisterFormSchema,
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      age: ""
    },
    onSubmit: async (values) => {
      const { firstName, lastName, email, password, age } = values;
      const ageNumber = typeof age === "string" && age !== "" ? parseInt(age, 10) : (typeof age === "number" ? age : 0);
      if (isNaN(ageNumber) || ageNumber < 15 || ageNumber > 150) {
        throw new Error("Debes ser mayor de 14 años para crear una cuenta");
      }
      await registerWithEmailPassword(firstName, lastName, email, password, ageNumber);
      router.push("/dashboard");
    },
    errorKey: "signUp",
    isLoading: isEmailSignUpLoading || isRegisterPending,
    otherLoading: isGoogleLoading || isGoogleAuthPending || isGithubLoading || isGithubAuthPending
  });

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Prevenir números negativos
    if (value === "" || (parseInt(value, 10) >= 0 && !isNaN(parseInt(value, 10)))) {
      handleChange(e);
    } else if (value.startsWith("-")) {
      // Si intenta escribir un negativo, simplemente no actualizar
      return;
    }
  };

  const handleAgeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevenir que se escriba el signo negativo, 'e', 'E', '+', '.'
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
      e.preventDefault();
    }
  };

  const { handleGoogleSignIn, handleGithubSignIn } = useSocialAuth({
    isGoogleLoading: isGoogleLoading || isGoogleAuthPending,
    isGithubLoading: isGithubLoading || isGithubAuthPending,
    isBlocking: isEmailSignUpLoading || isRegisterPending
  });

  useEffect(() => {
    clearAuthError("signUp");
    clearAuthError("google");
    clearAuthError("github");
  }, [clearAuthError]);

  const passwordsMatch = useMemo(() => {
    if (!formData.password || !formData.confirmPassword) {
      return false;
    }
    return formData.password === formData.confirmPassword;
  }, [formData.password, formData.confirmPassword]);

  const errorMessage = authErrors.signUp ?? authErrors.google ?? authErrors.github;

  return (
    <AuthShell>
      <AuthCard
        title="Crea tu cuenta en Nexun"
        description="Registra tu espacio en segundos y organiza videoconferencias seguras."
      >
        <ErrorAlert message={errorMessage} />

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              id="firstName"
              label="Nombre"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              autoComplete="given-name"
              required
              icon={<User className="h-4 w-4" />}
            />

            <FormField
              id="lastName"
              label="Apellido"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              autoComplete="family-name"
              required
              icon={<User className="h-4 w-4" />}
            />

            <FormField
              id="email"
              label="Correo electrónico"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nombre@empresa.com"
              autoComplete="email"
              required
              icon={<Mail className="h-4 w-4" />}
            />

            <FormField
              id="age"
              label="Edad (mínimo 15 años)"
              type="number"
              name="age"
              value={formData.age}
              onChange={handleAgeChange}
              onKeyDown={handleAgeKeyDown}
              placeholder="25"
              autoComplete="off"
              required
              min="15"
            />

            <div className="space-y-2">
              <PasswordField
                id="password"
                label="Contraseña"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              {formData.password && <PasswordStrengthIndicator password={formData.password} />}
            </div>

            <div className="space-y-2">
              <PasswordField
                id="confirmPassword"
                label="Confirmar contraseña"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
                isValid={formData.confirmPassword ? passwordsMatch : undefined}
              />
              {formData.confirmPassword && (
                <p
                  className={cn(
                    "text-xs font-medium transition-colors",
                    passwordsMatch ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                  )}
                >
                  {passwordsMatch ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
                </p>
              )}
            </div>
          </div>

          <SubmitButton
            label="Crear cuenta"
            isLoading={isEmailSignUpLoading || isRegisterPending}
            disabled={isSubmitDisabled}
          />
        </form>

        <AuthDivider text="O regístrate con" />

        <div className="grid grid-cols-2 gap-3">
          <SocialAuthButton
            provider="google"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isEmailSignUpLoading || isGoogleAuthPending || isRegisterPending || isGithubLoading || isGithubAuthPending}
            isLoading={isGoogleLoading || isGoogleAuthPending}
          />
          <SocialAuthButton
            provider="github"
            onClick={handleGithubSignIn}
            disabled={isGithubLoading || isEmailSignUpLoading || isGithubAuthPending || isRegisterPending || isGoogleLoading || isGoogleAuthPending}
            isLoading={isGithubLoading || isGithubAuthPending}
          />
        </div>

        <AuthLink
          href="/login"
          text="¿Ya tienes una cuenta?"
          linkText="Inicia sesión"
        />
      </AuthCard>
    </AuthShell>
  );
};

export default RegisterPage;
