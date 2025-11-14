"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import AuthCard from "@/app/components/auth/AuthCard";
import AuthShell from "@/app/components/auth/AuthShell";
import FormField from "@/app/components/auth/FormField";
import PasswordField from "@/app/components/auth/PasswordField";
import SocialAuthButton from "@/app/components/auth/SocialAuthButton";
import ErrorAlert from "@/app/components/auth/ErrorAlert";
import AuthDivider from "@/app/components/auth/AuthDivider";
import SubmitButton from "@/app/components/auth/SubmitButton";
import AuthLink from "@/app/components/auth/AuthLink";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";
import useAuthForm from "@/app/hooks/useAuthForm";
import useSocialAuth from "@/app/hooks/useSocialAuth";
import { LoginFormSchema } from "@/types/forms";

const LoginPage = () => {
  const router = useRouter();
  const { 
    authErrors, 
    isEmailSignInLoading, 
    isGoogleLoading,
    signInWithEmailPassword,
    clearAuthError,
    isLoginPending,
    isGoogleAuthPending
  } = useAuthWithQuery();

  const { formData, handleChange, handleSubmit, isSubmitDisabled } = useAuthForm({
    schema: LoginFormSchema,
    initialValues: {
      email: "",
      password: ""
    },
    onSubmit: async (values) => {
      await signInWithEmailPassword(values.email, values.password);
      router.push("/dashboard");
    },
    errorKey: "signIn",
    isLoading: isEmailSignInLoading || isLoginPending,
    otherLoading: isGoogleLoading || isGoogleAuthPending
  });

  const { handleGoogleSignIn } = useSocialAuth({
    isLoading: isGoogleLoading || isGoogleAuthPending,
    otherLoading: isEmailSignInLoading || isLoginPending
  });

  useEffect(() => {
    clearAuthError("signIn");
    clearAuthError("google");
  }, [clearAuthError]);

  const errorMessage = authErrors.signIn ?? authErrors.google;

  return (
    <AuthShell>
      <AuthCard
        title="Bienvenido a Nexun"
        description="Inicia sesión para acceder a tus reuniones y espacios guardados."
      >
        <ErrorAlert message={errorMessage} />

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
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

            <PasswordField
              id="password"
              label="Contraseña"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <SubmitButton
            label="Iniciar sesión"
            isLoading={isEmailSignInLoading || isLoginPending}
            disabled={isSubmitDisabled}
          />
        </form>

        <AuthDivider text="O continúa con" />

        <div className="grid grid-cols-2 gap-3">
          <SocialAuthButton
            provider="google"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isEmailSignInLoading || isGoogleAuthPending || isLoginPending}
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
          href="/sign"
          text="¿No tienes una cuenta?"
          linkText="Regístrate aquí"
        />
      </AuthCard>
    </AuthShell>
  );
};

export default LoginPage;
