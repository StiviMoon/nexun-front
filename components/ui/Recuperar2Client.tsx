"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

export default function Recuperar2Client() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams ? searchParams.get('oobCode') : null;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';
  const isValid = hasMinLength && hasUppercase && hasSpecialChar && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setError('');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/inicio');
      }, 2000);
    } catch (err) {
      setError('Error al cambiar la contraseña. El enlace puede haber expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Image src="/LOGO_SOLO.svg" alt="Nexun" width={32} height={32} className="w-8 h-8" />
          <span className="text-white font-semibold">NEXUN</span>
        </div>

        {isSuccess ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-4">
              ¡Contraseña actualizada!
            </h1>
            <p className="text-zinc-400 text-sm">Redirigiendo al inicio de sesión...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-3">
              Crea una nueva contraseña
            </h1>
            <p className="text-zinc-400 text-sm text-center mb-8">
              Por favor, digite su nueva contraseña, no olvide que estas deben coincidir, contener más de 8 caracteres, una mayúscula y un símbolo especial.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-zinc-400 text-sm">Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-12 py-3.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-zinc-400 text-sm">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-12 py-3.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button type="submit" disabled={isLoading || !isValid} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Cambiando...</>) : ('Cambiar contraseña')}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-zinc-800" />
                <Link href="/inicio" className="text-zinc-400 hover:text-white text-sm transition-colors">Volver al inicio</Link>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
