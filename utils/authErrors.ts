const signInErrorMessages: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-disabled": "Tu cuenta está deshabilitada. Contacta a soporte.",
  "auth/too-many-requests": "Demasiados intentos fallidos. Inténtalo más tarde.",
  "auth/user-not-found": "No encontramos una cuenta con ese correo."
};

const signUpErrorMessages: Record<string, string> = {
  "auth/email-already-in-use": "Este correo ya está registrado.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email": "El correo electrónico no es válido."
};

export const getReadableSignInError = (code: string) => {
  return signInErrorMessages[code] ?? "No fue posible iniciar sesión. Inténtalo nuevamente.";
};

export const getReadableSignUpError = (code: string) => {
  return signUpErrorMessages[code] ?? "No fue posible crear la cuenta. Inténtalo nuevamente.";
};

