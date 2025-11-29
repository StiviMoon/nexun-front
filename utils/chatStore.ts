import { create } from "zustand";
import { ChatRoom, ChatMessage, ChatError } from "@/types/chat";

type MessagesRecord = Record<string, ChatMessage[]>;

interface ChatStoreState {
  rooms: ChatRoom[];
  messages: MessagesRecord;
  currentRoomId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: ChatError | null;
  setRooms: (rooms: ChatRoom[]) => void;
  upsertRoom: (room: ChatRoom) => void;
  removeRoom: (roomId: string) => void;
  setCurrentRoomId: (roomId: string | null) => void;
  setMessagesForRoom: (roomId: string, chatMessages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setConnected: (value: boolean) => void;
  setConnecting: (value: boolean) => void;
  setError: (error: ChatError | null) => void;
  reset: () => void;
}

const initialState: Omit<ChatStoreState, "setRooms" | "upsertRoom" | "removeRoom" | "setCurrentRoomId" | "setMessagesForRoom" | "addMessage" | "setConnected" | "setConnecting" | "setError" | "reset"> = {
  rooms: [],
  messages: {},
  currentRoomId: null,
  isConnected: false,
  isConnecting: false,
  error: null,
};

export const useChatStore = create<ChatStoreState>((set) => ({
  ...initialState,
  setRooms: (rooms) =>
    set(() => ({
      rooms,
    })),
  upsertRoom: (room) =>
    set((state) => {
      const exists = state.rooms.find((r) => r.id === room.id);
      if (exists) {
        return {
          rooms: state.rooms.map((r) => (r.id === room.id ? room : r)),
        };
      }
      return {
        rooms: [...state.rooms, room],
      };
    }),
  removeRoom: (roomId) =>
    set((state) => ({
      rooms: state.rooms.filter((room) => room.id !== roomId),
    })),
  setCurrentRoomId: (roomId) =>
    set(() => ({
      currentRoomId: roomId,
    })),
  setMessagesForRoom: (roomId, chatMessages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: chatMessages,
      },
    })),
  addMessage: (message) =>
    set((state) => {
      const roomMessages = state.messages[message.roomId] || [];
      const messageExists = roomMessages.some((m) => m.id === message.id);
      if (messageExists) {
        console.log(`⚠️ [ChatStore] Mensaje ${message.id} ya existe, ignorando duplicado`);
        return state;
      }
      const updatedMessages = {
        ...state.messages,
        [message.roomId]: [...roomMessages, message],
      };
      console.log(`✅ [ChatStore] Mensaje agregado. Total en sala ${message.roomId}: ${updatedMessages[message.roomId].length}`);
      return {
        messages: updatedMessages,
      };
    }),
  setConnected: (value) =>
    set(() => ({
      isConnected: value,
    })),
  setConnecting: (value) =>
    set(() => ({
      isConnecting: value,
    })),
  setError: (error) =>
    set(() => ({
      error,
    })),
  reset: () =>
    set(() => ({
      ...initialState,
    })),
}));

