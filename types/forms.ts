import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El correo es obligatorio.")
  .email("Ingresa un correo válido.");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Tu nombre es obligatorio.");

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .regex(/[A-Z]/, "Incluye al menos una letra mayúscula." )
  .regex(/[a-z]/, "Incluye al menos una letra minúscula." )
  .regex(/[0-9]/, "Incluye al menos un número." )
  .regex(/[^A-Za-z0-9]/, "Incluye al menos un carácter especial.");

export const LoginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;

const lastNameSchema = z
  .string()
  .trim()
  .min(1, "Tu apellido es obligatorio.");

const ageSchema = z
  .string()
  .min(1, "La edad es obligatoria.")
  .refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 15 && num <= 150;
  }, {
    message: "Debes ser mayor de 14 años y menor de 150 años."
  });

export const RegisterFormSchema = z
  .object({
    firstName: nameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
    age: ageSchema,
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
