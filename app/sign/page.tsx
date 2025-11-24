'use client';

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

/**
 * RegisterPage component renders the registration form for new users.
 *
 * component
 * returns {JSX.Element} The registration page UI
 */
const RegisterPage = () => {
  const router = useRouter();

  const { 
    authErrors, 
    isEmailSignUpLoading, 
    isGoogleLoading,
    registerWithEmailPassword,
    clearAuthError,
    isRegisterPending,
    isGoogleAuthPending
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

    /**
     * Handles the form submission to register a new user
     * param {Object} values - The form values
     * param {string} values.firstName
     * param {string} values.lastName
     * param {string} values.email
     * param {string} values.password
     * param {string | number} values.age
     * returns {Promise<void>}
     * throws Will throw an error if age is below 15 or above 150
     */
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
    otherLoading: isGoogleLoading || isGoogleAuthPending
  });

  /**
   * Handles changes to the age input field, preventing negative numbers
   * param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (parseInt(value, 10) >= 0 && !isNaN(parseInt(value, 10)))) {
      handleChange(e);
    }
  };

  /**
   * Prevents invalid keys for the age input (negative, e, E, +, .)
   * param {React.KeyboardEvent<HTMLInputElement>} e
   */
  const handleAgeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
      e.preventDefault();
    }
  };

  const { handleGoogleSignIn } = useSocialAuth({
    isLoading: isGoogleLoading || isGoogleAuthPending,
    otherLoading: isEmailSignUpLoading || isRegisterPending
  });

  useEffect(() => {
    clearAuthError("signUp");
    clearAuthError("google");
  }, [clearAuthError]);

  const passwordsMatch = useMemo(() => {
    if (!formData.password || !formData.confirmPassword) return false;
    return formData.password === formData.confirmPassword;
  }, [formData.password, formData.confirmPassword]);

  const errorMessage = authErrors.signUp ?? authErrors.google;

  return (
    <AuthShell>
      <AuthCard
        title="Crea tu cuenta en Nexun"
        description="Registra tu espacio en segundos y organiza videoconferencias seguras."
      >
        <ErrorAlert message={errorMessage} />

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            {/* First Name */}
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

            {/* Last Name */}
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

            {/* Email */}
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

            {/* Age */}
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

            {/* Password */}
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

            {/* Confirm Password */}
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
            disabled={isGoogleLoading || isEmailSignUpLoading || isGoogleAuthPending || isRegisterPending}
            isLoading={isGoogleLoading || isGoogleAuthPending}
          />
          <SocialAuthButton
            provider="github"
            onClick={() => {}}
            disabled
            className="opacity-70"
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
