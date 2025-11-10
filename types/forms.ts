import { z } from "zod";

const emailSchema = z
  .string({ required_error: "El correo es obligatorio." })
  .trim()
  .toLowerCase()
  .email("Ingresa un correo válido.");

const nameSchema = z
  .string({ required_error: "Tu nombre es obligatorio." })
  .trim()
  .min(1, "Tu nombre es obligatorio.");

const passwordSchema = z
  .string({ required_error: "La contraseña es obligatoria." })
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .regex(/[A-Z]/, "Incluye al menos una letra mayúscula." )
  .regex(/[a-z]/, "Incluye al menos una letra minúscula." )
  .regex(/[0-9]/, "Incluye al menos un número." )
  .regex(/[^A-Za-z0-9]/, "Incluye al menos un carácter especial.");

export const LoginFormSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "La contraseña es obligatoria." })
    .min(1, "Ingresa tu contraseña."),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;

export const RegisterFormSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z
      .string({ required_error: "Confirma tu contraseña." })
      .min(1, "Confirma tu contraseña."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export type PasswordRequirement = {
  regex: RegExp;
  text: string;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { regex: /.{8,}/, text: "Al menos 8 caracteres" },
  { regex: /[A-Z]/, text: "Una letra mayúscula" },
  { regex: /[a-z]/, text: "Una letra minúscula" },
  { regex: /[0-9]/, text: "Un número" },
  { regex: /[^A-Za-z0-9]/, text: "Un carácter especial" },
];
