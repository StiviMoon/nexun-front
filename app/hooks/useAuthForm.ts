"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";

type UseAuthFormOptions<T extends z.ZodSchema> = {
  schema: T;
  initialValues: z.infer<T>;
  onSubmit: (values: z.infer<T>) => Promise<void>;
  errorKey: "signIn" | "signUp" | "google";
  isLoading?: boolean;
  otherLoading?: boolean;
};

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

    if (isLoading || otherLoading) {
      return;
    }

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

