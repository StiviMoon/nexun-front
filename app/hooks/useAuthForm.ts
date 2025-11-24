'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";

/**
 * Opciones para inicializar `useAuthForm`.
 *
 * template T - Un esquema Zod que describe los valores del formulario.
 *
 *type UseAuthFormOptions<T extends z.ZodSchema> = {
  Esquema zod para validar el formulario */
  ' schema: T'
  ' Valores iniciales del formulario '
  ' initialValues: z.infer<T>'
  'Función que se ejecuta al enviar el formulario '
  'onSubmit: (values: z.infer<T>) => Promise<void>'
  ' Clave de error asociada: signIn, signUp o google' 
  'errorKey: "signIn" | "signUp" | "google"'
  ' Indica si el formulario está en estado de carga   isLoading?: boolean'
  ' Otra carga externa que bloquea el envío'
  'otherLoading?: boolean'
/**
 * Hook para manejar formularios de autenticación con validación Zod.
 *
 * template T - Esquema Zod del formulario.
 * param {UseAuthFormOptions<T>} options - Configuración del formulario.
 * returns {{
 *   formData: z.infer<T>;
 *   handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
 *   handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
 *   isFormValid: boolean;
 *   isSubmitDisabled: boolean;
 *   setFormData: React.Dispatch<React.SetStateAction<z.infer<T>>>;
 * }}
 */
const useAuthForm = <T extends z.ZodSchema>({
  schema,
  initialValues,
  onSubmit,
  errorKey,
  isLoading = false,
  otherLoading = false
}: UseAuthFormOptions<T>) => {
  const [formData, setFormData] = useState<z.infer<T>>(initialValues);
  const { setAuthError, clearAuthError } = useAuthWithQuery();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    clearAuthError(errorKey);
    setFormData((previous) => ({
      ...(previous as Record<string, unknown>),
      [name]: value
    } as z.infer<T>));
  };

  const isFormValid = useMemo(() => {
    const validation = schema.safeParse(formData);
    return validation.success;
  }, [formData, schema]);

  const isSubmitDisabled = useMemo(() => {
    if (isLoading || otherLoading) {
      return true;
    }
    return !isFormValid;
  }, [isLoading, otherLoading, isFormValid]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading || otherLoading) return;

    const validationResult = schema.safeParse(formData);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      setAuthError(errorKey, firstIssue?.message ?? "Revisa los datos ingresados.");
      return;
    }

    try {
      await onSubmit(validationResult.data);
    } catch (error) {
      // Error handling is done in the auth store
    }
  };

  return {
    formData,
    handleChange,
    handleSubmit,
    isFormValid,
    isSubmitDisabled,
    setFormData
  };
};

export default useAuthForm;
