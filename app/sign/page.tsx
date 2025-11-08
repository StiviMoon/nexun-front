"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/utils/firabase";

type PasswordRequirement = {
  regex: RegExp;
  text: string;
};

const passwordRequirements: PasswordRequirement[] = [
  { regex: /.{8,}/, text: "Al menos 8 caracteres" },
  { regex: /[A-Z]/, text: "Una letra mayúscula" },
  { regex: /[a-z]/, text: "Una letra minúscula" },
  { regex: /[0-9]/, text: "Un número" },
  { regex: /[^A-Za-z0-9]/, text: "Un carácter especial" },
];

const getReadableError = (code: string) => {
  if (code === "auth/email-already-in-use") {
    return "Este correo ya está registrado.";
  }

  if (code === "auth/weak-password") {
    return "La contraseña debe tener al menos 6 caracteres.";
  }

  if (code === "auth/invalid-email") {
    return "El correo electrónico no es válido.";
  }

  return "No fue posible crear la cuenta. Inténtalo nuevamente.";
};

const checkPasswordStrength = (password: string) => {
  return passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.regex.test(password),
  }));
};

const RegisterPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const passwordStrength = useMemo(
    () => checkPasswordStrength(formData.password),
    [formData.password]
  );

  const passwordsMatch = useMemo(() => {
    if (!formData.password || !formData.confirmPassword) {
      return false;
    }

    return formData.password === formData.confirmPassword;
  }, [formData.confirmPassword, formData.password]);

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) {
      return true;
    }

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return true;
    }

    return false;
  }, [
    formData.confirmPassword,
    formData.email,
    formData.name,
    formData.password,
    isSubmitting,
  ]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage("Completa todos los campos requeridos.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      if (formData.name.trim()) {
        await updateProfile(userCredential.user, {
          displayName: formData.name.trim(),
        });
      }

      router.push("/dashboard");
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error) {
        setErrorMessage(getReadableError(String(error.code)));
        return;
      }

      setErrorMessage("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting || isGoogleSubmitting) {
      return;
    }

    setErrorMessage("");
    setIsGoogleSubmitting(true);

    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error) {
        setErrorMessage("No fue posible continuar con Google.");
        return;
      }

      setErrorMessage("Ocurrió un error inesperado.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-neutral-950">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-20" />

      <div className="relative z-10 w-full max-w-3xl px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white/90 p-10 shadow-lg backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-md dark:bg-neutral-100 dark:text-neutral-900">
              <span className="text-2xl font-bold">N</span>
            </div>
            <h1 className="mb-2 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
              Crea tu cuenta en Nexun
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Registra tu espacio en segundos y comienza a organizar videoconferencias seguras.
            </p>
          </div>

          {errorMessage ? (
            <p
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
              role="alert"
              aria-live="assertive"
            >
              {errorMessage}
            </p>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-neutral-600 dark:text-neutral-300"
                  htmlFor="name"
                >
                  Nombre completo
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                  </div>
                  <input
                    id="name"
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-100/20"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    autoComplete="name"
                    required
                    aria-label="Nombre completo"
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-neutral-600 dark:text-neutral-300"
                  htmlFor="email"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-100/20"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    required
                    aria-label="Correo electrónico"
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-neutral-600 dark:text-neutral-300"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-12 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-100/20"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    aria-label="Contraseña"
                  />
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword((previous) => !previous)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {formData.password ? (
                  <div className="mt-2 space-y-1">
                    {passwordStrength.map((requirement) => (
                      <div
                        className="flex items-center gap-2 text-xs"
                        key={requirement.text}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full ${
                            requirement.met ? "bg-green-500" : "bg-neutral-400"
                          }`}
                        >
                          {requirement.met ? (
                            <Check className="h-3 w-3 text-white" aria-hidden="true" />
                          ) : null}
                        </span>
                        <span
                          className={
                            requirement.met ? "text-green-600" : "text-neutral-500"
                          }
                        >
                          {requirement.text}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-neutral-600 dark:text-neutral-300"
                  htmlFor="confirmPassword"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                  </div>
                  <input
                    id="confirmPassword"
                    className={`w-full rounded-xl border bg-white py-3 pl-10 pr-12 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-100/20 ${
                      formData.confirmPassword
                        ? passwordsMatch
                          ? "border-green-500"
                          : "border-red-500"
                        : "border-neutral-200 dark:border-neutral-700"
                    }`}
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    aria-label="Confirmar contraseña"
                  />
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar confirmación de contraseña"
                        : "Mostrar confirmación de contraseña"
                    }
                    onClick={() => setShowConfirmPassword((previous) => !previous)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword ? (
                  <p
                    className={`mt-1 text-xs ${
                      passwordsMatch ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {passwordsMatch
                      ? "✓ Las contraseñas coinciden"
                      : "✗ Las contraseñas no coinciden"}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/20 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:text-neutral-200 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-neutral-100/20"
              type="submit"
              disabled={isSubmitDisabled}
              aria-disabled={isSubmitDisabled}
              aria-busy={isSubmitting}
              aria-label="Crear cuenta"
            >
              {isSubmitting ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Crear Cuenta</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
      </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-neutral-400 dark:bg-neutral-900/80 dark:text-neutral-500">
                O regístrate con
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
              aria-disabled={isGoogleSubmitting || isSubmitting}
              aria-busy={isGoogleSubmitting}
              aria-label="Registrarse con Google"
            >
              {isGoogleSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
            </button>
            <button
              className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 opacity-70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              type="button"
              aria-disabled="true"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
              </svg>
              GitHub
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            ¿Ya tienes una cuenta?{" "}
            <Link
              className="font-medium text-blue-400 transition-colors hover:text-blue-300"
              href="/login"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

