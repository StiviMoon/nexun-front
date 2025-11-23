import { Download } from 'lucide-react';
import Image from 'next/image';
export default function EquipoDesarrollo() {
  const team = [
    { name: "Johan Steven Rodriguez Lopez", role: "Backend Developer", img: "/team/maniacoo.jpeg" },
    { name: "Alejandro Rubianes Realpe", role: "Tester - Project Manager", img: "/team/mono.jpeg" },
    { name: "Daniel Alexander Ramirez Maigual", role: "Frontend Developer", img: "/team/dan.jpeg" },
    { name: "Santiago Bedon Gomez", role: "Database", img: "/team/Santiagp.jpeg" },
  ];

  return (
    <div className="bg-background py-8">
      <div className="w-full max-w-7xl mx-auto px-6">
        <div className="border-2 border-cyan-500/30 rounded-2xl p-8 md:p-12 bg-background">
          <div className="grid grid-cols-3 gap-6">
          
          {/* Left Section - Team */}
          <div className="col-span-2">
            <h2 className="text-xl font-semibold text-white mb-6">
              Nuestro equipo de desarrollo
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {team.map((member, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Image 
                    src={member.img} 
                    alt={member.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">{member.name}</p>
                    <p className="text-gray-400 text-xs">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section - Version & Download */}
          <div className="flex items-center justify-center border-l border-gray-800 pl-6">
            <div className="flex flex-col gap-3">
              <div className="px-4 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-center">
                <span className="text-purple-300 text-sm">Versión de Sitio: 1.0.0</span>
              </div>
              <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all">
                <span className="text-white text-sm">Descargar Manual de Usuario</span>
                <Download className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
}