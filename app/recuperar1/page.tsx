'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Mail, Loader2 } from 'lucide-react';

/**
 * RecuperarContrasenaPage component
 *
 * Renders a password recovery page where users can submit their email
 * to receive a password reset link. Handles loading state, success state,
 * and errors during submission.
 *
 * component
 * returns {JSX.Element} The rendered password recovery page
 */
export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handles form submission to send password recovery email.
   *
   * param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual email sending logic
      // await sendPasswordResetEmail(email);
      
      // Simulate delay for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
    } catch (err) {
      setError('Error al enviar el enlace. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full relative">
        {/* Close Button */}
        <Link
          href="/inicio"
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </Link>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Image
            src="/LOGO_SOLO.svg"
            alt="Nexun"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-white font-semibold">NEXUN</span>
        </div>

        {/* Email Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>

        {isSuccess ? (
          // Success State
          <div className="text-center">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-4">
              ¡Enlace enviado!
            </h1>
            <p className="text-zinc-400 text-sm mb-8">
              Revisa tu correo electrónico y sigue las instrucciones para recuperar tu contraseña.
            </p>
            <Link
              href="/inicio"
              className="text-zinc-400 hover:text-white text-sm transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          // Form State
          <>
            {/* Title */}
            <h1 className="text-2xl font-semibold text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-3">
              Recupera tu contraseña
            </h1>

            {/* Description */}
            <p className="text-zinc-400 text-sm text-center mb-8">
              Ingresa tu correo electrónico para obtener un enlace de recuperación de contraseña
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-zinc-400 text-sm">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    required
                    className="
                      w-full bg-zinc-900 border border-zinc-700 rounded-xl
                      pl-12 pr-4 py-3.5
                      text-white text-sm placeholder-zinc-500
                      focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40
                      transition-all
                    "
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email}
                className="
                  w-full py-3.5 rounded-xl
                  bg-gradient-to-r from-cyan-500 to-purple-600
                  text-white font-medium
                  hover:from-cyan-400 hover:to-purple-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all
                  flex items-center justify-center gap-2
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar enlace'
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-zinc-800" />
                <Link
                  href="/inicio"
                  className="text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  Volver al inicio
                </Link>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
