import { Star, ThumbsUp, Users, MessageSquare, Video, Globe, Wifi } from 'lucide-react';

/**
 * SobreNexun Component
 *
 * This component renders the "About Nexun" page, including the company's mission,
 * offerings, and key features in a visually structured layout with icons.
 *
 * returns {JSX.Element} A React component displaying information about Nexun
 */
export default function SobreNexun() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Sobre Nexun</h1>
          <p className="text-gray-400">Conectar, proteger, innovar.</p>
        </div>

        {/* Main Container */}
        <div className="rounded-2xl border-2 border-cyan-500/30 bg-background p-1 backdrop-blur">
          <div className="grid grid-cols-2">
            {/* Left Column - Nuestra Misión */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Nuestra Misión</h2>
              </div>
              <p className="text-blue-400 font-medium mb-4">
                Conectar, proteger, innovar.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Conectar equipos modernos de forma segura y sencilla, desde cualquier lugar.
              </p>
            </div>

            {/* Right Column - ¿Qué ofrecemos? */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <ThumbsUp className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">¿Qué ofrecemos?</h2>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 text-sm">Conexión Directa</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 text-sm">Audio y Video de Alta Calidad</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 text-sm">Chat Integrado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 text-sm">Salas Persistentes y Controladas</span>
                </div>
              </div>

              {/* Virtual Meetings */}
              <div className="flex items-center gap-2 mb-4">
                <Wifi className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 text-sm">
                  Reuniones Virtuales Sin Límites (Hasta 10 Participantes)
                </span>
              </div>

              {/* Description */}
              <div className="flex items-start gap-2 pt-3 border-t border-gray-800">
                <Wifi className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-400 text-xs leading-relaxed">
                  Nexun es la herramienta perfecta para la gestión de proyectos, brainstormings 
                  rápidos y juntas ejecutivas donde la seguridad de la información es primordial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
