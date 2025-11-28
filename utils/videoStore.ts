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
  localStream: MediaStream | null;

  // Media controls
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;

  // Remote streams (userId -> MediaStream)
  remoteStreams: Map<string, MediaStream>;

  // Actions
  setConnected: (value: boolean) => void;
  setConnecting: (value: boolean) => void;
  setError: (error: VideoError | null) => void;
  setCurrentRoom: (room: VideoRoom | null) => void;
  setParticipants: (participants: VideoParticipant[]) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setScreenSharing: (enabled: boolean) => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
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
  | "setAudioEnabled"
  | "setVideoEnabled"
  | "setScreenSharing"
  | "addRemoteStream"
  | "removeRemoteStream"
  | "reset"
> = {
  isConnected: false,
  isConnecting: false,
  error: null,
  currentRoom: null,
  participants: [],
  localStream: null,
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  remoteStreams: new Map(),
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
  reset: () =>
    set(() => {
      // Clean up streams
      const state = useVideoStore.getState();
      if (state.localStream) {
        state.localStream.getTracks().forEach((track) => track.stop());
      }
      state.remoteStreams.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });

      return {
        ...initialState,
        remoteStreams: new Map(),
      };
    }),
}));

