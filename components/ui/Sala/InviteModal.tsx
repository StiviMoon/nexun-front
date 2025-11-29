'use client';

import { useState } from 'react';
import { X, Copy, Check, Mail, MessageSquare, Link2 } from 'lucide-react';
import Image from 'next/image';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingCode: string;
  meetingName: string;
}

export function InviteModal({ isOpen, onClose, meetingCode, meetingName }: InviteModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const meetingLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/Sala/${meetingCode}`
    : '';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(meetingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Error copiando código:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Error copiando enlace:', err);
    }
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Invitación a ${meetingName}`);
    const body = encodeURIComponent(
      `Te invito a unirte a la reunión "${meetingName}"\n\n` +
      `Código de la reunión: ${meetingCode}\n` +
      `Enlace: ${meetingLink}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Te invito a unirte a la reunión "${meetingName}"\n\n` +
      `Código: ${meetingCode}\n` +
      `Enlace: ${meetingLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Invitar participantes</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meeting Info */}
          <div>
            <p className="text-zinc-400 text-sm mb-1">Reunión</p>
            <p className="text-white font-medium">{meetingName}</p>
          </div>

          {/* Code Section */}
          <div>
            <p className="text-zinc-400 text-sm mb-2">Código de la reunión</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700">
                <p className="text-white font-mono text-lg font-semibold">{meetingCode}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Link Section */}
          <div>
            <p className="text-zinc-400 text-sm mb-2">Enlace de la reunión</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700">
                <p className="text-white text-sm truncate">{meetingLink}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                title="Copiar enlace"
              >
                {copiedLink ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div>
            <p className="text-zinc-400 text-sm mb-3">Compartir por</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShareEmail}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span>Email</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="pt-4 border-t border-zinc-800">
            <p className="text-zinc-400 text-xs">
              Los participantes pueden unirse usando el código o haciendo clic en el enlace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

