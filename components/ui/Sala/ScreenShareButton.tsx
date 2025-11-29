import { Monitor } from 'lucide-react';

interface ScreenShareButtonProps {
  isSharing: boolean;
  onToggle: () => void;
}

export function ScreenShareButton({ isSharing, onToggle }: ScreenShareButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-2 rounded-lg font-medium flex items-center gap-2 ${
        isSharing ? 'bg-red-600 text-white' : 'bg-zinc-700 text-white'
      }`}
    >
      <Monitor className="w-4 h-4" />
      {isSharing ? 'Dejar de compartir' : 'Compartir pantalla'}
    </button>
  );
}
