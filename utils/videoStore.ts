import { create } from "zustand";
import { VideoRoom, VideoParticipant } from "@/utils/services/videoService";

export interface VideoError {
  message: string;
  code?: string;
}

interface VideoStoreState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: VideoError | null;

  // Room state
  currentRoom: VideoRoom | null;
  participants: VideoParticipant[];
  localStream: MediaStream | null; // Stream de cámara local
  localScreenStream: MediaStream | null; // Stream de pantalla local

  // Media controls
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;

  // Remote streams (userId -> MediaStream) - streams de cámara
  remoteStreams: Map<string, MediaStream>;
  // Remote screen streams (userId -> MediaStream) - streams de pantalla compartida
  remoteScreenStreams: Map<string, MediaStream>;

  // Actions
  setConnected: (value: boolean) => void;
  setConnecting: (value: boolean) => void;
  setError: (error: VideoError | null) => void;
  setCurrentRoom: (room: VideoRoom | null) => void;
  setParticipants: (participants: VideoParticipant[]) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setLocalScreenStream: (stream: MediaStream | null) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setScreenSharing: (enabled: boolean) => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
  addRemoteScreenStream: (userId: string, stream: MediaStream) => void;
  removeRemoteScreenStream: (userId: string) => void;
  reset: () => void;
}

const initialState: Omit<
  VideoStoreState,
  | "setConnected"
  | "setConnecting"
  | "setError"
  | "setCurrentRoom"
  | "setParticipants"
  | "setLocalStream"
  | "setLocalScreenStream"
  | "setAudioEnabled"
  | "setVideoEnabled"
  | "setScreenSharing"
  | "addRemoteStream"
  | "removeRemoteStream"
  | "addRemoteScreenStream"
  | "removeRemoteScreenStream"
  | "reset"
> = {
  isConnected: false,
  isConnecting: false,
  error: null,
  currentRoom: null,
  participants: [],
  localStream: null,
  localScreenStream: null,
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  remoteStreams: new Map(),
  remoteScreenStreams: new Map(),
};

export const useVideoStore = create<VideoStoreState>((set) => ({
  ...initialState,
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
  setCurrentRoom: (room) =>
    set(() => ({
      currentRoom: room,
    })),
  setParticipants: (participants) =>
    set(() => ({
      participants: Array.isArray(participants) ? participants : [],
    })),
  setLocalStream: (stream) =>
    set(() => ({
      localStream: stream,
    })),
  setLocalScreenStream: (stream) =>
    set(() => ({
      localScreenStream: stream,
    })),
  setAudioEnabled: (enabled) =>
    set(() => ({
      isAudioEnabled: enabled,
    })),
  setVideoEnabled: (enabled) =>
    set(() => ({
      isVideoEnabled: enabled,
    })),
  setScreenSharing: (enabled) =>
    set(() => ({
      isScreenSharing: enabled,
    })),
  addRemoteStream: (userId, stream) =>
    set((state) => {
      const newStreams = new Map(state.remoteStreams);
      newStreams.set(userId, stream);
      return {
        remoteStreams: newStreams,
      };
    }),
  removeRemoteStream: (userId) =>
    set((state) => {
      const newStreams = new Map(state.remoteStreams);
      newStreams.delete(userId);
      return {
        remoteStreams: newStreams,
      };
    }),
  addRemoteScreenStream: (userId, stream) =>
    set((state) => {
      const newStreams = new Map(state.remoteScreenStreams);
      newStreams.set(userId, stream);
      return {
        remoteScreenStreams: newStreams,
      };
    }),
  removeRemoteScreenStream: (userId) =>
    set((state) => {
      const newStreams = new Map(state.remoteScreenStreams);
      newStreams.delete(userId);
      return {
        remoteScreenStreams: newStreams,
      };
    }),
  reset: () =>
    set(() => {
      // Clean up streams
      const state = useVideoStore.getState();
      if (state.localStream) {
        state.localStream.getTracks().forEach((track) => track.stop());
      }
      if (state.localScreenStream) {
        state.localScreenStream.getTracks().forEach((track) => track.stop());
      }
      state.remoteStreams.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });
      state.remoteScreenStreams.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });

      return {
        ...initialState,
        remoteStreams: new Map(),
        remoteScreenStreams: new Map(),
      };
    }),
}));

