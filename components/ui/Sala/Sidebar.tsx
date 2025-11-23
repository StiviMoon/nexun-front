'use client';

import { Users, MessageSquare } from 'lucide-react';
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
  return (
    <aside className="w-full bg-zinc-950 border-l border-zinc-800 flex flex-col h-full">
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
    </aside>
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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    if (input.value.trim()) {
      onSendMessage(input.value.trim());
      input.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="text-purple-400 font-medium">{msg.senderName}: </span>
            <span className="text-zinc-300">{msg.content}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800">
        <input
          name="message"
          type="text"
          placeholder="Escribe un mensaje..."
          className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        />
      </form>
    </div>
  );
}