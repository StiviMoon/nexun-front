'use client';

import React, { useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { ParticipantsSectionProps, Participant } from './types';

/**
 * ParticipantsSection Component
 *
 * Displays the participants of a meeting, allows searching and adding new participants,
 * and removing existing participants.
 *
 * param {ParticipantsSectionProps} props - Component props
 * param {Participant[]} props.participants - Current list of participants
 * param {(participant: Participant) => void} props.onAddParticipant - Callback to add a participant
 * param {(id: string) => void} props.onRemoveParticipant - Callback to remove a participant by ID
 * returns {JSX.Element} UI for managing meeting participants
 */
const ParticipantsSection: React.FC<ParticipantsSectionProps> = ({
  participants,
  onAddParticipant,
  onRemoveParticipant
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Handle the search form submission.
   * Simulates finding a user and adding them to the participants list.
   *
   * @param {React.FormEvent} e - Form submit event
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const newParticipant: Participant = {
        id: Date.now().toString(),
        name: searchQuery,
        email: `${searchQuery.toLowerCase().replace(' ', '.')}@example.com`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${searchQuery}`
      };
      onAddParticipant(newParticipant);
      setSearchQuery('');
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Participantes</h2>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o email"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
        />
      </form>

      {/* Participants List */}
      <div className="flex flex-wrap gap-3">
        {participants.map((participant) => (
          <div key={participant.id} className="relative group">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-cyan-500 transition-all">
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-bold">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => onRemoveParticipant(participant.id)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {/* Add Participant Button */}
        <button
          onClick={() => {
            const name = prompt('Nombre del participante:');
            if (name) {
              const newParticipant: Participant = {
                id: Date.now().toString(),
                name,
                email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
              };
              onAddParticipant(newParticipant);
            }
          }}
          className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 hover:border-cyan-500 flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      {participants.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          No hay participantes agregados
        </p>
      )}
    </div>
  );
};

export default ParticipantsSection;
