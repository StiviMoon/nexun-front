'use client';

import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, X } from 'lucide-react';
import { Participant, SidebarTab, ChatMessage } from '@/types/meetingRoom';
import { ParticipantListItem } from './ParticipantListItem';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  participants: Participant[];
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  participants,
  messages,
  onSendMessage,
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar when tab changes on mobile
  useEffect(() => {
    if (isMobileOpen) {
      // Keep open when switching tabs
    }
  }, [activeTab, isMobileOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const sidebarContent = (
    <>
      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => onTabChange('participants')}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3
            text-sm font-medium transition-colors
            ${activeTab === 'participants'
              ? 'text-white bg-zinc-800/50 border-b-2 border-purple-500'
              : 'text-zinc-400 hover:text-white'
            }
          `}
          aria-label="Ver participantes"
          aria-pressed={activeTab === 'participants'}
        >
          <Users className="w-4 h-4" />
          Participantes
        </button>
        <button
          onClick={() => onTabChange('chat')}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3
            text-sm font-medium transition-colors
            ${activeTab === 'chat'
              ? 'text-white bg-zinc-800/50 border-b-2 border-purple-500'
              : 'text-zinc-400 hover:text-white'
            }
          `}
          aria-label="Ver chat"
          aria-pressed={activeTab === 'chat'}
        >
          Chat
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'participants' ? (
          <div className="p-2 space-y-1">
            {participants.map((participant) => (
              <ParticipantListItem key={participant.id} participant={participant} />
            ))}
          </div>
        ) : (
          <ChatPanel messages={messages} onSendMessage={onSendMessage} />
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button - Fixed position */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-16 right-4 z-30 bg-zinc-800 hover:bg-zinc-700 text-white p-2.5 rounded-lg shadow-lg border border-zinc-700 transition-colors"
        aria-label="Abrir panel lateral"
        aria-expanded={isMobileOpen}
      >
        {activeTab === 'participants' ? (
          <Users className="w-5 h-5" />
        ) : (
          <MessageSquare className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar - Slide from right */}
      <aside
        className={`
          lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-zinc-950 border-l border-zinc-800 
          flex flex-col z-50 transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-label="Panel lateral"
        aria-hidden={!isMobileOpen}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            {activeTab === 'participants' ? 'Participantes' : 'Chat'}
          </h2>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Cerrar panel lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside 
        className="hidden lg:flex w-full bg-zinc-950 border-l border-zinc-800 flex-col h-full"
        aria-label="Panel lateral"
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// Panel de Chat
function ChatPanel({
  messages,
  onSendMessage,
}: {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}) {
  const [message, setMessage] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-500 text-center">No hay mensajes aún</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex flex-col items-end gap-1.5 px-2 py-2 rounded-lg hover:bg-zinc-900/30 transition-colors group"
              >
                <div className="flex items-center gap-2 w-full justify-end">
                  <span className="text-xs text-zinc-500 font-medium">{msg.senderName}</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="bg-zinc-800 rounded-lg px-3 py-2.5 max-w-[85%] ml-auto shadow-sm">
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800 bg-zinc-950">
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <input
              name="message"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent transition-all"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="shrink-0 w-10 h-10 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-sm"
              aria-label="Enviar mensaje"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}